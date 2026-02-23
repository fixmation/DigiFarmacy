/**
 * Web implementation of Google Play Billing Plugin
 * Used for development and web browser testing
 */

import { WebPlugin } from '@capacitor/core';
import type { GooglePlayBillingPlugin } from '../google-play-billing';
import { CapacitorPaymentResponse, PurchaseDetails } from '@shared/checkout-types';

export class GooglePlayBillingWeb extends WebPlugin implements GooglePlayBillingPlugin {
  private packageName: string = 'com.digifarmacy.app';
  private mockPurchases: Map<string, PurchaseDetails> = new Map();

  /**
   * Initialize the billing system
   */
  async initialize(options: { packageName: string }): Promise<{ success: boolean }> {
    this.packageName = options.packageName;
    console.log('[GooglePlayBillingWeb] Initialized for package:', this.packageName);
    return { success: true };
  }

  /**
   * Query available products
   */
  async queryProducts(options: { skus: string[] }): Promise<{ products: any[] }> {
    console.log('[GooglePlayBillingWeb] Querying products:', options.skus);

    // Mock products for development
    const mockProducts = options.skus.map((sku) => ({
      sku,
      title: `DigiFarmacy - ${sku.replace(/_/g, ' ')}`,
      description: `Subscription: ${sku}`,
      price: this.getMockPrice(sku),
      priceCurrencyCode: 'LKR',
      type: 'subs',
    }));

    return { products: mockProducts };
  }

  /**
   * Launch billing flow (show payment dialog)
   */
  async launchBillingFlow(options: {
    sku: string;
    userId: string;
    email: string;
  }): Promise<CapacitorPaymentResponse> {
    console.log('[GooglePlayBillingWeb] Launching billing flow:', {
      sku: options.sku,
      userId: options.userId,
      email: options.email,
    });

    // In web/development, show console message
    console.log(`
      ╔═══════════════════════════════════════════════════╗
      ║       MOCK GOOGLE PLAY BILLING FLOW                ║
      ╠═══════════════════════════════════════════════════╣
      ║ SKU: ${options.sku.padEnd(42)} ║
      ║ User: ${options.userId.padEnd(40)} ║
      ║ Email: ${options.email.padEnd(39)} ║
      ║                                                   ║
      ║ In production, the native Google Play Billing    ║
      ║ dialog would appear here for the user to         ║
      ║ complete the payment.                            ║
      ╚═══════════════════════════════════════════════════╝
    `);

    // Simulate successful purchase
    const mockOrderId = `ORDER_${Date.now()}`;
    const mockToken = `TOKEN_${Math.random().toString(36).substring(2, 15)}`;

    const purchase: PurchaseDetails = {
      orderId: mockOrderId,
      packageName: this.packageName,
      productId: options.sku,
      purchaseToken: mockToken,
      purchaseTime: Date.now(),
      purchaseState: 'purchased',
      acknowledgementState: 'unacknowledged',
    };

    this.mockPurchases.set(mockToken, purchase);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      orderId: mockOrderId,
      purchaseToken: mockToken,
      message: 'Mock purchase successful (development mode)',
    };
  }

  /**
   * Query purchase history
   */
  async queryPurchaseHistory(options: { sku?: string }): Promise<{ purchases: PurchaseDetails[] }> {
    console.log('[GooglePlayBillingWeb] Querying purchase history for SKU:', options.sku);

    const purchases = Array.from(this.mockPurchases.values());
    const filtered = options.sku
      ? purchases.filter((p) => p.productId === options.sku)
      : purchases;

    return { purchases: filtered };
  }

  /**
   * Acknowledge a purchase
   */
  async acknowledgePurchase(options: { purchaseToken: string }): Promise<{ success: boolean }> {
    console.log('[GooglePlayBillingWeb] Acknowledging purchase:', options.purchaseToken);

    const purchase = this.mockPurchases.get(options.purchaseToken);
    if (purchase) {
      purchase.acknowledgementState = 'acknowledged';
      return { success: true };
    }

    return { success: false };
  }

  /**
   * Check subscription status
   */
  async checkSubscriptionStatus(options: {
    packageName: string;
    subscriptionId: string;
    token: string;
  }): Promise<{ active: boolean; expiryTime?: number }> {
    console.log('[GooglePlayBillingWeb] Checking subscription status:', options.subscriptionId);

    // Mock: assume subscription is active for 30 days
    const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000;

    return {
      active: true,
      expiryTime,
    };
  }

  /**
   * Get mock price for a SKU
   */
  private getMockPrice(sku: string): string {
    const prices: { [key: string]: string } = {
      pharmacy_monthly: 'LKR 2,500.00',
      pharmacy_annual: 'LKR 25,000.00',
      laboratory_monthly: 'LKR 1,500.00',
      laboratory_annual: 'LKR 15,000.00',
    };

    return prices[sku] || 'LKR 0.00';
  }
}
