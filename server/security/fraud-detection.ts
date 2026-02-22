/**
 * Fraud Detection & Validation for Subscription Payments
 * Implements various security checks to detect potential fraud
 */

export interface FraudLikelihoodScore {
  score: number; // 0-100 (0 = safe, 100 = definitely fraud)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
}

export interface PurchaseValidationContext {
  userId: string;
  email: string;
  businessType: 'pharmacy' | 'laboratory';
  purchaseToken: string;
  subscriptionId: string;
  price: number;
  currency: string;
  purchaseDate: Date;
  isFirstPurchase: boolean;
  previousPurchases: number;
  userAccountAge: number; // days since signup
}

/**
 * Fraud Detection Engine
 */
export class FraudDetectionEngine {
  /**
   * Analyze purchase for fraud indicators
   */
  static analyzePurchase(
    context: PurchaseValidationContext
  ): FraudLikelihoodScore {
    const reasons: string[] = [];
    let score = 0;

    // Check 1: Very new account making first purchase
    if (context.userAccountAge < 1) {
      score += 20;
      reasons.push('Account created less than 1 day ago');
    } else if (context.userAccountAge < 7) {
      score += 10;
      reasons.push('Account created less than 7 days ago');
    }

    // Check 2: Multiple purchases in short time (abuse pattern)
    if (context.previousPurchases > 5) {
      score += 15;
      reasons.push('Unusually high number of previous purchases');
    }

    // Check 3: Duplicate subscriptions (user trying to circumvent limits)
    if (!context.isFirstPurchase && context.previousPurchases > 0) {
      // Small risk - user is repeat customer
      score += 2;
    }

    // Check 4: Suspicious token patterns
    if (this.isSuspiciousToken(context.purchaseToken)) {
      score += 25;
      reasons.push('Suspicious purchase token format detected');
    }

    // Check 5: Price validation (very cheap or very expensive)
    if (context.price < 100) {
      // LKR 100 = ~USD 0.30, suspiciously low
      score += 15;
      reasons.push('Price unusually low (potential test/fraud)');
    } else if (context.price > 100000) {
      // LKR 100,000 = ~USD 300, suspiciously high
      score += 10;
      reasons.push('Price unusually high (potential error or fraud)');
    }

    // Check 6: Velocity check - purchases per user per time period
    // This requires database context, so we'll implement separately

    // Check 7: Geographic anomaly - would need IP geolocation data
    // Implement in extended version

    // Check 8: Email domain validation
    if (!this.isValidBusinessEmail(context.email, context.businessType)) {
      score += 5;
      reasons.push('Email domain not typical for business type');
    }

    // Calculate risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (score >= 80) {
      riskLevel = 'CRITICAL';
    } else if (score >= 60) {
      riskLevel = 'HIGH';
    } else if (score >= 30) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    return {
      score,
      riskLevel,
      reasons,
    };
  }

  /**
   * Check for suspicious token patterns
   */
  private static isSuspiciousToken(token: string): boolean {
    if (!token || token.length < 20) {
      return true; // Too short to be legitimate
    }

    // Google Play tokens typically:
    // - Are long (100+ chars)
    // - Contain alphanumeric and special chars
    // - Follow specific patterns

    if (token.length < 100) {
      return true; // Too short
    }

    // Check for patterns that look like test tokens
    if (token.includes('test') || token.includes('mock')) {
      return true;
    }

    return false;
  }

  /**
   * Validate email domain for business type
   */
  private static isValidBusinessEmail(
    email: string,
    businessType: 'pharmacy' | 'laboratory'
  ): boolean {
    if (!email || !email.includes('@')) {
      return false;
    }

    // Allow common domains
    const commonDomains = [
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com',
      'icloud.com',
    ];

    const domain = email.split('@')[1].toLowerCase();

    // For businesses, email should ideally be from company domain
    // But also accept common email providers
    if (commonDomains.includes(domain)) {
      return true;
    }

    // Check for pharmacy/lab related indicators
    if (businessType === 'pharmacy') {
      if (
        domain.includes('pharmacy') ||
        domain.includes('pharma') ||
        domain.includes('health')
      ) {
        return true;
      }
    } else if (businessType === 'laboratory') {
      if (
        domain.includes('lab') ||
        domain.includes('laboratory') ||
        domain.includes('diagnostic')
      ) {
        return true;
      }
    }

    // Accept other professional TLDs
    const professionalTlds = [
      '.com',
      '.lk',
      '.org',
      '.net',
      '.co',
      '.biz',
      '.business',
    ];
    if (professionalTlds.some((tld) => domain.endsWith(tld))) {
      return true;
    }

    return false;
  }

  /**
   * Check velocity -  too many purchases too quickly
   */
  static checkVelocity(
    purchases: Array<{
      createdAt: Date;
      status: string;
    }>,
    maxPurchasesPerHour: number = 5
  ): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentPurchases = purchases.filter(
      (p) => p.createdAt > oneHourAgo && p.status === 'ACTIVE'
    );

    return recentPurchases.length <= maxPurchasesPerHour;
  }

  /**
   * Check for duplicate purchases (prevents abuse)
   */
  static checkDuplicates(
    purchases: Array<{
      subscriptionId: string;
      createdAt: Date;
      status: string;
    }>,
    currentSubscriptionId: string,
    minutesWindow: number = 5
  ): boolean {
    const windowStart = new Date(Date.now() - minutesWindow * 60 * 1000);
    const duplicates = purchases.filter(
      (p) =>
        p.subscriptionId === currentSubscriptionId &&
        p.createdAt > windowStart &&
        p.status === 'ACTIVE'
    );

    return duplicates.length === 0; // No duplicates = safe
  }

  /**
   * Check chargeback risk based on user history
   */
  static assessChargebackRisk(
    userHistory: {
      totalPurchases: number;
      successfulCharges: number;
      failedCharges: number;
      chargebacks: number;
    }
  ): number {
    if (userHistory.totalPurchases === 0) {
      return 10; // No history = slight risk
    }

    const chargebackRate =
      (userHistory.chargebacks / userHistory.totalPurchases) * 100;
    const failureRate =
      (userHistory.failedCharges / userHistory.totalPurchases) * 100;

    let risk = 0;

    // Chargeback risk
    if (chargebackRate > 20) {
      risk += 40; // High chargeback rate
    } else if (chargebackRate > 5) {
      risk += 20;
    } else if (chargebackRate > 0) {
      risk += 5;
    }

    // Payment failure risk
    if (failureRate > 50) {
      risk += 30;
    } else if (failureRate > 20) {
      risk += 15;
    }

    return Math.min(100, risk);
  }
}

/**
 * Enhanced Payment Validation
 */
export class PaymentValidator {
  /**
   * Comprehensive purchase validation
   */
  static validatePurchase(
    purchase: any,
    expectedPrice: number
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validation 1: Price match
    const actualPrice = parseInt(purchase.priceAmountMicros);
    // Google Play prices are in microcurrencies (divide by 1,000,000)
    const expectedPriceMicros = expectedPrice * 1000000;

    if (Math.abs(actualPrice - expectedPriceMicros) > 10000) {
      // Allow small variance (0.01 LKR)
      errors.push(
        `Price mismatch: expected ${expectedPrice}, got ${actualPrice / 1000000}`
      );
    }

    // Validation 2: Purchase state
    if (purchase.paymentState !== 1) {
      errors.push('Purchase not completed (paymentState !== 1)');
    }

    // Validation 3: Expiry validation
    const expiryDate = new Date(parseInt(purchase.expiryTimeMillis));
    if (expiryDate <= new Date()) {
      errors.push('Purchase already expired');
    }

    // Validation 4: Cancellation check
    if (
      purchase.cancelReason !== undefined &&
      purchase.cancelReason !== null
    ) {
      errors.push('Purchase has been cancelled');
    }

    // Validation 5: Acknowledgement state
    if (purchase.acknowledgementState !== 1) {
      // Not critical, just warning
      console.warn('Purchase not yet acknowledged by app');
    }

    // Validation 6: Token format
    if (!purchase.token || purchase.token.length < 20) {
      errors.push('Invalid purchase token format');
    }

    // Validation 7: Order ID
    if (!purchase.orderId || purchase.orderId.length === 0) {
      errors.push('Missing order ID');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate subscription before creating record
   */
  static validateSubscriptionData(data: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Required fields
    if (!data.userId) errors.push('Missing userId');
    if (!data.businessType) errors.push('Missing businessType');
    if (!['pharmacy', 'laboratory'].includes(data.businessType)) {
      errors.push('Invalid businessType');
    }
    if (!data.subscriptionId) errors.push('Missing subscriptionId');
    if (!data.purchaseToken) errors.push('Missing purchaseToken');
    if (!data.orderId) errors.push('Missing orderId');

    // Validate dates
    if (!data.purchaseDate || isNaN(Date.parse(data.purchaseDate))) {
      errors.push('Invalid purchaseDate');
    }
    if (!data.expiryDate || isNaN(Date.parse(data.expiryDate))) {
      errors.push('Invalid expiryDate');
    }

    // Ensure expiry is after purchase
    if (
      data.purchaseDate &&
      data.expiryDate &&
      new Date(data.expiryDate) <= new Date(data.purchaseDate)
    ) {
      errors.push('Expiry date must be after purchase date');
    }

    // Validate price
    if (!data.price || data.price <= 0) {
      errors.push('Invalid price');
    }

    // Validate currency
    if (data.currency && data.currency.length !== 3) {
      errors.push('Invalid currency code');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check token for tampering
   */
  static validateTokenIntegrity(
    token: string,
    subscriptionId: string,
    packageName: string
  ): boolean {
    // Google Play tokens are cryptographically signed
    // This is a basic check - actual validation happens server-side with Google

    if (!token || token.length < 50) {
      return false;
    }

    // Token should be alphanumeric
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(token)) {
      return false;
    }

    return true;
  }
}

/**
 * Audit logging for security events
 */
export class SecurityAuditLog {
  static logFraudDetection(
    userId: string,
    score: FraudLikelihoodScore,
    action: string
  ): void {
    console.warn(`[FRAUD ALERT] User: ${userId}, Score: ${score.score}, Level: ${score.riskLevel}`);
    console.warn(`Reasons: ${score.reasons.join(', ')}`);
    console.warn(`Action taken: ${action}`);

    // In production, send to security monitoring system
    // Example: Sentry, DataDog, or custom logging service
  }

  static logSecurityEvent(
    eventType: string,
    userId: string,
    details: Record<string, any>
  ): void {
    const event = {
      timestamp: new Date(),
      eventType,
      userId,
      details,
    };

    console.log('[SECURITY EVENT]', JSON.stringify(event));

    // In production, store in audit database or logging service
  }

  static logValidationFailure(
    userId: string,
    validationType: string,
    reason: string
  ): void {
    console.error(
      `[VALIDATION FAILURE] User: ${userId}, Type: ${validationType}, Reason: ${reason}`
    );
  }
}

export default {
  FraudDetectionEngine,
  PaymentValidator,
  SecurityAuditLog,
};
