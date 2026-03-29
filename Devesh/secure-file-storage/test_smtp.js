import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import emailService from './src/services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from the same directory
dotenv.config({ path: path.join(__dirname, '.env') });

async function testEmail() {
    console.log('Testing SMTP connection...');
    console.log('Target Email:', process.env.SMTP_USER);
    
    try {
        const info = await emailService.sendMail({
            to: process.env.SMTP_USER,
            subject: 'SMTP Test - Secure File Storage',
            text: 'Hello! Your SMTP settings are working correctly.',
            html: '<h1>Success!</h1><p>Hello! Your SMTP settings are working correctly.</p>'
        });
        
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Failed to send test email:');
        console.error(error.message);
    }
}

testEmail();
