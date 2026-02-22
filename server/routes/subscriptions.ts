import { Router, Request, Response } from 'express';
import GooglePlayService, { SubscriptionPurchaseResponse } from '../services/googlePlay';
import { db } from '../db';

const router = Router();

// Initialize Google Play Service (credentials should come from environment)
const getGooglePlayService = (): GooglePlayService => {
  const credentials = JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT || '{}');
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.digifarmacy.app';
  return new GooglePlayService(packageName, credentials);
};

/**
 * POST /api/subscriptions/initiate
 * Get subscription details and pricing
 */
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { businessType } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!['pharmacy', 'laboratory'].includes(businessType)) {
      return res.status(400).json({ error: 'Invalid business type' });
    }

    // Define SKUs based on business type
    const skus = {
      pharmacy: {
        monthly: {
          sku: 'pharmacy_monthly',
          price: 2941, // LKR (adjusted for 15% commission)
          currency: 'LKR',
          period: 'monthly',
        },
        annual: {
          sku: 'pharmacy_annual',
          price: 29410,
          currency: 'LKR',
          period: 'annual',
        },
      },
      laboratory: {
        monthly: {
          sku: 'laboratory_monthly',
          price: 1765, // LKR (adjusted for 15% commission)
          currency: 'LKR',
          period: 'monthly',
        },
        annual: {
          sku: 'laboratory_annual',
          price: 17650,
          currency: 'LKR',
          period: 'annual',
        },
      },
    };

    const businessSkus = skus[businessType as keyof typeof skus];

    return res.json({
      businessType,
      subscriptionOptions: businessSkus,
      message: 'Ready to initiate purchase. Use these SKUs with Google Play Billing Library',
    });
  } catch (error) {
    console.error('Error initiating subscription:', error);
    res.status(500).json({ error: 'Failed to initiate subscription' });
  }
});

/**
 * POST /api/subscriptions/verify-purchase
 * Verify purchase token with Google Play
 */
router.post('/verify-purchase', async (req: Request, res: Response) => {
  try {
    const { packageName, subscriptionId, token } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!subscriptionId || !token) {
      return res.status(400).json({ error: 'Missing subscriptionId or token' });
    }

    // Validate SKU format
    const validSkus = [
      'pharmacy_monthly',
      'pharmacy_annual',
      'laboratory_monthly',
      'laboratory_annual',
    ];

    if (!validSkus.includes(subscriptionId)) {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }

    const googlePlayService = getGooglePlayService();

    // Verify purchase with Google Play
    const purchase: SubscriptionPurchaseResponse =
      await googlePlayService.verifySubscriptionPurchase(subscriptionId, token);

    // Check if subscription already exists for this token
    const existingSubscription = await db.query(
      'SELECT id FROM subscriptions WHERE purchase_token = $1',
      [token]
    );

    if (existingSubscription.rows.length > 0) {
      return res.status(400).json({
        error: 'This purchase token has already been used',
        subscription_id: existingSubscription.rows[0].id,
      });
    }

    // Calculate subscription dates
    const startDate = new Date(parseInt(purchase.startTimeMillis));
    const expiryDate = new Date(parseInt(purchase.expiryTimeMillis));

    // Determine business type from SKU
    const businessType = subscriptionId.includes('pharmacy') ? 'pharmacy' : 'laboratory';

    // Create subscription record
    const insertResult = await db.query(
      `INSERT INTO subscriptions (
        user_id,
        business_type,
        sku_id,
        purchase_token,
        order_id,
        status,
        purchase_date,
        expiry_date,
        renewal_date,
        is_auto_renew,
        price_amount_micros,
        currency_code,
        google_response
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, user_id, status, expiry_date`,
      [
        userId,
        businessType,
        subscriptionId,
        token,
        purchase.orderId,
        'ACTIVE',
        startDate,
        expiryDate,
        expiryDate,
        purchase.autoRenewing,
        purchase.priceAmountMicros,
        purchase.priceCurrencyCode,
        JSON.stringify(purchase),
      ]
    );

    const subscription = insertResult.rows[0];

    // Log purchase event
    await db.query(
      `INSERT INTO purchase_events (
        subscription_id,
        user_id,
        event_type,
        event_data
      ) VALUES ($1, $2, $3, $4)`,
      [
        subscription.id,
        userId,
        'PURCHASE',
        JSON.stringify({
          sku: subscriptionId,
          orderId: purchase.orderId,
          price: purchase.priceAmountMicros,
          currency: purchase.priceCurrencyCode,
        }),
      ]
    );

    // Acknowledge purchase with Google Play
    try {
      await googlePlayService.acknowledgeSubscriptionPurchase(subscriptionId, token);
    } catch (error) {
      console.error('Failed to acknowledge purchase (non-blocking):', error);
    }

    return res.status(201).json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        expires_at: subscription.expiry_date,
        auto_renew: purchase.autoRenewing,
      },
      message: 'Subscription verified and activated',
    });
  } catch (error: any) {
    console.error('Error verifying purchase:', error);

    // Return specific error messages
    if (error.message.includes('expired')) {
      return res.status(400).json({ error: 'Subscription has expired' });
    } else if (error.message.includes('cancelled')) {
      return res.status(400).json({ error: 'Subscription has been cancelled' });
    } else if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    res.status(500).json({ error: 'Failed to verify purchase' });
  }
});

/**
 * GET /api/subscriptions/status
 * Get current subscription status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await db.query(
      `SELECT 
        id,
        business_type,
        sku_id,
        status,
        purchase_date,
        expiry_date,
        is_auto_renew,
        price_amount_micros,
        currency_code,
        cancellation_date
      FROM subscriptions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        has_subscription: false,
        message: 'No active subscription found',
      });
    }

    const subscription = result.rows[0];
    const isExpired = new Date(subscription.expiry_date) < new Date();

    return res.json({
      has_subscription: true,
      subscription: {
        id: subscription.id,
        business_type: subscription.business_type,
        sku: subscription.sku_id,
        status: isExpired && subscription.status === 'ACTIVE' ? 'EXPIRED' : subscription.status,
        purchased_at: subscription.purchase_date,
        expires_at: subscription.expiry_date,
        auto_renew: subscription.is_auto_renew,
        price: subscription.price_amount_micros,
        currency: subscription.currency_code,
        days_remaining: Math.ceil(
          (new Date(subscription.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      },
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancel active subscription
 */
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Find active subscription
    const result = await db.query(
      `SELECT id, sku_id, purchase_token FROM subscriptions
       WHERE user_id = $1 AND status = 'ACTIVE'
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const subscription = result.rows[0];

    // Update subscription status
    await db.query(
      `UPDATE subscriptions
       SET status = 'CANCELLED', cancellation_date = NOW(), cancellation_reason = $1
       WHERE id = $2`,
      [reason || 'User requested cancellation', subscription.id]
    );

    // Log cancellation event
    await db.query(
      `INSERT INTO purchase_events (
        subscription_id,
        user_id,
        event_type,
        event_data
      ) VALUES ($1, $2, $3, $4)`,
      [
        subscription.id,
        userId,
        'CANCELLATION',
        JSON.stringify({
          reason: reason || 'User requested cancellation',
          cancelled_at: new Date(),
        }),
      ]
    );

    return res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription_id: subscription.id,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * POST /api/subscriptions/webhook
 * Receive notifications from Google Play
 * Documentation: https://developer.android.com/google/play/billing/rtdn-reference
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { message, messageId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    // Decode the message (it's base64 encoded)
    const decodedMessage = JSON.parse(Buffer.from(message.data, 'base64').toString('utf-8'));

    const { subscriptionNotification } = decodedMessage;

    // Handle different notification types
    switch (subscriptionNotification.notificationType) {
      case 1: // SUBSCRIPTION_RECOVERED
        await handleSubscriptionRecovered(subscriptionNotification);
        break;
      case 2: // SUBSCRIPTION_RENEWED
        await handleSubscriptionRenewed(subscriptionNotification);
        break;
      case 3: // SUBSCRIPTION_CANCELED
        await handleSubscriptionCanceled(subscriptionNotification);
        break;
      case 4: // SUBSCRIPTION_PURCHASE
        await handleSubscriptionPurchase(subscriptionNotification);
        break;
      case 5: // SUBSCRIPTION_ON_HOLD
        await handleSubscriptionOnHold(subscriptionNotification);
        break;
      case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
        await handleSubscriptionInGracePeriod(subscriptionNotification);
        break;
      case 7: // SUBSCRIPTION_RESTARTED
        await handleSubscriptionRestarted(subscriptionNotification);
        break;
      case 8: // SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
        await handlePriceChangeConfirmed(subscriptionNotification);
        break;
      case 9: // SUBSCRIPTION_DEFERRED
        await handleSubscriptionDeferred(subscriptionNotification);
        break;
      case 11: // SUBSCRIPTION_EXPIRED
        await handleSubscriptionExpired(subscriptionNotification);
        break;
      default:
        console.log('Unknown notification type:', subscriptionNotification.notificationType);
    }

    // Acknowledge receipt of the message
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

/**
 * Webhook handlers for different subscription events
 */

async function handleSubscriptionRecovered(notification: any) {
  console.log('Subscription recovered:', notification);
  // Handle recovery - subscription was paused and is now recovered
  // Update subscription status to ACTIVE
}

async function handleSubscriptionRenewed(notification: any) {
  console.log('Subscription renewed:', notification);
  // Update subscription with new expiry date
}

async function handleSubscriptionCanceled(notification: any) {
  console.log('Subscription canceled:', notification);
  // Update subscription status to CANCELLED
}

async function handleSubscriptionPurchase(notification: any) {
  console.log('Subscription purchase:', notification);
  // Initial subscription purchase
}

async function handleSubscriptionOnHold(notification: any) {
  console.log('Subscription on hold:', notification);
  // User initiated pause
}

async function handleSubscriptionInGracePeriod(notification: any) {
  console.log('Subscription in grace period:', notification);
  // Payment method failed but subscription still active
}

async function handleSubscriptionRestarted(notification: any) {
  console.log('Subscription restarted:', notification);
  // User restarted a cancelled subscription
}

async function handlePriceChangeConfirmed(notification: any) {
  console.log('Price change confirmed:', notification);
  // User confirmed price increase
}

async function handleSubscriptionDeferred(notification: any) {
  console.log('Subscription deferred:', notification);
  // User deferred upgrade/downgrade
}

async function handleSubscriptionExpired(notification: any) {
  console.log('Subscription expired:', notification);
  // Mark subscription as EXPIRED
  // Update user profile subscription_status
}

export default router;
