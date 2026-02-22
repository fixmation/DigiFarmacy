/**
 * Monitoring & Analytics for Subscription System
 * Tracks metrics, revenue, and health indicators
 */

export interface MetricPoint {
  timestamp: Date;
  value: number;
}

export interface SubscriptionMetrics {
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  renewalSuccessRate: number;
  averageSubscriptionLifetime: number; // days
  newSubscriptionsThisMonth: number;
  cancelledSubscriptionsThisMonth: number;
}

export interface RevenueBreakdown {
  pharmacyMonthly: number;
  pharmacyAnnual: number;
  laboratoryMonthly: number;
  laboratoryAnnual: number;
  total: number;
}

export interface HealthIndicators {
  systemHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  uptime: number; // percentage
  averageResponseTime: number; // ms
  errorRate: number; // percentage
  webhookDeliveryRate: number; // percentage
  databaseConnectionHealth: number; // percentage
}

export interface Alert {
  id: string;
  timestamp: Date;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  metric: string;
  message: string;
  threshold: number;
  actual: number;
  acknowledged: boolean;
}

/**
 * Monitoring engine for subscription metrics
 */
export class SubscriptionMonitor {
  private metrics: Map<string, MetricPoint[]> = new Map();
  private alerts: Alert[] = [];
  private startTime = Date.now();

  constructor(private readonly retentionDays: number = 30) {}

  /**
   * Record metric value
   */
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push({
      timestamp: new Date(),
      value,
    });

    // Clean old entries
    this.cleanupOldMetrics(name);
  }

  /**
   * Clean up metrics older than retention period
   */
  private cleanupOldMetrics(name: string): void {
    const cutoffTime = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;
    const points = this.metrics.get(name) || [];

    const filtered = points.filter((p) => p.timestamp.getTime() > cutoffTime);
    if (filtered.length !== points.length) {
      this.metrics.set(name, filtered);
    }
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name: string): {
    current: number;
    average: number;
    min: number;
    max: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
  } | null {
    const points = this.metrics.get(name);
    if (!points || points.length === 0) {
      return null;
    }

    const values = points.map((p) => p.value);
    const current = values[values.length - 1];
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend over last 10 data points
    let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (values.length >= 10) {
      const recentAvg =
        values.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const olderAvg =
        values.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;

      if (recentAvg > olderAvg * 1.05) {
        trend = 'UP';
      } else if (recentAvg < olderAvg * 0.95) {
        trend = 'DOWN';
      }
    }

    return { current, average, min, max, trend };
  }

  /**
   * Create alert if metric exceeds threshold
   */
  checkThreshold(
    metricName: string,
    threshold: number,
    severity: 'INFO' | 'WARNING' | 'CRITICAL'
  ): void {
    const stats = this.getMetricStats(metricName);
    if (!stats) return;

    if (stats.current > threshold) {
      this.createAlert(severity, metricName, `${metricName} exceeded ${threshold}`, threshold, stats.current);
    }
  }

  /**
   * Create alert
   */
  private createAlert(
    severity: 'INFO' | 'WARNING' | 'CRITICAL',
    metric: string,
    message: string,
    threshold: number,
    actual: number
  ): void {
    const alert: Alert = {
      id: generateId(),
      timestamp: new Date(),
      severity,
      metric,
      message,
      threshold,
      actual,
      acknowledged: false,
    };

    this.alerts.push(alert);

    console.warn(
      `[${severity} ALERT] ${metric}: ${message} (Threshold: ${threshold}, Actual: ${actual})`
    );
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }
}

/**
 * Revenue Analytics
 */
export class RevenueAnalytics {
  /**
   * Calculate MRR (Monthly Recurring Revenue)
   */
  static calculateMRR(activeSubscriptions: {
    businessType: 'pharmacy' | 'laboratory';
    subscriptionId: string;
  }[]): number {
    const priceMap: Record<string, number> = {
      'pharmacy_monthly': 2941,
      'pharmacy_annual': 29410 / 12,
      'laboratory_monthly': 1765,
      'laboratory_annual': 17650 / 12,
    };

    let mrr = 0;
    for (const sub of activeSubscriptions) {
      const price = priceMap[sub.subscriptionId] || 0;
      mrr += price;
    }

    return Math.round(mrr);
  }

  /**
   * Calculate ARR (Annual Recurring Revenue)
   */
  static calculateARR(mrr: number): number {
    return mrr * 12;
  }

  /**
   * Calculate LTV (Lifetime Value)
   */
  static calculateLTV(
    averageMonthlyRevenue: number,
    averageSubscriptionLifetimeMonths: number,
    grossMargin: number = 0.85 // After 15% Google Play commission
  ): number {
    return averageMonthlyRevenue * averageSubscriptionLifetimeMonths * grossMargin;
  }

  /**
   * Calculate CAC (Customer Acquisition Cost) payback period
   */
  static calculateCACPaybackPeriod(
    cac: number,
    monthlyRevenue: number,
    grossMargin: number = 0.85
  ): number {
    const monthlyContribution = monthlyRevenue * grossMargin;
    if (monthlyContribution <= 0) return Infinity;
    return cac / monthlyContribution;
  }

  /**
   * Calculate churn rate
   */
  static calculateChurnRate(
    startingSubscriptions: number,
    cancelledSubscriptions: number,
    endingSubscriptions: number
  ): number {
    if (startingSubscriptions === 0) return 0;
    const avgSubscriptions = (startingSubscriptions + endingSubscriptions) / 2;
    return ((cancelledSubscriptions / avgSubscriptions) * 100);
  }

  /**
   * Revenue breakdown by subscription type
   */
  static getRevenueBreakdown(subscriptions: {
    subscriptionId: string;
    price: number;
  }[]): RevenueBreakdown {
    const breakdown: RevenueBreakdown = {
      pharmacyMonthly: 0,
      pharmacyAnnual: 0,
      laboratoryMonthly: 0,
      laboratoryAnnual: 0,
      total: 0,
    };

    for (const sub of subscriptions) {
      const price = sub.price / 1000000; // Convert from microcurrency

      if (sub.subscriptionId === 'pharmacy_monthly') {
        breakdown.pharmacyMonthly += price;
      } else if (sub.subscriptionId === 'pharmacy_annual') {
        breakdown.pharmacyAnnual += price;
      } else if (sub.subscriptionId === 'laboratory_monthly') {
        breakdown.laboratoryMonthly += price;
      } else if (sub.subscriptionId === 'laboratory_annual') {
        breakdown.laboratoryAnnual += price;
      }

      breakdown.total += price;
    }

    return breakdown;
  }
}

/**
 * System Health Monitor
 */
export class HealthMonitor {
  private requests = 0;
  private errors = 0;
  private totalResponseTime = 0;
  private webhooksReceived = 0;
  private webhooksSuccessful = 0;
  private startTime = Date.now();

  /**
   *Record successful request
   */
  recordSuccess(responseTimeMs: number): void {
    this.requests++;
    this.totalResponseTime += responseTimeMs;
  }

  /**
   * Record failed request
   */
  recordError(): void {
    this.errors++;
    this.requests++;
  }

  /**
   * Record webhook
   */
  recordWebhook(successful: boolean): void {
    this.webhooksReceived++;
    if (successful) this.webhooksSuccessful++;
  }

  /**
   * Get health indicators
   */
  getHealthIndicators(): HealthIndicators {
    const uptime =
      ((Date.now() - this.startTime) / (7 * 24 * 60 * 60 * 1000)) * 100; // Uptime percentage
    const errorRate =
      this.requests === 0 ? 0 : (this.errors / this.requests) * 100;
    const averageResponseTime =
      this.requests === 0
        ? 0
        : Math.round(this.totalResponseTime / (this.requests - this.errors || 1));
    const webhookDeliveryRate =
      this.webhooksReceived === 0
        ? 100
        : (this.webhooksSuccessful / this.webhooksReceived) * 100;

    // Determine system health
    let systemHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    if (errorRate > 5 || webhookDeliveryRate < 90) {
      systemHealth = 'DEGRADED';
    }
    if (errorRate > 10 || webhookDeliveryRate < 80) {
      systemHealth = 'CRITICAL';
    }

    return {
      systemHealth,
      uptime: Math.min(100, uptime),
      averageResponseTime,
      errorRate: Math.round(errorRate * 100) / 100,
      webhookDeliveryRate: Math.round(webhookDeliveryRate * 100) / 100,
      databaseConnectionHealth: 100, // Would be calculated from DB pool
    };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.requests = 0;
    this.errors = 0;
    this.totalResponseTime = 0;
    this.webhooksReceived = 0;
    this.webhooksSuccessful = 0;
    this.startTime = Date.now();
  }
}

/**
 * Dashboard data aggregator
 */
export class DashboardAggregator {
  constructor(
    private monitor: SubscriptionMonitor,
    private healthMonitor: HealthMonitor
  ) {}

  /**
   * Get complete dashboard snapshot
   */
  getDashboardSnapshot(): {
    health: HealthIndicators;
    keyMetrics: {
      errorRate: number;
      averageResponseTime: number;
      webhookDelivery: number;
    };
    alerts: Alert[];
  } {
    const health = this.healthMonitor.getHealthIndicators();

    return {
      health,
      keyMetrics: {
        errorRate: health.errorRate,
        averageResponseTime: health.averageResponseTime,
        webhookDelivery: health.webhookDeliveryRate,
      },
      alerts: this.monitor.getActiveAlerts(),
    };
  }
}

/**
 * Generate monitoring report
 */
export function generateMonitoringReport(
  monitor: SubscriptionMonitor,
  healthMonitor: HealthMonitor
): string {
  const health = healthMonitor.getHealthIndicators();
  const alerts = monitor.getActiveAlerts();

  const report = `
═════════════════════════════════════════════════════════
Subscription System - Monitoring Report
Generated: ${new Date().toISOString()}
═════════════════════════════════════════════════════════

SYSTEM HEALTH
─────────────
Status: ${health.systemHealth}
Uptime: ${health.uptime.toFixed(2)}%
Error Rate: ${health.errorRate.toFixed(2)}%
Average Response Time: ${health.averageResponseTime}ms
Webhook Delivery Rate: ${health.webhookDeliveryRate.toFixed(2)}%
Database Connection Health: ${health.databaseConnectionHealth}%

ACTIVE ALERTS (${alerts.length})
─────────────
${alerts
  .map(
    (a) =>
      `[${a.severity}] ${a.metric}: ${a.message} (Actual: ${a.actual}, Threshold: ${a.threshold})`
  )
  .join('\n') || 'No active alerts'}

═════════════════════════════════════════════════════════
`;

  return report;
}

/**
 * Generate ID for alerts
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default {
  SubscriptionMonitor,
  RevenueAnalytics,
  HealthMonitor,
  DashboardAggregator,
  generateMonitoringReport,
};
