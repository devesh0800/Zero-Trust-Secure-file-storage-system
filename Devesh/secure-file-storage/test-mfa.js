import fs from 'fs';
import speakeasy from 'speakeasy';

const API_URL = 'http://localhost:5000/api/v1';

async function testMfaFlow() {
  try {
    console.log('1. Registering test user...');
    
    // Using a random email to avoid conflicts across runs
    const userEmail = `mfa_test_${Math.floor(Math.random()*1000000)}@example.com`;
    const userPassword = 'TestPassword123!';
    const username = `mfatest${Math.floor(Math.random()*1000000)}`;

    let registerCaptchaId;
    let registerCaptchaText;
    let captchaResRaw;
    try {
      captchaResRaw = await fetch(`${API_URL}/auth/captcha`);
      const captchaData = await captchaResRaw.json();
      registerCaptchaId = captchaData.data.id;
      registerCaptchaText = captchaData.data.text; // Available in dev environment
    } catch(err) {
      console.error("Failed to fetch captcha", err);
      return;
    }

    let registerRes;
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-csrf-token': '1'
        },
        body: JSON.stringify({
          email: userEmail,
          password: userPassword,
          full_name: 'MFA Test User',
          username: username,
          captcha_id: registerCaptchaId,
          captcha_text: registerCaptchaText || 'TEST_123'
        })
      });
      registerRes = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(registerRes));
    } catch(err) {
       console.error("Registration failed, possibly due to captcha:", err.message);
       return;
    }

    const token = registerRes.data.accessToken;
    console.log('✓ User registered successfully.');

    console.log('\n2. Initializing MFA Setup...');
    const setupResRaw = await fetch(`${API_URL}/auth/mfa/setup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-csrf-token': '1'
      }
    });
    const setupRes = await setupResRaw.json();
    if (!setupResRaw.ok) throw new Error(JSON.stringify(setupRes));

    const mfaSecret = setupRes.data.secret;
    console.log('✓ MFA Setup initialized. Secret:', mfaSecret);

    console.log('\n3. Generating valid TOTP Token...');
    const totpToken = speakeasy.totp({
      secret: mfaSecret,
      encoding: 'base32'
    });
    console.log('Generated TOTP Token:', totpToken);

    console.log('\n4. Verifying MFA Setup...');
    const verifyResRaw = await fetch(`${API_URL}/auth/mfa/verify-setup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-csrf-token': '1'
      },
      body: JSON.stringify({ token: totpToken })
    });
    const verifyRes = await verifyResRaw.json();
    if (!verifyResRaw.ok) throw new Error(JSON.stringify(verifyRes));
    
    console.log('✓ MFA Setup Verified successfully.');

    console.log('\n5. Testing new MFA Login Flow...');
    let loginCaptchaId;
    let loginCaptchaText;
    try {
      const cResRaw = await fetch(`${API_URL}/auth/captcha`);
      const cData = await cResRaw.json();
      loginCaptchaId = cData.data.id;
      loginCaptchaText = cData.data.text;
    } catch(err) {
      console.error("Failed to fetch login captcha", err);
      return;
    }

    const loginResRaw = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-csrf-token': '1' 
        },
        body: JSON.stringify({
            email: userEmail,
            password: userPassword,
            captcha_id: loginCaptchaId,
            captcha_text: loginCaptchaText || 'TEST_123'
        })
    });
    const loginRes = await loginResRaw.json();
    if (!loginResRaw.ok) throw new Error(JSON.stringify(loginRes));
    
    if(loginRes.data.mfa_required) {
        console.log('✓ Login correctly prompted for MFA.');
        const tempToken = loginRes.data.temp_token;
        
        const newTotp = speakeasy.totp({ secret: mfaSecret, encoding: 'base32' });
        
        const mfaLoginResRaw = await fetch(`${API_URL}/auth/verify-mfa`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-csrf-token': '1'
             },
            body: JSON.stringify({
                temp_token: tempToken,
                mfa_token: newTotp
            })
        });
        const mfaLoginRes = await mfaLoginResRaw.json();
        if(!mfaLoginResRaw.ok) throw new Error(JSON.stringify(mfaLoginRes));
        
        console.log('✓ Successfully logged in with MFA. Access token received!');
    } else {
        console.log('❌ Login failed to prompt for MFA.');
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    if(error.stack) console.error(error.stack);
  }
}

testMfaFlow();
