import express from 'express';
import { sendRegistrationOtp, sendUpdateOtp } from '../controllers/otpController.js';
import { authenticate } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/v1/otp/send-registration-otp
 * @desc    Send an OTP to a new email address for registration
 * @access  Public
 */
router.post('/send-registration-otp', authLimiter, sendRegistrationOtp);

/**
 * @route   POST /api/v1/otp/send-update-otp
 * @desc    Send an OTP to current email or phone before updating it
 * @access  Private
 */
router.post('/send-update-otp', authenticate, authLimiter, sendUpdateOtp);

export default router;
