import { Request, Response, NextFunction } from 'express';

/**
 * Rate Limiting for Subscription API
 * Prevents abuse and ensures fair resource usage
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
}

export interface RateLimitStore {
  get(key: string): Promise<number>;
  set(key: string, value: number, ttl: number): Promise<void>;
  increment(key: string, ttl: number): Promise<number>;
}

/**
 * In-memory rate limit store (for development)
 * In production, use Redis
 */
export class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;

    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return 0;
    }

    return entry.count;
  }

  async set(key: string, value: number, ttl: number): Promise<void> {
    this.store.set(key, {
      count: value,
      resetTime: Date.now() + ttl,
    });
  }

  async increment(key: string, ttl: number): Promise<number> {
    const entry = this.store.get(key);

    if (!entry || Date.now() > entry.resetTime) {
      // Reset if expired or doesn't exist
      this.store.set(key, {
        count: 1,
        resetTime: Date.now() + ttl,
      });
      return 1;
    }

    // Increment existing
    entry.count++;
    return entry.count;
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Create rate limit middleware
 */
export function createRateLimiter(
  config: RateLimitConfig,
  store: RateLimitStore
) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    statusCode = 429,
    skipSuccessfulRequests = false,
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get identifier (user ID or IP)
      const userId = (req.user as any)?.id;
      const identifier = userId || req.ip || 'anonymous';
      const key = `ratelimit:${identifier}`;

      // Increment request count
      const currentCount = await store.increment(key, windowMs);

      // Calculate reset time
      const resetTime = Math.floor(windowMs / 1000);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': String(Math.max(0, maxRequests - currentCount)),
        'X-RateLimit-Reset': String(Math.ceil((Date.now() + windowMs) / 1000)),
      });

      // Check if limit exceeded
      if (currentCount > maxRequests) {
        console.warn(
          `Rate limit exceeded for ${identifier}:`,
          `${currentCount}/${maxRequests}`
        );

        res.set('Retry-After', String(resetTime));
        return res.status(statusCode).json({
          error: message,
          retryAfter: resetTime,
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - allow request on error
      next();
    }
  };
}

/**
 * Per-endpoint rate limiters
 */
export const subscriptionRateLimiters = {
  /**
   * /subscriptions/initiate - 10 requests per minute
   */
  initiate: (store: RateLimitStore) =>
    createRateLimiter(
      {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        message: 'Too many subscription initiation requests',
      },
      store
    ),

  /**
   * /subscriptions/verify-purchase - 5 requests per minute
   * (Lower limit due to Google Play verification cost)
   */
  verifyPurchase: (store: RateLimitStore) =>
    createRateLimiter(
      {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 5,
        message: 'Too many purchase verification requests',
      },
      store
    ),

  /**
   * /subscriptions/status - 20 requests per minute
   */
  status: (store: RateLimitStore) =>
    createRateLimiter(
      {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 20,
        message: 'Too many status check requests',
      },
      store
    ),

  /**
   * /subscriptions/cancel - 5 requests per minute
   */
  cancel: (store: RateLimitStore) =>
    createRateLimiter(
      {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 5,
        message: 'Too many cancellation requests',
      },
      store
    ),

  /**
   * /subscriptions/webhook - 100 requests per minute
   * (Higher limit as webhooks are from trusted source)
   */
  webhook: (store: RateLimitStore) =>
    createRateLimiter(
      {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
        message: 'Too many webhook requests',
      },
      store
    ),
};

/**
 * Sliding window rate limiter for more granular control
 */
export class SlidingWindowRateLimiter {
  private store = new Map<string, number[]>();
  private readonly cleanupInterval: NodeJS.Timer;

  constructor(cleanupIntervalMs: number = 60 * 1000) {
    // Clean up old entries periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get request timestamps for this identifier
    let timestamps = this.store.get(identifier) || [];

    // Remove old timestamps outside the window
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= limit) {
      return false;
    }

    // Add current timestamp and save
    timestamps.push(now);
    this.store.set(identifier, timestamps);

    return true;
  }

  /**
   * Get remaining requests in window
   */
  getRemaining(identifier: string, limit: number, windowMs: number): number {
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = this.store.get(identifier) || [];
    timestamps = timestamps.filter((ts) => ts > windowStart);

    return Math.max(0, limit - timestamps.length);
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [identifier, timestamps] of this.store.entries()) {
      const validTimestamps = timestamps.filter(
        (ts) => now - ts < 24 * 60 * 60 * 1000 // Keep for 24 hours
      );

      if (validTimestamps.length === 0) {
        this.store.delete(identifier);
      } else {
        this.store.set(identifier, validTimestamps);
      }
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

/**
 * Adaptive rate limiting based on resource usage
 */
export class AdaptiveRateLimiter {
  private baseLimit: number;
  private thresholds = {
    cpu: 80, // CPU usage %
    memory: 85, // Memory usage %
    dbConnections: 90, // DB connection %
  };

  constructor(baseLimit: number = 100) {
    this.baseLimit = baseLimit;
  }

  /**
   * Calculate adaptive limit based on current load
   */
  getAdaptiveLimit(
    cpuUsage: number,
    memoryUsage: number,
    dbConnections: number
  ): number {
    let limit = this.baseLimit;

    // Reduce limits if resources are constrained
    if (cpuUsage > this.thresholds.cpu) {
      limit = Math.floor(limit * 0.7);
    }
    if (memoryUsage > this.thresholds.memory) {
      limit = Math.floor(limit * 0.6);
    }
    if (dbConnections > this.thresholds.dbConnections) {
      limit = Math.floor(limit * 0.5);
    }

    return Math.max(1, limit); // Ensure at least 1 request
  }
}

/**
 * Circuit breaker pattern for failed operations
 */
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;

  constructor(
    private failureThreshold: number = 5,
    private successThreshold: number = 2,
    private resetTimeoutMs: number = 60 * 1000
  ) {}

  /**
   * Get current state
   */
  getState(): string {
    // Auto-reset if timeout passed
    if (
      this.state === 'OPEN' &&
      Date.now() - this.lastFailureTime > this.resetTimeoutMs
    ) {
      console.log('Circuit breaker transitioning to HALF_OPEN');
      this.state = 'HALF_OPEN';
      this.successCount = 0;
    }

    return this.state;
  }

  /**
   * Check if request is allowed
   */
  canExecute(): boolean {
    const state = this.getState();
    return state !== 'OPEN';
  }

  /**
   * Record successful operation
   */
  recordSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        console.log('Circuit breaker closing');
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }

  /**
   * Record failed operation
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold && this.state === 'CLOSED') {
      console.warn('Circuit breaker opening');
      this.state = 'OPEN';
    }
  }
}

export default {
  InMemoryRateLimitStore,
  createRateLimiter,
  subscriptionRateLimiters,
  SlidingWindowRateLimiter,
  AdaptiveRateLimiter,
  CircuitBreaker,
};
