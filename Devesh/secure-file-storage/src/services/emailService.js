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
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
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
        const info = await mailer.sendMail({
            from: '"Secure Vault" <no-reply@securevault.local>',
            to,
            subject,
            text,
            html
        });

        console.log('\n=============================================');
        console.log(`📧 EMAIL DELIVERED`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        
        // Show the verification link if using ethereal testing service (dummy credentials)
        if (!process.env.SMTP_HOST || process.env.SMTP_USER.includes('your_email')) {
            console.log(`🔗 VIEW TEST EMAIL IN BROWSER HERE: ${nodemailer.getTestMessageUrl(info)}`);
        }
        console.log('=============================================\n');

        return info;
    } catch (err) {
        console.error('Failed to send email:', err);
        throw err;
    }
}

export default {
    getTransporter,
    sendMail
};
