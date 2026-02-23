/**
 * Checkout Service
 * Handles subscription checkout flow
 */

import { SubscriptionCheckoutData, SubscriptionPlan, BillingPeriod, BusinessType, CapacitorPaymentResponse, PaymentStatus } from '@shared/checkout-types';
import { GooglePlayBillingService } from './google-play-billing';
import { getPlatformInfo } from '../utils/platform';

const API_BASE = '/api';

interface CheckoutState {
  isProcessing: boolean;
  error: string | null;
  successMessage: string | null;
  lastOrderId: string | null;
}

export class CheckoutService {
  private static instance: CheckoutService;
  private state: CheckoutState = {
    isProcessing: false,
    error: null,
    successMessage: null,
    lastOrderId: null,
  };

  private billingService = GooglePlayBillingService.getInstance();

  private constructor() {}

  static getInstance(): CheckoutService {
    if (!CheckoutService.instance) {
      CheckoutService.instance = new CheckoutService();
    }
    return CheckoutService.instance;
  }

  /**
   * Get subscription plans
   */
  async getSubscriptionPlans(businessType: BusinessType): Promise<SubscriptionPlan[]> {
    try {
      const response = await fetch(`${API_BASE}/subscriptions/plans?businessType=${businessType}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch plans: ${response.statusText}`);
      }

      const data = await response.json();
      return data.plans || [];
    } catch (error) {
      console.error('[CheckoutService] Error fetching plans:', error);
      throw error;
    }
  }

  /**
   * Initiate checkout session
   */
  async initiateCheckout(data: SubscriptionCheckoutData): Promise<{ checkoutSessionId: string }> {
    try {
      this.state.isProcessing = true;
      this.state.error = null;

      const response = await fetch(`${API_BASE}/checkout/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          businessType: data.businessType,
          period: data.period,
          planId: data.planId,
          amount: data.price,
          currency: data.currency,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate checkout: ${response.statusText}`);
      }

      const result = await response.json();
      return { checkoutSessionId: result.sessionId };
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CheckoutService] Error initiating checkout:', error);
      throw error;
    } finally {
      this.state.isProcessing = false;
    }
  }

  /**
   * Process subscription payment
   */
  async processSubscription(plan: SubscriptionPlan, userId: string, email: string): Promise<CapacitorPaymentResponse> {
    try {
      this.state.isProcessing = true;
      this.state.error = null;
      this.state.successMessage = null;

      // Initialize billing service
      await this.billingService.initialize();

      // Launch billing flow
      console.log(`[CheckoutService] Launching payment for SKU: ${plan.sku}`);

      const response = await this.billingService.launchBillingFlow({
        sku: plan.sku,
        businessType: plan.businessType,
        userId,
        email,
      });

      if (response.success && response.purchaseToken) {
        // Acknowledge purchase on backend
        await this.acknowledgePurchaseOnBackend(response.purchaseToken, plan.sku);

        this.state.lastOrderId = response.orderId || null;
        this.state.successMessage = 'Subscription activated successfully!';

        console.log('[CheckoutService] Payment successful:', response.orderId);
      } else {
        this.state.error = response.error || 'Payment processing failed';
        console.warn('[CheckoutService] Payment failed:', response.error);
      }

      return response;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Payment processing failed';
      console.error('[CheckoutService] Payment error:', error);
      throw error;
    } finally {
      this.state.isProcessing = false;
    }
  }

  /**
   * Acknowledge purchase on backend
   */
  private async acknowledgePurchaseOnBackend(purchaseToken: string, sku: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/subscriptions/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          purchaseToken,
          sku,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge purchase on backend');
      }

      console.log('[CheckoutService] Purchase acknowledged on backend');
    } catch (error) {
      console.error('[CheckoutService] Error acknowledging purchase:', error);
      throw error;
    }
  }

  /**
   * Get checkout state
   */
  getState(): CheckoutState {
    return { ...this.state };
  }

  /**
   * Clear state
   */
  clearState(): void {
    this.state = {
      isProcessing: false,
      error: null,
      successMessage: null,
      lastOrderId: null,
    };
  }

  /**
   * Get SKU for a subscription plan
   */
  getSKU(businessType: BusinessType, period: BillingPeriod): string {
    return `${businessType}_${period}`;
  }

  /**
   * Verify subscription status
   */
  async verifySubscriptionStatus(subscriptionId: string, token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/subscriptions/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscriptionId,
          token,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.verified === true;
    } catch (error) {
      console.error('[CheckoutService] Error verifying subscription:', error);
      return false;
    }
  }
}

export default CheckoutService;
