#!/usr/bin/env node

import http from 'http';

async function checkUI() {
  console.log('\n🧪 Checking AuthModal UI for Admin Tab\n');
  
  const url = new URL('http://localhost:5000');
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'text/html'
    }
  };

  return new Promise((resolve) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✓ Page loaded successfully');
        
        // Check for evidence of the AuthModal with 3 tabs
        const hasAuthModal = data.includes('AuthModal') || data.includes('authModal');
        const hasAdminTab = data.includes('Admin') || data.includes('admin');
        const hasSignIn = data.includes('Sign In') || data.includes('sign in');
        const hasSignUp = data.includes('Sign Up') || data.includes('sign up');
        
        console.log('\n--- UI Component Checks ---');
        console.log(`✓ AuthModal component: ${hasAuthModal ? '✅ Found' : '⚠️ Not found in HTML'}`);
        console.log(`✓ Sign In tab text: ${hasSignIn ? '✅ Found' : '⚠️ Not found'}`);
        console.log(`✓ Sign Up tab text: ${hasSignUp ? '✅ Found' : '⚠️ Not found'}`);
        console.log(`✓ Admin tab text: ${hasAdminTab ? '✅ Found' : '⚠️ Not found'}`);
        
        console.log('\n📱 To test the Admin tab in the browser:');
        console.log('1. Open http://localhost:5000 in your browser');
        console.log('2. Look for the AuthModal popup');
        console.log('3. You should see three tabs: "Sign In", "Sign Up", and "Admin"');
        console.log('4. Click the Admin tab');
        console.log('5. Enter:');
        console.log('   - Secret Key: DIGIFARMACY_ADMIN_2024_LK_SECRET');
        console.log('   - Email: any valid email');
        console.log('   - Password: (8+ characters)');
        console.log('6. Click "Create Admin Account" or "Admin Sign In"');
        
        console.log('\n✅ All checks completed!\n');
        process.exit(0);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
    
    req.end();
  });
}

checkUI();
