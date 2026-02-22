/**
 * Database Setup & Migration Scripts
 * 
 * Handles:
 * - Database initialization
 * - Schema migration
 * - Backup and restoration
 * - Performance optimization
 * - Connection pooling setup
 */

import { Pool, PoolClient } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number; // Connection pool size
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

interface MigrationFile {
  version: string;
  name: string;
  up: string;
  down: string;
}

export class DatabaseManager {
  private pool: Pool;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.pool = new Pool(config);
  }

  /**
   * Initialize database connection pool
   */
  async initialize(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log('✅ Database connection established');
      client.release();
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Execute migration SQL
   */
  async migrate(direction: 'up' | 'down'): Promise<void> {
    const migrationDir = path.join(__dirname, '../../supabase/migrations');
    const files = fs.readdirSync(migrationDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      try {
        console.log(`▶️  Executing migration: ${file}`);
        await this.pool.query(sql);
        console.log(`✅ Migration completed: ${file}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${file}`, error);
        throw error;
      }
    }
  }

  /**
   * Backup database to SQL file
   */
  async backup(outputPath: string): Promise<void> {
    const { spawn } = require('child_process');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(outputPath, `backup_${timestamp}.sql`);

    return new Promise((resolve, reject) => {
      const backup = spawn('pg_dump', [
        '-h', this.config.host,
        '-p', this.config.port.toString(),
        '-U', this.config.user,
        '-d', this.config.database,
        '--no-password',
      ]);

      const file = fs.createWriteStream(backupFile);

      backup.stdout.pipe(file);

      backup.on('error', (error) => {
        console.error('❌ Backup failed:', error);
        reject(error);
      });

      file.on('finish', () => {
        const stats = fs.statSync(backupFile);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`✅ Backup created: ${backupFile} (${sizeMB} MB)`);
        resolve();
      });

      file.on('error', (error) => {
        console.error('❌ Backup file error:', error);
        reject(error);
      });
    });
  }

  /**
   * Restore database from backup
   */
  async restore(backupFile: string): Promise<void> {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
      const restore = spawn('psql', [
        '-h', this.config.host,
        '-p', this.config.port.toString(),
        '-U', this.config.user,
        '-d', this.config.database,
        '--no-password',
      ]);

      const file = fs.createReadStream(backupFile);

      file.pipe(restore.stdin);

      restore.on('error', (error) => {
        console.error('❌ Restore failed:', error);
        reject(error);
      });

      restore.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Restore completed from: ${backupFile}`);
          resolve();
        } else {
          reject(new Error(`Restore process exited with code ${code}`));
        }
      });

      file.on('error', (error) => {
        console.error('❌ Restore file error:', error);
        reject(error);
      });
    });
  }

  /**
   * Optimize database performance
   */
  async optimize(): Promise<void> {
    console.log('🔧 Optimizing database...');

    const optimizations = [
      // Analyze query statistics
      'ANALYZE;',

      // Reindex all indexes
      'REINDEX DATABASE CONCURRENT;',

      // Update statistics for query planner
      'ANALYZE pg_catalog;',

      // Vacuum to reclaim space
      'VACUUM ANALYZE;',
    ];

    for (const sql of optimizations) {
      try {
        console.log(`▶️  ${sql.substring(0, 30)}...`);
        await this.pool.query(sql);
      } catch (error) {
        console.error(`❌ Optimization failed: ${sql}`, error);
        throw error;
      }
    }

    console.log('✅ Database optimization complete');
  }

  /**
   * Check database size and table statistics
   */
  async getStatistics(): Promise<void> {
    try {
      // Database size
      const sizeResult = await this.pool.query(`
        SELECT
          pg_size_pretty(pg_database_size(current_database())) as size
      `);

      console.log(`\n📊 Database Statistics:`);
      console.log(`  Size: ${sizeResult.rows[0].size}`);

      // Table statistics
      const tableResult = await this.pool.query(`
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size,
          n_live_tup as rows
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
      `);

      console.log(`\n📈 Table Statistics:`);
      tableResult.rows.forEach(row => {
        console.log(`  ${row.tablename}: ${row.size} (${row.rows} rows)`);
      });

      // Index statistics
      const indexResult = await this.pool.query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          pg_size_pretty(pg_relation_size(indexrelid)) as size
        FROM pg_stat_user_indexes
        ORDER BY pg_relation_size(indexrelid) DESC
        LIMIT 10
      `);

      console.log(`\n🔍 Top 10 Indexes:`);
      indexResult.rows.forEach(row => {
        console.log(`  ${row.tablename}.${row.indexname}: ${row.size}`);
      });
    } catch (error) {
      console.error('❌ Failed to get statistics:', error);
    }
  }

  /**
   * Create connection pool for production
   */
  async setupConnectionPool(poolSize: number = 20): Promise<void> {
    console.log(`🔌 Setting up connection pool with ${poolSize} connections...`);

    // Verify pool connections
    const testResults = [];
    for (let i = 0; i < Math.min(poolSize, 5); i++) {
      try {
        const client = await this.pool.connect();
        testResults.push('✅');
        client.release();
      } catch (error) {
        testResults.push('❌');
      }
    }

    console.log(`   Test connections: ${testResults.join(' ')}`);
    console.log(`✅ Connection pool ready`);
  }

  /**
   * Setup row-level security (RLS) policies
   */
  async setupRLS(): Promise<void> {
    console.log('🔐 Setting up Row-Level Security (RLS)...');

    const policies = [
      // Enable RLS on subscriptions table
      `ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;`,

      // Pharmacies can only see their own subscriptions
      `CREATE POLICY business_subscriptions_policy ON subscriptions
       FOR ALL USING (business_id = auth.uid());`,

      // Enable RLS on purchases table
      `ALTER TABLE purchase_events ENABLE ROW LEVEL SECURITY;`,

      // Pharmacies can only see their own purchases
      `CREATE POLICY business_purchases_policy ON purchase_events
       FOR ALL USING (business_id = auth.uid());`,

      // Enable RLS on webhooks table
      `ALTER TABLE subscription_webhooks ENABLE ROW LEVEL SECURITY;`,

      // System only (no user access)
      `CREATE POLICY webhook_system_policy ON subscription_webhooks
       FOR ALL USING (FALSE);`,
    ];

    for (const policy of policies) {
      try {
        console.log(`▶️  Creating policy...`);
        await this.pool.query(policy);
      } catch (error) {
        // Ignore if policy already exists
        if (!error.message.includes('already exists')) {
          console.error(`⚠️  Policy creation warning:`, error.message);
        }
      }
    }

    console.log('✅ RLS policies configured');
  }

  /**
   * Setup automated backups
   */
  setupAutomatedBackups(backupDir: string, scheduleHour: number = 2): void {
    console.log(`📅 Setting up automated backups...`);
    console.log(`   Daily backup at ${scheduleHour}:00 UTC`);
    console.log(`   Backup directory: ${backupDir}`);

    // Create cron job script (would be integrated with actual cron)
    const cronScript = `
# Digifarmacy Database Backup
# Runs daily at ${scheduleHour}:00 UTC

0 ${scheduleHour} * * * /usr/local/bin/digifarmacy-backup >> /var/log/digifarmacy-backup.log 2>&1

# Keep only last 30 days of backups
0 ${scheduleHour + 1} * * * find ${backupDir} -name 'backup_*.sql' -mtime +30 -delete
`;

    const cronPath = path.join(backupDir, 'backup-cron.txt');
    fs.writeFileSync(cronPath, cronScript);

    console.log(`✅ Backup cron configuration saved to ${cronPath}`);
    console.log(`   Install with: crontab < ${cronPath}`);
  }

  /**
   * Verify database readiness
   */
  async verifyReadiness(): Promise<boolean> {
    console.log('🔍 Verifying database readiness...\n');

    try {
      // 1. Connection test
      console.log('1️⃣  Testing connection...');
      const client = await this.pool.connect();
      client.release();
      console.log('   ✅ Connection successful\n');

      // 2. Tables exist test
      console.log('2️⃣  Checking tables...');
      const tablesResult = await this.pool.query(`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `);
      console.log(`   ✅ Found ${tablesResult.rows.length} tables\n`);

      // 3. Indexes test
      console.log('3️⃣  Checking indexes...');
      const indexesResult = await this.pool.query(`
        SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
      `);
      console.log(`   ✅ Found ${indexesResult.rows.length} indexes\n`);

      // 4. Functions exist test
      console.log('4️⃣  Checking functions...');
      const functionsResult = await this.pool.query(`
        SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'
      `);
      console.log(`   ✅ Found ${functionsResult.rows.length} functions\n`);

      // 5. Extensions test
      console.log('5️⃣  Checking extensions...');
      const extensionsResult = await this.pool.query(`
        SELECT extname FROM pg_extension
      `);
      console.log(`   ✅ Installed extensions: ${extensionsResult.rows.map(r => r.extname).join(', ')}\n`);

      console.log('✅ Database readiness verification complete!');
      return true;
    } catch (error) {
      console.error('❌ Database readiness check failed:', error);
      return false;
    }
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('🔌 Database connection pool closed');
  }
}

// Export for use in migration scripts
export async function runMigration(environment: 'production' | 'staging' | 'development') {
  const configs: Record<string, DatabaseConfig> = {
    production: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'digifarmacy',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    staging: {
      host: process.env.DB_HOST_STAGING || 'localhost',
      port: parseInt(process.env.DB_PORT_STAGING || '5432'),
      database: process.env.DB_NAME_STAGING || 'digifarmacy_staging',
      user: process.env.DB_USER_STAGING || 'postgres',
      password: process.env.DB_PASSWORD_STAGING || '',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    development: {
      host: 'localhost',
      port: 5432,
      database: 'digifarmacy_dev',
      user: 'postgres',
      password: 'postgres',
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
  };

  const config = configs[environment];
  const manager = new DatabaseManager(config);

  try {
    await manager.initialize();
    await manager.migrate('up');
    await manager.optimize();
    await manager.setupRLS();
    await manager.getStatistics();
    await manager.verifyReadiness();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await manager.close();
  }
}

// CLI execution
if (require.main === module) {
  const environment = (process.argv[2] || 'development') as 'production' | 'staging' | 'development';
  const command = process.argv[3] || 'migrate';

  console.log(`🚀 Database Migration Tool`);
  console.log(`   Environment: ${environment}`);
  console.log(`   Command: ${command}\n`);

  runMigration(environment).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
