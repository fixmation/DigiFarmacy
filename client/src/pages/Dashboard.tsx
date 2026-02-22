
import { useAuth } from "@/components/auth/useAuth";
import { PharmacyDashboard } from "@/components/dashboard/PharmacyDashboard";
import { LaboratoryDashboard } from "@/components/dashboard/LaboratoryDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-blue mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to sign in to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate('/')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (profile.role) {
    case 'pharmacy':
      return <PharmacyDashboard />;
    case 'laboratory':
      return <LaboratoryDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return (
        <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Unknown Role</CardTitle>
              <CardDescription>
                Your account role is not recognized
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate('/')}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
  }
};

export default Dashboard;
