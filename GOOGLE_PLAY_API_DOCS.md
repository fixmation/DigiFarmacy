# Google Play Subscription API Documentation

## Base URL
```
https://api.digifarmacy.com/api/subscriptions
```

## Authentication
All endpoints require user authentication (session cookie or bearer token).

---

## 1. POST /api/subscriptions/initiate

Retrieve subscription options and pricing for a specific business type.

### Request
```http
POST /api/subscriptions/initiate
Content-Type: application/json

{
  "businessType": "pharmacy"
}
```

### Parameters
- **businessType** (required): `"pharmacy"` or `"laboratory"`

### Response (200 OK)
```json
{
  "businessType": "pharmacy",
  "subscriptionOptions": {
    "monthly": {
      "sku": "pharmacy_monthly",
      "price": 2941,
      "currency": "LKR",
      "period": "monthly"
    },
    "annual": {
      "sku": "pharmacy_annual",
      "price": 29410,
      "currency": "LKR",
      "period": "annual"
    }
  },
  "message": "Ready to initiate purchase. Use these SKUs with Google Play Billing Library"
}
```

### Error Responses
```json
// 400 Bad Request
{
  "error": "Invalid business type"
}

// 401 Unauthorized
{
  "error": "Not authenticated"
}
```

---

## 2. POST /api/subscriptions/verify-purchase

Verify a purchase token with Google Play and create a subscription record.

### Request
```http
POST /api/subscriptions/verify-purchase
Content-Type: application/json

{
  "packageName": "com.digifarmacy.app",
  "subscriptionId": "pharmacy_monthly",
  "token": "purchase_token_from_google_play_billing_library"
}
```

### Parameters
- **packageName** (required): Android package name (from build.gradle)
- **subscriptionId** (required): SKU ID from Google Play Console
  - Valid values: `pharmacy_monthly`, `pharmacy_annual`, `laboratory_monthly`, `laboratory_annual`
- **token** (required): Purchase token from Google Play Billing Library

### Response (201 Created)
```json
{
  "success": true,
  "subscription": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "ACTIVE",
    "expires_at": "2026-03-22T10:30:00Z",
    "auto_renew": true
  },
  "message": "Subscription verified and activated"
}
```

### Error Responses
```json
// 400 Bad Request - Invalid token or expired subscription
{
  "error": "Subscription has expired"
}

// 400 Bad Request - Already used token
{
  "error": "This purchase token has already been used",
  "subscription_id": "550e8400-e29b-41d4-a716-446655440000"
}

// 401 Unauthorized
{
  "error": "Not authenticated"
}

// 404 Not Found
{
  "error": "Purchase not found"
}

// 500 Server Error
{
  "error": "Failed to verify purchase"
}
```

---

## 3. GET /api/subscriptions/status

Get the current subscription status for authenticated user.

### Request
```http
GET /api/subscriptions/status
```

### Response - With Active Subscription (200 OK)
```json
{
  "has_subscription": true,
  "subscription": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "business_type": "pharmacy",
    "sku": "pharmacy_monthly",
    "status": "ACTIVE",
    "purchased_at": "2026-02-22T10:30:00Z",
    "expires_at": "2026-03-22T10:30:00Z",
    "auto_renew": true,
    "price": 294100000,
    "currency": "LKR",
    "days_remaining": 28
  }
}
```

### Response - No Subscription (200 OK)
```json
{
  "has_subscription": false,
  "message": "No active subscription found"
}
```

### Error Responses
```json
// 401 Unauthorized
{
  "error": "Not authenticated"
}

// 500 Server Error
{
  "error": "Failed to get subscription status"
}
```

### Status Values
- **ACTIVE**: Subscription is currently active
- **PAUSED**: User has paused the subscription (Google Play only)
- **EXPIRED**: Subscription expiration date has passed (on-device or auto-renewal failed)
- **CANCELLED**: User or system cancelled the subscription

---

## 4. POST /api/subscriptions/cancel

Cancel active subscription.

### Request
```http
POST /api/subscriptions/cancel
Content-Type: application/json

{
  "reason": "User requested cancellation"
}
```

### Parameters
- **reason** (optional): Cancellation reason for analytics

### Response (200 OK)
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "subscription_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Error Responses
```json
// 401 Unauthorized
{
  "error": "Not authenticated"
}

// 404 Not Found
{
  "error": "No active subscription found"
}

// 500 Server Error
{
  "error": "Failed to cancel subscription"
}
```

### Notes
- Cancellation is processed immediately
- User can still access features until expiration date
- Automatic refund processing handled by Google Play (based on policies)

---

## 5. POST /api/subscriptions/webhook

**PRIVATE ENDPOINT** - Receives real-time notifications from Google Play.

### Request (From Google Cloud Pub/Sub)
```http
POST /api/subscriptions/webhook
Content-Type: application/json

{
  "message": {
    "data": "eyJzdWJzY3JpcHRpb25Ob3RpZmljYXRpb24iOnsibm90aWZpY2F0aW9uVHlwZSI6MiwiIiwic2t1IjoicGhhcm1hY3lfbW9udGhseSIsImdvb2dsZSwicHVyY2hhc2VUb2tlbiI6IlBhcnRpYWxfUHVyY2hhc2VfdHV0b3JpYWwifX0="
  },
  "messageId": "12345"
}
```

### Notification Types Handled

#### 1. SUBSCRIPTION_RECOVERED (Type: 1)
Subscription was paused and has now recovered.
```json
{
  "subscriptionNotification": {
    "version": "1.0",
    "notificationType": 1,
    "purchaseToken": "...",
    "subscriptionId": "pharmacy_monthly"
  }
}
```

#### 2. SUBSCRIPTION_RENEWED (Type: 2)
Subscription was renewed (auto-renewal successful).
```json
{
  "subscriptionNotification": {
    "version": "1.0",
    "notificationType": 2,
    "purchaseToken": "...",
    "subscriptionId": "pharmacy_monthly"
  }
}
```

#### 3. SUBSCRIPTION_CANCELED (Type: 3)
Subscription was cancelled by user.
```json
{
  "subscriptionNotification": {
    "version": "1.0",
    "notificationType": 3,
    "purchaseToken": "...",
    "subscriptionId": "pharmacy_monthly"
  }
}
```

#### 4. SUBSCRIPTION_PURCHASE (Type: 4)
New subscription was purchased.
```json
{
  "subscriptionNotification": {
    "version": "1.0",
    "notificationType": 4,
    "purchaseToken": "...",
    "subscriptionId": "pharmacy_monthly"
  }
}
```

#### 5. SUBSCRIPTION_ON_HOLD (Type: 5)
Subscription is on hold (payment issue).
```json
{
  "subscriptionNotification": {
    "version": "1.0",
    "notificationType": 5,
    "purchaseToken": "...",
    "subscriptionId": "pharmacy_monthly"
  }
}
```

#### 6. SUBSCRIPTION_IN_GRACE_PERIOD (Type: 6)
Subscription is in grace period (payment retry in progress).
```json
{
  "subscriptionNotification": {
    "version": "1.0",
    "notificationType": 6,
    "purchaseToken": "...",
    "subscriptionId": "pharmacy_monthly"
  }
}
```

#### 7. SUBSCRIPTION_RESTARTED (Type: 7)
Cancelled subscription was restarted.
```json
{
  "subscriptionNotification": {
    "version": "1.0",
    "notificationType": 7,
    "purchaseToken": "...",
    "subscriptionId": "pharmacy_monthly"
  }
}
```

#### 8. SUBSCRIPTION_PRICE_CHANGE_CONFIRMED (Type: 8)
User confirmed a price increase.
```json
{
  "subscriptionNotification": {
    "version": "1.0",
    "notificationType": 8,
    "purchaseToken": "...",
    "subscriptionId": "pharmacy_monthly"
  }
}
```

#### 9. SUBSCRIPTION_DEFERRED (Type: 9)
User deferred charge (upgrade will happen later).
```json
{
  "subscriptionNotification": {
    "version": "1.0",
    "notificationType": 9,
    "purchaseToken": "...",
    "subscriptionId": "pharmacy_monthly"
  }
}
```

#### 11. SUBSCRIPTION_EXPIRED (Type: 11)
Subscription has expired.
```json
{
  "subscriptionNotification": {
    "version": "1.0",
    "notificationType": 11,
    "purchaseToken": "...",
    "subscriptionId": "pharmacy_monthly"
  }
}
```

### Response (200 OK)
```json
{
  "success": true
}
```

### Error Responses
```json
// 400 Bad Request
{
  "error": "Missing message"
}

// 500 Server Error
{
  "error": "Failed to process webhook"
}
```

### Security
- Webhook signature verification (RSA-SHA1)
- Idempotent processing (same messageId never processed twice)
- Rate limiting applied (100 requests/minute per user)

---

## Rate Limiting

All endpoints are rate-limited:
- **Subscriptions endpoints**: 10 requests per minute
- **Webhook endpoint**: 100 requests per minute

Response headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1645555200
```

---

## Error Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check request format and parameters |
| 401 | Unauthorized | User not authenticated, please login |
| 403 | Forbidden | User lacks required permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (duplicate token) |
| 429 | Too Many Requests | Rate limit exceeded, retry later |
| 500 | Server Error | Internal server error, contact support |
| 503 | Service Unavailable | Service temporarily down |

---

## Pricing Reference

All prices are in LKR (Sri Lankan Rupee), already adjusted for 15% Google Play commission.

### Pharmacy
| Plan | Monthly | Annual | Monthly Cost |
|------|---------|--------|--------------|
| Price | LKR 2,941 | LKR 29,410 | LKR 2,451/month |
| Original | LKR 2,500 | LKR 25,000 | LKR 2,084/month |
| Commission | 15% | 15% | 15% |

### Laboratory
| Plan | Monthly | Annual | Monthly Cost |
|------|---------|--------|--------------|
| Price | LKR 1,765 | LKR 17,650 | LKR 1,471/month |
| Original | LKR 1,500 | LKR 15,000 | LKR 1,250/month |
| Commission | 15% | 15% | 15% |

---

## Integration Checklist

- [ ] Service account created and linked
- [ ] SKUs created in Google Play Console
- [ ] Webhook configured in Pub/Sub
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] API endpoints tested
- [ ] Frontend hooks implemented
- [ ] UI components displaying correctly
- [ ] Error handling working
- [ ] Monitoring and logging set up
- [ ] Security review completed
- [ ] Load testing passed
- [ ] Documentation reviewed
- [ ] Team trained on system
- [ ] Go-live checklist passed

---

## Support & Resources

- **API Status**: https://status.digifarmacy.com
- **Documentation**: https://docs.digifarmacy.com
- **Support Email**: support@digifarmacy.com
- **Emergency Support**: +94-11-XXX-XXXX

Last Updated: February 22, 2026
