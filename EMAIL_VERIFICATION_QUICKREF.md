# Email Verification - Quick Reference

## 🚀 Quick Start

### For Testing (Development)

```bash
# 1. Start server
npm run dev

# 2. In browser console:
# Sign up
fetch('/api/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'TestPass123',
    fullName: 'Test User',
    role: 'pharmacy'
  })
}).then(r => r.json()).then(console.log)

# 3. Check server console output for verification link
# 4. Copy & paste verification link in browser
# 5. Email is now verified!
```

## 📋 API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/signup` | POST | No | Create account & send verification |
| `/api/auth/send-verification` | POST | No | Send verification email |
| `/api/auth/verify-email` | POST | No | Verify with token |
| `/api/auth/resend-verification` | POST | Yes | Resend email (logged in) |
| `/api/auth/verify-email-status` | GET | Yes | Check if verified |

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `server/services/email.ts` | Email & token logic |
| `server/routes/email-verification.ts` | API endpoints |
| `client/src/pages/VerifyEmail.tsx` | Verification page |
| `shared/schema.ts` | Database types |
| `supabase/migrations/20260223_add_email_verification.sql` | DB migration |

## 🗄️ Database

### New Table: `email_verification_tokens`
```sql
id, user_id, email, token, expires_at, verified_at, created_at
```

### Updated: `profiles`
```sql
Added: email (UNIQUE), email_verified (nullable)
```

## 📧 Email Modes

| Mode | Behavior |
|------|----------|
| **Dev** | Logs link to console, no actual email |
| **Prod w/Supabase** | Sends real email via Supabase |
| **Prod w/o Email** | Returns error (requires setup) |

## 🔐 Token Details

- **Generation**: 32-byte secure random
- **Expiration**: 24 hours
- **Uniqueness**: Database UNIQUE constraint
- **One-time use**: Marked as verified after use

## 📨 Signup Response

```json
{
  "success": true,
  "message": "Account created. Please verify your email to continue.",
  "user": {...},
  "emailVerificationPending": true
}
```

## ✅ Verification Response

```json
{
  "success": true,
  "message": "Email verified successfully",
  "user": {
    "id": "user-id",
    "email": "test@example.com",
    "fullName": "Test User",
    "role": "pharmacy",
    "status": "verified"
  }
}
```

## 🧪 Test Commands

```bash
# Run all auth tests
npm run test:auth

# Check TypeScript
npm run check

# Start dev server
npm run dev
```

## 🔌 Frontend Integration

### Show Notification
```tsx
import EmailVerificationNotice from '@/components/auth/EmailVerificationNotice';

<EmailVerificationNotice />
```

### Check Status
```tsx
const { profile } = useAuth();

if (profile?.status === 'verified') {
  // Email is verified
}
```

### Manual Verify
```tsx
const verifyToken = async (token: string, email: string) => {
  const res = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, email })
  });
  
  return res.json();
};
```

## ⚙️ Environment Variables (Production)

```bash
SUPABASE_SERVICE_KEY=your_key_here
APP_URL=https://yourdomain.com
NODE_ENV=production
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Verification link not working | Check console for link (dev mode) |
| Email not received (dev) | Check server console for link |
| Email not received (prod) | Set SUPABASE_SERVICE_KEY |
| Token expired | Resend verification email |
| Invalid token | Re-check token in email |

## 📝 Log Output

### Development Console Shows:
```
[Email Service] Sending verification email to test@example.com
[Email Service] Verification link: http://localhost:5000/verify-email?token=xxx
[Email Service] Token: xxx
```

### Server Console Shows:
```
POST /api/signup 200 ms :: {"success": true, ...}
POST /api/auth/verify-email 200 ms :: {"success": true, ...}
```

## 🎯 Common Tasks

### Test Signup → Verify

```javascript
// 1. Sign up
const signupRes = await fetch('/api/signup', {/* ... */});
const { user } = await signupRes.json();

// 2. Extract token from console output or database
// 3. Verify
const verifyRes = await fetch('/api/auth/verify-email', {
  method: 'POST',
  body: JSON.stringify({ token, email: user.email })
});

// 4. Check status
const statusRes = await fetch('/api/auth/verify-email-status', {
  credentials: 'include'
});
const { isVerified } = await statusRes.json();
```

### Resend Email (User Logged In)

```javascript
const resendRes = await fetch('/api/auth/resend-verification', {
  method: 'POST',
  credentials: 'include'
});

const { message } = await resendRes.json();
```

## 📊 User Status Flow

```
pending → (email verified) → verified
```

Only "verified" users can fully access dashboard features.

## 🔗 Related Documentation

- Full guide: `EMAIL_VERIFICATION_GUIDE.md`
- Implementation details: `EMAIL_VERIFICATION_IMPLEMENTATION.md`
- Auth system: `AUTH_DIAGNOSTIC_GUIDE.md`

## 💡 Tips

✅ In dev mode, always check server console for verification link  
✅ Tokens expire after 24 hours  
✅ Users can resend verification email  
✅ Email verification is not required for login (warning shown)  
✅ Admin accounts can verify manually  

---

**Print this page for quick reference!**
