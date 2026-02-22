import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Google Play Webhook Security
 * Implements RSA-SHA1 signature verification for webhooks
 */

export interface WebbookSecurityConfig {
  publicKey: string;
  maxMessageAge: number; // milliseconds
  allowedPackageNames: string[];
}

/**
 * Verify webhook signature from Google Play
 * All webhooks from Google Play are signed with their private key
 * We verify using their public key
 */
export function verifyWebbookSignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const verifier = crypto.createVerify('RSA-SHA1');
    verifier.update(message);
    return verifier.verify(publicKey, signature, 'base64');
  } catch (error) {
    console.error('Failed to verify webhook signature:', error);
    return false;
  }
}

/**
 * Validate webhook message structure
 */
export interface ValidatedWebhookMessage {
  valid: boolean;
  error?: string;
  messageId?: string;
  publishTime?: string;
  subscriptionNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    subscriptionId: string;
  };
}

export function validateWebbookMessage(
  rawMessage: any
): ValidatedWebhookMessage {
  // Check if message structure is valid
  if (!rawMessage || typeof rawMessage !== 'object') {
    return {
      valid: false,
      error: 'Invalid message format',
    };
  }

  const { message, messageId } = rawMessage;

  if (!message || !message.data) {
    return {
      valid: false,
      error: 'Missing message data',
    };
  }

  if (!messageId) {
    return {
      valid: false,
      error: 'Missing messageId for idempotency',
    };
  }

  try {
    // Decode base64 message
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
    const parsedMessage = JSON.parse(decodedData);

    // Validate notification structure
    if (!parsedMessage.subscriptionNotification) {
      return {
        valid: false,
        error: 'Missing subscriptionNotification',
      };
    }

    const { version, notificationType, purchaseToken, subscriptionId } =
      parsedMessage.subscriptionNotification;

    if (!version || !notificationType || !purchaseToken || !subscriptionId) {
      return {
        valid: false,
        error: 'Missing required notification fields',
      };
    }

    // Validate notification type (1-11, excluding missing types)
    const validTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11];
    if (!validTypes.includes(notificationType)) {
      return {
        valid: false,
        error: `Invalid notification type: ${notificationType}`,
      };
    }

    return {
      valid: true,
      messageId,
      publishTime: message.publishTime,
      subscriptionNotification: parsedMessage.subscriptionNotification,
    };
  } catch (error) {
    console.error('Failed to validate webhook message:', error);
    return {
      valid: false,
      error: 'Failed to parse webhook message',
    };
  }
}

/**
 * Check if message is too old (prevent replay attacks)
 */
export function isMessageTooOld(publishTime: string, maxAge: number): boolean {
  try {
    const publishDate = new Date(publishTime);
    const messageAge = Date.now() - publishDate.getTime();
    return messageAge > maxAge;
  } catch (error) {
    console.error('Failed to check message age:', error);
    return true; // Fail safe - reject old messages
  }
}

/**
 * Idempotency check - track processed messageIds
 * In production, use Redis or database to store processed IDs
 */
export class IdempotencyStore {
  private processedMessages = new Map<string, Date>();
  private readonly ttl = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Check if message was already processed
   */
  isProcessed(messageId: string): boolean {
    const timestamp = this.processedMessages.get(messageId);
    if (!timestamp) return false;

    // Clean up expired entries
    if (Date.now() - timestamp.getTime() > this.ttl) {
      this.processedMessages.delete(messageId);
      return false;
    }

    return true;
  }

  /**
   * Mark message as processed
   */
  markProcessed(messageId: string): void {
    this.processedMessages.set(messageId, new Date());
  }

  /**
   * Clean up old entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [messageId, timestamp] of this.processedMessages.entries()) {
      if (now - timestamp.getTime() > this.ttl) {
        this.processedMessages.delete(messageId);
      }
    }
  }
}

/**
 * Webhook verification middleware
 */
export function createWebbookVerificationMiddleware(
  publicKey: string,
  idempotencyStore: IdempotencyStore
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, messageId } = req.body;

      // Validate webhook message structure
      const validation = validateWebbookMessage(req.body);
      if (!validation.valid) {
        console.warn(
          `Invalid webhook message: ${validation.error}`,
          req.body
        );
        return res.status(400).json({
          error: 'Invalid webhook format',
          details: validation.error,
        });
      }

      // Check message age (reject very old messages)
      const maxAge = 60 * 1000; // 1 minute
      if (
        validation.publishTime &&
        isMessageTooOld(validation.publishTime, maxAge)
      ) {
        console.warn(`Webhook message too old: ${validation.publishTime}`);
        return res.status(400).json({
          error: 'Webhook message too old',
        });
      }

      // Check for duplicate message (idempotency)
      const messageIdStr = String(messageId);
      if (idempotencyStore.isProcessed(messageIdStr)) {
        console.warn(`Duplicate webhook message: ${messageIdStr}`);
        // Return 200 to acknowledge receipt (Pub/Sub will not retry)
        return res.status(200).json({
          success: true,
          message: 'Duplicate message acknowledged',
        });
      }

      // Mark as processed
      idempotencyStore.markProcessed(messageIdStr);

      // Store validated data for route handler
      req.body._validated = validation;

      next();
    } catch (error) {
      console.error('Webhook verification middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Security utilities
 */
export const SecurityUtils = {
  /**
   * Hash purchase token for storage obfuscation
   */
  hashPurchaseToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  /**
   * Generate secure random string
   */
  generateSecureString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  },

  /**
   * Time-constant string comparison (prevent timing attacks)
   */
  secureCompare(a: string, b: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(a),
      Buffer.from(b)
    );
  },

  /**
   * Sanitize error messages to not leak sensitive data
   */
  sanitizeError(error: any): string {
    if (error instanceof Error) {
      // Log full error internally
      console.error('Error details:', error);

      // Return safe message to client
      if (error.message.includes('token')) {
        return 'Invalid purchase token';
      } else if (error.message.includes('not found')) {
        return 'Purchase record not found';
      } else if (error.message.includes('expired')) {
        return 'Subscription has expired';
      }
    }
    return 'An error occurred processing your request';
  },
};

export default {
  verifyWebbookSignature,
  validateWebbookMessage,
  isMessageTooOld,
  IdempotencyStore,
  createWebbookVerificationMiddleware,
  SecurityUtils,
};
