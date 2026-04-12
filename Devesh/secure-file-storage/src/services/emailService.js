import nodemailer from 'nodemailer';

let testAccount = null;
let transporter = null;

/**
 * Initializes and returns a Nodemailer Transporter instance.
 * Automatically falls back to Ethereal Testing service if real SMTP credentials are not provided.
 */
export async function getTransporter() {
    if (!transporter) {
        if (process.env.SMTP_HOST && process.env.SMTP_USER && !process.env.SMTP_USER.includes('your_email')) {
            // Use real SMTP if valid credentials are provided
            const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 465;
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: smtpPort,
                secure: smtpPort === 465, // true for 465, false for 587
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: false
                },
                // Force IPv4 — Render Free Tier blocks outbound IPv6
                dnsOptions: { family: 4 }
            });
            console.log(`📧 SMTP configured: ${process.env.SMTP_HOST}:${smtpPort} as ${process.env.SMTP_USER}`);
        } else {
            // Fallback to Ethereal Testing service
            testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log(`\n📧 Ethereal Email Testing Account Ready: ${testAccount.user}`);
            console.log(`⚠️  NOTE: You are using the testing email service because valid SMTP credentials were not found in .env\n`);
        }
    }
    return transporter;
}

/**
 * Send an email using the configured transporter
 */
export async function sendMail({ to, subject, text, html }) {
    try {
        const mailer = await getTransporter();
        
        // Use the authenticated SMTP user as the sender (Gmail requires this)
        const fromAddress = process.env.SMTP_USER || 'no-reply@securevault.local';
        
        const info = await mailer.sendMail({
            from: `"SecureVault" <${fromAddress}>`,
            to,
            subject,
            text,
            html
        });

        console.log('\n=============================================');
        console.log(`📧 EMAIL DELIVERED SUCCESSFULLY`);
        console.log(`From: ${fromAddress}`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`MessageId: ${info.messageId}`);
        
        // Show the verification link if using ethereal testing service
        if (!process.env.SMTP_HOST || process.env.SMTP_USER?.includes('your_email')) {
            console.log(`🔗 VIEW TEST EMAIL IN BROWSER HERE: ${nodemailer.getTestMessageUrl(info)}`);
        }
        console.log('=============================================\n');

        return info;
    } catch (err) {
        console.error('\n❌ EMAIL SEND FAILED:');
        console.error(`   To: ${to}`);
        console.error(`   Error: ${err.message}`);
        console.error(`   Code: ${err.code || 'N/A'}`);
        console.error(`   SMTP Host: ${process.env.SMTP_HOST || 'NOT SET'}`);
        console.error(`   SMTP User: ${process.env.SMTP_USER || 'NOT SET'}`);
        console.error(`   SMTP Pass: ${process.env.SMTP_PASS ? '****SET****' : 'NOT SET'}\n`);
        throw err;
    }
}

export default {
    getTransporter,
    sendMail
};
