import speakeasy from 'speakeasy';
import crypto from 'crypto';
import fs from 'fs';

const API = 'http://localhost:5000/api/v1';

const headers = (token) => ({
    'Content-Type': 'application/json',
    'x-csrf-token': '1',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
});

async function test() {
    const results = [];
    let accessToken = null;
    let fileId = null;

    try {
        // ========================================
        // 1. REGISTER
        // ========================================
        console.log('\n🔐 1. REGISTER USER');
        const email = `sectest_${Math.floor(Math.random()*999999)}@test.com`;
        const captchaRes = await fetch(`${API}/auth/captcha`);
        const captchaData = await captchaRes.json();

        const regRes = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                email,
                password: 'SuperSecure123!@#',
                full_name: 'Security Tester',
                username: `sectest${Math.floor(Math.random()*999999)}`,
                captcha_id: captchaData.data.id,
                captcha_text: captchaData.data.text || 'TEST_123'
            })
        });
        const regData = await regRes.json();
        accessToken = regData.data?.accessToken;
        console.log(regRes.ok ? '   ✅ Registration OK' : `   ❌ Registration Failed: ${regData.message}`);
        results.push({ test: 'Register', pass: regRes.ok });

        if (!accessToken) { console.log('Cannot continue without token'); return; }

        // ========================================
        // 2. UPLOAD SAFE FILE
        // ========================================
        console.log('\n📤 2. UPLOAD SAFE FILE');
        // Create a safe test file
        fs.writeFileSync('/tmp/test-safe.txt', 'This is a perfectly safe test file for security validation.');

        const formData = new FormData();
        formData.append('file', new Blob([fs.readFileSync('/tmp/test-safe.txt')], { type: 'text/plain' }), 'test-safe.txt');

        const uploadRes = await fetch(`${API}/files/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'x-csrf-token': '1' },
            body: formData
        });
        const uploadData = await uploadRes.json();
        fileId = uploadData.data?.file?.id;
        console.log(uploadRes.ok ? `   ✅ Safe file uploaded. ID: ${fileId}` : `   ❌ Upload Failed: ${uploadData.message}`);
        results.push({ test: 'Upload Safe File', pass: uploadRes.ok });

        // ========================================
        // 3. VIRUS SCAN: BLOCK DANGEROUS FILE
        // ========================================
        console.log('\n🦠 3. VIRUS SCAN - BLOCK .EXE');
        // Create a fake exe file (MZ header = Windows executable signature)
        const exeBuffer = Buffer.alloc(100);
        exeBuffer.write('MZ', 0); // Windows PE signature
        fs.writeFileSync('/tmp/test-malware.exe', exeBuffer);

        const formData2 = new FormData();
        formData2.append('file', new Blob([fs.readFileSync('/tmp/test-malware.exe')], { type: 'application/octet-stream' }), 'test-malware.exe');

        const malRes = await fetch(`${API}/files/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'x-csrf-token': '1' },
            body: formData2
        });
        // Should be rejected (400 or 403)
        console.log(!malRes.ok ? '   ✅ Malware correctly BLOCKED' : '   ❌ Malware was NOT blocked!');
        results.push({ test: 'Block Malware', pass: !malRes.ok });

        // ========================================
        // 4. SIGNED DOWNLOAD URL
        // ========================================
        if (fileId) {
            console.log('\n🔗 4. SIGNED DOWNLOAD URL');
            const signedRes = await fetch(`${API}/files/${fileId}/signed-url`, {
                headers: headers(accessToken)
            });
            const signedData = await signedRes.json();
            console.log(signedRes.ok ? `   ✅ Signed URL generated. Expires: ${signedData.data?.expiresAt}` : `   ❌ Failed: ${signedData.message}`);
            results.push({ test: 'Generate Signed URL', pass: signedRes.ok });

            // Download using signed token (no auth cookie needed)
            if (signedData.data?.downloadUrl) {
                console.log('\n📥 5. DOWNLOAD VIA SIGNED URL');
                const dlRes = await fetch(`http://localhost:5000${signedData.data.downloadUrl}`);
                console.log(dlRes.ok ? '   ✅ Downloaded via signed URL' : `   ❌ Failed: ${dlRes.status}`);
                results.push({ test: 'Download via Signed URL', pass: dlRes.ok });
            }

            // Try with invalid token
            console.log('\n🚫 6. REJECT INVALID SIGNED URL');
            const badRes = await fetch(`${API}/files/${fileId}/download?token=fake.token`);
            console.log(!badRes.ok ? '   ✅ Invalid token correctly rejected' : '   ❌ Invalid token was accepted!');
            results.push({ test: 'Reject Invalid Token', pass: !badRes.ok });
        }

        // ========================================
        // 7. ENCRYPTED BACKUP
        // ========================================
        console.log('\n💾 7. CREATE ENCRYPTED BACKUP');
        const backupRes = await fetch(`${API}/admin/backup`, {
            method: 'POST',
            headers: headers(accessToken)
        });
        const backupData = await backupRes.json();
        console.log(backupRes.ok ? `   ✅ Backup created: ${backupData.data?.backupPath}` : `   ❌ Failed: ${backupData.message}`);
        results.push({ test: 'Create Backup', pass: backupRes.ok });

        console.log('\n📋 8. LIST BACKUPS');
        const listRes = await fetch(`${API}/admin/backups`, {
            headers: headers(accessToken)
        });
        const listData = await listRes.json();
        const backupCount = listData.data?.backups?.length || 0;
        console.log(listRes.ok ? `   ✅ Found ${backupCount} backup(s)` : `   ❌ Failed: ${listData.message}`);
        results.push({ test: 'List Backups', pass: listRes.ok && backupCount > 0 });

        // ========================================
        // 9. FILE INTEGRITY CHECK
        // ========================================
        if (fileId) {
            console.log('\n🔒 9. FILE INTEGRITY (Download + Verify)');
            const dlRes2 = await fetch(`${API}/files/${fileId}/download`, {
                headers: headers(accessToken)
            });
            const content = await dlRes2.text();
            const expected = 'This is a perfectly safe test file for security validation.';
            const match = content === expected;
            console.log(match ? '   ✅ File integrity verified (content matches original)' : '   ❌ Integrity check failed!');
            results.push({ test: 'File Integrity', pass: match });
        }

        // ========================================
        // SUMMARY
        // ========================================
        console.log('\n' + '='.repeat(50));
        console.log('🏆 SECURITY TEST RESULTS');
        console.log('='.repeat(50));
        const passed = results.filter(r => r.pass).length;
        const total = results.length;
        for (const r of results) {
            console.log(`  ${r.pass ? '✅' : '❌'} ${r.test}`);
        }
        console.log(`\n  Score: ${passed}/${total} tests passed`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('\n💥 Fatal Error:', error.message);
        if (error.stack) console.error(error.stack);
    }
}

test();
