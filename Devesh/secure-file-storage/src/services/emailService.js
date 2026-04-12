/**
 * Email Service — Brevo (Sendinblue) HTTP API
 * Uses Brevo's REST API instead of SMTP to bypass Render's blocked outbound SMTP ports.
 * Free tier: 300 emails/day — no domain verification needed!
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.SMTP_USER || 'zerotrustsecurefilestorage@gmail.com';
const SENDER_NAME = 'SecureVault';

/**
 * Send an email using Brevo HTTP API
 */
export async function sendMail({ to, subject, text, html }) {
    if (!BREVO_API_KEY) {
        console.error('\n❌ BREVO_API_KEY is not set in environment variables!');
        console.error('   Emails will NOT be delivered.\n');
        throw new Error('Email service not configured: BREVO_API_KEY missing');
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                to: [{ email: to }],
                subject,
                textContent: text,
                htmlContent: html
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('\n❌ BREVO EMAIL FAILED:');
            console.error(`   To: ${to}`);
            console.error(`   Status: ${response.status}`);
            console.error(`   Error: ${JSON.stringify(data)}\n`);
            throw new Error(data.message || 'Brevo API error');
        }

        console.log('\n=============================================');
        console.log(`📧 EMAIL DELIVERED SUCCESSFULLY (Brevo)`);
        console.log(`   From: ${SENDER_EMAIL}`);
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   MessageId: ${data.messageId}`);
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
    return null;
}

export default {
    getTransporter,
    sendMail
};
