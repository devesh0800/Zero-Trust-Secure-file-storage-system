import authService from '../services/authService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import config from '../config/config.js';
import captchaController from './captchaController.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
    const { email, password, username, captcha_id, captcha_text, otp_code, public_key, security_pin } = req.body;

    // OTP check required for registration
    if (!otp_code) {
        throw new AppError('OTP code is required for registration', 400);
    }

    // Verify Captcha
    if (process.env.NODE_ENV !== 'development' && !captchaController.verifyCaptcha(captcha_id, captcha_text)) {
        throw new AppError('Invalid or expired captcha', 400);
    }

    const result = await authService.registerUser(
        { email, password, username, public_key, security_pin },
        otp_code,
        req.ip,
        req.get('user-agent')
    );

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: config.cookie.maxAge
    });

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: result.user,
            accessToken: result.accessToken
        }
    });
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
    const { identifier, password, captcha_id, captcha_text } = req.body;

    // Verify Captcha
    if (process.env.NODE_ENV !== 'development' && !captchaController.verifyCaptcha(captcha_id, captcha_text)) {
        throw new AppError('Invalid or expired captcha', 400);
    }

    const result = await authService.loginUser(
        { identifier, password },
        req.ip,
        req.get('user-agent')
    );

    // If OTP or MFA is required, return immediately without setting cookies
    if (result.otp_required || result.mfa_required) {
        return res.status(200).json({
            success: true,
            message: result.mfa_required ? 'MFA verification required' : 'OTP verification required',
            data: result
        });
    }

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: config.cookie.maxAge
    });

    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: result.user,
            accessToken: result.accessToken
        }
    });
});

/**
 * @route   POST /api/v1/auth/verify-login-otp
 * @desc    Verify OTPs from multi-factor 2nd step login
 * @access  Public
 */
export const verifyLoginOtpEndpoint = asyncHandler(async (req, res) => {
    const { temp_token, email_otp, phone_otp, new_device } = req.body;

    if (!temp_token || !email_otp) {
        throw new AppError('Session token and Email OTP are required', 400);
    }

    const result = await authService.verifyLoginOtp(
        temp_token,
        email_otp,
        phone_otp,
        new_device,
        req.ip,
        req.get('user-agent')
    );

    // If MFA is required, return early and don't set session cookie yet
    if (result && result.mfa_required) {
        return res.status(200).json({
            success: true,
            message: 'MFA verification required',
            data: {
                mfa_required: true,
                temp_token: result.temp_token
            }
        });
    }

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: config.cookie.maxAge
    });

    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: result.user,
            accessToken: result.accessToken
        }
    });
});

/**
 * @route   POST /api/v1/auth/verify-mfa
 * @desc    Verify MFA token (or backup code) to complete login
 * @access  Public
 */
export const verifyMfa = asyncHandler(async (req, res) => {
    const { temp_token, mfa_token } = req.body;

    if (!temp_token || !mfa_token) {
        return res.status(400).json({
            success: false,
            message: 'Both temp_token and mfa_token are required'
        });
    }

    const result = await authService.verifyMfaLogin(
        temp_token,
        mfa_token,
        req.ip,
        req.get('user-agent')
    );

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: config.cookie.maxAge
    });

    res.status(200).json({
        success: true,
        message: 'Login successful with MFA',
        data: {
            user: result.user,
            accessToken: result.accessToken
        }
    });
});

/**
 * @route   POST /api/v1/auth/mfa/setup
 * @desc    Initialize MFA setup for the logged-in user
 * @access  Private
 */
export const setupMfa = asyncHandler(async (req, res) => {
    const result = await authService.setupMfa(req.user.id);

    res.status(200).json({
        success: true,
        message: 'MFA setup initialized',
        data: result
    });
});

/**
 * @route   POST /api/v1/auth/mfa/verify-setup
 * @desc    Verify the MFA token to finalize MFA setup
 * @access  Private
 */
export const verifyMfaSetup = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: 'MFA token is required'
        });
    }

    await authService.verifyMfaSetup(req.user.id, token);

    res.status(200).json({
        success: true,
        message: 'MFA has been successfully enabled'
    });
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
export const refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: 'Refresh token required'
        });
    }

    const tokens = await authService.refreshAccessToken(
        refreshToken,
        req.ip,
        req.get('user-agent')
    );

    // Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: config.cookie.maxAge
    });

    res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            accessToken: tokens.accessToken
        }
    });
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    await authService.logoutUser(
        req.user.id,
        refreshToken,
        req.ip,
        req.get('user-agent')
    );

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
});

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
export const logoutAll = asyncHandler(async (req, res) => {
    await authService.logoutAllDevices(
        req.user.id,
        req.ip,
        req.get('user-agent')
    );

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
        success: true,
        message: 'Logged out from all devices'
    });
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            user: req.user.toJSON()
        }
    });
});

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get all active sessions for the current user
 * @access  Private
 */
export const getSessions = asyncHandler(async (req, res) => {
    const sessions = await authService.getActiveSessions(req.user.id);

    res.status(200).json({
        success: true,
        data: { sessions }
    });
});

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
export const revokeSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    await authService.revokeSessionById(
        req.user.id,
        sessionId,
        req.ip,
        req.get('user-agent')
    );

    res.status(200).json({
        success: true,
        message: 'Session revoked successfully'
    });
});

/**
 * @route   GET /api/v1/auth/audit-logs
 * @desc    Get security audit logs for the current user
 * @access  Private
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await authService.getUserAuditLogs(req.user.id, page, limit);

    res.status(200).json({
        success: true,
        data: result
    });
});

export const requestUnlock = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const result = await authService.requestUnlockMagicLink(email, req.ip);

    res.status(200).json(result);
});

export const verifyUnlock = asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ success: false, message: 'Token is required' });
    }

    const result = await authService.verifyUnlockMagicLink(token, req.ip, req.get('user-agent'));

    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: config.cookie.maxAge
    });

    res.status(200).json({
        success: true,
        message: 'Account unlocked in RESTRICTED mode. Please complete AI verification to restore full access.',
        data: {
            user: result.user,
            accessToken: result.accessToken,
            is_restricted: result.is_restricted
        }
    });
});

/**
 * @route   POST /api/v1/auth/unlock/reset-credentials
 * @desc    Submit reset_token and new password to restore full access
 * @access  Private (Restricted Mode Only)
 */
export const resetCredentials = asyncHandler(async (req, res) => {
    const { reset_token, new_password } = req.body;

    if (!reset_token || !new_password) {
        return res.status(400).json({ success: false, message: 'reset_token and new_password are required' });
    }

    // Password strength is validated by middleware/model

    const result = await authService.resetCredentials(
        req.user.id,
        reset_token,
        new_password,
        req.ip,
        req.get('user-agent')
    );

    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: config.cookie.maxAge
    });

    res.status(200).json({
        success: true,
        message: 'Account successfully restored. You now have full access.',
        data: {
            user: result.user,
            accessToken: result.accessToken,
            is_restricted: result.is_restricted
        }
    });
});

export default {
    register,
    login,
    verifyLoginOtp: verifyLoginOtpEndpoint,
    verifyMfa,
    refresh,
    logout,
    logoutAll,
    getCurrentUser,
    getSessions,
    revokeSession,
    getAuditLogs,
    setupMfa,
    verifyMfaSetup,
    requestUnlock,
    verifyUnlock,
    resetCredentials
};
