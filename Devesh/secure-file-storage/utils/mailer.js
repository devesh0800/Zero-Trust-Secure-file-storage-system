import nodemailer from 'nodemailer';

// Use environment variables for security
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS, // App Password
  },
});

/**
 * Send OTP Email
 * @param {string} toEmail - Recipient email
 * @param {string} otp - The numeric OTP code
 */
export const sendOTPEmail = async (toEmail, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"Secure Vault" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
      to: toEmail,
      subject: "Your OTP Code",
      html: `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #333;">Secure Vault Verification</h2>
          <p>Your one-time password (OTP) is:</p>
          <div style="font-size: 36px; font-weight: bold; color: #4F46E5; background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px; border-radius: 5px;">
            ${otp}
          </div>
          <p>This OTP is valid for <b>10 minutes</b>.</p>
          <p style="color: #777; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
    console.log('OTP Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending OTP Email:', error);
    throw error;
  }
};

export default { sendOTPEmail };
