/**
 * Error Handling & Retry Logic for Subscriptions
 * Implements robust error recovery with exponential backoff
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number; // 0-1
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attemptsUsed: number;
  totalTimeMs: number;
}

export interface DeadLetterMessage {
  id: string;
  timestamp: Date;
  messageType: string;
  data: any;
  error: string;
  attempts: number;
  lastError: Date;
}

/**
 * Default retry configuration for different operations
 */
export const retryConfigs = {
  googlePlayVerification: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  },
  databaseWrite: {
    maxRetries: 2,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitterFactor: 0.15,
  },
  webhookProcessing: {
    maxRetries: 5,
    initialDelayMs: 2000,
    maxDelayMs: 30000,
    backoffMultiplier: 1.5,
    jitterFactor: 0.2,
  },
};

/**
 * Execute function with exponential backoff retry
 */
export async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  operationName: string = 'operation'
): Promise<RetryResult<T>> {
  let lastError: Error | null = null;
  let totalTimeMs = 0;
  let currentDelayMs = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;
      totalTimeMs += duration;

      if (attempt > 0) {
        console.log(
          `[Retry Success] ${operationName} succeeded on attempt ${attempt + 1}/${config.maxRetries + 1} (${totalTimeMs}ms)`
        );
      }

      return {
        success: true,
        data: result,
        attemptsUsed: attempt + 1,
        totalTimeMs,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const duration = Date.now() - Date.now();
      totalTimeMs += duration;

      if (attempt < config.maxRetries) {
        // Calculate delay with jitter
        const jitter =
          (Math.random() - 0.5) * 2 * currentDelayMs * config.jitterFactor;
        const delayMs = Math.min(
          Math.max(0, currentDelayMs + jitter),
          config.maxDelayMs
        );

        console.warn(
          `[Retry Attempt ${attempt + 1}/${config.maxRetries + 1}] ${operationName} failed: ${lastError.message}. Retrying in ${Math.round(delayMs)}ms...`
        );

        await sleep(delayMs);
        currentDelayMs = Math.min(
          currentDelayMs * config.backoffMultiplier,
          config.maxDelayMs
        );
      } else {
        console.error(
          `[Retry Failed] ${operationName} failed after ${config.maxRetries + 1} attempts (${totalTimeMs}ms): ${lastError.message}`
        );
      }
    }
  }

  return {
    success: false,
    error: lastError || new Error('Unknown error'),
    attemptsUsed: config.maxRetries + 1,
    totalTimeMs,
  };
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Dead Letter Queue for failed operations
 */
export class DeadLetterQueue {
  private queue: DeadLetterMessage[] = [];
  private maxQueueSize = 1000;

  /**
   * Add message to DLQ
   */
  addMessage(
    messageType: string,
    data: any,
    error: Error,
    attempts: number
  ): DeadLetterMessage {
    const message: DeadLetterMessage = {
      id: generateUUID(),
      timestamp: new Date(),
      messageType,
      data,
      error: error.message,
      attempts,
      lastError: new Date(),
    };

    this.queue.push(message);

    // Maintain max size
    if (this.queue.length > this.maxQueueSize) {
      const removed = this.queue.shift();
      console.warn(`[DLQ] Removing oldest message due to size limit: ${removed?.id}`);
    }

    console.error(`[DLQ] Message added: ${message.id} (Type: ${messageType})`);

    return message;
  }

  /**
   * Get messages from DLQ
   */
  getMessages(
    limit: number = 10,
    filterType?: string
  ): DeadLetterMessage[] {
    if (filterType) {
      return this.queue.filter((m) => m.messageType === filterType).slice(0, limit);
    }
    return this.queue.slice(0, limit);
  }

  /**
   * Remove message from DLQ (after manual processing)
   */
  removeMessage(messageId: string): boolean {
    const index = this.queue.findIndex((m) => m.id === messageId);
    if (index > -1) {
      this.queue.splice(index, 1);
      console.log(`[DLQ] Message removed: ${messageId}`);
      return true;
    }
    return false;
  }

  /**
   * Get DLQ statistics
   */
  getStats(): {
    totalMessages: number;
    messagesByType: Record<string, number>;
    oldestMessage?: DeadLetterMessage;
    newestMessage?: DeadLetterMessage;
  } {
    const stats: {
      totalMessages: number;
      messagesByType: Record<string, number>;
      oldestMessage?: DeadLetterMessage;
      newestMessage?: DeadLetterMessage;
    } = {
      totalMessages: this.queue.length,
      messagesByType: {},
    };

    for (const message of this.queue) {
      stats.messagesByType[message.messageType] =
        (stats.messagesByType[message.messageType] || 0) + 1;
    }

    if (this.queue.length > 0) {
      stats.oldestMessage = this.queue[0];
      stats.newestMessage = this.queue[this.queue.length - 1];
    }

    return stats;
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.queue = [];
    console.warn('[DLQ] Queue cleared');
  }
}

/**
 * Error classification
 */
export enum ErrorType {
  TEMPORARY = 'TEMPORARY', // Retry might resolve (network timeout)
  PERMANENT = 'PERMANENT', // Retry won't help (invalid input)
  UNKNOWN = 'UNKNOWN',
}

/**
 * Classify error to determine retry strategy
 */
export function classifyError(error: any): ErrorType {
  const message = error?.message?.toLowerCase() || '';

  // Temporary errors - retry recommended
  const temporaryPatterns = [
    'timeout',
    'econnrefused',
    'econnreset',
    'enotfound',
    'etimedout',
    'network',
    'temporarily',
    'unavailable',
    'service unavailable',
    '503', // Service unavailable
    '429', // Too many requests
  ];

  for (const pattern of temporaryPatterns) {
    if (message.includes(pattern)) {
      return ErrorType.TEMPORARY;
    }
  }

  // Permanent errors - don't retry
  const permanentPatterns = [
    'invalid',
    'unauthorized',
    'forbidden',
    '401', // Unauthorized
    '403', // Forbidden
    '404', // Not found
    'not found',
    'permission denied',
  ];

  for (const pattern of permanentPatterns) {
    if (message.includes(pattern)) {
      return ErrorType.PERMANENT;
    }
  }

  return ErrorType.UNKNOWN;
}

/**
 * Get appropriate retry config based on error type
 */
export function getRetryConfigForError(
  error: any,
  baseConfig: RetryConfig = retryConfigs.googlePlayVerification
): RetryConfig {
  const errorType = classifyError(error);

  if (errorType === ErrorType.PERMANENT) {
    return {
      ...baseConfig,
      maxRetries: 0, // Don't retry permanent errors
    };
  }

  if (errorType === ErrorType.TEMPORARY) {
    return baseConfig; // Use full retry for temporary errors
  }

  return {
    ...baseConfig,
    maxRetries: Math.ceil(baseConfig.maxRetries / 2), // Reduce retries for unknown
  };
}

/**
 * User notification service for subscription events
 */
export interface NotificationQueue {
  notificationType: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  userId: string;
  timestamp: Date;
  read: boolean;
}

export class UserNotificationService {
  private notifications: Map<string, NotificationQueue[]> = new Map();

  /**
   * Send notification to user
   */
  sendNotification(
    userId: string,
    type: 'error' | 'warning' | 'success' | 'info',
    title: string,
    message: string
  ): void {
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }

    const notification: NotificationQueue = {
      notificationType: type,
      title,
      message,
      userId,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.get(userId)!.push(notification);

    console.log(`[Notification] To: ${userId}, Type: ${type}, Title: ${title}`);
  }

  /**
   * Get unread notifications for user
   */
  getUnreadNotifications(userId: string): NotificationQueue[] {
    return (this.notifications.get(userId) || []).filter((n) => !n.read);
  }

  /**
   * Mark notification as read
   */
  markAsRead(userId: string, index: number): boolean {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications && index < userNotifications.length) {
      userNotifications[index].read = true;
      return true;
    }
    return false;
  }

  /**
   * Send subscription expiry warning (7 days before)
   */
  notifySubscriptionExpiringSoon(
    userId: string,
    subscriptionId: string,
    daysRemaining: number
  ): void {
    this.sendNotification(
      userId,
      'warning',
      'Subscription Expiring Soon',
      `Your premium subscription expires in ${daysRemaining} day(s). Please renew to maintain access.`
    );
  }

  /**
   * Send subscription expired notification
   */
  notifySubscriptionExpired(userId: string, businessType: string): void {
    this.sendNotification(
      userId,
      'error',
      'Subscription Expired',
      `Your ${businessType} subscription has expired. Please renew to regain access to premium features.`
    );
  }

  /**
   * Send payment failure notification
   */
  notifyPaymentFailed(userId: string, reason: string): void {
    this.sendNotification(
      userId,
      'error',
      'Payment Failed',
      `Your subscription payment failed: ${reason}. Please update your payment method.`
    );
  }

  /**
   * Send successful renewal notification
   */
  notifyRenewalSuccess(userId: string, expiryDate: Date): void {
    const dateStr = expiryDate.toLocaleDateString();
    this.sendNotification(
      userId,
      'success',
      'Subscription Renewed',
      `Your subscription has been successfully renewed and is active until ${dateStr}.`
    );
  }

  /**
   * Send cancellation confirmation
   */
  notifySubscriptionCancelled(userId: string, expiryDate: Date): void {
    const dateStr = expiryDate.toLocaleDateString();
    this.sendNotification(
      userId,
      'info',
      'Subscription Cancelled',
      `Your subscription has been cancelled and will expire on ${dateStr}. You can still access premium features until then.`
    );
  }
}

/**
 * Generate UUID for DLQ messages
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default {
  retryWithExponentialBackoff,
  retryConfigs,
  sleep,
  DeadLetterQueue,
  ErrorType,
  classifyError,
  getRetryConfigForError,
  UserNotificationService,
};
