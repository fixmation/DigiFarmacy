import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    const verifyEmail = async () => {
      setIsLoading(true);

      // Basic validation
      if (!token || !email) {
        setError('Invalid verification link');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
          setIsVerified(true);
          toast.success('Email verified successfully! You can now log in.');
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setError(data.error || 'Verification failed. Please try again.');
          toast.error(data.error || 'Verification failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Network error';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, email, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center">
          {isLoading && (
            <>
              <Loader2 className="h-16 w-16 text-indigo-600 mx-auto mb-6 animate-spin" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email</h1>
              <p className="text-gray-600 mb-4">Please wait while we verify your email address...</p>
            </>
          )}

          {isVerified && !isLoading && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h1>
              <p className="text-gray-600 mb-6">
                Your email has been successfully verified. Redirecting to login...
              </p>
              <div className="text-sm text-gray-500">
                If not redirected automatically,{' '}
                <button
                  onClick={() => navigate('/')}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  click here
                </button>
              </div>
            </>
          )}

          {error && !isLoading && (
            <>
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification failed</h1>
              <p className="text-gray-600 mb-6">{error}</p>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Check your email for a new verification link
                </p>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                  >
                    Back to Login
                  </Button>
                  <Button
                    onClick={() => window.location.href = 'mailto:support@digifarmacy.lk'}
                    variant="default"
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
