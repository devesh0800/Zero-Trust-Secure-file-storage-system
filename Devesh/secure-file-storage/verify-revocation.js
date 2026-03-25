import { User, RefreshToken } from './src/models/index.js';
import { generateTokenPair } from './src/utils/jwt.js';

async function testRevocation() {
    const API_BASE = 'http://localhost:5000/api/v1';
    const email = `test_direct_${Date.now()}@example.com`;
    const password = 'SecurePassword123!';

    try {
        console.log('1. Creating user directly in DB...');
        const user = await User.create({
            email,
            password_hash: password, // Model hook will hash this
            full_name: 'Direct Tester',
            is_active: true
        });
        console.log('   User created.');

        const ipAddress = '127.0.0.1';
        const userAgent = 'NodeTest';

        console.log('2. Generating token pair...');
        const tokens = await generateTokenPair(user, ipAddress, userAgent);
        const token = tokens.accessToken;
        console.log('   Token acquired.');

        console.log('3. Verifying token works...');
        const meRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`   /auth/me status: ${meRes.status}`);
        if (meRes.status !== 200) {
            const errData = await meRes.json();
            throw new Error('Initial auth failed: ' + JSON.stringify(errData));
        }

        console.log('4. Fetching session ID...');
        const sessionsRes = await fetch(`${API_BASE}/auth/sessions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const sessionsData = await sessionsRes.json();
        const sessionId = sessionsData.data.sessions[0].id;
        console.log(`   Session ID: ${sessionId}`);

        console.log('5. Revoking session...');
        // We need CSRF token for DELETE
        const csrfRes = await fetch('http://localhost:5000/', { credentials: 'include' });
        const cookies = csrfRes.headers.get('set-cookie');
        const csrfToken = cookies ? (cookies.match(/XSRF-TOKEN=([^;]+)/) || [])[1] : '';

        const revokeRes = await fetch(`${API_BASE}/auth/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-csrf-token': csrfToken,
                'Cookie': `XSRF-TOKEN=${csrfToken}`
            }
        });
        console.log(`   Revoke status: ${revokeRes.status}`);

        console.log('6. Verifying token is now INVALID (Real-time check)...');
        const finalMeRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const finalMeData = await finalMeRes.json();
        console.log(`   Final /auth/me status: ${finalMeRes.status}`);
        console.log(`   Message: ${finalMeData.message}`);

        if (finalMeRes.status === 401 && finalMeData.message === 'Session has been revoked') {
            console.log('\n✅ SUCCESS: Real-time revocation is working!');
        } else {
            console.error('\n❌ FAILURE: Token is still valid or returned wrong error.');
        }

        // Cleanup
        await user.destroy();

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testRevocation();
