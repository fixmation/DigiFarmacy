/**
 * Checkout Page Component
 * Handles subscription checkout and payment
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader, AlertCircle, CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '@/components/auth/useAuth';
import CheckoutService from '@/services/checkout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { SubscriptionPlan, BusinessType, BillingPeriod } from '@shared/checkout-types';

interface CheckoutPageProps {}

const CheckoutPage: React.FC<CheckoutPageProps> = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const businessType = (params.get('businessType') || 'pharmacy') as BusinessType;
  const period = (params.get('period') || 'monthly') as BillingPeriod;

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const checkoutService = CheckoutService.getInstance();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    }
  }, [user, navigate]);

  // Load subscription plan
  useEffect(() => {
    const loadPlan = async () => {
      try {
        setLoading(true);
        setError(null);

        const plans = await checkoutService.getSubscriptionPlans(businessType);
        const selectedPlan = plans.find((p) => p.period === period);

        if (!selectedPlan) {
          throw new Error('Subscription plan not found');
        }

        setPlan(selectedPlan);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load subscription plan';
        setError(message);
        console.error('Error loading plan:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [businessType, period]);

  /**
   * Handle payment
   */
  const handlePayment = async () => {
    if (!plan || !user?.email) {
      setError('Missing required information for payment');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Process subscription payment via Google Play Billing
      const response = await checkoutService.processSubscription(plan, user.id, user.email);

      if (response.success) {
        setSuccess(true);
        setOrderId(response.orderId || null);

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard?tab=subscription');
        }, 3000);
      } else {
        setError(response.error || 'Payment failed. Please try again.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment processing failed';
      setError(message);
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    navigate(-1);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to proceed with checkout.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Checkout</h1>
            <p className="text-gray-400 text-sm mt-1">Review and complete your subscription</p>
          </div>
        </div>

        {/* Success State */}
        {success && (
          <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-12 w-12 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-green-900 dark:text-green-50">Payment Successful!</h3>
                  <p className="text-sm text-green-700 dark:text-green-100 mt-1">
                    Your subscription has been activated. Redirecting to dashboard...
                  </p>
                  {orderId && <p className="text-xs text-green-600 dark:text-green-200 mt-2">Order ID: {orderId}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !success && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <Card>
            <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
              <Loader className="h-8 w-8 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading subscription details...</p>
            </CardContent>
          </Card>
        ) : plan ? (
          <>
            {/* Plan Details */}
            <Card className="mb-6 border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your subscription details before payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Info */}
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">
                          {businessType} Subscription
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize mt-1">
                          {period} billing cycle
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {plan.currency} {plan.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Included Features:</p>
                    <ul className="space-y-2">
                      {plan.features.slice(0, 5).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 5 && (
                        <li className="text-sm text-gray-500 italic">+ {plan.features.length - 5} more features</li>
                      )}
                    </ul>
                  </div>

                  {/* User Info */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Billing Email:</span> {user.email}
                    </p>
                  </div>

                  {/* Pricing Note */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>• Auto-renews every {period}</p>
                    <p>• Cancel anytime from your dashboard</p>
                    <p>• No hidden charges or setup fees</p>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {plan.currency} {plan.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="font-bold text-lg text-blue-600">
                      {plan.currency} {plan.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Info */}
            <Card className="mb-6 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-orange-900 dark:text-orange-100">Secure Payment Processing</p>
                    <p className="text-orange-800 dark:text-orange-200 text-xs mt-1">
                      Payment processed securely via Google Play Billing. Your payment information is never stored on our servers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={processing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={processing || success}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {processing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Complete Payment
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600 mb-4" />
              <p className="text-gray-600">Subscription plan not found</p>
              <Button onClick={handleCancel} variant="link" className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
