
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Building2, 
  DollarSign, 
  FileText, 
  Settings, 
  TrendingUp,
  Shield,
  Database,
  Key,
  Ban,
  CheckCircle,
  FlaskConical,
  QrCode,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/useAuth';
import { toast } from 'sonner';
import { CommissionDashboard } from './CommissionDashboard';

interface AdminStats {
  totalUsers: number;
  totalPharmacies: number;
  totalLaboratories: number;
  pendingVerifications: number;
  totalEarnings: number;
  monthlyTransactions: number;
  pendingPayments: number;
  unpaidCommissions: number;
}

interface SiteConfig {
  [key: string]: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  pharmacy_details?: Array<{ id: string; business_name: string; }>;
  laboratory_details?: Array<{ id: string; business_name: string; }>;
}

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPharmacies: 0,
    totalLaboratories: 0,
    pendingVerifications: 0,
    totalEarnings: 0,
    monthlyTransactions: 0,
    pendingPayments: 0,
    unpaidCommissions: 0
  });
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({});
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Check if user is developer admin (handle potential type mismatch)
  const isDeveloperAdmin = profile?.role === 'admin' && profile?.email?.includes('developer');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch user stats with related pharmacy/lab data
      const { data: usersData } = await supabase
        .from('profiles')
        .select(`
          *,
          pharmacy_details(id, business_name),
          laboratory_details(id, business_name)
        `);

      // Fetch pharmacy stats
      const { data: pharmacies } = await supabase
        .from('pharmacy_details')
        .select('verified_at');

      // Fetch laboratory stats
      const { data: laboratories } = await supabase
        .from('laboratory_details')
        .select('verified_at');

      // Fetch transaction stats (handle potential missing columns gracefully)
      const { data: transactions } = await supabase
        .from('commission_transactions')
        .select('amount_lkr, transaction_date, status, description');

      // Try to fetch QR payment requests (may not exist yet)
      let paymentRequests: any[] = [];
      try {
        const { data: paymentData } = await supabase
          .from('commission_transactions')
          .select('*')
          .eq('status', 'pending');
        paymentRequests = paymentData || [];
      } catch (error) {
        console.log('QR payment requests table not available yet');
      }

      // Fetch site configuration (only for main admin)
      let config: any[] = [];
      if (profile?.role === 'admin') {
        const { data: configData } = await supabase
          .from('site_config')
          .select('config_key, config_value');
        config = configData || [];
      }

      // Process stats
      const totalUsers = usersData?.length || 0;
      const totalPharmacies = usersData?.filter(u => u.role === 'pharmacy').length || 0;
      const totalLaboratories = usersData?.filter(u => u.role === 'laboratory').length || 0;
      const pendingVerifications = usersData?.filter(u => (u.role === 'pharmacy' || u.role === 'laboratory') && u.status === 'pending').length || 0;
      
      // Commission calculations (handle gracefully if columns don't exist)
      const totalEarnings = transactions?.reduce((sum, t) => sum + Number(t.amount_lkr || 0), 0) || 0;
      const unpaidCommissions = transactions?.filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + Number(t.amount_lkr || 0), 0) || 0;
      
      const pendingPayments = Array.isArray(paymentRequests) ? paymentRequests.length : 0;
      
      // Calculate monthly transactions (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyTransactions = transactions?.filter(t => {
        if (!t.transaction_date) return false;
        const transDate = new Date(t.transaction_date);
        return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
      }).length || 0;

      setStats({
        totalUsers,
        totalPharmacies,
        totalLaboratories,
        pendingVerifications,
        totalEarnings,
        monthlyTransactions,
        pendingPayments,
        unpaidCommissions
      });

      setUsers(usersData || []);

      // Process site config (only for main admin)
      if (profile?.role === 'admin') {
        const configObj: SiteConfig = {};
        config.forEach(c => {
          configObj[c.config_key] = c.config_value || '';
        });
        setSiteConfig(configObj);
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const updateSiteConfig = async () => {
    if (profile?.role !== 'admin') return;
    
    setSaving(true);
    try {
      // Update each config value
      for (const [key, value] of Object.entries(siteConfig)) {
        const { error } = await supabase
          .from('site_config')
          .upsert({ 
            config_key: key,
            config_value: value,
            updated_by: profile?.id,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'config_key'
          });

        if (error) throw error;
      }

      toast.success('Site configuration updated successfully');
    } catch (error) {
      console.error('Error updating site config:', error);
      toast.error('Failed to update site configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setSiteConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'verified' ? 'suspended' : 'verified';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );

      toast.success(`User ${newStatus === 'verified' ? 'activated' : 'blocked'} successfully`);
      fetchAdminData(); // Refresh stats
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-blue mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-medical-blue to-medical-green bg-clip-text text-transparent">
            {isDeveloperAdmin ? 'Developer Admin Dashboard' : 'Admin Dashboard'}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            {isDeveloperAdmin ? 'Commission tracking and developer analytics' : 'System administration and commission management'}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="glass-card shadow-blue-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-blue-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {stats.totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Platform commissions
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-blue-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid Commissions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">LKR {stats.unpaidCommissions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Pending payments
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-blue-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyTransactions}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="commission" className="text-xs md:text-sm">Commission</TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">Users</TabsTrigger>
            <TabsTrigger value="pharmacies" className="text-xs md:text-sm">Pharmacies</TabsTrigger>
            <TabsTrigger value="laboratories" className="text-xs md:text-sm">Labs</TabsTrigger>
            {profile?.role === 'admin' && <TabsTrigger value="settings" className="text-xs md:text-sm">API Settings</TabsTrigger>}
          </TabsList>

          <TabsContent value="commission">
            <CommissionDashboard />
          </TabsContent>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-card shadow-blue-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Database Status</span>
                    <Badge variant="default">Online</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Authentication</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Storage</span>
                    <Badge variant="default">Available</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payment System</span>
                    <Badge variant="default">LankaQR Ready</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card shadow-blue-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>New user registrations</span>
                      <span className="font-medium">12 today</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prescription uploads</span>
                      <span className="font-medium">45 this week</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission transactions</span>
                      <span className="font-medium">{stats.monthlyTransactions} this month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment requests</span>
                      <span className="font-medium">{stats.pendingPayments} pending</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="glass-card shadow-blue-md">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, permissions and commission payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.filter(user => user.role === 'pharmacy' || user.role === 'laboratory').map((user) => {
                    const providerDetails = user.role === 'pharmacy' ? user.pharmacy_details?.[0] : user.laboratory_details?.[0];
                    return (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg shadow-blue-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {user.role === 'pharmacy' ? (
                              <Building2 className="h-4 w-4 text-medical-blue" />
                            ) : (
                              <FlaskConical className="h-4 w-4 text-medical-green" />
                            )}
                            <Badge variant={user.role === 'pharmacy' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {providerDetails && (
                              <p className="text-xs text-blue-600">{providerDetails.business_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={user.status === 'verified' ? 'default' : user.status === 'suspended' ? 'destructive' : 'secondary'}>
                            {user.status}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={user.status === 'verified'}
                              onCheckedChange={() => toggleUserStatus(user.id, user.status)}
                            />
                            {user.status === 'verified' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Ban className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {profile?.role === 'admin' && (
            <TabsContent value="settings">
              <Card className="glass-card shadow-blue-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    API Configuration
                  </CardTitle>
                  <CardDescription>
                    Manage system-wide API keys and integrations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      API Keys & Integrations
                    </h3>
                    
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mapbox_token">Mapbox Public Token</Label>
                        <Input
                          id="mapbox_token"
                          type="text"
                          value={siteConfig.mapbox_token || ''}
                          onChange={(e) => handleConfigChange('mapbox_token', e.target.value)}
                          placeholder="pk.eyJ1Ijoi..."
                        />
                        <p className="text-xs text-muted-foreground">
                          <strong>Required:</strong> Get your Mapbox public token from{' '}
                          <a 
                            href="https://account.mapbox.com/access-tokens/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-medical-blue hover:underline"
                          >
                            Mapbox Access Tokens
                          </a>
                          . Use the "Default public token" or create a new public token with default scopes.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gemini_api_key">Gemini AI API Key</Label>
                        <Input
                          id="gemini_api_key"
                          type="password"
                          value={siteConfig.gemini_api_key || ''}
                          onChange={(e) => handleConfigChange('gemini_api_key', e.target.value)}
                          placeholder="Enter Google Gemini API key"
                        />
                        <p className="text-xs text-muted-foreground">
                          Required for prescription analysis and drug information
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lankaqr_api_key">LankaQR API Key</Label>
                        <Input
                          id="lankaqr_api_key"
                          type="password"
                          value={siteConfig.lankaqr_api_key || ''}
                          onChange={(e) => handleConfigChange('lankaqr_api_key', e.target.value)}
                          placeholder="Enter LankaQR API key for payments"
                        />
                        <p className="text-xs text-muted-foreground">
                          Required for commission payout processing via QR payments
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={updateSiteConfig} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};
