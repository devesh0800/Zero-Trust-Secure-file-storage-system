import { User, AuditLog, KnownDevice, ActionToken } from '../models/index.js';
import crypto from 'crypto';
import { generateTokenPair, verifyRefreshToken, validateRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../utils/jwt.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logAuthEvent, logSecurityEvent } from '../utils/logger.js';
import { checkAndRegisterDevice, parseDeviceName } from '../utils/deviceFingerprint.js';
import otpService from './otpService.js';
import notificationService from './notificationService.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Authentication Service
 * Handles all authentication business logic
 */

/**
 * Register a new user
 */
export async function registerUser(userData, otpCode, ipAddress, userAgent) {
    const { email, password, username } = userData;

    // Verify OTP first
    await otpService.verifyOtp(email, 'registration', otpCode);

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new AppError('Email already registered', 409);
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
        throw new AppError('Username already taken', 409);
    }

    // Create user (password will be hashed by model hook, unique_share_id generated)
    const user = await User.create({
        email,
        username,
        password_hash: password
    });

    // Log registration
    await AuditLog.create({
        user_id: user.id,
        event_type: 'user_registered',
        event_description: `User registered: ${email}`,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'success'
    });

    logAuthEvent('register', user.id, true, { email, ip: ipAddress });

    // Generate tokens
    const tokens = await generateTokenPair(user, ipAddress, userAgent);

    return {
        user: user.toJSON(),
        ...tokens
    };
}

/**
 * Login user
 */
export async function loginUser(credentials, ipAddress, userAgent) {
    const { identifier, password } = credentials;

    // Find user by either email or username using Sequelize Op.or
    const { Op } = await import('sequelize');
    const user = await User.findOne({
        where: {
            [Op.or]: [
                { email: identifier },
                { username: identifier }
            ]
        }
    });

    if (!user) {
        // Log failed attempt with invalid identifier
        await AuditLog.create({
            event_type: 'login_failed',
            event_description: `Login attempt with invalid identifier: ${identifier}`,
            ip_address: ipAddress,
            user_agent: userAgent,
            status: 'failure'
        });

        logAuthEvent('login', null, false, { identifier, reason: 'user_not_found', ip: ipAddress });

        // Generic error message to prevent user enumeration
        throw new AppError('Invalid credentials', 401);
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
        await AuditLog.create({
            user_id: user.id,
            event_type: 'login_failed',
            event_description: 'Login attempt on locked account',
            ip_address: ipAddress,
            user_agent: userAgent,
            status: 'failure'
        });

        logSecurityEvent('locked_account_login_attempt', {
            userId: user.id,
            email: user.email,
            ip: ipAddress
        });

        throw new AppError(
            'Account is permanently locked due to multiple failed login attempts. Please use the Account Recovery option to restore your access.',
            403
        );
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);

    if (!isPasswordValid) {
        // Increment failed attempts
        await user.incrementFailedAttempts();

        await AuditLog.create({
            user_id: user.id,
            event_type: 'login_failed',
            event_description: `Failed login attempt (${user.failed_login_attempts}/${user.constructor.rawAttributes.failed_login_attempts.defaultValue})`,
            ip_address: ipAddress,
            user_agent: userAgent,
            status: 'failure'
        });

        logAuthEvent('login', user.id, false, {
            email: user.email,
            reason: 'invalid_password',
            attempts: user.failed_login_attempts,
            ip: ipAddress
        });

        throw new AppError('Invalid credentials', 401);
    }

    // Check if account is active
    if (!user.is_active) {
        await AuditLog.create({
            user_id: user.id,
            event_type: 'login_failed',
            event_description: 'Login attempt on inactive account',
            ip_address: ipAddress,
            user_agent: userAgent,
            status: 'failure'
        });

        throw new AppError('Account is inactive', 403);
    }

    // Device fingerprinting — detect new devices
    const deviceCheck = await checkAndRegisterDevice(KnownDevice, user.id, userAgent, ipAddress);

    // Check if MFA is enabled - if so, skip Email OTP and go straight to MFA
    if (user.mfa_enabled) {
        logAuthEvent('login_mfa_required', user.id, true, { email: user.email, ip: ipAddress });
        return {
            mfa_required: true,
            temp_token: user.id
        };
    }

    // Require OTP for all logins (when MFA is NOT enabled)
    await otpService.sendOtp(user.email, 'login_email');

    logAuthEvent('login_otp_required', user.id, true, { email: user.email, ip: ipAddress });

    return {
        otp_required: true,
        temp_token: user.id, // Using user.id as temp_token for simplicity
        email: user.email,
        new_device: deviceCheck.isNew
    };
}

/**
 * Verify Login OTPs
 */
export async function verifyLoginOtp(tempToken, emailOtp, phoneOtp, isNewDevice, ipAddress, userAgent) {
    const user = await User.findByPk(tempToken);
    
    if (!user || !user.is_active) {
        throw new AppError('Invalid login session or inactive account', 400);
    }

    // Verify Email OTP
    await otpService.verifyOtp(user.email, 'login_email', emailOtp);

    // Verify Phone OTP if new device and user has a phone number
    if (isNewDevice && user.phone_number && phoneOtp) {
        await otpService.verifyOtp(user.phone_number, 'login_phone', phoneOtp);
    } else if (isNewDevice && user.phone_number && !phoneOtp) {
        throw new AppError('Phone OTP is required for new devices', 400);
    }

    // Check for concurrent active sessions before creating the new one
    const activeSessions = await getActiveSessions(user.id);
    const deviceName = parseDeviceName(userAgent);
    
    if (activeSessions.length > 0) {
        await notificationService.createNotification(
            user.id,
            'New Login Alert',
            `A new login was detected from ${deviceName}. If this wasn't you, secure your account.`,
            'security'
        );
    } else if (isNewDevice) {
        await notificationService.createNotification(
            user.id,
            'New Device Login',
            `We detected a login from a new device (${ipAddress}).`,
            'security'
        );
    }

    // Check if MFA is enabled
    if (user.mfa_enabled) {
        logAuthEvent('login_mfa_required', user.id, true, { email: user.email, ip: ipAddress });
        return {
            mfa_required: true,
            temp_token: user.id
        };
    }

    // Generate tokens for current session
    const tokens = await generateTokenPair(user, ipAddress, userAgent);

    // Log successful complete login
    await AuditLog.create({
        user_id: user.id,
        event_type: 'login_success',
        event_description: `User completed OTP login from ${isNewDevice ? 'NEW DEVICE' : 'KNOWN DEVICE'}`,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'success'
    });

    logAuthEvent('login_complete', user.id, true, { email: user.email, ip: ipAddress });

    return {
        user: user.toJSON(),
        ...tokens
    };
}

/**
 * Verify MFA Login
 */

export async function verifyMfaLogin(tempToken, mfaToken, ipAddress, userAgent) {
    const user = await User.findByPk(tempToken);

    if (!user || !user.mfa_enabled) {
        throw new AppError('Invalid MFA session', 400);
    }

    let verified = false;

    // First try standard TOTP
    verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: mfaToken,
        window: 1
    });

    // If TOTP fails, try backup codes
    if (!verified && user.mfa_backup_codes) {
        let codes;
        try {
            codes = JSON.parse(user.mfa_backup_codes);
        } catch (e) { codes = []; }

        const codeIndex = codes.indexOf(mfaToken);
        if (codeIndex > -1) {
            verified = true;
            // Remove the used backup code
            codes.splice(codeIndex, 1);
            user.mfa_backup_codes = JSON.stringify(codes);
            await user.save();
        }
    }

    if (!verified) {
        logSecurityEvent('mfa_login_failed', { userId: user.id, ip: ipAddress });
        throw new AppError('Invalid MFA token or Backup Code', 401);
    }

    // Generate real tokens
    const tokens = await generateTokenPair(user, ipAddress, userAgent);

    // Device fingerprinting — detect new devices
    const deviceCheck = await checkAndRegisterDevice(KnownDevice, user.id, userAgent, ipAddress);

    await AuditLog.create({
        user_id: user.id,
        event_type: 'login_success',
        event_description: `User logged in successfully with MFA${deviceCheck.isNew ? ' [NEW DEVICE]' : ''}`,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'success',
        metadata: { newDevice: deviceCheck.isNew, deviceName: deviceCheck.device?.device_name }
    });

    logAuthEvent('login', user.id, true, { email: user.email, ip: ipAddress, mfa: true, newDevice: deviceCheck.isNew });

    // Check for concurrent active sessions
    const activeSessions = await getActiveSessions(user.id);
    if (activeSessions.length > 0) {
        await notificationService.createNotification(
            user.id,
            'New Login Alert',
            `A new login was detected from ${deviceCheck.device?.device_name || 'a new device'}. If this wasn't you, secure your account.`,
            'security'
        );
    }

    return {
        user: user.toJSON(),
        ...tokens,
        new_device: deviceCheck.isNew,
        device_name: deviceCheck.device?.device_name
    };
}

/**
 * Setup MFA for a user
 */
export async function setupMfa(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.mfa_enabled) throw new AppError('MFA is already enabled', 400);

    const secret = speakeasy.generateSecret({
        name: `SecureFileStorage:${user.email}`,
        issuer: 'SecureFileStorage'
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () => Math.random().toString(36).substring(2, 10).toUpperCase());

    // Save secret and backup codes temporarily (not enabled yet)
    user.mfa_secret = secret.base32;
    user.mfa_backup_codes = JSON.stringify(backupCodes);
    await user.save();

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes
    };
}

/**
 * Verify MFA token to finalize setup
 */
export async function verifyMfaSetup(userId, token) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.mfa_enabled) throw new AppError('MFA is already enabled', 400);

    const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token,
        window: 1
    });

    if (!verified) {
        throw new AppError('Invalid MFA token', 400);
    }

    user.mfa_enabled = true;
    await user.save();

    await AuditLog.create({
        user_id: user.id,
        event_type: 'mfa_enabled',
        event_description: 'User successfully enabled MFA',
        ip_address: 'System', // IP isn't easily available here without passing it down
        user_agent: 'System',
        status: 'success'
    });

    logSecurityEvent('mfa_setup_complete', { userId: user.id });

    return true;
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken, ipAddress, userAgent) {
    // Verify token signature
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        throw new AppError('Invalid refresh token', 401);
    }

    // Validate token in database
    const tokenRecord = await validateRefreshToken(refreshToken);

    if (!tokenRecord) {
        logSecurityEvent('invalid_refresh_token_used', {
            userId: decoded.userId,
            ip: ipAddress
        });

        throw new AppError('Invalid or expired refresh token', 401);
    }

    // Get user
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
        throw new AppError('User not found or inactive', 401);
    }

    // Generate new token pair
    const tokens = await generateTokenPair(user, ipAddress, userAgent);

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    // Log token refresh
    await AuditLog.create({
        user_id: user.id,
        event_type: 'token_refreshed',
        event_description: 'Access token refreshed',
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'success'
    });

    return tokens;
}

/**
 * Logout user
 */
export async function logoutUser(userId, refreshToken, ipAddress, userAgent) {
    // Revoke refresh token
    if (refreshToken) {
        await revokeRefreshToken(refreshToken);
    }

    // Log logout
    await AuditLog.create({
        user_id: userId,
        event_type: 'logout',
        event_description: 'User logged out',
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'success'
    });

    logAuthEvent('logout', userId, true, { ip: ipAddress });
}

/**
 * Logout from all devices
 */
export async function logoutAllDevices(userId, ipAddress, userAgent) {
    // Revoke all refresh tokens
    await revokeAllUserTokens(userId);

    // Log logout
    await AuditLog.create({
        user_id: userId,
        event_type: 'logout',
        event_description: 'User logged out from all devices',
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'success'
    });

    logAuthEvent('logout_all', userId, true, { ip: ipAddress });
}

/**
 * Get active sessions for a user
 */
export async function getActiveSessions(userId) {
    const { default: RefreshToken } = await import('../models/RefreshToken.js');
    const { Op } = await import('sequelize');

    const tokens = await RefreshToken.findAll({
        where: {
            user_id: userId,
            is_revoked: false,
            expires_at: { [Op.gt]: new Date() }
        },
        attributes: ['id', 'ip_address', 'user_agent', 'created_at', 'expires_at'],
        order: [['created_at', 'DESC']]
    });

    return tokens.map(t => ({
        id: t.id,
        ip_address: t.ip_address || 'Unknown',
        user_agent: t.user_agent || 'Unknown',
        created_at: t.created_at,
        expires_at: t.expires_at
    }));
}

/**
 * Revoke a specific session by its refresh token ID
 */
export async function revokeSessionById(userId, sessionId, ipAddress, userAgent) {
    const { default: RefreshToken } = await import('../models/RefreshToken.js');

    const token = await RefreshToken.findOne({
        where: { id: sessionId, user_id: userId, is_revoked: false }
    });

    if (!token) {
        throw new AppError('Session not found or already revoked', 404);
    }

    await token.revoke();

    await AuditLog.create({
        user_id: userId,
        event_type: 'logout',
        event_description: `Session revoked (ID: ${sessionId.substring(0, 8)}...)`,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'success'
    });

    logAuthEvent('session_revoked', userId, true, { sessionId, ip: ipAddress });
}

/**
 * Get paginated audit logs for a user
 */
export async function getUserAuditLogs(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { count, rows } = await AuditLog.findAndCountAll({
        where: { user_id: userId },
        attributes: ['id', 'event_type', 'event_description', 'ip_address', 'user_agent', 'status', 'created_at'],
        order: [['created_at', 'DESC']],
        limit,
        offset
    });

    return {
        logs: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        }
    };
}

/**
 * Request Account Unlock Magic Link
 */
export async function requestUnlockMagicLink(email, ipAddress) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
        // Silently succeed to prevent email enumeration
        return { success: true, message: 'If the email exists, a magic link has been sent.' };
    }

    if (!user.is_locked && !user.is_restricted) {
        throw new AppError('Account is not locked', 400);
    }

    const tokenBytes = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenBytes).digest('hex');

    await ActionToken.create({
        user_id: user.id,
        token: tokenHash,
        action_type: 'unlock_account',
        expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
    });

    logSecurityEvent('magic_link_requested', { userId: user.id, ip: ipAddress });

    // In a real app, send email here. E.g. sendEmail(user.email, `/unlock?token=${tokenBytes}`);
    // Returning the plain token bytes ONLY FOR TESTING since we don't have an email provider configured
    return { 
        success: true, 
        message: 'Magic link generated successfully',
        test_magic_link: `/api/v1/auth/unlock/verify?token=${tokenBytes}`
    };
}

/**
 * Verify Magic Link and Grant Restricted Access
 */
export async function verifyUnlockMagicLink(token, ipAddress, userAgent) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const actionToken = await ActionToken.findOne({
        where: {
            token: tokenHash,
            action_type: 'unlock_account',
            is_used: false
        },
        include: [{ model: User }]
    });

    if (!actionToken || new Date() > actionToken.expires_at) {
        throw new AppError('Invalid or expired magic link', 400);
    }

    const user = actionToken.user;

    // Mark token as used
    actionToken.is_used = true;
    await actionToken.save();

    // Transition from LOCKED to RESTRICTED
    user.is_locked = false;
    user.failed_login_attempts = 0;
    user.is_restricted = true;
    await user.save();

    logSecurityEvent('account_restricted_mode_entered', { userId: user.id, ip: ipAddress });

    const tokens = await generateTokenPair(user, ipAddress, userAgent);

    return {
        user: user.toJSON(),
        ...tokens,
        is_restricted: true
    };
}

/**
 * Final Unlock Step: Reset Credentials
 * Consumes the reset token, changes password, and removes restricted state
 */
export async function resetCredentials(userId, resetToken, newPassword, ipAddress, userAgent) {
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const actionToken = await ActionToken.findOne({
        where: {
            user_id: userId,
            token: tokenHash,
            action_type: 'reset_credentials',
            is_used: false
        },
        include: [{ model: User }]
    });

    if (!actionToken || new Date() > actionToken.expires_at) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    const user = actionToken.user;

    // Mark token as used
    actionToken.is_used = true;
    await actionToken.save();

    // Reset password (beforeUpdate hook will hash it)
    user.password_hash = newPassword;
    
    // Remove restricted access
    user.is_restricted = false;
    await user.save();

    logSecurityEvent('account_full_access_restored', { userId: user.id, ip: ipAddress });
    logAuthEvent('password_reset', user.id, true, { ip: ipAddress });

    // Revoke all existing sessions to force fresh login with new password everywhere
    await revokeAllUserTokens(user.id);

    // Generate fresh tokens for current session
    const tokens = await generateTokenPair(user, ipAddress, userAgent);

    return {
        user: user.toJSON(),
        ...tokens,
        is_restricted: false
    };
}

export default {
    registerUser,
    loginUser,
    verifyLoginOtp,
    verifyMfaLogin,
    setupMfa,
    verifyMfaSetup,
    refreshAccessToken,
    logoutUser,
    logoutAllDevices,
    getActiveSessions,
    revokeSessionById,
    getUserAuditLogs,
    requestUnlockMagicLink,
    verifyUnlockMagicLink,
    resetCredentials
};
