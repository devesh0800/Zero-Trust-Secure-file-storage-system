import express from 'express';
import { getProfile, updateProfile, updateEmail, updatePhone } from '../controllers/profileController.js';
import { authenticate } from '../middlewares/auth.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();
router.use(authenticate);

/**
 * @route   GET /api/v1/profile
 * @desc    Get user's profile
 * @access  Private
 */
router.get('/', getProfile);

/**
 * @route   PUT /api/v1/profile
 * @desc    Update basic profile info (name, dob, gender, photo)
 * @access  Private
 */
router.put('/', apiLimiter, updateProfile);

/**
 * @route   PUT /api/v1/profile/email
 * @desc    Securely update email (requires OTP)
 * @access  Private
 */
router.put('/email', apiLimiter, updateEmail);

/**
 * @route   PUT /api/v1/profile/phone
 * @desc    Securely update phone (requires OTP)
 * @access  Private
 */
router.put('/phone', apiLimiter, updatePhone);

export default router;
