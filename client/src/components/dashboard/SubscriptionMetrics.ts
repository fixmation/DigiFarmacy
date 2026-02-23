/**
 * Subscription Metrics Types & Utilities
 * Used across admin and subscription-related dashboards
 */

export interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  monthlyRecurringRevenue: number;
  averageSubscriptionValue: number;
  churnRate: number;
  subscriptionsByType: Record<string, number>;
}

export interface PharmacySubscriptionData {
  pharmacyId: string;
  businessName: string;
  subscriptionStatus: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED';
  subscriptionType: 'pharmacy-monthly' | 'pharmacy-annual' | 'laboratory-monthly' | 'laboratory-annual';
  monthlyAmount: number;
  renewalDate: string;
  purchaseDate: string;
}

export const defaultMetrics: SubscriptionMetrics = {
  totalSubscriptions: 0,
  activeSubscriptions: 0,
  expiredSubscriptions: 0,
  cancelledSubscriptions: 0,
  monthlyRecurringRevenue: 0,
  averageSubscriptionValue: 0,
  churnRate: 0,
  subscriptionsByType: {},
};
