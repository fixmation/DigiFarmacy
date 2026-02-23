/**
 * Capacitor Google Play Billing Bridge
 * Handles communication between web app and native Google Play Billing
 */

import { registerPlugin } from '@capacitor/core';
import type { Plugin } from '@capacitor/core';
import { CapacitorPaymentRequest, CapacitorPaymentResponse, PurchaseDetails } from '@shared/checkout-types';

/**
 * Plugin interface for native Google Play Billing
 */
export interface GooglePlayBillingPlugin extends Plugin {
  /**
   * Initialize Google Play Billing
   */
  initialize(options: { packageName: string }): Promise<{ success: boolean }>;

  /**
   * Query available products/SKUs
   */
  queryProducts(options: { skus: string[] }): Promise<{ products: any[] }>;

  /**
   * Launch billing flow for a product
   */
  launchBillingFlow(options: {
    sku: string;
    userId: string;
    email: string;
  }): Promise<CapacitorPaymentResponse>;

  /**
   * Query purchase history
   */
  queryPurchaseHistory(options: {
    sku?: string;
  }): Promise<{ purchases: PurchaseDetails[] }>;

  /**
   * Acknowledge a purchase
   */
  acknowledgePurchase(options: {
    purchaseToken: string;
  }): Promise<{ success: boolean }>;

  /**
   * Check subscription status
   */
  checkSubscriptionStatus(options: {
    packageName: string;
    subscriptionId: string;
    token: string;
  }): Promise<{ active: boolean; expiryTime?: number }>;
}

// Register the plugin
const GooglePlayBilling = registerPlugin<GooglePlayBillingPlugin>(
  'GooglePlayBilling',
  {
    web: () =>
      import('./google-play-billing/web').then(m => new m.GooglePlayBillingWeb()),
  }
);

/**
 * Wrapper service for Google Play Billing
 */
export class GooglePlayBillingService {
  private static instance: GooglePlayBillingService;
  private initialized = false;
  private packageName: string = 'com.digifarmacy.app';

  private constructor() {}

  static getInstance(): GooglePlayBillingService {
    if (!GooglePlayBillingService.instance) {
      GooglePlayBillingService.instance = new GooglePlayBillingService();
    }
    return GooglePlayBillingService.instance;
  }

  /**
   * Initialize billing service
   */
  async initialize(packageName?: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (packageName) {
      this.packageName = packageName;
    }

    try {
      const result = await GooglePlayBilling.initialize({
        packageName: this.packageName,
      });

      if (!result.success) {
        throw new Error('Failed to initialize Google Play Billing');
      }

      this.initialized = true;
      console.log('[GooglePlayBilling] Initialized successfully');
    } catch (error) {
      console.error('[GooglePlayBilling] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Launch billing flow for subscription
   */
  async launchBillingFlow(request: CapacitorPaymentRequest): Promise<CapacitorPaymentResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('[GooglePlayBilling] Launching billing flow for SKU:', request.sku);

      const response = await GooglePlayBilling.launchBillingFlow({
        sku: request.sku,
        userId: request.userId,
        email: request.email,
      });

      if (response.success) {
        console.log('[GooglePlayBilling] Purchase successful:', response.orderId);
      } else {
        console.warn('[GooglePlayBilling] Purchase failed:', response.error);
      }

      return response;
    } catch (error) {
      console.error('[GooglePlayBilling] Billing flow error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Query purchase history
   */
  async queryPurchaseHistory(sku?: string): Promise<PurchaseDetails[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const result = await GooglePlayBilling.queryPurchaseHistory({ sku });
      return result.purchases || [];
    } catch (error) {
      console.error('[GooglePlayBilling] Query purchase history error:', error);
      return [];
    }
  }

  /**
   * Acknowledge a purchase
   */
  async acknowledgePurchase(purchaseToken: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('[GooglePlayBilling] Acknowledging purchase token:', purchaseToken);

      const result = await GooglePlayBilling.acknowledgePurchase({
        purchaseToken,
      });

      return result.success;
    } catch (error) {
      console.error('[GooglePlayBilling] Acknowledge purchase error:', error);
      return false;
    }
  }

  /**
   * Check if subscription is active
   */
  async checkSubscriptionStatus(subscriptionId: string, token: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const result = await GooglePlayBilling.checkSubscriptionStatus({
        packageName: this.packageName,
        subscriptionId,
        token,
      });

      return result.active;
    } catch (error) {
      console.error('[GooglePlayBilling] Check subscription status error:', error);
      return false;
    }
  }
}

export default GooglePlayBilling;
