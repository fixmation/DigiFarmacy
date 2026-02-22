
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Clock, FileText, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/useAuth';

interface Review {
  id: string;
  pharmacy_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  pharmacy_details: {
    business_name: string;
  };
}

export const CustomerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserReviews();
  }, []);

  const fetchUserReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_reviews')
        .select(`
          *,
          pharmacy_details!inner(business_name)
        `)
        .eq('customer_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-medical-blue to-medical-green bg-clip-text text-transparent">
            Welcome back, {profile?.full_name}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your personal health companion dashboard
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="glass-card hover:scale-105 transition-all duration-300">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 medical-gradient rounded-xl flex items-center justify-center mx-auto mb-2">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">Find Pharmacies</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                Search Nearby
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-all duration-300">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-medical-teal to-medical-green rounded-xl flex items-center justify-center mx-auto mb-2">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">Scan Prescription</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                Upload & Scan
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-all duration-300">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-medical-green to-medical-blue rounded-xl flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">Voice Assistant</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                Ask Questions
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card hover:scale-105 transition-all duration-300">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-medical-blue rounded-xl flex items-center justify-center mx-auto mb-2">
                <Star className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-lg">My Reviews</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="secondary">{reviews.length} Reviews</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reviews */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Your Recent Reviews
            </CardTitle>
            <CardDescription>
              Reviews you've left for pharmacies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading your reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>You haven't left any reviews yet.</p>
                <p className="text-sm">Visit a pharmacy and share your experience!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{review.pharmacy_details.business_name}</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(review.created_at)}
                        </Badge>
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-muted-foreground text-sm">{review.review_text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{profile?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{profile?.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Language</p>
                <p className="capitalize">{profile?.preferred_language}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={profile?.status === 'verified' ? 'default' : 'secondary'}>
                  {profile?.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
