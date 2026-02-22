/**
 * Load Testing Framework for Google Play Subscription System
 * 
 * Purpose: Simulate production traffic patterns to validate system performance
 * Run with: npm run test:load
 * 
 * Test Scenarios:
 * 1. Normal load (100 concurrent users)
 * 2. Peak load (500 concurrent users)
 * 3. Stress test (1000 concurrent users)
 * 4. Spike test (sudden 5x increase)
 * 5. Sustained load (24 hour test)
 */

import * as http from 'http';

interface LoadTestConfig {
  name: string;
  concurrentUsers: number;
  duration: number; // in seconds
  rampUpTime: number; // in seconds
  endpoints: LoadTestEndpoint[];
}

interface LoadTestEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  payload?: Record<string, any>;
  weight: number; // percentage of traffic
  expectedStatus: number;
}

interface LoadTestMetrics {
  requestsTotal: number;
  requestsSuccessful: number;
  requestsFailed: number;
  responseTimes: number[];
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  throughput: number; // requests per second
  errorsByCode: Record<number, number>;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
}

export class LoadTestRunner {
  private baseUrl: string;
  private metrics: LoadTestMetrics;
  private authToken: string = '';

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): LoadTestMetrics {
    return {
      requestsTotal: 0,
      requestsSuccessful: 0,
      requestsFailed: 0,
      responseTimes: [],
      averageResponseTime: 0,
      medianResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      throughput: 0,
      errorsByCode: {},
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
    };
  }

  /**
   * Run load test scenario
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestMetrics> {
    console.log(`\n🚀 Starting Load Test: ${config.name}`);
    console.log(`   Concurrent Users: ${config.concurrentUsers}`);
    console.log(`   Duration: ${config.duration} seconds`);
    console.log(`   Ramp-up Time: ${config.rampUpTime} seconds\n`);

    this.metrics = this.initializeMetrics();
    const startTime = Date.now();

    // Calculate requests per second for ramp-up
    const rampUpStep = config.concurrentUsers / (config.rampUpTime || 1);
    const testStartTime = startTime + (config.rampUpTime * 1000);

    // Ramp up phase
    await this.rampUp(config, rampUpStep, startTime);

    // Sustained load phase
    const endTime = testStartTime + (config.duration * 1000);
    await this.sustainedLoad(config, endTime);

    // Calculate final metrics
    this.calculateMetrics(Date.now() - startTime);

    return this.metrics;
  }

  /**
   * Ramp up: gradually increase load
   */
  private async rampUp(config: LoadTestConfig, rampUpStep: number, startTime: number): Promise<void> {
    const interval = 100; // milliseconds
    let currentUsers = 0;
    let lastLogTime = startTime;

    return new Promise((resolve) => {
      const ramper = setInterval(async () => {
        if (currentUsers < config.concurrentUsers) {
          currentUsers = Math.min(currentUsers + rampUpStep, config.concurrentUsers);

          // Log progress every second
          if (Date.now() - lastLogTime >= 1000) {
            console.log(`📈 Ramping up: ${Math.round(currentUsers)} users`);
            lastLogTime = Date.now();
          }

          // Send requests
          for (let i = 0; i < Math.ceil(rampUpStep / 10); i++) {
            this.sendRandomRequest(config);
          }
        } else {
          clearInterval(ramper);
          resolve();
        }
      }, interval);
    });
  }

  /**
   * Sustained load: maintain constant load for specified duration
   */
  private async sustainedLoad(config: LoadTestConfig, endTime: number): Promise<void> {
    console.log(`⚡ Running sustained load test...`);

    const startTime = Date.now();
    const logInterval = 5000; // Log every 5 seconds
    let lastLogTime = startTime;
    let lastRequestCount = 0;

    return new Promise((resolve) => {
      const loader = setInterval(() => {
        const now = Date.now();

        if (now >= endTime) {
          clearInterval(loader);
          console.log(`✅ Load test completed`);
          resolve();
          return;
        }

        // Send requests continuously
        for (let i = 0; i < config.concurrentUsers; i++) {
          this.sendRandomRequest(config);
        }

        // Log progress every 5 seconds
        if (now - lastLogTime >= logInterval) {
          const elapsedSeconds = (now - startTime) / 1000;
          const requestsSinceLastLog = this.metrics.requestsTotal - lastRequestCount;
          const currentThroughput = requestsSinceLastLog / (logInterval / 1000);

          console.log(
            `⏱️  ${Math.round(elapsedSeconds)}s | ` +
            `${this.metrics.requestsTotal} total | ` +
            `${Math.round(currentThroughput)} req/s | ` +
            `${this.metrics.requestsFailed} failed`
          );

          lastLogTime = now;
          lastRequestCount = this.metrics.requestsTotal;
        }
      }, 10); // Send batches every 10ms
    });
  }

  /**
   * Send random request based on endpoint weights
   */
  private async sendRandomRequest(config: LoadTestConfig): Promise<void> {
    const random = Math.random() * 100;
    let cumulativeWeight = 0;

    let endpoint = config.endpoints[0];
    for (const ep of config.endpoints) {
      cumulativeWeight += ep.weight;
      if (random <= cumulativeWeight) {
        endpoint = ep;
        break;
      }
    }

    await this.sendRequest(endpoint);
  }

  /**
   * Send HTTP request and measure response time
   */
  private sendRequest(endpoint: LoadTestEndpoint): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = new URL(endpoint.path, this.baseUrl);

      const options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LoadTester/1.0',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        },
        timeout: 10000, // 10 second timeout
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const responseTime = Date.now() - startTime;

          this.metrics.requestsTotal++;
          this.metrics.responseTimes.push(responseTime);

          // Track response time extremes
          this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, responseTime);
          this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, responseTime);

          if (res.statusCode === endpoint.expectedStatus) {
            this.metrics.requestsSuccessful++;
          } else {
            this.metrics.requestsFailed++;
            this.metrics.errorsByCode[res.statusCode || 0] = (this.metrics.errorsByCode[res.statusCode || 0] || 0) + 1;
          }

          resolve();
        });
      });

      req.on('error', (error) => {
        this.metrics.requestsFailed++;
        this.metrics.errorsByCode[0] = (this.metrics.errorsByCode[0] || 0) + 1;
        resolve();
      });

      req.on('timeout', () => {
        req.abort();
        this.metrics.requestsFailed++;
        resolve();
      });

      if (endpoint.payload) {
        req.write(JSON.stringify(endpoint.payload));
      }

      req.end();
    });
  }

  /**
   * Calculate percentile response times
   */
  private calculatePercentile(percentile: number): number {
    const sorted = this.metrics.responseTimes.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Calculate final metrics
   */
  private calculateMetrics(totalTime: number): void {
    this.metrics.endTime = new Date();
    this.metrics.duration = totalTime / 1000;

    if (this.metrics.responseTimes.length > 0) {
      const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageResponseTime = sum / this.metrics.responseTimes.length;
      this.metrics.medianResponseTime = this.calculatePercentile(50);
      this.metrics.p95ResponseTime = this.calculatePercentile(95);
      this.metrics.p99ResponseTime = this.calculatePercentile(99);
    }

    this.metrics.throughput = this.metrics.requestsTotal / (totalTime / 1000);
  }

  /**
   * Print formatted test results
   */
  printResults(): void {
    const successRate = ((this.metrics.requestsSuccessful / this.metrics.requestsTotal) * 100).toFixed(2);
    const errorRate = ((this.metrics.requestsFailed / this.metrics.requestsTotal) * 100).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('📊 LOAD TEST RESULTS');
    console.log('='.repeat(60));

    console.log('\n📈 Throughput:');
    console.log(`  Total Requests: ${this.metrics.requestsTotal}`);
    console.log(`  Successful: ${this.metrics.requestsSuccessful} (${successRate}%)`);
    console.log(`  Failed: ${this.metrics.requestsFailed} (${errorRate}%)`);
    console.log(`  Throughput: ${this.metrics.throughput.toFixed(2)} req/s`);

    console.log('\n⏱️  Response Times:');
    console.log(`  Min: ${this.metrics.minResponseTime.toFixed(2)}ms`);
    console.log(`  Avg: ${this.metrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`  Median: ${this.metrics.medianResponseTime.toFixed(2)}ms`);
    console.log(`  P95: ${this.metrics.p95ResponseTime.toFixed(2)}ms`);
    console.log(`  P99: ${this.metrics.p99ResponseTime.toFixed(2)}ms`);
    console.log(`  Max: ${this.metrics.maxResponseTime.toFixed(2)}ms`);

    if (Object.keys(this.metrics.errorsByCode).length > 0) {
      console.log('\n❌ Errors by Status Code:');
      for (const [code, count] of Object.entries(this.metrics.errorsByCode)) {
        if (code !== '0') {
          console.log(`  ${code}: ${count} errors`);
        }
      }
    }

    console.log('\n📊 Test Duration:');
    console.log(`  Start: ${this.metrics.startTime.toISOString()}`);
    console.log(`  End: ${this.metrics.endTime.toISOString()}`);
    console.log(`  Total: ${this.metrics.duration.toFixed(2)}s`);

    console.log('\n' + '='.repeat(60));

    // Performance assessment
    this.assessPerformance();
  }

  /**
   * Assess performance against acceptable thresholds
   */
  private assessPerformance(): void {
    const issues: string[] = [];

    if (this.metrics.averageResponseTime > 500) {
      issues.push(`⚠️  Average response time (${this.metrics.averageResponseTime.toFixed(0)}ms) exceeds 500ms threshold`);
    }

    if (this.metrics.p95ResponseTime > 1000) {
      issues.push(`⚠️  P95 response time (${this.metrics.p95ResponseTime.toFixed(0)}ms) exceeds 1000ms threshold`);
    }

    if (this.metrics.p99ResponseTime > 2000) {
      issues.push(`⚠️  P99 response time (${this.metrics.p99ResponseTime.toFixed(0)}ms) exceeds 2000ms threshold`);
    }

    const successRate = (this.metrics.requestsSuccessful / this.metrics.requestsTotal) * 100;
    if (successRate < 99) {
      issues.push(`⚠️  Success rate (${successRate.toFixed(2)}%) below 99% threshold`);
    }

    if (this.metrics.throughput < 100) {
      issues.push(`⚠️  Throughput (${this.metrics.throughput.toFixed(0)} req/s) below expected 100+ req/s`);
    }

    if (issues.length === 0) {
      console.log('✅ Performance Acceptable - All metrics within acceptable ranges');
    } else {
      console.log('⚠️  Performance Issues Found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
  }
}

/**
 * Pre-configured test scenarios
 */
export const testScenarios = {
  normalLoad: {
    name: 'Normal Load Test (100 users, 5 min)',
    concurrentUsers: 100,
    duration: 300,
    rampUpTime: 30,
    endpoints: [
      {
        method: 'POST' as const,
        path: '/api/subscriptions/initiate',
        payload: { businessType: 'pharmacy' },
        weight: 20,
        expectedStatus: 200,
      },
      {
        method: 'GET' as const,
        path: '/api/subscriptions/status',
        weight: 30,
        expectedStatus: 200,
      },
      {
        method: 'POST' as const,
        path: '/api/subscriptions/verify-purchase',
        payload: { purchaseToken: 'test-token-12345', productId: 'pharmacy-monthly' },
        weight: 25,
        expectedStatus: 200,
      },
      {
        method: 'POST' as const,
        path: '/api/subscriptions/cancel',
        payload: { subscriptionId: 'test-sub-123', reason: 'user-request' },
        weight: 15,
        expectedStatus: 200,
      },
      {
        method: 'GET' as const,
        path: '/api/health',
        weight: 10,
        expectedStatus: 200,
      },
    ],
  } as LoadTestConfig,

  peakLoad: {
    name: 'Peak Load Test (500 users, 10 min)',
    concurrentUsers: 500,
    duration: 600,
    rampUpTime: 60,
    endpoints: [
      {
        method: 'POST' as const,
        path: '/api/subscriptions/initiate',
        payload: { businessType: 'pharmacy' },
        weight: 15,
        expectedStatus: 200,
      },
      {
        method: 'GET' as const,
        path: '/api/subscriptions/status',
        weight: 40,
        expectedStatus: 200,
      },
      {
        method: 'POST' as const,
        path: '/api/subscriptions/verify-purchase',
        payload: { purchaseToken: 'test-token-12345', productId: 'pharmacy-monthly' },
        weight: 30,
        expectedStatus: 200,
      },
      {
        method: 'POST' as const,
        path: '/api/subscriptions/cancel',
        payload: { subscriptionId: 'test-sub-123', reason: 'user-request' },
        weight: 10,
        expectedStatus: 200,
      },
      {
        method: 'GET' as const,
        path: '/api/health',
        weight: 5,
        expectedStatus: 200,
      },
    ],
  } as LoadTestConfig,

  stressTest: {
    name: 'Stress Test (1000 users, 15 min)',
    concurrentUsers: 1000,
    duration: 900,
    rampUpTime: 120,
    endpoints: [
      {
        method: 'POST' as const,
        path: '/api/subscriptions/initiate',
        payload: { businessType: 'pharmacy' },
        weight: 10,
        expectedStatus: 200,
      },
      {
        method: 'GET' as const,
        path: '/api/subscriptions/status',
        weight: 50,
        expectedStatus: 200,
      },
      {
        method: 'POST' as const,
        path: '/api/subscriptions/verify-purchase',
        payload: { purchaseToken: 'test-token-12345', productId: 'pharmacy-monthly' },
        weight: 25,
        expectedStatus: 200,
      },
      {
        method: 'POST' as const,
        path: '/api/subscriptions/cancel',
        payload: { subscriptionId: 'test-sub-123', reason: 'user-request' },
        weight: 10,
        expectedStatus: 200,
      },
      {
        method: 'GET' as const,
        path: '/api/health',
        weight: 5,
        expectedStatus: 200,
      },
    ],
  } as LoadTestConfig,

  spikeTest: {
    name: 'Spike Test (sudden 5x load)',
    concurrentUsers: 500,
    duration: 300,
    rampUpTime: 10, // Very quick ramp-up to simulate spike
    endpoints: [
      {
        method: 'GET' as const,
        path: '/api/subscriptions/status',
        weight: 60,
        expectedStatus: 200,
      },
      {
        method: 'POST' as const,
        path: '/api/subscriptions/initiate',
        payload: { businessType: 'pharmacy' },
        weight: 20,
        expectedStatus: 200,
      },
      {
        method: 'POST' as const,
        path: '/api/subscriptions/verify-purchase',
        payload: { purchaseToken: 'test-token-12345', productId: 'pharmacy-monthly' },
        weight: 20,
        expectedStatus: 200,
      },
    ],
  } as LoadTestConfig,
};

// Main execution
if (require.main === module) {
  (async () => {
    const runner = new LoadTestRunner(process.env.TEST_URL || 'http://localhost:5000');

    try {
      console.log('🧪 Google Play Subscription System - Load Testing Suite\n');

      // Run all scenarios
      for (const [key, scenario] of Object.entries(testScenarios)) {
        const metrics = await runner.runLoadTest(scenario);
        runner.printResults();

        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      console.log('\n✅ All load tests completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Load test failed:', error);
      process.exit(1);
    }
  })();
}
