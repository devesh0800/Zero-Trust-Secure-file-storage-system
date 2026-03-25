import { User } from '../models/index.js';
import otpService from '../services/otpService.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';

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
 * Update basic profile details (no high-security items like email/phone/password)
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const { full_name, username, gender, dob, profile_pic } = req.body;
    const user = await User.findByPk(req.user.id);

    if (full_name) user.full_name = full_name;
    if (username) user.username = username;
    if (gender) user.gender = gender;
    if (dob) user.dob = dob;
    if (profile_pic) user.profile_pic = profile_pic;

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

export default {
    getProfile,
    updateProfile,
    updateEmail,
    updatePhone
};
