#!/usr/bin/env node

import http from 'http';

const BASE_URL = 'http://localhost:5000';
const ADMIN_SECRET_KEY = 'DIGIFARMACY_ADMIN_2024_LK_SECRET';

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=test-session'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testAdminAuth() {
  console.log('\n🧪 Starting Admin Authentication Flow Tests\n');
  console.log('Admin Secret Key:', ADMIN_SECRET_KEY);
  
  // Generate unique emails for testing
  const timestamp = Date.now();
  const adminEmail = `admin.test.${timestamp}@digifarmacy.lk`;
  const pharmacyEmail = `pharmacy.test.${timestamp}@digifarmacy.lk`;
  
  try {
    // Test 1: Verify the application is running
    console.log('\n--- Test 1: Verify Server is Running ---');
    const sessionRes = await makeRequest('GET', '/api/session');
    console.log(`✓ Server Status: ${sessionRes.status}`);
    console.log(`  Session Data:`, sessionRes.data);

    // Test 2: Check /api/locations endpoint
    console.log('\n--- Test 2: Check /api/locations Endpoint ---');
    const locationsRes = await makeRequest('GET', '/api/locations');
    console.log(`✓ Locations Status: ${locationsRes.status}`);
    if (locationsRes.data.pharmacies) {
      console.log(`  Found ${locationsRes.data.pharmacies.length} pharmacies`);
    }
    if (locationsRes.data.laboratories) {
      console.log(`  Found ${locationsRes.data.laboratories.length} laboratories`);
    }

    // Test 3: Test Admin Sign Up with valid secret key
    console.log('\n--- Test 3: Admin Sign Up (New Admin Account) ---');
    const adminSignUpData = {
      email: adminEmail,
      password: 'AdminTest123!@#',
      fullName: 'Test Admin User',
      role: 'admin',
      secretKey: ADMIN_SECRET_KEY  // Valid secret key
    };
    const signUpRes = await makeRequest('POST', '/api/signup', adminSignUpData);
    console.log(`✓ Sign Up Status: ${signUpRes.status}`);
    console.log(`  Response:`, JSON.stringify(signUpRes.data, null, 2));

    if (signUpRes.status === 200 || signUpRes.status === 201) {
      console.log('  ✅ PASS: Admin account created successfully');

      // Test 4: Test Admin Sign In
      console.log('\n--- Test 4: Admin Sign In ---');
      const adminSignInData = {
        username: adminEmail,  // Use 'username' for Passport
        password: 'AdminTest123!@#'
      };
      const signInRes = await makeRequest('POST', '/api/login', adminSignInData);
      console.log(`✓ Sign In Status: ${signInRes.status}`);
      console.log(`  Response:`, JSON.stringify(signInRes.data, null, 2));
      
      if (signInRes.status === 200) {
        console.log('  ✅ PASS: Admin signed in successfully');
      } else {
        console.log('  ❌ FAIL: Admin sign in failed');
      }
    } else {
      console.log('  ❌ FAIL: Admin sign up failed');
    }

    // Test 5: Test invalid secret key
    console.log('\n--- Test 5: Admin Sign Up with INVALID Secret Key ---');
    const invalidSecretData = {
      email: `admin.invalid.${timestamp}@digifarmacy.lk`,
      password: 'AdminTest123!@#',
      fullName: 'Invalid Admin',
      role: 'admin',
      secretKey: 'WRONG_SECRET_KEY_12345'  // Invalid secret key
    };
    const invalidSecretRes = await makeRequest('POST', '/api/signup', invalidSecretData);
    console.log(`✓ Invalid Secret Status: ${invalidSecretRes.status}`);
    console.log(`  Response:`, JSON.stringify(invalidSecretRes.data, null, 2));
    
    if (invalidSecretRes.status < 200 || invalidSecretRes.status >= 300) {
      console.log('  ✅ PASS: Invalid secret key was rejected');
    } else {
      console.log('  ⚠️  WARNING: Invalid secret key was not properly rejected');
    }

    // Test 6: Test regular pharmacy sign up (should not require secret key)
    console.log('\n--- Test 6: Regular Pharmacy Sign Up (Should Work Without Secret Key) ---');
    const pharmacySignUpData = {
      email: pharmacyEmail,
      password: 'PharmacyTest123!',
      fullName: 'Test Pharmacy',
      phone: '1234567890',
      role: 'pharmacy'
      // No secretKey required for pharmacy
    };
    const pharmacySignUpRes = await makeRequest('POST', '/api/signup', pharmacySignUpData);
    console.log(`✓ Pharmacy Sign Up Status: ${pharmacySignUpRes.status}`);
    console.log(`  Response:`, JSON.stringify(pharmacySignUpRes.data, null, 2));
    
    if (pharmacySignUpRes.status === 200 || pharmacySignUpRes.status === 201) {
      console.log('  ✅ PASS: Pharmacy account created without secret key');
    } else {
      console.log('  ❌ FAIL: Pharmacy sign up failed');
    }

    console.log('\n✅ All tests completed!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAdminAuth();
