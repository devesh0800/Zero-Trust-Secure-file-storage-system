import { OtpVerification } from '../models/index.js';
import crypto from 'crypto';
import { AppError } from '../middlewares/errorHandler.js';
import { logSecurityEvent } from '../utils/logger.js';
import emailService from './emailService.js';

/**
 * OTP Service
 * Handles generation, delivery, and verification of One-Time Passwords
 */

// OTP expiration times
const OTP_EXPIRY = {
    registration: 30 * 60 * 1000, // 30 mins
    login_email: 10 * 60 * 1000, // 10 mins
    login_phone: 10 * 60 * 1000, // 10 mins
    update_email: 15 * 60 * 1000, // 15 mins
    update_phone: 15 * 60 * 1000, // 15 mins
    update_pin: 15 * 60 * 1000   // 15 mins
};

/**
 * Hash an OTP code for secure storage
 */
function hashOtp(code) {
    return crypto.createHash('sha256').update(code.toString()).digest('hex');
}

/**
 * Generate a random 6 digit numeric code
 */
function generateRandomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create and send an OTP
 */
export async function sendOtp(userIdentifier, purpose) {
    if (!OTP_EXPIRY[purpose]) {
        throw new AppError('Invalid OTP purpose', 400);
    }

    // Find and invalidate any existing unused OTPs for this path
    await OtpVerification.update(
        { is_used: true },
        {
            where: {
                user_identifier: userIdentifier,
                purpose: purpose,
                is_used: false
            }
        }
    );

    const code = generateRandomCode();
    const hashedCode = hashOtp(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY[purpose]);

    await OtpVerification.create({
        user_identifier: userIdentifier,
        otp_code: hashedCode,
        purpose,
        expires_at: expiresAt
    });

    logSecurityEvent(`otp_generated_${purpose}`, { identifier: userIdentifier });

    // Send real email in background (truly non-blocking)
    emailService.sendMail({
        to: userIdentifier.includes('@') ? userIdentifier : 'test@example.com',
        subject: `Your OTP Code for ${purpose.replace('_', ' ').toUpperCase()}`,
        text: `Your Verification Code is: ${code}\nThis code expires in ${OTP_EXPIRY[purpose] / 60000} minutes.`,
        html: `<div style="font-family: Arial; padding: 20px;">
                <h2>Secure Vault Verification</h2>
                <p>Your one-time code for <b>${purpose.replace('_', ' ')}</b> is:</p>
                <h1 style="color: #4f46e5; letter-spacing: 5px;">${code}</h1>
                <p>This code will expire in ${OTP_EXPIRY[purpose] / 60000} minutes.</p>
               </div>`
    }).catch(emailError => {
        console.error('⚠️ Background Email failed:', emailError.message);
    });

    // Always log OTP to console in production as a backup for the user
    console.log(`\n[BACKUP] OTP for ${userIdentifier}: ${code}\n`);

    return {
        success: true,
        message: `OTP sent successfully to ${userIdentifier}`,
        // Return code in non-production OR if email failed to help with testing
        ...(process.env.NODE_ENV !== 'production' && { test_code: code })
    };
}

/**
 * Verify an OTP
 */
export async function verifyOtp(userIdentifier, purpose, code) {
    if (!userIdentifier || !purpose || !code) {
        throw new AppError('Missing OTP verification parameters', 400);
    }

    const hashedCode = hashOtp(code);

    const otpRecord = await OtpVerification.findOne({
        where: {
            user_identifier: userIdentifier,
            purpose,
            is_used: false
        },
        order: [['created_at', 'DESC']]
    });

    if (!otpRecord) {
        throw new AppError('Invalid OTP or no OTP requested', 400);
    }

    if (new Date() > otpRecord.expires_at) {
        otpRecord.is_used = true;
        await otpRecord.save();
        throw new AppError('OTP has expired', 400);
    }

    if (otpRecord.otp_code !== hashedCode) {
        // Log failed attempt, maybe implement brute force protection specific to OTP later
        logSecurityEvent('otp_verification_failed', { identifier: userIdentifier, purpose });
        throw new AppError('Invalid OTP code', 400);
    }

    // Success - invalidate token
    otpRecord.is_used = true;
    await otpRecord.save();

    logSecurityEvent('otp_verification_success', { identifier: userIdentifier, purpose });

    return true;
}

export default {
    sendOtp,
    verifyOtp
};
