#!/usr/bin/env node
/**
 * Comprehensive Admin Authentication Flow Test
 * Tests the complete end-to-end authentication flow including:
 * - Admin sign up with secret key validation
 * - Admin sign in
 * - Invalid secret key rejection
 * - Regular user sign up (pharmacy/laboratory)
 */

import http from 'http';

const BASE_URL = 'http://localhost:5000';
const ADMIN_SECRET_KEY = 'DIGIFARMACY_ADMIN_2024_LK_SECRET';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testAdminAuthFlow() {
  console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║     DigiFarmacy Admin Authentication Flow Test Report         ║
║                      End-to-End Validation                    ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const timestamp = Date.now();
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  try {
    // Test 1: Server Health Check
    console.log(`${colors.blue}1. Server Health Check${colors.reset}`);
    const healthRes = await makeRequest('GET', '/api/session');
    const healthPass = healthRes.status === 401 || healthRes.status === 200;
    if (healthPass) {
      console.log(`   ${colors.green}✅ Server is running${colors.reset}`);
      results.passed++;
    } else {
      console.log(`   ${colors.red}❌ Server health check failed${colors.reset}`);
      results.failed++;
    }
    results.tests.push({ name: 'Server Health', passed: healthPass });

    // Test 2: Admin Sign Up Flow
    console.log(`\n${colors.blue}2. Admin Sign Up with Valid Secret Key${colors.reset}`);
    const adminEmail = `admin.e2e.${timestamp}@digifarmacy.lk`;
    const adminSignUpRes = await makeRequest('POST', '/api/signup', {
      email: adminEmail,
      password: 'AdminSecure123!',
      fullName: 'E2E Test Admin',
      role: 'admin',
      secretKey: ADMIN_SECRET_KEY
    });
    const adminSignUpPass = adminSignUpRes.status === 200 && adminSignUpRes.data.success;
    if (adminSignUpPass) {
      console.log(`   ${colors.green}✅ Admin account created successfully${colors.reset}`);
      console.log(`      Email: ${adminEmail}`);
      console.log(`      Role: ${adminSignUpRes.data.user.role}`);
      results.passed++;
    } else {
      console.log(`   ${colors.red}❌ Admin sign up failed${colors.reset}`);
      console.log(`      Error: ${adminSignUpRes.data.error || 'Unknown error'}`);
      results.failed++;
    }
    results.tests.push({ name: 'Admin Sign Up', passed: adminSignUpPass });

    // Test 3: Admin Sign In
    if (adminSignUpPass) {
      console.log(`\n${colors.blue}3. Admin Sign In${colors.reset}`);
      const adminSignInRes = await makeRequest('POST', '/api/login', {
        username: adminEmail,
        password: 'AdminSecure123!'
      });
      const adminSignInPass = adminSignInRes.status === 200 && adminSignInRes.data.user;
      if (adminSignInPass) {
        console.log(`   ${colors.green}✅ Admin signed in successfully${colors.reset}`);
        console.log(`      User ID: ${adminSignInRes.data.user.id}`);
        console.log(`      Status: ${adminSignInRes.data.user.status}`);
        results.passed++;
      } else {
        console.log(`   ${colors.red}❌ Admin sign in failed${colors.reset}`);
        results.failed++;
      }
      results.tests.push({ name: 'Admin Sign In', passed: adminSignInPass });
    }

    // Test 4: Invalid Secret Key Rejection
    console.log(`\n${colors.blue}4. Invalid Secret Key Rejection${colors.reset}`);
    const invalidSecretRes = await makeRequest('POST', '/api/signup', {
      email: `admin.invalid.${timestamp}@digifarmacy.lk`,
      password: 'SomePassword123!',
      fullName: 'Invalid Admin',
      role: 'admin',
      secretKey: 'WRONG_SECRET_KEY'
    });
    const invalidSecretPass = invalidSecretRes.status === 401;
    if (invalidSecretPass) {
      console.log(`   ${colors.green}✅ Invalid secret key was rejected${colors.reset}`);
      console.log(`      Status Code: ${invalidSecretRes.status}`);
      console.log(`      Error: ${invalidSecretRes.data.error}`);
      results.passed++;
    } else {
      console.log(`   ${colors.red}❌ Invalid secret key was NOT rejected${colors.reset}`);
      results.failed++;
    }
    results.tests.push({ name: 'Invalid Secret Key Rejection', passed: invalidSecretPass });

    // Test 5: Pharmacy Sign Up (No Secret Key Required)
    console.log(`\n${colors.blue}5. Pharmacy Sign Up (No Secret Key)${colors.reset}`);
    const pharmacyEmail = `pharmacy.e2e.${timestamp}@digifarmacy.lk`;
    const pharmacySignUpRes = await makeRequest('POST', '/api/signup', {
      email: pharmacyEmail,
      password: 'PharmacySecure123!',
      fullName: 'E2E Test Pharmacy',
      phone: '0701234567',
      role: 'pharmacy'
    });
    const pharmacySignUpPass = pharmacySignUpRes.status === 200 && pharmacySignUpRes.data.user.role === 'pharmacy';
    if (pharmacySignUpPass) {
      console.log(`   ${colors.green}✅ Pharmacy account created without secret key${colors.reset}`);
      console.log(`      Email: ${pharmacyEmail}`);
      console.log(`      Role: ${pharmacySignUpRes.data.user.role}`);
      results.passed++;
    } else {
      console.log(`   ${colors.red}❌ Pharmacy sign up failed${colors.reset}`);
      results.failed++;
    }
    results.tests.push({ name: 'Pharmacy Sign Up', passed: pharmacySignUpPass });

    // Test 6: Laboratory Sign Up
    console.log(`\n${colors.blue}6. Laboratory Sign Up (No Secret Key)${colors.reset}`);
    const labEmail = `laboratory.e2e.${timestamp}@digifarmacy.lk`;
    const labSignUpRes = await makeRequest('POST', '/api/signup', {
      email: labEmail,
      password: 'LabSecure123!',
      fullName: 'E2E Test Laboratory',
      phone: '0707654321',
      role: 'laboratory'
    });
    const labSignUpPass = labSignUpRes.status === 200 && labSignUpRes.data.user.role === 'laboratory';
    if (labSignUpPass) {
      console.log(`   ${colors.green}✅ Laboratory account created without secret key${colors.reset}`);
      console.log(`      Email: ${labEmail}`);
      console.log(`      Role: ${labSignUpRes.data.user.role}`);
      results.passed++;
    } else {
      console.log(`   ${colors.red}❌ Laboratory sign up failed${colors.reset}`);
      results.failed++;
    }
    results.tests.push({ name: 'Laboratory Sign Up', passed: labSignUpPass });

    // Test 7: Locations API
    console.log(`\n${colors.blue}7. Locations API Availability${colors.reset}`);
    const locationsRes = await makeRequest('GET', '/api/locations');
    const locationsPass = locationsRes.status === 200 && locationsRes.data.pharmacies && locationsRes.data.laboratories;
    if (locationsPass) {
      console.log(`   ${colors.green}✅ Locations API working${colors.reset}`);
      console.log(`      Pharmacies: ${locationsRes.data.pharmacies.length}`);
      console.log(`      Laboratories: ${locationsRes.data.laboratories.length}`);
      results.passed++;
    } else {
      console.log(`   ${colors.red}❌ Locations API failed${colors.reset}`);
      results.failed++;
    }
    results.tests.push({ name: 'Locations API', passed: locationsPass });

  } catch (error) {
    console.error(`${colors.red}❌ Test Error: ${error.message}${colors.reset}`);
    results.failed++;
  }

  // Print Summary
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                        Test Summary                            ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  results.tests.forEach((test, i) => {
    const icon = test.passed ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
    console.log(`  ${icon} ${(i + 1).toString().padStart(2, ' ')}. ${test.name}`);
  });

  console.log(`\n${colors.cyan}Total Tests: ${results.tests.length}${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}\n`);

  if (results.failed === 0) {
    console.log(`${colors.green}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║  🎉 All Admin Authentication Tests PASSED! 🎉                 ║${colors.reset}`);
    console.log(`${colors.green}╚═══════════════════════════════════════════════════════════════╝${colors.reset}\n`);
    console.log(`${colors.cyan}Admin authentication is fully functional and ready for use!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}⚠️  Some tests failed. Please review the errors above.${colors.reset}\n`);
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

// Run the tests
testAdminAuthFlow();
