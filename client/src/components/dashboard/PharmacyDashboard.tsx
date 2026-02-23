
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Calendar, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/useAuth';
import { toast } from 'sonner';
import { PharmacyVerification } from './PharmacyVerification';
import { PharmacyProducts } from './PharmacyProducts';

interface Subscription {
  id: string;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';
  product_id: string;
  monthly_price: number;
  purchase_date: string;
  expiry_date: string;
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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [pharmacyDetails, setPharmacyDetails] = useState<PharmacyDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchPharmacyData();
    }
  }, [profile?.id]);

  const fetchPharmacyData = async () => {
    if (!profile?.id) return;

    try {
      // Fetch pharmacy details
      const { data: pharmacy, error: pharmacyError } = await (supabase
        .from('pharmacy_details')
        .select('*')
        .eq('user_id', profile.id)
        .single() as any);

      if (pharmacyError && (pharmacyError as any).code !== 'PGRST116') {
        console.error('Error fetching pharmacy details:', pharmacyError);
      } else if (pharmacy) {
        setPharmacyDetails(pharmacy);
      }

      // Fetch subscription info
      const { data: subscriptions, error: subscriptionError } = await (supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', profile.id)
        .order('purchase_date', { ascending: false }) as any);

      if (subscriptionError && (subscriptionError as any).code !== 'PGRST116') {
        console.error('Error fetching subscription:', subscriptionError);
      } else if (subscriptions && subscriptions.length > 0) {
        setSubscription(subscriptions[0]);
      }
    } catch (error) {
      console.error('Error fetching pharmacy data:', error);
      toast.error('Failed to load pharmacy information');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    fetchPharmacyData();
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'PAUSED':
        return 'secondary';
      case 'EXPIRED':
        return 'destructive';
      case 'CANCELLED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-medical-blue to-medical-green bg-clip-text text-transparent">
            Pharmacy Dashboard
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Manage your subscription and pharmacy operations
          </p>
        </div>

        {/* Subscription Status Card */}
        {subscription ? (
          <Card className="glass-card shadow-blue-md border-2 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Active Subscription
                  </CardTitle>
                  <CardDescription>Your current subscription status</CardDescription>
                </div>
                <Badge variant={getSubscriptionStatusColor(subscription.status)} className="text-base px-3 py-1">
                  {subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="text-lg font-semibold capitalize">{subscription.product_id.replace(/-/g, ' ')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Monthly Cost</p>
                  <p className="text-lg font-semibold">LKR {subscription.monthly_price.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Expires In</p>
                  <p className="text-lg font-semibold">
                    {getDaysUntilExpiry(subscription.expiry_date)} days
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">{new Date(subscription.purchase_date).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-medium">{new Date(subscription.expiry_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card shadow-blue-md border-2 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                No Active Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You don't have an active subscription. Please visit Google Play to subscribe to our service.
              </p>
              <Button className="bg-medical-blue hover:bg-medical-blue/90">
                Subscribe Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        {subscription && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{subscription.status}</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verification</CardTitle>
                {profile?.status === 'verified' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold capitalize">{profile?.status}</div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Renewal</CardTitle>
                <Calendar className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold">{getDaysUntilExpiry(subscription.expiry_date)} days</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Subscription Overview</CardTitle>
                <CardDescription>
                  {subscription 
                    ? 'Your current subscription details and status'
                    : 'Subscribe to access pharmacy features'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Monthly Subscription Cost</p>
                        <p className="text-3xl font-bold text-blue-600">LKR {subscription.monthly_price.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Days Remaining</p>
                        <p className="text-3xl font-bold text-green-600">{getDaysUntilExpiry(subscription.expiry_date)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-muted-foreground">No active subscription</p>
                  </div>
                )}
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
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Verification Complete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Your pharmacy has been successfully verified and is active on the platform.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="products">
            <PharmacyProducts />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
