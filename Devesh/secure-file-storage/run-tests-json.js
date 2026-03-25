import fs from 'fs';

const BASE_URL = 'http://localhost:5000/api/v1';

async function run() {
    try {
        const testEmail = `testuser_${Date.now()}@example.com`;
        const testPassword = `SecurePass123!@#`;
        let accessToken;
        let fileId;
        let cookie;

        // Register
        await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: testPassword, full_name: 'Test' })
        });

        // Login
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: testPassword })
        });
        const loginData = await loginRes.json();
        if (!loginData.success) throw { step: 'Login', error: loginData };
        accessToken = loginData.data.accessToken;
        cookie = loginRes.headers.get('set-cookie');

        // Mute fetch logs before doing this...
        // Upload File
        const formData = new FormData();
        formData.append('file', new Blob(['Hello'], { type: 'text/plain' }), 'test.txt');
        const uploadRes = await fetch(`${BASE_URL}/files/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
            body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) throw { step: 'Upload', error: uploadData };
        fileId = uploadData.data.file.id;

        // Refresh Token
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': cookie }
        });
        const refreshData = await refreshRes.json();
        if (!refreshData.success) throw { step: 'Refresh', error: refreshData };

        console.log("All success!");
        fs.writeFileSync('output.json', JSON.stringify({ success: true }));
    } catch (err) {
        fs.writeFileSync('output.json', JSON.stringify(err, null, 2));
    }
}
run();
