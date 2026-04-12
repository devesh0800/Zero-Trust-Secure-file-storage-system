/**
 * Email Service — Resend HTTP API
 * Uses Resend's REST API instead of SMTP to bypass Render's blocked outbound SMTP ports.
 * Free tier: 100 emails/day, 3000/month
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM || 'SecureVault <onboarding@resend.dev>';

/**
 * Send an email using Resend HTTP API
 */
export async function sendMail({ to, subject, text, html }) {
    if (!RESEND_API_KEY) {
        console.error('\n❌ RESEND_API_KEY is not set in environment variables!');
        console.error('   Emails will NOT be delivered.\n');
        throw new Error('Email service not configured: RESEND_API_KEY missing');
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_ADDRESS,
                to: [to],
                subject,
                text,
                html
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('\n❌ RESEND EMAIL FAILED:');
            console.error(`   To: ${to}`);
            console.error(`   Status: ${response.status}`);
            console.error(`   Error: ${JSON.stringify(data)}\n`);
            throw new Error(data.message || 'Resend API error');
        }

        console.log('\n=============================================');
        console.log(`📧 EMAIL DELIVERED SUCCESSFULLY (Resend)`);
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   ID: ${data.id}`);
        console.log('=============================================\n');

        return data;
    } catch (err) {
        console.error('\n❌ EMAIL SEND FAILED:');
        console.error(`   To: ${to}`);
        console.error(`   Error: ${err.message}\n`);
        throw err;
    }
}

// Keep backward-compatible export
export async function getTransporter() {
    // No longer needed with Resend, but kept for compatibility
    return null;
}

export default {
    getTransporter,
    sendMail
};
