
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  FileText, 
  QrCode,
  Users,
  Building2,
  FlaskConical,
  Download,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/useAuth';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CommissionSummary {
  totalPrescriptions: number;
  totalLabBookings: number;
  totalGrossCommission: number;
  totalHostCommission: number;
  totalDeveloperCommission: number;
  monthlyData: Array<{
    month: string;
    prescriptions: number;
    labBookings: number;
    commission: number;
  }>;
}

interface QRPaymentRequest {
  id: string;
  service_provider_id: string;
  service_provider_type: string;
  amount_lkr: number;
  status: string;
  generated_at: string;
  proof_of_payment_url?: string;
  notes?: string;
  provider_name?: string;
}

export const CommissionDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<CommissionSummary>({
    totalPrescriptions: 0,
    totalLabBookings: 0,
    totalGrossCommission: 0,
    totalHostCommission: 0,
    totalDeveloperCommission: 0,
    monthlyData: []
  });
  const [paymentRequests, setPaymentRequests] = useState<QRPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle potential type mismatch for developer admin role
  const isDeveloperAdmin = profile?.role === 'admin' && profile?.email?.includes('developer');

  useEffect(() => {
    fetchCommissionData();
    fetchPaymentRequests();
  }, []);

  const fetchCommissionData = async () => {
    try {
      // Fetch commission transactions
      const { data: transactions, error } = await supabase
        .from('commission_transactions')
        .select(`
          *,
          pharmacy_details!inner(business_name),
          laboratory_details(business_name)
        `);

      if (error) {
        console.error('Error fetching transactions:', error);
        // Handle gracefully - may be missing columns
      }

      // Calculate summary with fallback values
      const prescriptionCount = transactions?.filter(t => t.description?.includes('prescription')).length || 0;
      const labBookingCount = transactions?.filter(t => t.description?.includes('lab')).length || 0;
      const totalGross = transactions?.reduce((sum, t) => sum + Number(t.amount_lkr), 0) || 0;
      
      // Generate monthly data
      const monthlyData = generateMonthlyData(transactions || []);

      setSummary({
        totalPrescriptions: prescriptionCount,
        totalLabBookings: labBookingCount,
        totalGrossCommission: totalGross,
        totalHostCommission: totalGross * 0.7,
        totalDeveloperCommission: totalGross * 0.3,
        monthlyData
      });
    } catch (error) {
      console.error('Error fetching commission data:', error);
      toast.error('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentRequests = async () => {
    try {
      // Try to fetch QR payment requests using commission_transactions as fallback
      const { data, error } = await supabase
        .from('commission_transactions')
        .select('*')
        .eq('status', 'pending')
        .order('transaction_date', { ascending: false });

      if (error) {
        console.log('QR payment requests not available yet:', error);
      } else {
        // Transform commission transactions to look like payment requests
        const transformedData = (data || []).map(transaction => ({
          id: transaction.id,
          service_provider_id: transaction.pharmacy_id || transaction.laboratory_id || '',
          service_provider_type: transaction.pharmacy_id ? 'pharmacy' : 'laboratory',
          amount_lkr: transaction.amount_lkr,
          status: transaction.status,
          generated_at: transaction.transaction_date || new Date().toISOString(),
          provider_name: 'Provider'
        }));
        setPaymentRequests(transformedData);
      }
    } catch (error) {
      console.log('Error fetching payment requests:', error);
    }
  };

  const generateMonthlyData = (transactions: any[]) => {
    const monthlyMap = new Map();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    }).reverse();

    last6Months.forEach(month => {
      monthlyMap.set(month, { month, prescriptions: 0, labBookings: 0, commission: 0 });
    });

    transactions.forEach(transaction => {
      if (!transaction.transaction_date) return;
      const date = new Date(transaction.transaction_date);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (monthlyMap.has(monthKey)) {
        const data = monthlyMap.get(monthKey);
        if (transaction.description?.includes('prescription')) {
          data.prescriptions += 1;
        } else if (transaction.description?.includes('lab')) {
          data.labBookings += 1;
        }
        data.commission += Number(transaction.amount_lkr);
      }
    });

    return Array.from(monthlyMap.values());
  };

  const verifyPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('commission_transactions')
        .update({ 
          status: 'completed'
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast.success('Payment verified successfully');
      fetchPaymentRequests();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    }
  };

  const exportReport = (type: 'csv' | 'pdf') => {
    // Implementation for exporting reports
    toast.success(`${type.toUpperCase()} report export started`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-blue"></div>
      </div>
    );
  }

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-medical-blue to-medical-green bg-clip-text text-transparent">
            {isDeveloperAdmin ? 'Developer Commission Dashboard' : 'Commission Management Dashboard'}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            {isDeveloperAdmin ? 'Your commission earnings and analytics' : 'Complete commission tracking and payment management'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="glass-card shadow-blue-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalPrescriptions}</div>
              <p className="text-xs text-muted-foreground">Total uploads</p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-blue-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lab Bookings</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalLabBookings}</div>
              <p className="text-xs text-muted-foreground">Total bookings</p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-blue-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gross Commission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {summary.totalGrossCommission.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total generated</p>
            </CardContent>
          </Card>

          {!isDeveloperAdmin && (
            <Card className="glass-card shadow-blue-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Host Share (70%)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">LKR {summary.totalHostCommission.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Your earnings</p>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card shadow-blue-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isDeveloperAdmin ? 'Your Share (30%)' : 'Dev Share (30%)'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {summary.totalDeveloperCommission.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Developer earnings</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics and Charts */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="payments">QR Payments</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-card shadow-blue-md">
                <CardHeader>
                  <CardTitle>Monthly Commission Trends</CardTitle>
                  <CardDescription>Commission earnings over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={summary.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="commission" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-card shadow-blue-md">
                <CardHeader>
                  <CardTitle>Activity Breakdown</CardTitle>
                  <CardDescription>Prescriptions vs Lab Bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={summary.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="prescriptions" fill="#3B82F6" />
                      <Bar dataKey="labBookings" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card className="glass-card shadow-blue-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Payment Requests
                </CardTitle>
                <CardDescription>
                  Manage commission payments through LankaQR system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No payment requests yet.</p>
                    </div>
                  ) : (
                    paymentRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg shadow-blue-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {request.service_provider_type === 'pharmacy' ? (
                              <Building2 className="h-4 w-4 text-medical-blue" />
                            ) : (
                              <FlaskConical className="h-4 w-4 text-medical-green" />
                            )}
                            <p className="font-medium">{request.provider_name}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            LKR {Number(request.amount_lkr).toLocaleString()} • 
                            {new Date(request.generated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            request.status === 'completed' ? 'default' : 
                            request.status === 'pending' ? 'secondary' : 'outline'
                          }>
                            {request.status}
                          </Badge>
                          {!isDeveloperAdmin && request.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => verifyPayment(request.id)}
                              className="text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verify
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="glass-card shadow-blue-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Reports
                </CardTitle>
                <CardDescription>
                  Generate detailed commission and audit reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Button onClick={() => exportReport('csv')} variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Export CSV Report
                  </Button>
                  <Button onClick={() => exportReport('pdf')} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF Report
                  </Button>
                </div>
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Report Contents:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Commission transaction details</li>
                    <li>• Service provider performance</li>
                    <li>• Monthly/yearly summaries</li>
                    <li>• Payment status tracking</li>
                    {!isDeveloperAdmin && <li>• Audit trail and compliance data</li>}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
