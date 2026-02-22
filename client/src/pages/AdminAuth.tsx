
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Admin secret key - store this securely in production
const ADMIN_SECRET_KEY = 'DIGIFARMACY_ADMIN_2024_LK_SECRET';
const MAX_ADMIN_USERS = 2;

const AdminAuth: React.FC = () => {
  const [secretKey, setSecretKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminCount, setAdminCount] = useState(0);
  
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminCount();
  }, []);

  const checkAdminCount = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (error) throw error;
      setAdminCount(data?.length || 0);
    } catch (error) {
      console.error('Error checking admin count:', error);
    }
  };

  const validateSecretKey = () => {
    return secretKey === ADMIN_SECRET_KEY;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSecretKey()) {
      toast.error('Invalid admin secret key');
      return;
    }

    if (isSignUp && adminCount >= MAX_ADMIN_USERS) {
      toast.error('Maximum number of admin users reached');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }

        await signUp(email, password, {
          full_name: fullName,
          role: 'admin'
        });
        
        toast.success('Admin account created successfully!');
        await checkAdminCount(); // Update count after successful signup
      } else {
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Admin auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-[#7aebcf] flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
          <CardDescription>
            {isSignUp ? 'Create admin account' : 'Sign in to admin dashboard'}
            {isSignUp && (
              <div className="mt-2 text-sm text-muted-foreground">
                Admin slots: {adminCount}/{MAX_ADMIN_USERS}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Admin Secret Key */}
            <div className="space-y-2">
              <Label htmlFor="secretKey">Admin Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter admin secret key"
                required
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Admin full name"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@digifarmacy.lk"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white"
              disabled={loading || (isSignUp && adminCount >= MAX_ADMIN_USERS)}
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Admin Account' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm"
              disabled={isSignUp && adminCount >= MAX_ADMIN_USERS}
            >
              {isSignUp ? 'Already have an admin account? Sign in' : 'Need to create admin account? Sign up'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;
