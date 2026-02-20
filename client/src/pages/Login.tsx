import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // If user is already authenticated or authentication is still loading, do nothing
    if (loading) return;

    if (user && profile) {
      console.log("Login Page: User authenticated, navigating to /.");
      navigate('/');
    } else {
      // If not authenticated, redirect to the landing page to allow them to sign in from there
      console.log("Login Page: User not authenticated, navigating to / to show AuthModal.");
      navigate('/');
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-[#7aebcf]">
      {/* This page should ideally not be seen if the routing is correct. */}
      {/* If seen, it implies a redirect loop or an unhandled state. */}
      <p>Redirecting...</p>
    </div>
  );
};

export default LoginPage;
