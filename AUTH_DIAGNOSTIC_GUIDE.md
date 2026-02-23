# DigiFarmacy Auth Flow Diagnostic Guide

## Current Status
- **Server**: Running on port 5000 ✅
- **API Endpoints**: All configured and responding
- **Database**: Using in-memory storage (MemStorage) for auth
- **CORS**: Enabled for all origins
- **Health Check**: Available at `/health` and `/api/health`

## Authentication Flow

### 1. API Endpoints Available

#### Health Checks
- `GET /health` - Server health status
- `GET /api/health` - API health status

#### Authentication Endpoints
- `POST /api/signup` - Create new account
  - Body: `{ email, password, fullName, phone, role, secretKey? }`
  - Returns: `{ success: true, user: { id, email, fullName, phone, role, status, preferredLanguage } }`

- `POST /api/login` - Sign in with credentials
  - Body: `{ username (email), password }`
  - Returns: `{ success: true, user: {...} }`

- `GET /api/session` - Check current session
  - Returns: `{ user: {...} }` or `{ user: null }`

- `POST /api/logout` - Sign out

### 2. Testing Connection from Browser

#### Test 1: Access the Application
```
URL: http://localhost:5000
Expected: See the DigiFarmacy app loaded
```

#### Test 2: Check Health Endpoints
Open your browser console and run:
```javascript
// Test health endpoint
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log('Health:', d))
  .catch(e => console.error('Error:', e));

// Test session endpoint
fetch('/api/session')
  .then(r => r.json())
  .then(d => console.log('Session:', d))
  .catch(e => console.error('Error:', e));
```

#### Test 3: Test Signup
```javascript
fetch('/api/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'TestPassword123',
    fullName: 'Test User',
    phone: '1234567890',
    role: 'pharmacy'
  })
})
  .then(r => r.json())
  .then(d => console.log('Signup Response:', d))
  .catch(e => console.error('Error:', e));
```

#### Test 4: Test Login
```javascript
fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'test@example.com',
    password: 'TestPassword123'
  })
})
  .then(r => r.json())
  .then(d => console.log('Login Response:', d))
  .catch(e => console.error('Error:', e));
```

### 3. Common Issues and Solutions

#### Issue: `ERR_CONNECTION_REFUSED (-102)`
**Possible Causes:**
1. Browser can't reach server on localhost:5000
2. Firewall blocking the connection
3. Server port changed or not responding
4. CORS headers missing

**Solutions:**
1. Verify server is running: Check console output for "serving on port 5000"
2. Test from browser: Open http://localhost:5000 directly
3. Check firewall: Ensure port 5000 is allowed
4. Check CORS: Running the updated server with CORS middleware

#### Issue: Network timeout
**Solutions:**
1. Restart server: `npm run dev`
2. Clear browser cache: Hard refresh with Ctrl+Shift+R
3. Check firewall: Test with `netstat -an | findstr 5000` (Windows) or `lsof -i :5000` (Mac/Linux)

#### Issue: 401 Unauthorized on login
**Expected Behavior:** This is normal for initial `/api/session` check before login
**Solution:** Log in first with valid credentials

### 4. Database Connection Status

The auth system uses **in-memory storage** (MemStorage) which doesn't require a database connection.

**Note:** Subscription routes use the Supabase database when needed:
- Database: Supabase PostgreSQL
- Connection String: Set in `.env` as `DATABASE_URL`
- Status: Lazy-loaded only when subscription endpoints are called

### 5. Environment Variables Required

```
DATABASE_URL=postgresql://postgres:aUiTe5ki3bcD47Ya@db.xplqwdjoezwvspvkxvsx.supabase.co:5432/postgres
VITE_SUPABASE_URL=https://xplqwdjoezwvspvkxvsx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_Jha-1qO6GMNjgnIp64m7rg_41H0qyjg
NODE_ENV=development
SESSION_SECRET=a-secret-key-that-is-at-least-32-chars-long
```

### 6. Next Steps

1. **Access the app**: Open http://localhost:5000 in your browser
2. **Check browser console**: Look for any errors (F12 → Console tab)
3. **Test health endpoint**: Verify API is responding
4. **Test signup**: Create a test account
5. **Test login**: Log in with created account
6. **Check session**: Verify session is persisted

## Server Architecture

```
Express Server (port 5000)
├── CORS Middleware
├── Session Management (express-session)
├── Passport.js Authentication
├── API Routes
│   ├── /health (health check)
│   ├── /api/health (API health check)
│   ├── /api/signup (create account)
│   ├── /api/login (authenticate)
│   ├── /api/logout (clear session)
│   ├── /api/session (check auth)
│   └── ... other routes
├── Vite Dev Server (HMR enabled)
└── Static File Serving
```

## Contact & Support

If you continue to experience connection issues:
1. Check the server console for error messages
2. Verify firewall/network settings
3. Try accessing the health endpoint directly
4. Check browser developer tools for network errors
