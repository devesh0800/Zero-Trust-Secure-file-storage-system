import { User, File, AuditLog } from '../models/index.js';
import otpService from '../services/otpService.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import speakeasy from 'speakeasy';
import { logSecurityEvent } from '../utils/logger.js';

/**
 * Get the current user's profile
 */
export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.status(200).json({
        success: true,
        data: {
            user: user.toJSON()
        }
    });
});

/**
 * Update basic profile details (no high-security items like email/password)
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const { full_name, gender, dob, profile_pic, phone_number } = req.body;
    const user = await User.findByPk(req.user.id);

    if (full_name !== undefined) user.full_name = full_name;
    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined) user.dob = dob;
    if (profile_pic !== undefined) user.profile_pic = profile_pic;
    if (phone_number !== undefined) user.phone_number = phone_number;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: user.toJSON()
        }
    });
});

/**
 * Securely update email using OTP
 */
export const updateEmail = asyncHandler(async (req, res) => {
    const { new_email, otp_code } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!new_email || !otp_code) {
        throw new AppError('New email and old email OTP code are required', 400);
    }

    // Verify OTP sent to OLD email
    await otpService.verifyOtp(user.email, 'update_email', otp_code);

    user.email = new_email;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Email updated successfully',
        data: { user: user.toJSON() }
    });
});

/**
 * Securely update phone number using OTP
 */
export const updatePhone = asyncHandler(async (req, res) => {
    const { new_phone, otp_code } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!new_phone) {
        throw new AppError('New phone number is required', 400);
    }

    // If user already has a phone, they must verify it first
    if (user.phone_number) {
        if (!otp_code) {
             throw new AppError('OTP from current phone number is required', 400);
        }
        await otpService.verifyOtp(user.phone_number, 'update_phone', otp_code);
    }

    user.phone_number = new_phone;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Phone number updated successfully',
        data: { user: user.toJSON() }
    });
});

/**
 * Change user password
 */
export const changePassword = asyncHandler(async (req, res) => {
    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!current_password || !new_password) {
        throw new AppError('Current and new password are required', 400);
    }

    // Verify current password
    const isMatch = await user.verifyPassword(current_password);
    if (!isMatch) {
        throw new AppError('Incorrect current password', 401);
    }

    // Update password
    user.password_hash = new_password;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password updated successfully'
    });
});

/**
 * Get Storage Stats
 */
export const getStorageStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // Get all files
    const files = await File.findAll({
        where: { user_id: userId, is_deleted: false },
        attributes: ['id', 'file_size', 'mime_type', 'original_filename', 'file_extension', 'created_at']
    });

    const totalFiles = files.length;
    let totalSize = 0;
    const breakdown = { images: 0, docs: 0, others: 0 };

    files.forEach(file => {
        totalSize += file.file_size;
        const mime = (file.mime_type || '').toLowerCase();
        const ext = (file.file_extension || '').toLowerCase();
        
        if (mime.startsWith('image/')) {
            breakdown.images += file.file_size;
        } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext) || mime.includes('word') || mime.includes('pdf')) {
            breakdown.docs += file.file_size;
        } else {
            breakdown.others += file.file_size;
        }
    });

    // Recent 5 files
    const recentFiles = files
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(f => ({
            id: f.id,
            name: f.original_filename,
            type: f.file_extension || 'file',
            size: f.file_size,
            date: f.created_at
        }));

    const limit = 5 * 1024 * 1024 * 1024; // 5GB limit
    
    res.status(200).json({
        success: true,
        data: {
            used_size: totalSize,
            total_files: totalFiles,
            limit: limit,
            free_size: Math.max(0, limit - totalSize),
            percentage: ((totalSize / limit) * 100).toFixed(2),
            breakdown,
            recentFiles
        }
    });
});

/**
 * Get Activity Log
 */
export const getActivityLog = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Login history (last 10)
    const loginHistory = await AuditLog.findAll({
        where: { 
            user_id: userId, 
            event_type: ['login_success', 'login_failed'] 
        },
        order: [['created_at', 'DESC']],
        limit: 10
    });

    // File activity (last 15)
    const fileActivity = await AuditLog.findAll({
        where: { 
            user_id: userId, 
            event_type: ['file_uploaded', 'file_downloaded', 'file_deleted'] 
        },
        order: [['created_at', 'DESC']],
        limit: 15
    });

    res.status(200).json({
        success: true,
        data: {
            loginHistory,
            fileActivity
        }
    });
});

/**
 * Get Security Info
 */
export const getSecurityInfo = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);
    
    res.status(200).json({
        success: true,
        data: {
            mfa_enabled: user.mfa_enabled,
            email_otp_enabled: true, // Assuming always on for this system
            last_password_change: user.updated_at // mock if not tracked specifically
        }
    });
});

/**
 * Request OTP for PIN Update
 */
export const requestPinUpdateOtp = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);
    const result = await otpService.sendOtp(user.email, 'update_pin');
    res.status(200).json(result);
});

/**
 * Update Security PIN
 * Requires MFA token if enabled, otherwise requires Email OTP
 */
export const updateSecurityPin = asyncHandler(async (req, res) => {
    const { new_pin, otp_code, mfa_token } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!new_pin || new_pin.length !== 6) {
        throw new AppError('New 6-digit PIN is required', 400);
    }

    // Verify identity: MFA or OTP
    if (user.mfa_enabled) {
        if (!mfa_token) {
            throw new AppError('MFA token is required to update PIN', 400);
        }
        const verified = speakeasy.totp.verify({
            secret: user.mfa_secret,
            encoding: 'base32',
            token: mfa_token,
            window: 1
        });
        if (!verified) {
            logSecurityEvent('pin_update_mfa_failed', { userId: user.id });
            throw new AppError('Invalid MFA token', 401);
        }
    } else {
        if (!otp_code) {
            throw new AppError('Email OTP is required to update PIN', 400);
        }
        await otpService.verifyOtp(user.email, 'update_pin', otp_code);
    }

    // Update PIN (hashed by model hook)
    user.security_pin_hash = new_pin;
    await user.save();

    logSecurityEvent('security_pin_updated', { userId: user.id });

    res.status(200).json({
        success: true,
        message: 'Security PIN updated successfully'
    });
});

export default {
    getProfile,
    updateProfile,
    updateEmail,
    updatePhone,
    changePassword,
    getStorageStats,
    getActivityLog,
    getSecurityInfo,
    requestPinUpdateOtp,
    updateSecurityPin
};
