import express from 'express';
import { getProfile, updateProfile, updateEmail, updatePhone, changePassword, getStorageStats, getActivityLog, getSecurityInfo } from '../controllers/profileController.js';
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
/**
 * @route   PUT /api/v1/profile/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', apiLimiter, changePassword);
router.get('/storage', apiLimiter, getStorageStats);
router.get('/activity', apiLimiter, getActivityLog);
router.get('/security', apiLimiter, getSecurityInfo);
router.post('/security-pin/request-otp', apiLimiter, requestPinUpdateOtp);
router.post('/security-pin/update', apiLimiter, updateSecurityPin);

export default router;
