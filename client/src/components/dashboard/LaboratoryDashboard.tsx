import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FlaskConical, 
  Calendar, 
  Bell, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Home
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/useAuth';
import { toast } from 'sonner';

interface LaboratoryDetails {
  id: string;
  business_name: string;
  registration_number: string;
  address: string;
  contact_phone?: string;
  contact_email?: string;
  operating_hours?: any;
  verified_at?: string;
  status: 'pending' | 'verified' | 'rejected' | 'suspended';
  services_offered?: string[];
  home_visit_available: boolean;
  home_visit_charges?: number;
}

interface Booking {
  id: string;
  customer_name: string;
  contact_phone: string;
  address: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  special_instructions?: string;
  created_at: string;
}

export const LaboratoryDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [labDetails, setLabDetails] = useState<LaboratoryDetails | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.role === 'laboratory') {
      fetchLaboratoryDetails();
      fetchBookings();
      fetchEarningsData();
    }
  }, [user, profile]);

  const fetchLaboratoryDetails = async () => {
    try {
      const { data: labData, error: labError } = await supabase
        .from('laboratory_details')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (labError) {
        console.error('Error fetching laboratory details:', labError);
      } else if (labData) {
        setLabDetails({
          ...labData,
          status: profile?.status || 'pending'
        });
      }
    } catch (error) {
      console.error('Error fetching laboratory details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      // First get laboratory ID
      const { data: labData } = await supabase
        .from('laboratory_details')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (labData) {
        const { data: bookingsData } = await supabase
          .from('lab_bookings')
          .select('*')
          .eq('laboratory_id', labData.id)
          .order('created_at', { ascending: false });

        if (bookingsData) {
          setBookings(bookingsData);
          setPendingBookings(bookingsData.filter((b: any) => b.status === 'pending').length);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchEarningsData = async () => {
    try {
      const { data: labData } = await supabase
        .from('laboratory_details')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (labData) {
        const { data: earningsData } = await supabase
          .from('commission_transactions')
          .select('amount_lkr')
          .eq('laboratory_id', labData.id)
          .eq('status', 'completed');

        const total = earningsData?.reduce((sum, transaction) => 
          sum + Number(transaction.amount_lkr), 0) || 0;
        
        setTotalEarnings(total);
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('lab_bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(`Booking ${status} successfully`);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-blue mx-auto mb-4"></div>
          <p>Loading laboratory dashboard...</p>
        </div>
      </div>
    );
  }

  if (!labDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Laboratory Registration</CardTitle>
              <CardDescription>Complete your laboratory profile to get verified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                It appears your laboratory profile is incomplete. Please complete your registration to start receiving bookings.
              </p>
              <Button>Complete Registration</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-medical-blue to-medical-green bg-clip-text text-transparent">
            Laboratory Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your laboratory profile, bookings, and home visits
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
              <p className="text-xs text-muted-foreground">All time bookings</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingBookings}</div>
              <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Commission earned</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {labDetails.status === 'verified' && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              {labDetails.status === 'pending' && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings">
              <Calendar className="h-4 w-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="profile">
              <FlaskConical className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="services">
              <Home className="h-4 w-4 mr-2" />
              Home Visits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-0">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Manage your home visit bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No bookings yet</p>
                      <p className="text-sm">Home visit bookings will appear here</p>
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <Card key={booking.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{booking.customer_name}</h3>
                            <p className="text-sm text-muted-foreground">{booking.service_type}</p>
                          </div>
                          <Badge variant={
                            booking.status === 'pending' ? 'secondary' :
                            booking.status === 'confirmed' ? 'default' :
                            booking.status === 'completed' ? 'outline' : 'destructive'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {booking.contact_phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {booking.address}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(booking.preferred_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {booking.preferred_time}
                          </div>
                        </div>

                        {booking.special_instructions && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            <strong>Instructions:</strong> {booking.special_instructions}
                          </div>
                        )}

                        {booking.status === 'pending' && (
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm" 
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Confirm
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}

                        {booking.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            className="mt-4 bg-blue-600 hover:bg-blue-700"
                          >
                            Mark Completed
                          </Button>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  Laboratory Profile
                </CardTitle>
                <CardDescription>
                  Overview of your laboratory details and verification status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Business Name</Label>
                    <Input value={labDetails.business_name} readOnly />
                  </div>
                  <div>
                    <Label>Registration Number</Label>
                    <Input value={labDetails.registration_number} readOnly />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Textarea value={labDetails.address} readOnly />
                  </div>
                  <div>
                    <Label>Contact Phone</Label>
                    <Input value={labDetails.contact_phone || 'N/A'} readOnly />
                  </div>
                  <div>
                    <Label>Contact Email</Label>
                    <Input value={labDetails.contact_email || 'N/A'} readOnly />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Registered on {new Date(labDetails.verified_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="mt-0">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Home Visit Services
                </CardTitle>
                <CardDescription>
                  Manage your home visit availability and charges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Home Visit Available</Label>
                    <div className="mt-2">
                      <Badge variant={labDetails.home_visit_available ? 'default' : 'secondary'}>
                        {labDetails.home_visit_available ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Home Visit Charges (LKR)</Label>
                    <Input 
                      value={labDetails.home_visit_charges || 'Not set'} 
                      readOnly 
                    />
                  </div>
                </div>

                <div>
                  <Label>Services Offered</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {labDetails.services_offered?.map((service, index) => (
                      <Badge key={index} variant="outline">
                        {service}
                      </Badge>
                    )) || <span className="text-muted-foreground">No services listed</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
