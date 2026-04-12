import express from 'express';
import { getProfile, updateProfile, updateAvatar, updateEmail, updatePhone, changePassword, getStorageStats, getActivityLog, getSecurityInfo, requestPinUpdateOtp, updateSecurityPin, downloadLogArchive, deleteEverything, deleteAccount } from '../controllers/profileController.js';
import { authenticate } from '../middlewares/auth.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';
import multer from 'multer';
import path from 'path';

// Setup basic storage for avatars
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

const router = express.Router();
router.use(authenticate);

/**
 * @route   POST /api/v1/profile/avatar
 * @desc    Upload profile picture
 * @access  Private
 */
router.post('/avatar', upload.single('avatar'), updateAvatar);

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
router.post('/log-archive', apiLimiter, downloadLogArchive);
router.delete('/delete-everything', apiLimiter, deleteEverything);
router.delete('/delete-account', apiLimiter, deleteAccount);

export default router;
