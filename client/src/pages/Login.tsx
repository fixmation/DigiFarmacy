import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/useAuth';
import { AuthModal } from '@/components/auth/AuthModal';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading } = useAuth();

  // Where to go after successful login
  const redirectTo = searchParams.get('redirect') || '/checkout';

  useEffect(() => {
    // Wait for auth check; if already signed in, go to redirect target
    if (loading) return;

    if (user && profile) {
      navigate(redirectTo);
    }
  }, [user, profile, loading, navigate, redirectTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-[#7aebcf]">
      <AuthModal
        isOpen={true}
        onClose={() => navigate('/')}
      />
    </div>
  );
};

export default LoginPage;
