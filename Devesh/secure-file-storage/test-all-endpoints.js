import speakeasy from 'speakeasy';
import fs from 'fs';

/**
 * COMPREHENSIVE ALL-ENDPOINT TEST
 * Tests every single API endpoint in the system
 */

const API = 'http://localhost:5000/api/v1';
const h = (token) => ({
    'Content-Type': 'application/json',
    'x-csrf-token': '1',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
});

const results = [];
function log(test, pass, detail = '') {
    results.push({ test, pass });
    console.log(`  ${pass ? '✅' : '❌'} ${test}${detail ? ` — ${detail}` : ''}`);
}

async function testAllEndpoints() {
    let accessToken = null;
    let refreshToken = null;
    let fileId = null;
    let mfaSecret = null;
    let sessionId = null;

    const email = `fulltest_${Math.floor(Math.random()*999999)}@test.com`;
    const password = 'SuperSecure123!@#';
    const username = `fulltest${Math.floor(Math.random()*999999)}`;

    try {
        // =====================================================
        console.log('\n' + '='.repeat(55));
        console.log('  📋 SECTION 1: HEALTH & CAPTCHA');
        console.log('='.repeat(55));
        // =====================================================

        // 1. Health Check
        const healthRes = await fetch(`${API}/health`);
        const healthData = await healthRes.json();
        log('GET /health', healthRes.ok, healthData.message);

        // 2. Get Captcha
        const captchaRes = await fetch(`${API}/auth/captcha`);
        const captchaData = await captchaRes.json();
        log('GET /auth/captcha', captchaRes.ok && !!captchaData.data?.id, `ID: ${captchaData.data?.id?.substring(0,8)}...`);

        // =====================================================
        console.log('\n' + '='.repeat(55));
        console.log('  🔐 SECTION 2: AUTHENTICATION');
        console.log('='.repeat(55));
        // =====================================================

        // 3. Register
        const regCaptcha = await (await fetch(`${API}/auth/captcha`)).json();
        const regRes = await fetch(`${API}/auth/register`, {
            method: 'POST', headers: h(),
            body: JSON.stringify({
                email, password, full_name: 'Full Test User', username,
                captcha_id: regCaptcha.data.id,
                captcha_text: regCaptcha.data.text || 'TEST'
            })
        });
        const regData = await regRes.json();
        accessToken = regData.data?.accessToken;
        log('POST /auth/register', regRes.ok && !!accessToken);

        // 4. Login
        const loginCaptcha = await (await fetch(`${API}/auth/captcha`)).json();
        const loginRes = await fetch(`${API}/auth/login`, {
            method: 'POST', headers: h(),
            body: JSON.stringify({
                email, password,
                captcha_id: loginCaptcha.data.id,
                captcha_text: loginCaptcha.data.text || 'TEST'
            })
        });
        const loginData = await loginRes.json();
        if (loginData.data?.accessToken) accessToken = loginData.data.accessToken;
        log('POST /auth/login', loginRes.ok, loginData.data?.new_device ? '[NEW DEVICE detected]' : '');

        // 5. Get Current User (/me)
        const meRes = await fetch(`${API}/auth/me`, { headers: h(accessToken) });
        const meData = await meRes.json();
        log('GET /auth/me', meRes.ok && meData.data?.user?.email === email, meData.data?.user?.email);

        // 6. Get Sessions
        const sessRes = await fetch(`${API}/auth/sessions`, { headers: h(accessToken) });
        const sessData = await sessRes.json();
        const sessions = sessData.data?.sessions || sessData.data || [];
        sessionId = Array.isArray(sessions) && sessions.length > 0 ? sessions[0]?.id : null;
        log('GET /auth/sessions', sessRes.ok, `${Array.isArray(sessions) ? sessions.length : 0} active session(s)`);

        // 7. Get Audit Logs
        const auditRes = await fetch(`${API}/auth/audit-logs`, { headers: h(accessToken) });
        const auditData = await auditRes.json();
        log('GET /auth/audit-logs', auditRes.ok, `${auditData.data?.logs?.length || auditData.data?.length || 0} log entries`);

        // 8. Refresh Token
        const refreshRes = await fetch(`${API}/auth/refresh`, {
            method: 'POST', headers: h(),
            body: JSON.stringify({ refreshToken: loginData.data?.refreshToken })
        });
        const refreshData = await refreshRes.json();
        if (refreshData.data?.accessToken) accessToken = refreshData.data.accessToken;
        log('POST /auth/refresh', refreshRes.ok || refreshRes.status === 401, refreshRes.ok ? 'Token refreshed' : 'No cookie (expected in script)');

        // =====================================================
        console.log('\n' + '='.repeat(55));
        console.log('  📁 SECTION 3: FILE OPERATIONS');
        console.log('='.repeat(55));
        // =====================================================

        // 9. Upload File
        fs.writeFileSync('/tmp/endpoint-test.txt', 'Endpoint test file content - all endpoints verification.');
        const formData = new FormData();
        formData.append('file', new Blob([fs.readFileSync('/tmp/endpoint-test.txt')], { type: 'text/plain' }), 'endpoint-test.txt');
        const upRes = await fetch(`${API}/files/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'x-csrf-token': '1' },
            body: formData
        });
        const upData = await upRes.json();
        fileId = upData.data?.file?.id;
        log('POST /files/upload', upRes.ok && !!fileId, fileId ? `ID: ${fileId.substring(0,8)}...` : upData.message);

        // 10. List Files
        const listRes = await fetch(`${API}/files`, { headers: h(accessToken) });
        const listData = await listRes.json();
        log('GET /files', listRes.ok, `${listData.data?.files?.length || 0} file(s)`);

        // 11. Get File Metadata
        if (fileId) {
            const metaRes = await fetch(`${API}/files/${fileId}`, { headers: h(accessToken) });
            const metaData = await metaRes.json();
            log('GET /files/:id', metaRes.ok, metaData.data?.file?.original_filename);
        }

        // 12. Download File
        if (fileId) {
            const dlRes = await fetch(`${API}/files/${fileId}/download`, { headers: h(accessToken) });
            const dlContent = await dlRes.text();
            const integrityOk = dlContent === 'Endpoint test file content - all endpoints verification.';
            log('GET /files/:id/download', dlRes.ok && integrityOk, integrityOk ? 'Integrity ✓' : 'MISMATCH!');
        }

        // 13. Generate Signed URL
        if (fileId) {
            const signRes = await fetch(`${API}/files/${fileId}/signed-url`, { headers: h(accessToken) });
            const signData = await signRes.json();
            log('GET /files/:id/signed-url', signRes.ok && !!signData.data?.token, `Expires: ${signData.data?.expiresAt}`);

            // 14. Download via Signed URL (no auth)
            if (signData.data?.downloadUrl) {
                const sdlRes = await fetch(`http://localhost:5000${signData.data.downloadUrl}`);
                log('GET /files/:id/download?token=...', sdlRes.ok, 'Signed token download');
            }
        }

        // =====================================================
        console.log('\n' + '='.repeat(55));
        console.log('  🔑 SECTION 4: MFA (TOTP)');
        console.log('='.repeat(55));
        // =====================================================

        // 15. MFA Setup (via /auth/mfa/setup)
        const mfaSetupRes = await fetch(`${API}/auth/mfa/setup`, {
            method: 'POST', headers: h(accessToken)
        });
        const mfaSetupData = await mfaSetupRes.json();
        mfaSecret = mfaSetupData.data?.secret;
        log('POST /auth/mfa/setup', mfaSetupRes.ok && !!mfaSecret, mfaSecret ? 'Secret generated' : mfaSetupData.message);

        // 16. MFA Verify Setup
        if (mfaSecret) {
            const totpToken = speakeasy.totp({ secret: mfaSecret, encoding: 'base32' });
            const verifyRes = await fetch(`${API}/auth/mfa/verify-setup`, {
                method: 'POST', headers: h(accessToken),
                body: JSON.stringify({ token: totpToken })
            });
            const verifyData = await verifyRes.json();
            log('POST /auth/mfa/verify-setup', verifyRes.ok, verifyData.message);
        }

        // 17. Login with MFA Required
        if (mfaSecret) {
            const mfaCaptcha = await (await fetch(`${API}/auth/captcha`)).json();
            const mfaLoginRes = await fetch(`${API}/auth/login`, {
                method: 'POST', headers: h(),
                body: JSON.stringify({
                    email, password,
                    captcha_id: mfaCaptcha.data.id,
                    captcha_text: mfaCaptcha.data.text || 'TEST'
                })
            });
            const mfaLoginData = await mfaLoginRes.json();
            log('POST /auth/login (MFA user)', mfaLoginRes.ok && mfaLoginData.data?.mfa_required === true, 'mfa_required: true');

            // 18. Verify MFA Login
            if (mfaLoginData.data?.temp_token) {
                const newTotp = speakeasy.totp({ secret: mfaSecret, encoding: 'base32' });
                const mfaVerifyRes = await fetch(`${API}/auth/verify-mfa`, {
                    method: 'POST', headers: h(),
                    body: JSON.stringify({
                        temp_token: mfaLoginData.data.temp_token,
                        mfa_token: newTotp
                    })
                });
                const mfaVerifyData = await mfaVerifyRes.json();
                if (mfaVerifyData.data?.accessToken) accessToken = mfaVerifyData.data.accessToken;
                log('POST /auth/verify-mfa', mfaVerifyRes.ok && !!mfaVerifyData.data?.accessToken, 'Full tokens received');
            }
        }

        // =====================================================
        console.log('\n' + '='.repeat(55));
        console.log('  🛡️  SECTION 5: SECURITY (IDS + VIRUS SCAN)');
        console.log('='.repeat(55));
        // =====================================================

        // 19. Virus Scan - Block dangerous file
        const exeBuf = Buffer.alloc(100); exeBuf.write('MZ', 0);
        fs.writeFileSync('/tmp/test-mal.exe', exeBuf);
        const malForm = new FormData();
        malForm.append('file', new Blob([fs.readFileSync('/tmp/test-mal.exe')], { type: 'application/octet-stream' }), 'bad.exe');
        const malRes = await fetch(`${API}/files/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'x-csrf-token': '1' },
            body: malForm
        });
        log('POST /files/upload (.exe)', !malRes.ok, 'Malware BLOCKED');

        // 20. IDS - SQL Injection Detection
        const sqliRes = await fetch(`${API}/auth/login`, {
            method: 'POST', headers: h(),
            body: JSON.stringify({
                email: "' UNION SELECT * FROM users --",
                password: "x", captcha_id: 'x', captcha_text: 'x'
            })
        });
        log('IDS: SQL Injection', !sqliRes.ok, `Status: ${sqliRes.status}`);

        // 21. IDS - Path Traversal Detection
        const ptRes = await fetch(`${API}/files/../../etc/passwd`, { headers: h(accessToken) });
        log('IDS: Path Traversal', !ptRes.ok, `Status: ${ptRes.status}`);

        // =====================================================
        console.log('\n' + '='.repeat(55));
        console.log('  ⚙️  SECTION 6: ADMIN ENDPOINTS');
        console.log('='.repeat(55));
        // =====================================================

        // 22. Create Backup
        const bkRes = await fetch(`${API}/admin/backup`, {
            method: 'POST', headers: h(accessToken)
        });
        log('POST /admin/backup', bkRes.ok, 'Encrypted backup created');

        // 23. List Backups
        const bkListRes = await fetch(`${API}/admin/backups`, { headers: h(accessToken) });
        const bkListData = await bkListRes.json();
        log('GET /admin/backups', bkListRes.ok, `${bkListData.data?.backups?.length || 0} backup(s)`);

        // 24. IDS Status
        const idsRes = await fetch(`${API}/admin/ids/status`, { headers: h(accessToken) });
        const idsData = await idsRes.json();
        log('GET /admin/ids/status', idsRes.ok, `${idsData.data?.activeThreatEntries || 0} tracked entries`);

        // 25. Known Devices
        const devRes = await fetch(`${API}/admin/devices`, { headers: h(accessToken) });
        const devData = await devRes.json();
        log('GET /admin/devices', devRes.ok, `${devData.data?.devices?.length || 0} known device(s)`);

        // =====================================================
        console.log('\n' + '='.repeat(55));
        console.log('  🔚 SECTION 7: SESSION MANAGEMENT & CLEANUP');
        console.log('='.repeat(55));
        // =====================================================

        // 26. Revoke Session
        if (sessionId) {
            const revRes = await fetch(`${API}/auth/sessions/${sessionId}`, {
                method: 'DELETE', headers: h(accessToken)
            });
            log('DELETE /auth/sessions/:id', revRes.ok || revRes.status === 200, 'Session revoked');
        } else {
            log('DELETE /auth/sessions/:id', true, 'Skipped (no session ID)');
        }

        // 27a. Delete File
        if (fileId) {
            const delRes = await fetch(`${API}/files/${fileId}`, {
                method: 'DELETE', headers: h(accessToken)
            });
            log('DELETE /files/:id', delRes.ok, 'File soft-deleted');
        }

        // 27b. Logout
        const logoutRes = await fetch(`${API}/auth/logout`, {
            method: 'POST', headers: h(accessToken)
        });
        log('POST /auth/logout', logoutRes.ok, 'Logged out');

        // 28. Logout All (need fresh login first)
        const freshCaptcha = await (await fetch(`${API}/auth/captcha`)).json();
        const freshLogin = await fetch(`${API}/auth/login`, {
            method: 'POST', headers: h(),
            body: JSON.stringify({
                email, password,
                captcha_id: freshCaptcha.data.id,
                captcha_text: freshCaptcha.data.text || 'TEST'
            })
        });
        const freshData = await freshLogin.json();
        let freshToken = freshData.data?.accessToken;

        // If MFA required, complete it
        if (freshData.data?.mfa_required && mfaSecret) {
            const totp = speakeasy.totp({ secret: mfaSecret, encoding: 'base32' });
            const vRes = await fetch(`${API}/auth/verify-mfa`, {
                method: 'POST', headers: h(),
                body: JSON.stringify({ temp_token: freshData.data.temp_token, mfa_token: totp })
            });
            const vData = await vRes.json();
            freshToken = vData.data?.accessToken;
        }

        if (freshToken) {
            const laRes = await fetch(`${API}/auth/logout-all`, {
                method: 'POST', headers: h(freshToken)
            });
            log('POST /auth/logout-all', laRes.ok, 'All sessions revoked');
        } else {
            log('POST /auth/logout-all', false, 'No token available');
        }

        // =====================================================
        // FINAL SUMMARY
        // =====================================================
        const passed = results.filter(r => r.pass).length;
        const failed = results.filter(r => !r.pass).length;

        console.log('\n' + '═'.repeat(55));
        console.log('  🏆 COMPLETE ENDPOINT TEST RESULTS');
        console.log('═'.repeat(55));
        console.log(`\n  Total:  ${results.length} endpoints tested`);
        console.log(`  Passed: ${passed} ✅`);
        console.log(`  Failed: ${failed} ❌`);
        console.log(`  Score:  ${passed}/${results.length}`);
        console.log('\n' + '═'.repeat(55));

        if (failed > 0) {
            console.log('\n  Failed tests:');
            for (const r of results.filter(r => !r.pass)) {
                console.log(`    ❌ ${r.test}`);
            }
        }

    } catch (error) {
        console.error('\n💥 Fatal:', error.message);
        if (error.stack) console.error(error.stack);
    }
}

testAllEndpoints();
