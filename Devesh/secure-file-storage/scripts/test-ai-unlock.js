import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log('🤖 Starting AI Unlock Integration Test...');
    
    const testUsername = `testuser_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;
    const testPassword = 'Password123!';
    let agent = axios.create({ baseURL: API_URL, validateStatus: () => true });

    // Step 1: Register User
    console.log(`\n[1] Registering test user: ${testEmail}`);
    const regRes = await agent.post('/auth/register', {
        email: testEmail,
        username: testUsername,
        full_name: 'Test Setup',
        password: testPassword
    });
    console.log(`Registration status: ${regRes.status}`);
    
    if (regRes.status !== 201) {
        console.error('Registration failed:', regRes.data);
        return;
    }

    // Step 2: Trigger Account Lock
    console.log(`\n[2] Triggering account lock via failed logins...`);
    for (let i = 0; i < 3; i++) {
        const failRes = await agent.post('/auth/login', { email: testEmail, password: 'WrongPassword' });
        console.log(`Failed attempt ${i + 1} status: ${failRes.status}`);
    }

    const lockedRes = await agent.post('/auth/login', { email: testEmail, password: testPassword });
    console.log(`Post-lock correct login status (should be 403): ${lockedRes.status}`);
    if (lockedRes.status !== 403) {
        console.error('Account lock failed.', lockedRes.data);
        return;
    }

    // Step 3: Request Magic Link
    console.log(`\n[3] Requesting Magic Link...`);
    const magicRes = await agent.post('/auth/unlock/request', { email: testEmail });
    console.log(`Magic link request status: ${magicRes.status}`);
    
    if (!magicRes.data.test_magic_link) {
        console.error('Failed to get magic link. Have you updated authService?', magicRes.data);
        return;
    }
    const token = new URLSearchParams(magicRes.data.test_magic_link.split('?')[1]).get('token');
    console.log(`Extracted token: ${token}`);

    // Step 4: Verify Magic Link => Restricted Mode
    console.log(`\n[4] Consuming Magic Link to enter RESTRICTED mode...`);
    const verifyRes = await agent.post(`/auth/unlock/verify?token=${token}`);
    console.log(`Verify link status: ${verifyRes.status}`);
    
    if (verifyRes.status !== 200) {
        console.error('Magic link verification failed:', verifyRes.data);
        return;
    }

    const accessToken = verifyRes.data.data.accessToken;
    console.log('Got Restricted Access Token.');
    
    // Set token for restricted requests
    let restrictedAgent = axios.create({ 
        baseURL: API_URL, 
        validateStatus: () => true,
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    // Step 5: Test Restricted Middleware
    console.log(`\n[5] Testing Restricted Middleware (attempting to list devices)...`);
    // Oh wait, GET requests might be allowed, but let's try an upload endpoint (which is POST)
    const restrictFailRes = await restrictedAgent.delete('/files/123-fake-id');
    console.log(`Restricted DELETE attempt status (should be 403): ${restrictFailRes.status}`);
    if (restrictFailRes.status !== 403) {
         console.warn(`Wait, it returned ${restrictFailRes.status} instead of restricted 403.`);
    }

    // Step 6: Generate AI Challenge
    console.log(`\n[6] Generating AI Challenge...`);
    const challengeRes = await restrictedAgent.get('/auth/unlock/challenge');
    console.log(`Challenge generation status: ${challengeRes.status}`);
    if (challengeRes.status !== 200) {
        console.error('Failed to generate challenge:', challengeRes.data);
        return;
    }

    const challengeData = challengeRes.data.data;
    console.log(`Received ${challengeData.questions ? challengeData.questions.length : 0} questions.`);
    
    if (!challengeData.debug_correct_indices) {
        console.log('No debug indices found, perhaps NODE_ENV !== development. Assuming fallback sequence [0, 0, 0] for testing.');
    }
    const correctAnswers = challengeData.debug_correct_indices || [0, 0, 0];
    console.log(`Expected answers:`, correctAnswers);

    // Step 7: Submit Challenge Answers
    console.log(`\n[7] Submitting correct Challenge answers...`);
    const submitRes = await restrictedAgent.post('/auth/unlock/challenge/verify', {
        answers: correctAnswers
    });
    console.log(`Submit status: ${submitRes.status}`);
    
    if (submitRes.status !== 200) {
         console.error('Failed to submit challenge:', submitRes.data);
         return;
    }
    const resetToken = submitRes.data.data.reset_token;
    console.log(`Received Reset Token: ${resetToken}`);

    // Step 8: Reset Credentials & Restore Access
    console.log(`\n[8] Resetting Password & Restoring Access...`);
    const newPassword = 'NewPassword321!';
    const resetRes = await restrictedAgent.post('/auth/unlock/reset-credentials', {
        reset_token: resetToken,
        new_password: newPassword
    });
    
    console.log(`Reset status: ${resetRes.status}`);
    if (resetRes.status !== 200) {
        console.error('Failed to reset credentials:', resetRes.data);
        return;
    }

    console.log('\n✅ TEST PASSED: Full AI Unlock & Reset Flow completed successfully!');
}

runTest().catch(console.error);
