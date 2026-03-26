import express from 'express';
import authRoutes from './authRoutes.js';
import fileRoutes from './fileRoutes.js';
import adminRoutes from './adminRoutes.js';
import mfaRoutes from './mfaRoutes.js';
import otpRoutes from './otpRoutes.js';
import profileRoutes from './profileRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import shareRoutes from './shareRoutes.js';
import connectionRoutes from './connectionRoutes.js';
import advancedShareRoutes from './advancedShareRoutes.js';

const router = express.Router();

/**
 * API Routes
 * Version 1
 */

router.use('/auth', authRoutes);
router.use('/files', fileRoutes);
router.use('/admin', adminRoutes);
router.use('/mfa', mfaRoutes);
router.use('/otp', otpRoutes);
router.use('/profile', profileRoutes);
router.use('/notifications', notificationRoutes);
router.use('/shares', shareRoutes);
router.use('/connections', connectionRoutes);
router.use('/advanced-shares', advancedShareRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

export default router;
