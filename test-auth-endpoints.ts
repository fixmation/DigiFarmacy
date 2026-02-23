#!/usr/bin/env node
/**
 * DigiFarmacy API Test Script
 * 
 * This script tests all authentication endpoints
 * Run with: npx ts-node test-auth-endpoints.ts
 * Or from Windows CMD: npm run test:auth
 */

interface ApiResponse {
  ok: boolean;
  status: number;
  data: any;
  error?: string;
}

class APITester {
  private baseUrl = 'http://localhost:5000';
  private testEmail = 'test-' + Date.now() + '@example.com';
  private testPassword = 'TestPassword123';
  private testFullName = 'Test Pharmacy ' + Date.now();

  async test(name: string, method: string, endpoint: string, body?: any): Promise<ApiResponse> {
    console.log(`\n📝 Testing: ${name}`);
    console.log(`   ${method.toUpperCase()} ${endpoint}`);
    
    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for session cookies
      };

      if (body) {
        options.body = JSON.stringify(body);
        console.log(`   Body: ${JSON.stringify(body)}`);
      }

      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, options);
      const data = await response.json().catch(() => null);

      const result: ApiResponse = {
        ok: response.ok,
        status: response.status,
        data,
      };

      if (response.ok) {
        console.log(`✅ Success (${response.status})`);
        if (data) console.log(`   Response:`, JSON.stringify(data, null, 2));
      } else {
        console.log(`❌ Failed (${response.status})`);
        if (data?.error) console.log(`   Error: ${data.error}`);
        if (data) console.log(`   Response:`, JSON.stringify(data, null, 2));
      }

      return result;
    } catch (error: any) {
      console.log(`❌ Network Error: ${error.message}`);
      return {
        ok: false,
        status: 0,
        data: null,
        error: error.message,
      };
    }
  }

  async runAllTests() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     DigiFarmacy Authentication API Test Suite           ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`\nServer URL: ${this.baseUrl}`);
    console.log(`Started at: ${new Date().toISOString()}`);

    // Test 1: Health Check
    console.log('\n' + '='.repeat(60));
    console.log('Test Group 1: Health Checks');
    console.log('='.repeat(60));
    
    const health1 = await this.test('Server Health', 'GET', '/health');
    const health2 = await this.test('API Health', 'GET', '/api/health');

    if (!health2.ok) {
      console.log('\n❌ Server is not responding. Make sure it\'s running with: npm run dev');
      return;
    }

    // Test 2: Session Check (before login)
    console.log('\n' + '='.repeat(60));
    console.log('Test Group 2: Session Management');
    console.log('='.repeat(60));
    
    const sessionBefore = await this.test(
      'Check Session (before login)',
      'GET',
      '/api/session'
    );

    // Test 3: Sign Up
    console.log('\n' + '='.repeat(60));
    console.log('Test Group 3: Authentication (Sign Up)');
    console.log('='.repeat(60));
    
    console.log(`\nTest User Credentials:`);
    console.log(`  Email: ${this.testEmail}`);
    console.log(`  Password: ${this.testPassword}`);
    console.log(`  Full Name: ${this.testFullName}`);
    console.log(`  Role: pharmacy`);

    const signup = await this.test(
      'Sign Up New User',
      'POST',
      '/api/signup',
      {
        email: this.testEmail,
        password: this.testPassword,
        fullName: this.testFullName,
        phone: '0712345678',
        role: 'pharmacy'
      }
    );

    // Test 4: Login
    console.log('\n' + '='.repeat(60));
    console.log('Test Group 4: Authentication (Log In)');
    console.log('='.repeat(60));

    const login = await this.test(
      'Log In With Credentials',
      'POST',
      '/api/login',
      {
        username: this.testEmail,
        password: this.testPassword
      }
    );

    // Test 5: Session Check (after login)
    console.log('\n' + '='.repeat(60));
    console.log('Test Group 5: Session Verification');
    console.log('='.repeat(60));

    const sessionAfter = await this.test(
      'Check Session (after login)',
      'GET',
      '/api/session'
    );

    // Test 6: Logout
    console.log('\n' + '='.repeat(60));
    console.log('Test Group 6: Logout');
    console.log('='.repeat(60));

    const logout = await this.test(
      'Log Out',
      'POST',
      '/api/logout'
    );

    // Test 7: Session Check (after logout)
    const sessionAfterLogout = await this.test(
      'Check Session (after logout)',
      'GET',
      '/api/session'
    );

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));

    const tests = [
      { name: 'Server Health', result: health1.ok },
      { name: 'API Health', result: health2.ok },
      { name: 'Session Check (before)', result: !sessionBefore.ok }, // Should be 401
      { name: 'Sign Up', result: signup.ok },
      { name: 'Log In', result: login.ok },
      { name: 'Session Check (after)', result: sessionAfter.ok },
      { name: 'Log Out', result: logout.ok },
      { name: 'Session Check (after logout)', result: !sessionAfterLogout.ok }, // Should be 401
    ];

    const passed = tests.filter(t => t.result).length;
    const total = tests.length;

    console.log(`\n${passed}/${total} tests passed\n`);
    tests.forEach(test => {
      const status = test.result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${test.name}`);
    });

    if (passed === total) {
      console.log('\n🎉 All tests passed! Authentication system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the output above for details.');
    }

    console.log(`\nCompleted at: ${new Date().toISOString()}`);
  }
}

const tester = new APITester();
tester.runAllTests().catch(console.error);
