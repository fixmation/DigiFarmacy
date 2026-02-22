import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from './useAuth';
import { UserPlus, LogIn, Building2, User, FlaskConical, Shield, Eye, EyeOff } from 'lucide-react';

// Admin secret key - store this securely in production
const ADMIN_SECRET_KEY = 'DIGIFARMACY_ADMIN_2024_LK_SECRET';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signUp, signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'admin'>('signin');

  // Sign In Form
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Admin Auth Form
  const [adminAuthData, setAdminAuthData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    secretKey: '',
    isSignUp: false
  });

  // Sign Up Form
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: 'pharmacy' as 'pharmacy' | 'laboratory',
    language: 'en' as 'en' | 'si' | 'ta',
    // Pharmacy/Laboratory specific fields
    businessName: '',
    registrationNumber: '',
    addressLine1: '',
    city: '',
    district: '',
    province: ''
  });

  const [districts, setDistricts] = useState([
    { id: 1, name: 'Colombo' },
    { id: 2, name: 'Gampaha' },
    { id: 3, name: 'Kalutara' },
    { id: 4, name: 'Kandy' },
    { id: 5, name: 'Matale' },
    { id: 6, name: 'Nuwara Eliya' },
    { id: 7, name: 'Galle' },
    { id: 8, name: 'Matara' },
    { id: 9, name: 'Hambantota' },
    { id: 10, name: 'Jaffna' },
    { id: 11, name: 'Kilinochchi' },
    { id: 12, name: 'Mannar' },
    { id: 13, name: 'Vavuniya' },
    { id: 14, name: 'Mullaitivu' },
    { id: 15, name: 'Batticaloa' },
    { id: 16, name: 'Ampara' },
    { id: 17, name: 'Trincomalee' },
    { id: 18, name: 'Kurunegala' },
    { id: 19, name: 'Puttalam' },
    { id: 20, name: 'Anuradhapura' },
    { id: 21, name: 'Polonnaruwa' },
    { id: 22, name: 'Badulla' },
    { id: 23, name: 'Monaragala' },
    { id: 24, name: 'Ratnapura' },
    { id: 25, name: 'Kegalle' }
  ]); // Mock data

  const handleDistrictChange = (districtName: string) => {
    setSignUpData({ ...signUpData, district: districtName, province: getProvinceByDistrict(districtName) });
  };

  const handleRoleChange = (role: 'pharmacy' | 'laboratory') => {
    setSignUpData({ 
      ...signUpData, 
      role,
      businessName: '',
      registrationNumber: '',
      addressLine1: '',
      city: '',
      district: '',
      province: ''
    });
  };

  const getProvinceByDistrict = (district: string) => {
    // Mock function - replace with actual data fetching logic
    switch (district) {
      case 'Colombo':
      case 'Gampaha':
      case 'Kalutara':
        return 'Western Province';
      case 'Kandy':
      case 'Matale':
      case 'Nuwara Eliya':
        return 'Central Province';
      case 'Galle':
      case 'Matara':
      case 'Hambantota':
        return 'Southern Province';
      case 'Jaffna':
      case 'Kilinochchi':
      case 'Mannar':
      case 'Vavuniya':
      case 'Mullaitivu':
        return 'Northern Province';
      case 'Batticaloa':
      case 'Ampara':
      case 'Trincomalee':
        return 'Eastern Province';
      case 'Kurunegala':
      case 'Puttalam':
        return 'North Western Province';
      case 'Anuradhapura':
      case 'Polonnaruwa':
        return 'North Central Province';
      case 'Badulla':
      case 'Monaragala':
        return 'Uva Province';
      case 'Ratnapura':
      case 'Kegalle':
        return 'Sabaragamuwa Province';
      default:
        return '';
    }
  };

  const validateAdminSecretKey = () => {
    return adminAuthData.secretKey === ADMIN_SECRET_KEY;
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateAdminSecretKey()) {
      setError('Invalid admin secret key');
      return;
    }

    setLoading(true);
    try {
      if (adminAuthData.isSignUp) {
        if (adminAuthData.password !== adminAuthData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        await signUp(adminAuthData.email, adminAuthData.password, {
          full_name: adminAuthData.fullName,
          role: 'admin',
          secretKey: adminAuthData.secretKey
        });

        setError('');
        setAdminAuthData({
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          secretKey: '',
          isSignUp: false
        });
        onClose();
      } else {
        await signIn(adminAuthData.email, adminAuthData.password);
        setAdminAuthData({
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          secretKey: '',
          isSignUp: false
        });
        onClose();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Admin authentication failed';
      setError(errorMessage);
      console.error('Admin auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(signInData.email, signInData.password);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.';
      setError(errorMessage);
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pdpaConsent) {
      alert('Please accept the PDPA consent to continue.');
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        full_name: signUpData.fullName,
        role: signUpData.role,
        phone: signUpData.phone,
        preferred_language: signUpData.language,
        // Include business data if role is pharmacy or laboratory
        ...((signUpData.role === 'pharmacy' || signUpData.role === 'laboratory') && {
          business_name: signUpData.businessName,
          registration_number: signUpData.registrationNumber,
          address_line1: signUpData.addressLine1,
          city: signUpData.city,
          district: signUpData.district,
          province: signUpData.province
        })
      };

      await signUp(signUpData.email, signUpData.password, userData);
      onClose();
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto shadow-blue-xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Welcome to DigiFarmacy</DialogTitle>
          <DialogDescription>
            Sign in or create your account to access all features
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup' | 'admin')} className="w-full">
          {/* Desktop Tabs (hidden on mobile) */}
          <TabsList className="hidden sm:grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="signin" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Sign Up</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile Dropdown Selector (shown only on mobile) */}
          <div className="sm:hidden mb-6">
            <Label htmlFor="auth-mode" className="block text-sm font-medium mb-2">Authentication Mode</Label>
            <Select value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup' | 'admin')}>
              <SelectTrigger id="auth-mode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="signin">
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In to Your Account
                  </div>
                </SelectItem>
                <SelectItem value="signup">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create New Account
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Administrator Access
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

            <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="your@email.com"
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full medical-gradient text-white" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Sign up has been disabled for public users. Registrations for pharmacies and labs are by invitation/verification only. */}
              
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="signup-role" className="text-sm sm:text-base">Account Type</Label>
                <Select value={signUpData.role} onValueChange={(value) => handleRoleChange(value as 'pharmacy' | 'laboratory')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="laboratory">Laboratory</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={signUpData.password}
                  onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  placeholder="Your Full Name"
                  value={signUpData.fullName}
                  onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                  required
                />
              </div>
              
              {(signUpData.role === 'pharmacy' || signUpData.role === 'laboratory') && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50 shadow-blue-sm">
                  <h4 className="font-medium text-blue-900">
                    {signUpData.role === 'pharmacy' ? 'Pharmacy Information' : 'Laboratory Information'}
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input
                      id="business-name"
                      placeholder={signUpData.role === 'pharmacy' ? 'e.g., Wellness Pharmacy Pvt Ltd' : 'e.g., MediLab Diagnostics Pvt Ltd'}
                      value={signUpData.businessName}
                      onChange={(e) => setSignUpData({ ...signUpData, businessName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration-number">
                      {signUpData.role === 'pharmacy' ? 'Pharmacy Registration Number' : 'SLMC Registration Number'}
                    </Label>
                    <Input
                      id="registration-number"
                      placeholder={signUpData.role === 'pharmacy' ? 'e.g., PH/WP/2023/001' : 'e.g., SLMC/LAB/2023/001'}
                      value={signUpData.registrationNumber}
                      onChange={(e) => setSignUpData({ ...signUpData, registrationNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">First Line of Address</Label>
                    <Input
                      id="addressLine1"
                      placeholder="e.g., No. 123, Main Street"
                      value={signUpData.addressLine1}
                      onChange={(e) => setSignUpData({ ...signUpData, addressLine1: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Town/City</Label>
                    <Input
                      id="city"
                      placeholder="e.g., Colombo 07"
                      value={signUpData.city}
                      onChange={(e) => setSignUpData({ ...signUpData, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Select value={signUpData.district} onValueChange={(value) => handleDistrictChange(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.name}>{district.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province">Province</Label>
                    <Input
                      id="province"
                      value={signUpData.province}
                      readOnly
                    />
                  </div>
                  <p className="text-sm text-blue-700">
                    Note: You'll need to upload certificates after registration for verification.
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pdpa-consent"
                  checked={pdpaConsent}
                  onCheckedChange={(checked) => setPdpaConsent(checked as boolean)}
                />
                <Label htmlFor="pdpa-consent" className="text-sm">
                  I agree to the processing of my personal data in accordance with{' '}
                  <a 
                    href="/pdpa" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Sri Lanka's PDPA
                  </a>
                </Label>
              </div>

              <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white" disabled={loading || !pdpaConsent}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-secret">Admin Secret Key</Label>
                <Input
                  id="admin-secret"
                  type="password"
                  placeholder="Enter admin secret key"
                  value={adminAuthData.secretKey}
                  onChange={(e) => setAdminAuthData({ ...adminAuthData, secretKey: e.target.value })}
                  required
                />
                <p className="text-xs text-slate-500">Required to access admin features</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="your@email.com"
                  value={adminAuthData.email}
                  onChange={(e) => setAdminAuthData({ ...adminAuthData, email: e.target.value })}
                  required
                />
              </div>

              {adminAuthData.isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="admin-fullname">Full Name</Label>
                  <Input
                    id="admin-fullname"
                    type="text"
                    placeholder="Your full name"
                    value={adminAuthData.fullName}
                    onChange={(e) => setAdminAuthData({ ...adminAuthData, fullName: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showAdminPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={adminAuthData.password}
                    onChange={(e) => setAdminAuthData({ ...adminAuthData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                  >
                    {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {adminAuthData.isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="admin-confirm-password">Confirm Password</Label>
                  <Input
                    id="admin-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={adminAuthData.confirmPassword}
                    onChange={(e) => setAdminAuthData({ ...adminAuthData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? (adminAuthData.isSignUp ? 'Creating Admin...' : 'Signing In...') : (adminAuthData.isSignUp ? 'Create Admin Account' : 'Admin Sign In')}
              </Button>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setAdminAuthData({ ...adminAuthData, isSignUp: !adminAuthData.isSignUp })}
              >
                {adminAuthData.isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};