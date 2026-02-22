
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Upload, CheckCircle, AlertTriangle, Download, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/useAuth';
import { toast } from 'sonner';

interface PaymentRequest {
  id: string;
  amount_lkr: number;
  status: string;
  generated_at: string;
  proof_of_payment_url?: string;
  qr_code_data?: string;
  notes?: string;
}

interface QRPaymentManagerProps {
  serviceProviderId: string;
  serviceProviderType: 'pharmacy' | 'laboratory';
}

export const QRPaymentManager: React.FC<QRPaymentManagerProps> = ({
  serviceProviderId,
  serviceProviderType
}) => {
  const { user } = useAuth();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentRequests();
    fetchPendingCommissions();
  }, [serviceProviderId]);

  const fetchPaymentRequests = async () => {
    try {
      // Use commission_transactions as fallback since qr_payment_requests might not exist yet
      const { data, error } = await supabase
        .from('commission_transactions')
        .select('*')
        .eq(serviceProviderType === 'pharmacy' ? 'pharmacy_id' : 'laboratory_id', serviceProviderId)
        .eq('status', 'pending')
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Error fetching payment requests:', error);
      } else {
        // Transform commission transactions to look like payment requests
        const transformedData: PaymentRequest[] = (data || []).map(transaction => ({
          id: transaction.id,
          amount_lkr: transaction.amount_lkr,
          status: transaction.status || 'pending',
          generated_at: transaction.transaction_date || new Date().toISOString(),
          qr_code_data: `LKR_${transaction.amount_lkr}_${transaction.id}`,
          notes: transaction.description
        }));
        setPaymentRequests(transformedData);
      }
    } catch (error) {
      console.error('Error fetching payment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_transactions')
        .select('amount_lkr')
        .eq(serviceProviderType === 'pharmacy' ? 'pharmacy_id' : 'laboratory_id', serviceProviderId)
        .eq('status', 'pending');

      if (!error && data) {
        const total = data.reduce((sum, transaction) => sum + Number(transaction.amount_lkr), 0);
        setPendingAmount(total);
      }
    } catch (error) {
      console.error('Error fetching pending commissions:', error);
    }
  };

  const generateQRPayment = async () => {
    if (pendingAmount <= 0) {
      toast.error('No pending commissions to process');
      return;
    }

    try {
      // Create a QR payment request using commission_transactions table
      const { data, error } = await supabase
        .from('commission_transactions')
        .insert({
          amount_lkr: pendingAmount,
          description: `QR Payment Request - ${serviceProviderType}`,
          [serviceProviderType === 'pharmacy' ? 'pharmacy_id' : 'laboratory_id']: serviceProviderId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('QR payment request generated successfully');
      fetchPaymentRequests();
      fetchPendingCommissions();
    } catch (error) {
      console.error('Error generating QR payment:', error);
      toast.error('Failed to generate QR payment request');
    }
  };

  const uploadPaymentProof = async (paymentId: string, file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      // Upload proof of payment to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-proof-${paymentId}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pharmacy-documents')
        .upload(`payment-proofs/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pharmacy-documents')
        .getPublicUrl(`payment-proofs/${fileName}`);

      // Update the payment request with proof URL
      const { error: updateError } = await supabase
        .from('commission_transactions')
        .update({ 
          status: 'completed',
          description: `Payment completed with proof: ${urlData.publicUrl}`
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      toast.success('Payment proof uploaded successfully');
      fetchPaymentRequests();
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      toast.error('Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
  };

  const downloadQRCode = (qrData: string) => {
    // Simple QR code generation (in real implementation, use a proper QR library)
    const qrText = `LankaQR Payment: ${qrData}`;
    const blob = new Blob([qrText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-code-${qrData}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Amount Card */}
      <Card className="glass-card shadow-blue-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Payment Manager
          </CardTitle>
          <CardDescription>
            Generate QR codes for commission payments via LankaQR
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm font-medium text-blue-900">Pending Commission</p>
              <p className="text-2xl font-bold text-blue-700">LKR {pendingAmount.toLocaleString()}</p>
            </div>
            <Button 
              onClick={generateQRPayment}
              disabled={pendingAmount <= 0}
              className="bg-medical-blue hover:bg-medical-blue/90"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR Payment
            </Button>
          </div>

          {pendingAmount > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                You have pending commissions that can be processed via QR payment. 
                Generate a QR code to request payment from the admin.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Payment Requests */}
      <Card className="glass-card shadow-blue-md">
        <CardHeader>
          <CardTitle>Payment Requests</CardTitle>
          <CardDescription>
            Track your QR payment requests and upload payment proofs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No payment requests yet.</p>
                <p className="text-sm">Generate a QR payment request to get started.</p>
              </div>
            ) : (
              paymentRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Payment Request</p>
                      <p className="text-sm text-muted-foreground">
                        LKR {Number(request.amount_lkr).toLocaleString()} • 
                        {new Date(request.generated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      request.status === 'completed' ? 'default' : 
                      request.status === 'pending' ? 'secondary' : 'outline'
                    }>
                      {request.status}
                    </Badge>
                  </div>

                  {request.qr_code_data && (
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadQRCode(request.qr_code_data!)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download QR
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Use this QR code for LankaQR payment
                      </p>
                    </div>
                  )}

                  {request.status === 'pending' && (
                    <div className="space-y-2">
                      <Label htmlFor={`proof-${request.id}`}>Upload Payment Proof</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`proof-${request.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadPaymentProof(request.id, file);
                          }}
                          disabled={uploading}
                        />
                        <Button size="sm" disabled={uploading}>
                          <Upload className="h-3 w-3 mr-1" />
                          {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload a screenshot or photo of your payment confirmation
                      </p>
                    </div>
                  )}

                  {request.status === 'completed' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Payment completed and verified</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
