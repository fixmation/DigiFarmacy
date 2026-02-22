# Phase 8: Deployment & Go-Live Guide

**Status**: Ready for Production  
**Date**: February 22, 2026  
**Version**: 1.0

---

## Pre-Deployment Checklist

### Code Quality & Testing
- [ ] All TypeScript compilation passes (0 errors)
- [ ] All unit tests passing (7/7 admin tests)
- [ ] Code review completed and approved
- [ ] Security audit completed
- [ ] Load testing completed (1000+ concurrent users)
- [ ] Stress testing completed
- [ ] Failover testing completed
- [ ] Performance baseline established

### Security Validation
- [ ] Webhook signature verification implemented ✅
- [ ] Rate limiting configured ✅
- [ ] Fraud detection scoring active ✅
- [ ] Payment validation in place ✅
- [ ] Error messages sanitized ✅
- [ ] SQL injection prevention enabled ✅
- [ ] HTTPS/TLS enforced ✅
- [ ] Security headers configured ✅
- [ ] Secrets management in place ✅

### Database & Infrastructure
- [ ] Production database provisioned
- [ ] Database backups scheduled (at least daily)
- [ ] Backup restoration tested
- [ ] Migration scripts tested in staging
- [ ] Connection pooling configured
- [ ] Read replicas configured (optional)
- [ ] Monitoring dashboards created
- [ ] Alerts configured
- [ ] Log aggregation setup

### Configuration & Environment
- [ ] Production `.env` variables configured
- [ ] Google Play Console production setup complete
- [ ] Service account credentials securely stored
- [ ] API keys rotated
- [ ] SSL certificates valid and renewed
- [ ] DNS records configured
- [ ] CORS settings configured
- [ ] API rate limits set appropriately

### Documentation & Training
- [ ] Architecture documentation complete
- [ ] API documentation reviewed
- [ ] Runbook created for common issues
- [ ] Deployment procedure documented
- [ ] Rollback procedure documented
- [ ] Support team trained
- [ ] Incident response plan prepared
- [ ] On-call rotation established

---

## Deployment Procedure

### Phase 1: Staging Deployment (Day 0)

#### 1.1 Database Setup
```bash
# Create staging database
createdb digifarmacy_staging

# Run migrations
npm run db:migrate -- --environment staging

# Verify schema
psql digifarmacy_staging -c "\dt"
```

#### 1.2 Application Deployment
```bash
# Build production assets
npm run build

# Deploy to staging
npm run deploy:staging

# Start application
npm run start:staging
```

#### 1.3 Smoke Testing
```bash
# Run smoke tests
npm run test:smoke

# Verify endpoints
curl https://staging-api.digifarmacy.com/api/health
curl https://staging-api.digifarmacy.com/api/subscriptions/initiate

# Test workflows
npm run test:integration:staging
```

#### 1.4 User Acceptance Testing (UAT)
- [ ] Admin creates test account
- [ ] Test subscription flow
- [ ] Test cancellation flow
- [ ] Test payment validation
- [ ] Test fraud detection
- [ ] Test error handling
- [ ] Test rate limiting
- [ ] Verify monitoring dashboards

### Phase 2: Production Deployment (Day 1)

#### 2.1 Pre-Flight Checks
```bash
# Verify production environment
npm run verify:production

# Check all secrets are set
npm run check:secrets:production

# Verify database connectivity
npm run test:db:production

# Check service health
npm run health:check:production
```

#### 2.2 Database Migration
```bash
# Backup current production database
pg_dump digifarmacy > backup_$(date +%Y%m%d_%H%M%S).sql

# Apply migrations
npm run db:migrate -- --environment production

# Verify schema
psql digifarmacy -c "\dt"

# Verify functions and triggers
psql digifarmacy -c "\df"
```

#### 2.3 Application Deployment
```bash
# Stop current application
npm run stop:production

# Deploy new version
npm run deploy:production

# Verify deployment
npm run verify:deployment

# Warm up connections
npm run warmup:api

# Start application
npm run start:production
```

#### 2.4 Smoke Testing (Production)
```bash
# Health check
curl https://api.digifarmacy.com/api/health

# Admin endpoint test
curl -X POST https://api.digifarmacy.com/api/subscriptions/initiate \
  -H "Content-Type: application/json" \
  -d '{"businessType": "pharmacy"}'

# Verify database connectivity
curl https://api.digifarmacy.com/api/subscriptions/status
```

#### 2.5 Monitoring Verification
- [ ] Log aggregation active
- [ ] Performance metrics flowing
- [ ] Alerts firing correctly
- [ ] Dashboard showing data
- [ ] Error tracking setup
- [ ] APM (Application Performance Monitoring) enabled

### Phase 3: Post-Deployment (Day 1-7)

#### 3.1 Day 1 Monitoring (Continuous)
- [ ] Monitor error logs every 5 minutes
- [ ] Monitor API latency
- [ ] Monitor webhook delivery
- [ ] Monitor database performance
- [ ] Check for fraud alerts
- [ ] Review user activity

#### 3.2 Day 1 Testing
```bash
# Run full test suite
npm run test:full

# Test subscription workflows
npm run test:subscriptions

# Test payment flows
npm run test:payments
```

#### 3.3 Day 2-7 Validation
- [ ] Monitor for 7 days straight
- [ ] Collect performance baseline
- [ ] Test edge cases
- [ ] Verify backup/restore works
- [ ] Test failover procedures
- [ ] Gather user feedback

#### 3.4 Rollback Preparation
```bash
# Create rollback snapshot
npm run snapshot:current

# Test rollback procedure
npm run test:rollback

# Document current state
npm run status:deployment
```

---

## Production Configuration

### Environment Variables Checklist

```env
# Google Play Configuration
GOOGLE_PLAY_SERVICE_ACCOUNT='{"type":"service_account",...}'
GOOGLE_PLAY_PACKAGE_NAME='com.digifarmacy.app'
VITE_GOOGLE_PLAY_PACKAGE_NAME='com.digifarmacy.app'

# Database
DATABASE_URL='postgresql://user:password@host:5432/digifarmacy'
DB_POOL_SIZE='20'
DB_QUERY_TIMEOUT='5000'

# Server
NODE_ENV='production'
PORT='5000'
LOG_LEVEL='info'
API_TOKEN_EXPIRY='24h'

# Security
JWT_SECRET='<very-long-random-string>'
HTTPS_ONLY='true'
SESSION_SECRET='<very-long-random-string>'

# Monitoring
SENTRY_DSN='https://...'
NEW_RELIC_LICENSE_KEY='...'
DATADOG_API_KEY='...'

# Email (for notifications)
SMTP_HOST='smtp.example.com'
SMTP_PORT='587'
SMTP_USER='noreply@digifarmacy.com'
SMTP_PASS='<password>'

# Backup
BACKUP_BUCKET='s3://digifarmacy-backups'
BACKUP_SCHEDULE='0 2 * * *'  # 2 AM daily
```

### Security Headers Configuration

```nginx
# Nginx configuration example
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### Rate Limiting Configuration

```
POST /api/subscriptions/initiate: 10 req/min per user
POST /api/subscriptions/verify-purchase: 5 req/min per user
GET /api/subscriptions/status: 20 req/min per user
POST /api/subscriptions/cancel: 5 req/min per user
POST /api/subscriptions/webhook: 100 req/min per IP
```

### Monitoring & Alerting Rules

```
Alert if error rate > 5% for 5 minutes
Alert if response time > 5 seconds for 10 requests
Alert if webhook delivery < 95% for 1 hour
Alert if churn rate > 10% month-over-month
Alert if revenue down 20% vs previous week
Alert if fraud score blocking > 3 purchases/hour
```

---

## Runbook: Common Issues & Solutions

### Issue 1: Database Connection Timeout
```
Symptoms: 503 errors, slow queries
Solution:
  1. Check database server status
  2. Verify connection pool settings
  3. Check network connectivity
  4. Review slow query logs
  5. Scale database if needed
```

### Issue 2: High Error Rate on Authentication
```
Symptoms: 40% of requests failing
Solution:
  1. Check session store status
  2. Verify JWT secret hasn't changed
  3. Check rate limiter isn't too strict
  4. Review security logs
  5. Restart application if necessary
```

### Issue 3: Webhook Notifications Not Processing
```
Symptoms: Subscriptions not updating
Solution:
  1. Check Google Play Pub/Sub topic
  2. Verify webhook endpoint is accessible
  3. Check webhook verification logic
  4. Review cloud logs
  5. Manually process DLQ messages
```

### Issue 4: Payment Verification Failing
```
Symptoms: Users unable to purchase
Solution:
  1. Verify Google Play API credentials
  2. Check service account permissions
  3. Verify SKUs exist in Play Console
  4. Test with test SKUs
  5. Check circuit breaker status
```

---

## Monitoring Dashboard Metrics

### Real-Time Metrics
- Active subscriptions (by type)
- Hourly revenue (actual LKR)
- Error rate (%)
- Average response time (ms)
- Webhook success rate (%)

### Daily Metrics
- New subscriptions
- Cancellations
- Revenue breakdown (by SKU)
- Churn rate (%)
- MRR/ARR

### Weekly Metrics
- Growth rate (%)
- Customer acquisition cost
- Lifetime value
- Retention rate
- Top issues

### Monthly Metrics
- Total revenue
- Revenue growth
- Subscription count
- Average subscription value
- Profitability

---

## Incident Response Plan

### Level 1: Warning (Error Rate 1-5%)
**Response Time**: Within 30 minutes
1. Investigation
2. Check logs and metrics
3. Notify team
4. Monitor closely

### Level 2: Alert (Error Rate 5-10%)
**Response Time**: Within 15 minutes
1. Immediate investigation
2. Notify all on-call staff
3. Check database performance
4. Consider gradual rollback initiation

### Level 3: Critical (Error Rate >10%)
**Response Time**: Immediate
1. Emergency response team activated
2. Initiate rollback if necessary
3. Notify management
4. Begin detailed post-mortem

### Escalation Path
1. On-call engineer → Team lead
2. Team lead → Engineering manager
3. Engineering manager → VP Engineering
4. VP Engineering → CTO (if continued for >1 hour)

---

## Rollback Procedure

### Quick Rollback (< 5 minutes)
```bash
# If issue detected within first hour
npm run rollback:quick

# Verify state
npm run health:check

# Confirm all systems operational
npm run verify:rollback
```

### Full Rollback (< 15 minutes)
```bash
# Stop current deployment
npm run stop:production

# Restore from previous snapshot
npm run restore:snapshot:<VERSION>

# Verify database state
npm run verify:db:rollback

# Start previous version
npm run start:production:previous
```

### Manual Rollback
```bash
# SSH to production server
ssh prod-api-01.digifarmacy.com

# Check git history
git log --oneline

# Rollback to previous version
git reset --hard <COMMIT_HASH>

# Restart services
systemctl restart digifarmacy-api
```

---

## Post-Go-Live Procedures

### Week 1 Actions
- [ ] Monitor for any issues 24/7
- [ ] Review error logs daily
- [ ] Check fraud detection scores daily
- [ ] Monitor revenue collection
- [ ] Gather user feedback
- [ ] Fix critical bugs immediately

### Month 1 Actions
- [ ] Analyze payment success rates
- [ ] Review subscription churn
- [ ] Optimize slow queries
- [ ] Scale infrastructure if needed
- [ ] Document learnings
- [ ] Plan Phase 9 (optimization)

### Ongoing Actions
- [ ] Daily monitoring
- [ ] Weekly revenue reports
- [ ] Monthly performance analysis
- [ ] Quarterly capacity planning
- [ ] Annual security audits

---

## Success Criteria

✅ **Phase 8 Complete When**:
1. Application deployed to production
2. All smoke tests passing
3. No critical errors in logs
4. Revenue being collected successfully
5. Webhooks processing successfully
6. Fraud detection active
7. Monitoring dashboards live
8. Team comfortable with operations

---

## Sign-Off & Go-Live Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| QA Lead | [Name] | ______ | [ ] |
| DevOps Lead | [Name] | ______ | [ ] |
| Security Lead | [Name] | ______ | [ ] |
| Engineering Manager | [Name] | ______ | [ ] |
| Product Manager | [Name] | ______ | [ ] |
| CTO/VP Eng | [Name] | ______ | [ ] |

---

## Post-Launch Review

**Scheduled for**: 7 days after go-live

### Metrics to Review
- [ ] Total revenue vs forecast
- [ ] Subscription conversion rate
- [ ] System uptime %
- [ ] Error rate
- [ ] Average response time
- [ ] Churn rate
- [ ] User feedback score
- [ ] Support ticket volume

### Issues Found
- [ ] List any issues
- [ ] Root cause analysis
- [ ] Resolution applied
- [ ] Preventative measures

### Learnings & Improvements
- [ ] What went well
- [ ] What could be improved
- [ ] Process changes
- [ ] Training needs

---

**Document Version**: 1.0  
**Last Updated**: February 22, 2026  
**Next Review**: After production go-live
