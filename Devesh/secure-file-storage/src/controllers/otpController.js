import otpService from '../services/otpService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { User } from '../models/index.js';

/**
 * Send OTP for Registration
 */
export const sendRegistrationOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const result = await otpService.sendOtp(email, 'registration');
    res.status(200).json(result);
});

/**
 * Send OTP for general profile updates
 */
export const sendUpdateOtp = asyncHandler(async (req, res) => {
    const { type } = req.body; // 'email' or 'phone'
    const user = req.user; // Authenticated user

    if (type === 'email') {
        const result = await otpService.sendOtp(user.email, 'update_email');
        return res.status(200).json(result);
    } else if (type === 'phone') {
        if (!user.phone_number) {
            return res.status(400).json({ success: false, message: 'No phone number linked to this account.' });
        }
        const result = await otpService.sendOtp(user.phone_number, 'update_phone');
        return res.status(200).json(result);
    } else {
        return res.status(400).json({ success: false, message: 'Invalid update type' });
    }
});

export default {
    sendRegistrationOtp,
    sendUpdateOtp
};
