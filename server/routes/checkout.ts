/**
 * Checkout Routes
 * Handles subscription checkout and payment processing
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { subscriptions, profiles } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface AuthRequest extends Request {
  user?: any;
}

/**
 * GET /api/checkout/plans
 * Get subscription plans for a business type
 */
router.get('/plans', async (req: AuthRequest, res: Response) => {
  try {
    const { businessType } = req.query;

    if (!['pharmacy', 'laboratory'].includes(businessType as string)) {
      return res.status(400).json({ error: 'Invalid business type' });
    }

    const plans = {
      pharmacy: [
        {
          id: 'pharmacy_monthly',
          businessType: 'pharmacy',
          period: 'monthly',
          price: 2500,
          currency: 'LKR',
          sku: 'pharmacy_monthly',
          features: [
            'Batch scanning and tracking',
            'Inventory management system',
            'Temperature monitoring (cold chain)',
            'NMRA compliance reports (PDF)',
            'Medicine expiry automation',
            'Real-time alerts and notifications',
            'Dashboard analytics',
            'Pharmacist role access',
            'Up to 5 staff accounts',
            'Priority support',
          ],
        },
        {
          id: 'pharmacy_annual',
          businessType: 'pharmacy',
          period: 'annual',
          price: 25000,
          currency: 'LKR',
          sku: 'pharmacy_annual',
          features: [
            'All monthly features',
            'Annual billing discount (save 2 months)',
            'Advanced analytics',
            'Custom reporting',
            'Dedicated support manager',
          ],
        },
      ],
      laboratory: [
        {
          id: 'laboratory_monthly',
          businessType: 'laboratory',
          period: 'monthly',
          price: 1500,
          currency: 'LKR',
          sku: 'laboratory_monthly',
          features: [
            'Test request management',
            'Sample tracking system',
            'Results reporting',
            'Basic analytics dashboard',
            'Staff management (up to 3 users)',
            'Patient record security',
            'Email notifications',
            'API access for integrations',
            'Monthly data backups',
            'Email support',
          ],
        },
        {
          id: 'laboratory_annual',
          businessType: 'laboratory',
          period: 'annual',
          price: 15000,
          currency: 'LKR',
          sku: 'laboratory_annual',
          features: [
            'All monthly features',
            'Annual billing discount (save 1.5 months)',
            'Advanced analytics',
            'Custom integrations',
            'Priority API support',
          ],
        },
      ],
    };

    const businessPlans = plans[businessType as keyof typeof plans] || [];

    return res.json({
      businessType,
      plans: businessPlans,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

/**
 * POST /api/checkout/initiate
 * Initiate a checkout session
 */
router.post('/initiate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { businessType, period, planId, amount, currency } = req.body;

    if (!businessType || !period || !amount || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create checkout session
    const sessionId = uuidv4();

    console.log('[Checkout] Session initiated:', {
      sessionId,
      userId,
      businessType,
      period,
      amount,
      currency,
    });

    return res.json({
      sessionId,
      businessType,
      period,
      amount,
      currency,
      status: 'initiated',
    });
  } catch (error) {
    console.error('Error initiating checkout:', error);
    res.status(500).json({ error: 'Failed to initiate checkout session' });
  }
});

/**
 * POST /api/checkout/acknowledge
 * Acknowledge a purchase and activate subscription
 */
router.post('/acknowledge', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { purchaseToken, sku } = req.body;

    if (!purchaseToken || !sku) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Parse SKU to get business type and period
    const [businessType, period] = sku.split('_');

    if (!['pharmacy', 'laboratory'].includes(businessType)) {
      return res.status(400).json({ error: 'Invalid business type' });
    }

    // Create or update subscription in database
    const subscriptionId = uuidv4();
    const now = new Date();
    const expiryDate = new Date();

    // Set expiry date based on period
    if (period === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (period === 'annual') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    // Check if user already has active subscription
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.subscriptionType, businessType as any),
        )
      )
      .limit(1);

    if (existingSubscription.length > 0) {
      // Update existing subscription
      await db
        .update(subscriptions)
        .set({
          status: 'ACTIVE',
          purchaseToken,
          expiryDate,
          autoRenew: true,
          lastRenewalDate: now,
        })
        .where(eq(subscriptions.id, existingSubscription[0].id));

      console.log('[Checkout] Subscription updated:', existingSubscription[0].id);
    } else {
      // Create new subscription
      await db.insert(subscriptions).values({
        id: subscriptionId,
        userId,
        subscriptionType: businessType as any,
        billingPeriod: period as any,
        status: 'ACTIVE',
        purchaseToken,
        expiryDate,
        autoRenew: true,
        createdAt: now,
        lastRenewalDate: now,
      });

      console.log('[Checkout] Subscription created:', subscriptionId);
    }

    // Update user profile subscription status if needed
    await db
      .update(profiles)
      .set({
        subscriptionStatus: 'ACTIVE',
        businessType: businessType as any,
      })
      .where(eq(profiles.id, userId));

    console.log('[Checkout] User profile updated');

    return res.json({
      success: true,
      message: 'Payment acknowledged and subscription activated',
      subscriptionId: existingSubscription.length > 0 ? existingSubscription[0].id : subscriptionId,
      status: 'ACTIVE',
      expiryDate: expiryDate.toISOString(),
    });
  } catch (error) {
    console.error('Error acknowledging purchase:', error);
    res.status(500).json({ error: 'Failed to acknowledge purchase' });
  }
});

/**
 * POST /api/checkout/verify
 * Verify subscription status
 */
router.post('/verify', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { subscriptionId, token } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Missing subscription ID' });
    }

    // Check subscription status
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id, subscriptionId),
          eq(subscriptions.userId, userId),
        )
      )
      .limit(1);

    if (subscription.length === 0) {
      return res.json({ verified: false });
    }

    const sub = subscription[0];

    // Check if subscription is still active
    const isActive = sub.status === 'ACTIVE' && sub.expiryDate > new Date();

    return res.json({
      verified: isActive,
      subscriptionId: sub.id,
      status: sub.status,
      expiryDate: sub.expiryDate,
      businessType: sub.subscriptionType,
    });
  } catch (error) {
    console.error('Error verifying subscription:', error);
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
});

/**
 * GET /api/checkout/subscription-status
 * Get current subscription status for user
 */
router.get('/subscription-status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user's subscriptions
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    const activeSubscriptions = userSubscriptions.filter(
      (sub) => sub.status === 'ACTIVE' && sub.expiryDate > new Date(),
    );

    return res.json({
      hasActiveSubscription: activeSubscriptions.length > 0,
      subscriptions: activeSubscriptions.map((sub) => ({
        id: sub.id,
        type: sub.subscriptionType,
        status: sub.status,
        expiryDate: sub.expiryDate,
        autoRenew: sub.autoRenew,
        billingPeriod: sub.billingPeriod,
      })),
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

export default router;
