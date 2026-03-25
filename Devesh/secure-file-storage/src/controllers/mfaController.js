import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User, AuditLog } from '../models/index.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { logSecurityEvent } from '../utils/logger.js';

/**
 * MFA Controller
 * Handles Multi-Factor Authentication logic (TOTP)
 */

/**
 * @route   POST /api/v1/mfa/setup
 * @desc    Generate a new TOTP secret and QR code to enable MFA
 * @access  Private
 */
export const setupMFA = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (user.mfa_enabled) {
        return res.status(400).json({
            success: false,
            message: 'MFA is already enabled on this account'
        });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
        name: `SecureFileStorage:${user.email}`,
        issuer: 'SecureFileStorage'
    });

    // Save temporary secret to user (not enabled yet)
    user.mfa_secret = secret.base32;
    await user.save();

    // Generate QR Code data URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
        success: true,
        data: {
            secret: secret.base32,
            qrCodeUrl
        }
    });
});

/**
 * @route   POST /api/v1/mfa/enable
 * @desc    Verify TOTP and activate MFA on the account
 * @access  Private
 */
export const enableMFA = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        throw new AppError('TOTP token is required', 400);
    }

    const user = await User.findByPk(req.user.id);

    if (user.mfa_enabled) {
        throw new AppError('MFA is already enabled', 400);
    }

    if (!user.mfa_secret) {
        throw new AppError('MFA setup not initiated. Call /mfa/setup first.', 400);
    }

    const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token,
        window: 1 // Allow 30 seconds drift either way
    });

    if (!verified) {
        throw new AppError('Invalid TOTP token', 400);
    }

    // Setup 10 backup codes
    const backupCodes = Array.from({ length: 10 }).map(() =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    user.mfa_enabled = true;
    user.mfa_backup_codes = JSON.stringify(backupCodes);
    await user.save();

    await AuditLog.create({
        user_id: user.id,
        event_type: 'mfa_enabled',
        event_description: 'User successfully enabled TOTP Multi-factor authentication',
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
    });

    res.status(200).json({
        success: true,
        message: 'MFA successfully enabled.',
        data: {
            backupCodes
        }
    });
});

/**
 * @route   POST /api/v1/mfa/disable
 * @desc    Disable MFA (Requires passing a valid TOTP to disable)
 * @access  Private
 */
export const disableMFA = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        throw new AppError('TOTP token is required to disable MFA', 400);
    }

    const user = await User.findByPk(req.user.id);

    if (!user.mfa_enabled) {
        throw new AppError('MFA is not enabled', 400);
    }

    const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token,
        window: 1
    });

    if (!verified) {
        logSecurityEvent('mfa_disable_failed', {
            userId: user.id,
            ip: req.ip
        });
        throw new AppError('Invalid TOTP token', 400);
    }

    user.mfa_enabled = false;
    user.mfa_secret = null;
    user.mfa_backup_codes = null;
    await user.save();

    await AuditLog.create({
        user_id: user.id,
        event_type: 'mfa_disabled',
        event_description: 'User disabled Multi-factor authentication',
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'success'
    });

    res.status(200).json({
        success: true,
        message: 'MFA has been successfully disabled.'
    });
});

export default {
    setupMFA,
    enableMFA,
    disableMFA
};
