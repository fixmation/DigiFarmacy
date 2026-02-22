
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, FileText, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/useAuth';
import { toast } from 'sonner';
import { PharmacyVerification } from './PharmacyVerification';
import { PharmacyProducts } from './PharmacyProducts';
import { QRPaymentManager } from './QRPaymentManager';
import { PayoutRequests } from './PayoutRequests';

interface PrescriptionUpload {
  id: string;
  customer_name: string;
  customer_email: string;
  upload_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  commission_amount?: number;
}

interface PharmacyDetails {
  id: string;
  business_name: string;
  address: string;
  contact_phone?: string;
  contact_email?: string;
  registration_number: string;
  verified_at: string | null;
}

export const PharmacyDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [prescriptionUploads, setPrescriptionUploads] = useState<PrescriptionUpload[]>([]);
  const [pharmacyDetails, setPharmacyDetails] = useState<PharmacyDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPharmacyDetails();
  }, []);

  useEffect(() => {
    if (pharmacyDetails?.id) {
      fetchPrescriptionUploads();
    }
  }, [pharmacyDetails?.id]);

  const fetchPharmacyDetails = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('pharmacy_details')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (error) {
        console.error('Error fetching pharmacy details:', error);
        toast.error('Failed to load pharmacy details');
      } else {
        setPharmacyDetails(data);
      }
    } catch (error) {
      console.error('Error fetching pharmacy details:', error);
      toast.error('Failed to load pharmacy details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptionUploads = async () => {
    if (!pharmacyDetails?.id) return;

    try {
      // Fetch commission transactions for this pharmacy
      const { data: transactions, error: transactionError } = await supabase
        .from('commission_transactions')
        .select('*')
        .eq('pharmacy_id', pharmacyDetails.id)
        .order('transaction_date', { ascending: false });

      if (transactionError) {
        console.error('Error fetching transactions:', transactionError);
        setPrescriptionUploads([]);
        return;
      }

      // Fetch user profiles separately to get customer names
      const userIds = transactions?.map(t => t.prescription_id).filter(Boolean) || [];
      let profiles: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        if (!profileError) {
          profiles = profileData || [];
        }
      }

      // Transform commission transactions to look like prescription uploads
      const transformedData = (transactions || []).map(transaction => {
        const customerProfile = profiles.find(p => p.id === transaction.prescription_id);
        
        return {
          id: transaction.id,
          customer_name: customerProfile?.full_name || 'Unknown Customer',
          customer_email: customerProfile?.email || '',
          upload_date: transaction.transaction_date || new Date().toISOString(),
          status: (transaction.status || 'completed') as 'pending' | 'processing' | 'completed' | 'failed',
          commission_amount: transaction.amount_lkr
        };
      });
      
      setPrescriptionUploads(transformedData);
    } catch (error) {
      console.error('Error fetching prescription uploads:', error);
    }
  };

  const updatePrescriptionStatus = async (uploadId: string, newStatus: 'pending' | 'processing' | 'completed' | 'failed') => {
    try {
      const { error } = await supabase
        .from('commission_transactions')
        .update({ status: newStatus })
        .eq('id', uploadId);

      if (error) throw error;

      toast.success('Prescription status updated successfully');
      fetchPrescriptionUploads();
    } catch (error) {
      console.error('Error updating prescription status:', error);
      toast.error('Failed to update prescription status');
    }
  };

  const handleVerificationComplete = async () => {
    await fetchPharmacyDetails();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-blue mx-auto mb-4"></div>
          <p>Loading pharmacy dashboard...</p>
        </div>
      </div>
    );
  }

  const totalEarnings = prescriptionUploads.reduce((sum, upload) => sum + (upload.commission_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-medical-blue to-medical-green bg-clip-text text-transparent">
            Pharmacy Dashboard
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Manage your pharmacy operations and prescription uploads
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Card className="glass-card shadow-blue-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{prescriptionUploads.length}</div>
              <p className="text-xs text-muted-foreground">
                Prescription uploads
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-blue-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {prescriptionUploads.filter(upload => {
                  const uploadDate = new Date(upload.upload_date);
                  const now = new Date();
                  return uploadDate.getMonth() === now.getMonth() && 
                         uploadDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly uploads
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-blue-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                LKR {totalEarnings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total earnings
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-blue-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              {profile?.status === 'verified' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold capitalize">{profile?.status}</div>
              <p className="text-xs text-muted-foreground">
                Account status
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="uploads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="uploads" className="text-xs md:text-sm">Uploads</TabsTrigger>
            <TabsTrigger value="verification" className="text-xs md:text-sm">Verification</TabsTrigger>
            <TabsTrigger value="products" className="text-xs md:text-sm">Products</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs md:text-sm">Payments</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs md:text-sm">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="uploads">
            <Card className="glass-card shadow-blue-md">
              <CardHeader>
                <CardTitle>Prescription Uploads</CardTitle>
                <CardDescription>
                  Manage prescription uploads from customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prescriptionUploads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No prescription uploads yet.</p>
                    </div>
                  ) : (
                    prescriptionUploads.map((upload) => (
                      <div key={upload.id} className="flex items-center justify-between p-4 border rounded-lg shadow-blue-sm">
                        <div className="space-y-1">
                          <p className="font-medium">{upload.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{upload.customer_email}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(upload.upload_date).toLocaleDateString()} • 
                            LKR {upload.commission_amount?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            upload.status === 'completed' ? 'default' : 
                            upload.status === 'pending' ? 'secondary' : 'outline'
                          }>
                            {upload.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updatePrescriptionStatus(upload.id, 
                              upload.status === 'pending' ? 'completed' : 'pending'
                            )}
                          >
                            {upload.status === 'pending' ? 'Mark Complete' : 'Mark Pending'}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification">
            {profile?.status !== 'verified' ? (
              <PharmacyVerification 
                pharmacyDetails={pharmacyDetails}
                onUpdate={handleVerificationComplete}
              />
            ) : (
              <Card className="glass-card shadow-blue-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Verification Complete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Your pharmacy has been successfully verified and is now active on the platform.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="products">
            <PharmacyProducts />
          </TabsContent>

          <TabsContent value="payments">
            {pharmacyDetails && (
              <>
                <QRPaymentManager 
                  serviceProviderId={pharmacyDetails.id}
                  serviceProviderType="pharmacy"
                />
                <PayoutRequests 
                  pharmacyId={pharmacyDetails.id}
                  availableBalance={totalEarnings}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="settings">
            {pharmacyDetails && (
              <PharmacyVerification 
                pharmacyDetails={pharmacyDetails}
                onUpdate={handleVerificationComplete}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
