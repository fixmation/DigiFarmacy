/**
 * Checkout and subscription types for payment processing
 */

export type BusinessType = 'pharmacy' | 'laboratory';
export type BillingPeriod = 'monthly' | 'annual';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface SubscriptionPlan {
  id: string;
  businessType: BusinessType;
  period: BillingPeriod;
  price: number; // in LKR
  currency: string;
  sku: string; // Google Play SKU
  features: string[];
}

export interface CheckoutSession {
  id: string;
  userId: string;
  businessType: BusinessType;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  expiresAt?: string;
}

export interface PurchaseDetails {
  orderId?: string;
  packageName: string;
  productId: string;
  purchaseToken?: string;
  purchaseTime: number;
  purchaseState: 'purchased' | 'cancelled';
  developmentPayload?: string;
  acknowledgementState?: 'unacknowledged' | 'acknowledged';
}

export interface GooglePlayBillingConfig {
  packageName: string;
  serviceAccount: any; // Service account credentials
  skus: {
    [key: string]: SubscriptionPlan;
  };
}

export interface CapacitorPaymentRequest {
  sku: string;
  businessType: BusinessType;
  userId: string;
  email: string;
}

export interface CapacitorPaymentResponse {
  success: boolean;
  orderId?: string;
  purchaseToken?: string;
  message?: string;
  error?: string;
}

export interface BillingError {
  code: string;
  message: string;
  recoverable: boolean;
}

export interface SubscriptionCheckoutData {
  businessType: BusinessType;
  period: BillingPeriod;
  planId: string;
  price: number;
  currency: string;
  features: string[];
}
