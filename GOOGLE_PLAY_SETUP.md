# Google Play Integration - Environment Setup Guide

## Phase 1: Google Play Console Configuration

### 1. Prerequisites
- Google Play Console account (https://play.google.com/console)
- Project created in Google Cloud Console
- Service Account created with Android Publisher scopes

### 2. Service Account Setup

#### Step 1: Create Service Account in Google Cloud Console
1. Go to Google Cloud Console (https://console.cloud.google.com)
2. Select your project
3. Navigate to "Service Accounts" under "APIs & Services"
4. Click "Create Service Account"
5. Fill in the service account name and description
6. Grant the following roles:
   - **Editor** (for testing) or **Custom Role** with these permissions:
     - `androidpublisher.applications.get`
     - `androidpublisher.subscriptions.get`
     - `androidpublisher.subscriptions.acknowledge`
     - `androidpublisher.products.get`
     - `androidpublisher.products.acknowledge`

#### Step 2: Create Service Account Key
1. In the Service Account details, go to "Keys" tab
2. Click "Add Key" > "Create new key"
3. Choose **JSON** format
4. Download the JSON file (keep it safe!)

#### Step 3: Link Service Account to Google Play Console
1. Go to Google Play Console
2. Navigate to "Settings" > "API Access"
3. Click "Link to Google Cloud Project"
4. Select your Google Cloud project
5. Grant the service account access with "Manage releases" permission

### 3. Create Subscription SKUs

In Google Play Console:

1. **Pharmacy Monthly**
   - Product ID: `pharmacy_monthly`
   - Type: Subscription
   - Price: LKR 2,941 (adjusted for 15% commission)
   - Billing Period: Monthly (1 month)
   - Grace Period: 3 days (optional)

2. **Pharmacy Annual**
   - Product ID: `pharmacy_annual`
   - Type: Subscription
   - Price: LKR 29,410 (adjusted for 15% commission)
   - Billing Period: 1 year
   - Grace Period: 3 days (optional)

3. **Laboratory Monthly**
   - Product ID: `laboratory_monthly`
   - Type: Subscription
   - Price: LKR 1,765 (adjusted for 15% commission)
   - Billing Period: Monthly (1 month)
   - Grace Period: 3 days (optional)

4. **Laboratory Annual**
   - Product ID: `laboratory_annual`
   - Type: Subscription
   - Price: LKR 17,650 (adjusted for 15% commission)
   - Billing Period: 1 year
   - Grace Period: 3 days (optional)

### 4. Configure Webhook Notifications

In Google Play Console:

1. Navigate to "Settings" > "Developer Account" > "Notifications"
2. Set up Pubsub Topic for real-time notifications
3. Create a Cloud Pub/Sub topic: `google-play-subscriptions`
4. Create subscription that sends to: `https://yourdomain.com/api/subscriptions/webhook`

## Environment Variables

Create or update your `.env.local` file with the following:

```env
# Google Play Service Account Credentials
# Full JSON content from the downloaded service account key file
GOOGLE_PLAY_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'

# Google Play Package Name (Android app ID)
GOOGLE_PLAY_PACKAGE_NAME='com.digifarmacy.app'

# Database connection (for subscriptions table)
DATABASE_URL='postgresql://user:password@host:5432/digifarmacy'

# Webhook secret for signature verification (optional, for additional security)
GOOGLE_PLAY_WEBHOOK_SECRET='your-webhook-secret-key'

# Frontend Google Play Package Name (for client-side reference)
VITE_GOOGLE_PLAY_PACKAGE_NAME='com.digifarmacy.app'

# Optional: API logging
LOG_API_CALLS='true'
```

## Installation & Dependencies

### Backend Dependencies

```bash
npm install --save-dev @types/jsonwebtoken jsonwebtoken axios
```

### Frontend Dependencies

```bash
npm install axios
```

The Google Play Billing Library v6+ will be integrated on the mobile client side (separate from web implementation).

## Testing & Validation

### Local Testing (Development)

1. **Test SKU (Sandbox)**
   - Set environment variable: `USE_SANDBOX_TESTING=true`
   - This will use Google Play's test SKUs:
     - `android.test.purchased`
     - `android.test.canceled`
     - `android.test.refunded`
     - `android.test.item_unavailable`

2. **Mock Google Play Service**
   ```typescript
   if (process.env.NODE_ENV === 'development' && process.env.USE_SANDBOX_TESTING === 'true') {
     // Use mock responses for testing
   }
   ```

### Production Validation

1. **Verify Service Account Access**
   ```bash
   curl -X GET \
     -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
     https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.digifarmacy.app
   ```

2. **Test Subscription Verification**
   - Create test purchase on device
   - Verify token validation works
   - Check database records created

3. **Test Webhook Notifications**
   - Trigger subscription events
   - Verify webhook receives notifications
   - Check event logging

## Database Migrations

The subscription tables are created in the migration:
```
supabase/migrations/20260222_add_google_play_subscriptions.sql
```

Run migration:
```bash
npm run db:migrate
```

## Security Considerations

### 1. Service Account Key Protection
- Never commit the service account JSON to version control
- Rotate keys periodically
- Use `.env.local` (add to `.gitignore`)

### 2. Purchase Token Validation
- Always validate on backend
- Never trust client-side validation
- Verify token matches user's purchase

### 3. Webhook Signature Verification
- Verify Google Play signature on all webhook events
- Use public key from Google Play
- Implement rate limiting

### 4. Data Encryption
- Store confidential data encrypted in database
- Use HTTPS only for API communication
- Implement TLS 1.2 minimum

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check service account credentials
   - Verify project ID matches
   - Ensure service account has required permissions

2. **404 Not Found**
   - Confirm SKU exists in Google Play Console
   - Verify package name is correct
   - Check subscription is published

3. **Invalid Token**
   - Token may have expired (valid for 6 months)
   - Verify token format
   - Check package name in token matches

4. **Webhook Not Received**
   - Verify Pub/Sub topic is created
   - Check endpoint is publicly accessible
   - Review Cloud Logging for errors

### Debug Logging

Enable detailed logging:
```env
DEBUG='*'
LOG_GOOGLE_PLAY='true'
```

## Next Steps

After setting up Phase 1:
1. Proceed to Phase 2: Database schema (✅ DONE)
2. Proceed to Phase 3: API endpoints (✅ DONE)
3. Proceed to Phase 4: Frontend implementation
4. Proceed to Phase 5: Security hardening
5. Proceed to Phase 6: Error handling & retries
6. Proceed to Phase 7: Monitoring & analytics
7. Proceed to Phase 8: Deployment & go-live

## Resources

- [Google Play Console Documentation](https://support.google.com/googleplay/android-developer)
- [Android Publisher API Reference](https://developers.google.com/android-publisher)
- [Google Play Billing Library](https://developer.android.com/google/play/billing)
- [Real-time Developer Notifications](https://developer.android.com/google/play/billing/rtdn-reference)
