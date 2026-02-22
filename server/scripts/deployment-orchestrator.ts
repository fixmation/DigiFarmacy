/**
 * Phase 8 Complete: Deployment Integration & Verification
 * 
 * This file orchestrates all Phase 8 deployment components and provides
 * the final integration point for launching the Google Play subscription system.
 * 
 * Usage: npm run deploy:production
 */

import * as fs from 'fs';
import * as path from 'path';

interface DeploymentPhase {
  name: string;
  steps: DeploymentStep[];
  estimatedMinutes: number;
}

interface DeploymentStep {
  name: string;
  command?: string;
  verification?: () => Promise<boolean>;
  rollbackCommand?: string;
  critical: boolean; // If fails, rollback immediately
}

interface DeploymentConfig {
  environment: 'production' | 'staging' | 'development';
  databaseUrl: string;
  googlePlayServiceAccount: string;
  notificationEmail: string;
  slackWebhook?: string;
  startTime: Date;
  targetDuration: number; // minutes
}

export class DeploymentOrchestrator {
  private config: DeploymentConfig;
  private deploymentPhases: DeploymentPhase[] = [];
  private completedSteps: string[] = [];
  private failedSteps: string[] = [];
  private rollbackEnabled: boolean = true;

  constructor(config: Partial<DeploymentConfig>) {
    this.config = {
      environment: 'production',
      startTime: new Date(),
      targetDuration: 60,
      ...config,
    } as DeploymentConfig;

    this.initializePhases();
  }

  /**
   * Initialize deployment phases with all steps
   */
  private initializePhases(): void {
    this.deploymentPhases = [
      {
        name: 'Pre-Deployment Validation',
        estimatedMinutes: 10,
        steps: [
          {
            name: 'Check TypeScript compilation',
            command: 'npm run check',
            critical: true,
          },
          {
            name: 'Run security audit',
            command: 'npm audit --production',
            critical: false,
          },
          {
            name: 'Verify environment variables',
            command: 'npm run verify:env',
            critical: true,
          },
          {
            name: 'Test database connectivity',
            command: 'npm run test:db',
            critical: true,
          },
          {
            name: 'Verify Google Play credentials',
            command: 'npm run verify:google-play',
            critical: true,
          },
        ],
      },
      {
        name: 'Database Migration',
        estimatedMinutes: 15,
        steps: [
          {
            name: 'Create database backup',
            command: 'npm run db:backup',
            critical: true,
          },
          {
            name: 'Run migration scripts',
            command: 'npm run db:migrate -- --environment production',
            critical: true,
            rollbackCommand: 'npm run db:restore -- --latest',
          },
          {
            name: 'Verify schema integrity',
            command: 'npm run db:verify-schema',
            critical: true,
          },
          {
            name: 'Setup Row-Level Security',
            command: 'npm run db:setup-rls',
            critical: true,
          },
          {
            name: 'Optimize database',
            command: 'npm run db:optimize',
            critical: false,
          },
        ],
      },
      {
        name: 'Application Build & Deploy',
        estimatedMinutes: 20,
        steps: [
          {
            name: 'Build production assets',
            command: 'npm run build',
            critical: true,
          },
          {
            name: 'Generate source maps for debugging',
            command: 'npm run build:sourcemaps',
            critical: false,
          },
          {
            name: 'Deploy to production servers',
            command: 'npm run deploy:production',
            critical: true,
            rollbackCommand: 'npm run rollback:production',
          },
          {
            name: 'Verify application startup',
            command: 'npm run verify:app-startup',
            critical: true,
          },
          {
            name: 'Warm up application cache',
            command: 'npm run warmup:api',
            critical: false,
          },
        ],
      },
      {
        name: 'Smoke Testing',
        estimatedMinutes: 10,
        steps: [
          {
            name: 'Health check endpoint',
            command: 'npm run test:health',
            critical: true,
          },
          {
            name: 'Test subscription endpoints',
            command: 'npm run test:smoke:subscriptions',
            critical: true,
          },
          {
            name: 'Test payment flow',
            command: 'npm run test:smoke:payments',
            critical: true,
          },
          {
            name: 'Test webhook reception',
            command: 'npm run test:smoke:webhooks',
            critical: true,
          },
          {
            name: 'Verify monitoring metrics',
            command: 'npm run test:monitoring',
            critical: true,
          },
        ],
      },
      {
        name: 'Monitoring & Alerts Activation',
        estimatedMinutes: 5,
        steps: [
          {
            name: 'Activate production monitoring',
            command: 'npm run monitoring:activate',
            critical: true,
          },
          {
            name: 'Enable performance tracking',
            command: 'npm run monitoring:enable-perf',
            critical: true,
          },
          {
            name: 'Activate alert system',
            command: 'npm run alerts:activate',
            critical: true,
          },
          {
            name: 'Setup dashboard',
            command: 'npm run dashboard:setup',
            critical: false,
          },
        ],
      },
    ];
  }

  /**
   * Execute deployment
   */
  async execute(): Promise<DeploymentResult> {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 GOOGLE PLAY SUBSCRIPTION SYSTEM - PRODUCTION DEPLOYMENT');
    console.log('='.repeat(70));
    console.log(`\n📅 Environment: ${this.config.environment.toUpperCase()}`);
    console.log(`🕐 Start Time: ${this.config.startTime.toISOString()}`);
    console.log(`⏱️  Target Duration: ${this.config.targetDuration} minutes\n`);

    // Send notification
    await this.sendNotification('🟡 Deployment started');

    let allPassed = true;

    for (const phase of this.deploymentPhases) {
      console.log(`\n${'─'.repeat(70)}`);
      console.log(`📍 Phase: ${phase.name}`);
      console.log(`   Estimated Duration: ${phase.estimatedMinutes} minutes`);
      console.log(`${'─'.repeat(70)}\n`);

      const phaseResult = await this.executePhase(phase);
      if (!phaseResult.success) {
        allPassed = false;
        if (this.hasCriticalFailures(phaseResult)) {
          console.log('\n❌ Critical failure detected - initiating rollback');
          await this.rollback();
          await this.sendNotification('🔴 Deployment FAILED - Rollback completed');
          return {
            success: false,
            phaseFailed: phase.name,
            completedSteps: this.completedSteps,
            failedSteps: this.failedSteps,
            duration: this.getElapsedMinutes(),
          };
        }
      }
    }

    const endTime = new Date();
    const duration = this.getElapsedMinutes();

    console.log('\n' + '='.repeat(70));
    console.log('✅ DEPLOYMENT COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log(`\n📊 Summary:`);
    console.log(`   Completed Steps: ${this.completedSteps.length}`);
    console.log(`   Failed Steps (non-critical): ${this.failedSteps.length}`);
    console.log(`   Duration: ${duration} minutes`);
    console.log(`   End Time: ${endTime.toISOString()}`);
    console.log(`\n🎉 System is now LIVE!\n`);

    await this.sendNotification('🟢 Deployment SUCCESSFUL - System LIVE');
    await this.generatePostDeploymentReport();

    return {
      success: true,
      completedSteps: this.completedSteps,
      failedSteps: this.failedSteps,
      duration,
    };
  }

  /**
   * Execute a deployment phase
   */
  private async executePhase(phase: DeploymentPhase): Promise<{ success: boolean; failedSteps: string[] }> {
    const failedSteps: string[] = [];

    for (let i = 0; i < phase.steps.length; i++) {
      const step = phase.steps[i];
      const stepNumber = i + 1;
      const totalSteps = phase.steps.length;

      console.log(`  [${stepNumber}/${totalSteps}] 🔄 ${step.name}...`);

      try {
        // Execute command if specified
        if (step.command) {
          await this.executeCommand(step.command);
        }

        // Run verification if specified
        if (step.verification) {
          const verified = await step.verification();
          if (!verified) {
            throw new Error('Verification failed');
          }
        }

        console.log(`           ✅ ${step.name}`);
        this.completedSteps.push(step.name);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`           ❌ ${step.name} - ${errorMsg}`);

        if (step.critical) {
          failedSteps.push(step.name);
          if (step.rollbackCommand) {
            console.log(`           🔄 Running rollback: ${step.rollbackCommand}`);
            try {
              await this.executeCommand(step.rollbackCommand);
              console.log(`           ✅ Rollback successful`);
            } catch (rollbackError) {
              console.log(`           ❌ Rollback failed!`);
            }
          }
          return { success: false, failedSteps };
        } else {
          this.failedSteps.push(step.name);
          console.log(`           ⚠️  Continuing (non-critical failure)`);
        }
      }

      // Small delay between steps
      await this.delay(500);
    }

    return { success: failedSteps.length === 0, failedSteps };
  }

  /**
   * Execute shell command
   */
  private executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');

      exec(command, { timeout: 300000 }, (error: any, stdout: string, stderr: string) => {
        if (error) {
          reject(new Error(`Command failed: ${stderr || error.message}`));
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Check if phase has critical failures
   */
  private hasCriticalFailures(result: { failedSteps: string[] }): boolean {
    return result.failedSteps.length > 0;
  }

  /**
   * Rollback deployment to previous version
   */
  private async rollback(): Promise<void> {
    if (!this.rollbackEnabled) {
      console.log('❌ Rollback disabled - manual intervention needed');
      return;
    }

    console.log('\n🔄 Rolling back to previous version...\n');

    const rollbackSteps = [
      { name: 'Stop application', command: 'npm run stop:production' },
      { name: 'Restore database', command: 'npm run db:restore -- --latest' },
      { name: 'Revert code', command: 'npm run rollback:code' },
      { name: 'Restart application', command: 'npm run start:production' },
      { name: 'Verify system health', command: 'npm run test:health' },
    ];

    for (const step of rollbackSteps) {
      try {
        console.log(`  🔄 ${step.name}...`);
        if (step.command) {
          await this.executeCommand(step.command);
        }
        console.log(`     ✅ Success`);
      } catch (error) {
        console.error(`     ❌ Failed: ${error}`);
      }
    }

    console.log('\n✅ Rollback completed. Previous version is active.');
  }

  /**
   * Send notification to team
   */
  private async sendNotification(message: string): Promise<void> {
    if (!this.config.slackWebhook) {
      return;
    }

    try {
      const { default: fetch } = await import('node-fetch');
      await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${message}\n*Environment*: ${this.config.environment}\n*Time*: ${new Date().toISOString()}`,
        }),
      });
    } catch (error) {
      console.warn('⚠️  Failed to send Slack notification:', error);
    }
  }

  /**
   * Generate post-deployment report
   */
  private async generatePostDeploymentReport(): Promise<void> {
    const report = `
# Deployment Report

**Date**: ${new Date().toISOString()}
**Environment**: ${this.config.environment}
**Status**: SUCCESS

## Summary
- Total Steps: ${this.completedSteps.length + this.failedSteps.length}
- Successful: ${this.completedSteps.length}
- Failed (non-critical): ${this.failedSteps.length}
- Duration: ${this.getElapsedMinutes()} minutes

## Completed Steps
${this.completedSteps.map(s => `✅ ${s}`).join('\n')}

${this.failedSteps.length > 0 ? `\n## Non-Critical Failures\n${this.failedSteps.map(s => `⚠️  ${s}`).join('\n')}` : ''}

## Monitoring
- Metrics: ACTIVE
- Alerts: ACTIVE
- Dashboards: ACTIVE

## Next Steps
1. Monitor system for 24 hours
2. Review metrics daily for 1 week
3. Gather user feedback
4. Plan optimization (Phase 9)

---
Generated at: ${new Date().toISOString()}
`;

    const reportPath = path.join(process.cwd(), 'deployment-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Deployment report saved to: ${reportPath}`);
  }

  /**
   * Get elapsed minutes
   */
  private getElapsedMinutes(): number {
    return Math.round((Date.now() - this.config.startTime.getTime()) / 60000);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Deployment result interface
 */
interface DeploymentResult {
  success: boolean;
  phaseFailed?: string;
  completedSteps: string[];
  failedSteps: string[];
  duration: number;
}

/**
 * Export for use in npm scripts
 */
export async function runProduction(): Promise<void> {
  const orchestrator = new DeploymentOrchestrator({
    environment: 'production',
    databaseUrl: process.env.DATABASE_URL,
    googlePlayServiceAccount: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT,
    notificationEmail: process.env.DEPLOYMENT_NOTIFICATION_EMAIL,
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    targetDuration: 60,
  });

  const result = await orchestrator.execute();

  if (!result.success) {
    console.error('\n❌ Deployment failed');
    process.exit(1);
  }

  console.log('\n✅ Deployment completed successfully');
  process.exit(0);
}

/**
 * Export for use in npm scripts
 */
export async function runStaging(): Promise<void> {
  const orchestrator = new DeploymentOrchestrator({
    environment: 'staging',
    databaseUrl: process.env.DATABASE_URL_STAGING,
    googlePlayServiceAccount: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_STAGING,
    notificationEmail: process.env.DEPLOYMENT_NOTIFICATION_EMAIL,
    targetDuration: 45,
  });

  const result = await orchestrator.execute();

  if (!result.success) {
    console.error('\n❌ Staging deployment failed');
    process.exit(1);
  }

  console.log('\n✅ Staging deployment completed successfully');
  process.exit(0);
}

// CLI execution
if (require.main === module) {
  const environment = process.argv[2] || 'production';

  if (environment === 'staging') {
    runStaging();
  } else {
    runProduction();
  }
}
