import React, { useState } from 'react';
import { useAuth } from '@/components/auth/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mail, CheckCircle2 } from 'lucide-react';

export const EmailVerificationNotice: React.FC = () => {
  const { user, profile } = useAuth();
  const [isResending, setIsResending] = useState(false);

  if (!user || !profile) {
    return null;
  }

  if (profile.status === 'verified') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-green-900">Email Verified</p>
          <p className="text-sm text-green-800">Your email has been successfully verified.</p>
        </div>
      </div>
    );
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Verification email sent! Please check your inbox.');
      } else {
        toast.error(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      toast.error('Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3 mb-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Email Verification Pending</p>
          <p className="text-sm text-amber-800 mt-1">
            We've sent a verification link to <span className="font-medium">{profile.email}</span>. 
            Please check your inbox and click the link to verify your email.
          </p>
        </div>
      </div>

      <div className="flex gap-2 ml-8">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResendVerification}
          disabled={isResending}
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          {isResending ? 'Sending...' : 'Resend Email'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open('https://mail.google.com', '_blank')}
        >
          Check Gmail
        </Button>
      </div>
    </div>
  );
};

export default EmailVerificationNotice;
