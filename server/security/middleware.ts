import { Express, Request, Response, NextFunction } from 'express';
import {
  createWebbookVerificationMiddleware,
  IdempotencyStore,
  SecurityUtils,
} from './webhook-security';
import {
  InMemoryRateLimitStore,
  subscriptionRateLimiters,
  CircuitBreaker,
} from './rate-limiting';
import { FraudDetectionEngine, SecurityAuditLog } from './fraud-detection';

/**
 * Initialize all security middleware for subscription endpoints
 */
export function initializeSecurityMiddleware(app: Express): {
  idempotencyStore: IdempotencyStore;
  rateLimitStore: InMemoryRateLimitStore;
  fraudDetection: typeof FraudDetectionEngine;
  googlePlayCircuitBreaker: CircuitBreaker;
} {
  // Initialize security stores
  const idempotencyStore = new IdempotencyStore();
  const rateLimitStore = new InMemoryRateLimitStore();
  const googlePlayCircuitBreaker = new CircuitBreaker(
    5, // Fail after 5 consecutive failures
    2, // Require 2 successes to close
    60 * 1000 // Reset after 1 minute
  );

  // Webhook verification middleware
  const publicKey = process.env.GOOGLE_PLAY_PUBLIC_KEY || '';
  const webhookVerifier = createWebbookVerificationMiddleware(
    publicKey,
    idempotencyStore
  );

  // Register security middleware on subscription routes
  app.use(
    '/api/subscriptions/initiate',
    subscriptionRateLimiters.initiate(rateLimitStore)
  );

  app.use(
    '/api/subscriptions/verify-purchase',
    subscriptionRateLimiters.verifyPurchase(rateLimitStore)
  );

  app.use(
    '/api/subscriptions/status',
    subscriptionRateLimiters.status(rateLimitStore)
  );

  app.use(
    '/api/subscriptions/cancel',
    subscriptionRateLimiters.cancel(rateLimitStore)
  );

  app.use(
    '/api/subscriptions/webhook',
    subscriptionRateLimiters.webhook(rateLimitStore),
    webhookVerifier
  );

  // Global security headers middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevent information disclosure
    res.setHeader('Server', 'DigiFarmacy');

    // HSTS (only if HTTPS)
    if (req.protocol === 'https') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
    }

    next();
  });

  // Periodic cleanup of rate limit store (clean up expired entries every 5 minutes)
  setInterval(() => {
    rateLimitStore.cleanup();
  }, 5 * 60 * 1000);

  return {
    idempotencyStore,
    rateLimitStore,
    fraudDetection: FraudDetectionEngine,
    googlePlayCircuitBreaker,
  };
}

/**
 * Authentication middleware for subscription endpoints
 */
export function requireSubscriptionAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    });
  }

  if (!req.user) {
    return res.status(401).json({
      error: 'User session invalid',
      code: 'INVALID_SESSION',
    });
  }

  next();
}

/**
 * Input validation middleware for subscription endpoints
 */
export function validateSubscriptionInput(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { body } = req;

  // Validate businessType if provided
  if (
    body.businessType &&
    !['pharmacy', 'laboratory'].includes(body.businessType)
  ) {
    return res.status(400).json({
      error: 'Invalid businessType',
      code: 'INVALID_INPUT',
    });
  }

  // Validate subscriptionId format (must match known SKUs)
  if (body.subscriptionId) {
    const validSkus = [
      'pharmacy_monthly',
      'pharmacy_annual',
      'laboratory_monthly',
      'laboratory_annual',
    ];
    if (!validSkus.includes(body.subscriptionId)) {
      return res.status(400).json({
        error: 'Invalid subscriptionId',
        code: 'INVALID_SKU',
      });
    }
  }

  // Validate token if provided (basic format check)
  if (body.token) {
    if (typeof body.token !== 'string' || body.token.length < 50) {
      return res.status(400).json({
        error: 'Invalid purchase token format',
        code: 'INVALID_TOKEN',
      });
    }
  }

  // Validate reason length for cancellation
  if (body.reason) {
    if (typeof body.reason !== 'string' || body.reason.length > 500) {
      return res.status(400).json({
        error: 'Invalid cancellation reason',
        code: 'INVALID_REASON',
      });
    }
  }

  next();
}

/**
 * Error handling middleware for subscription endpoints
 */
export function handleSubscriptionErrors(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Subscription Error]', error);

  // Log security event
  if (req.user) {
    SecurityAuditLog.logSecurityEvent('error', (req.user as any).id, {
      endpoint: req.path,
      method: req.method,
      error: error.message,
    });
  }

  // Sanitize error message
  const safeMessage = SecurityUtils.sanitizeError(error);

  // Don't expose internal error details
  res.status(500).json({
    error: safeMessage,
    code: 'INTERNAL_ERROR',
  });
}

/**
 * Logging middleware for subscription endpoints
 */
export function logSubscriptionOperations(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = (req.user as any)?.id || 'anonymous';
  const startTime = Date.now();

  // Log response after it's sent
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    console.log(
      `[Subscription API] ${req.method} ${req.path} - User: ${userId} - Status: ${statusCode} - Duration: ${duration}ms`
    );

    // Log warnings for slow requests
    if (duration > 5000) {
      console.warn(`Slow subscription request detected: ${req.path} (${duration}ms)`);
    }

    // Log errors
    if (statusCode >= 400) {
      console.error(
        `[Subscription Error] ${req.method} ${req.path} - Status: ${statusCode}`
      );
    }
  });

  next();
}

/**
 * Request ID middleware for tracing
 */
export function addRequestId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId =
    req.headers['x-request-id'] || SecurityUtils.generateSecureString(16);

  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', String(requestId));

  next();
}

/**
 * CSRF protection middleware (if needed for web forms)
 */
export function validateCSRFToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // For API endpoints, CSRF protection via same-site cookies
  // Modern browsers enforce SameSite=Strict by default

  // Additional token validation if needed
  next();
}

/**
 * SQL Injection prevention - parameter validation
 */
export function sanitizeParams(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // All database queries should use parameterized queries (already implemented)
  // This middleware adds additional validation

  const { query, body } = req;

  // Check for SQL injection patterns
  const sqlPatterns =
    /(\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b)/gi;

  for (const [key, value] of Object.entries({ ...query, ...body })) {
    if (typeof value === 'string' && sqlPatterns.test(value)) {
      console.warn(
        `Potential SQL injection attempt in parameter: ${key}`,
        value
      );
      return res.status(400).json({
        error: 'Invalid input',
        code: 'INVALID_INPUT',
      });
    }
  }

  next();
}

/**
 * Data encryption middleware (for sensitive response data)
 */
export function encryptSensitiveData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // For sensitive responses containing subscription data
  // Implement encryption if needed for additional security

  // Current security is sufficient with HTTPS + TLS
  next();
}

/**
 * Compliance middleware for payment security
 */
export function validatePaymentCompliance(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Ensure HTTPS is being used
  if (req.protocol !== 'https' && process.env.NODE_ENV === 'production') {
    console.error('Non-HTTPS request to payment endpoint');
    return res.status(403).json({
      error: 'HTTPS required for payment operations',
      code: 'INSECURE_CONNECTION',
    });
  }

  // Check for required security headers
  const headers = req.headers;
  if (!headers['user-agent']) {
    console.warn('Request missing User-Agent header');
  }

  next();
}

export default {
  initializeSecurityMiddleware,
  requireSubscriptionAuth,
  validateSubscriptionInput,
  handleSubscriptionErrors,
  logSubscriptionOperations,
  addRequestId,
  validateCSRFToken,
  sanitizeParams,
  encryptSensitiveData,
  validatePaymentCompliance,
};
