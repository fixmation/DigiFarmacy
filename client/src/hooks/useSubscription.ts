import { useState, useCallback, useEffect } from 'react';

export interface SubscriptionStatus {
  has_subscription: boolean;
  subscription?: {
    id: string;
    business_type: 'pharmacy' | 'laboratory';
    sku: string;
    status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';
    purchased_at: string;
    expires_at: string;
    auto_renew: boolean;
    price: number;
    currency: string;
    days_remaining: number;
  };
}

export interface SubscriptionOption {
  sku: string;
  price: number;
  currency: string;
  period: 'monthly' | 'annual';
}

export interface SubscriptionOptions {
  businessType: 'pharmacy' | 'laboratory';
  subscriptionOptions: {
    monthly: SubscriptionOption;
    annual: SubscriptionOption;
  };
}

export interface UseSubscriptionReturn {
  status: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  initiatePurchase: (businessType: 'pharmacy' | 'laboratory') => Promise<SubscriptionOptions>;
  verifyPurchase: (
    subscriptionId: string,
    token: string
  ) => Promise<{
    success: boolean;
    subscription: {
      id: string;
      status: string;
      expires_at: string;
      auto_renew: boolean;
    };
  }>;
  cancelSubscription: (reason?: string) => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription status
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to fetch subscription:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Initiate purchase flow
  const initiatePurchase = useCallback(
    async (businessType: 'pharmacy' | 'laboratory'): Promise<SubscriptionOptions> => {
      try {
        setError(null);

        const response = await fetch('/api/subscriptions/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ businessType }),
        });

        if (!response.ok) {
          throw new Error('Failed to initiate subscription');
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Verify purchase with Google Play
  const verifyPurchase = useCallback(
    async (subscriptionId: string, token: string) => {
      try {
        setError(null);

        const response = await fetch('/api/subscriptions/verify-purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            subscriptionId,
            token,
            packageName: process.env.VITE_GOOGLE_PLAY_PACKAGE_NAME,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to verify purchase');
        }

        const data = await response.json();

        // Refetch status after successful purchase
        await fetchStatus();

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      }
    },
    [fetchStatus]
  );

  // Cancel subscription
  const cancelSubscription = useCallback(
    async (reason?: string) => {
      try {
        setError(null);

        const response = await fetch('/api/subscriptions/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ reason }),
        });

        if (!response.ok) {
          throw new Error('Failed to cancel subscription');
        }

        // Refetch status after cancellation
        await fetchStatus();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      }
    },
    [fetchStatus]
  );

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
    initiatePurchase,
    verifyPurchase,
    cancelSubscription,
  };
};

export default useSubscription;
