import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Building2, 
  DollarSign, 
  Settings, 
  TrendingUp,
  CheckCircle,
  FlaskConical,
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/useAuth';
import { toast } from 'sonner';

interface AdminStats {
  totalUsers: number;
  totalPharmacies: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  pendingVerifications: number;
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
}

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPharmacies: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRecurringRevenue: 0,
    pendingVerifications: 0,
  });
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({});
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isDeveloperAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch user stats
      const { data: usersData } = await (supabase
        .from('profiles')
        .select('id, full_name, email, role, status, created_at') as any);

      // Fetch pharmacy details
      const { data: pharmacyData } = await (supabase
        .from('pharmacy_details')
        .select('id') as any);

      // Fetch subscription stats
      const { data: subscriptions } = await (supabase
        .from('subscriptions')
        .select('id, status, product_id, monthly_price') as any);

      // Process stats
      const totalUsers = usersData?.length || 0;
      const totalPharmacies = pharmacyData?.length || 0;
      const totalSubscriptions = subscriptions?.length || 0;
      const activeSubscriptions = subscriptions?.filter((s: any) => s.status === 'ACTIVE').length || 0;
      const pendingVerifications = usersData?.filter((u: any) => 
        (u.role === 'pharmacy' || u.role === 'laboratory') && u.status === 'pending'
      ).length || 0;

      // Calculate MRR
      const monthlyRecurringRevenue = subscriptions
        ?.filter((s: any) => s.status === 'ACTIVE')
        .reduce((sum: number, s: any) => sum + (Number(s.monthly_price) || 0), 0) || 0;

      setStats({
        totalUsers,
        totalPharmacies,
        totalSubscriptions,
        activeSubscriptions,
        monthlyRecurringRevenue,
        pendingVerifications,
      });

      setUsers(usersData || []);

      // Fetch site configuration
      if (isDeveloperAdmin) {
        const { data: configData } = await (supabase
          .from('site_config')
          .select('config_key, config_value') as any);

        const configObj: SiteConfig = {};
        configData?.forEach((c: any) => {
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
    if (!isDeveloperAdmin) return;
    
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(siteConfig)) {
        await (supabase
          .from('site_config')
          .upsert({ 
            config_key: key,
            config_value: value,
            updated_at: new Date().toISOString()
          }) as any);
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
      await (supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId) as any);

      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );

      toast.success(`User ${newStatus === 'verified' ? 'activated' : 'blocked'} successfully`);
      fetchAdminData();
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
    <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-medical-slate mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage pharmacies, subscriptions, and site configuration</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Pharmacies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-medical-slate">{stats.totalPharmacies}</div>
                <Building2 className="w-8 h-8 text-medical-blue opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">{stats.activeSubscriptions}</div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-medical-blue">LKR {stats.monthlyRecurringRevenue.toLocaleString()}</div>
                <DollarSign className="w-8 h-8 text-medical-blue opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-medical-slate">{stats.totalUsers}</div>
                <Users className="w-8 h-8 text-medical-slate opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-amber-600">{stats.pendingVerifications}</div>
                <AlertTriangle className="w-8 h-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-medical-slate">{stats.totalSubscriptions}</div>
                <CreditCard className="w-8 h-8 text-medical-slate opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="subscriptions" className="space-y-4">
          <TabsList className="bg-white border-0 shadow-md p-1">
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-medical-blue data-[state=active]:text-white">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-medical-blue data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Users & Verification
            </TabsTrigger>
            {isDeveloperAdmin && (
              <TabsTrigger value="config" className="data-[state=active]:bg-medical-blue data-[state=active]:text-white">
                <Settings className="w-4 h-4 mr-2" />
                Site Configuration
              </TabsTrigger>
            )}
          </TabsList>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Subscription Overview</CardTitle>
                <CardDescription>Track subscription metrics and revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Subscriptions</p>
                    <p className="text-2xl font-bold text-medical-blue">{stats.totalSubscriptions}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">LKR {stats.monthlyRecurringRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Users & Verification</CardTitle>
                <CardDescription>Manage user accounts and verification status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                            {user.role}
                          </Badge>
                          <Badge variant={user.status === 'verified' ? 'secondary' : 'destructive'}>
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                      {(user.role === 'pharmacy' || user.role === 'laboratory') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id, user.status)}
                          className="ml-2"
                        >
                          {user.status === 'verified' ? 'Block' : 'Approve'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration Tab */}
          {isDeveloperAdmin && (
            <TabsContent value="config">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Site Configuration</CardTitle>
                  <CardDescription>Manage global site settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="app_name">App Name</Label>
                      <Input
                        id="app_name"
                        value={siteConfig['app_name'] || ''}
                        onChange={(e) => handleConfigChange('app_name', e.target.value)}
                        placeholder="DigiFarmacy"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={siteConfig['contact_email'] || ''}
                        onChange={(e) => handleConfigChange('contact_email', e.target.value)}
                        placeholder="support@digifarmacy.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="support_phone">Support Phone</Label>
                      <Input
                        id="support_phone"
                        value={siteConfig['support_phone'] || ''}
                        onChange={(e) => handleConfigChange('support_phone', e.target.value)}
                        placeholder="+94 11 234 5678"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={updateSiteConfig}
                    disabled={saving}
                    className="w-full bg-medical-blue hover:bg-medical-blue/90"
                  >
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
