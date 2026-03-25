import express from 'express';
import aiUnlockController from '../controllers/aiUnlockController.js';
import authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

/**
 * AI Unlock Routes (For Restricted Mode Users)
 * Base: /api/v1/auth/unlock
 */

// Generate the challenge
router.get(
    '/challenge',
    authenticate,
    authLimiter,
    aiUnlockController.getChallenge
);

// Submit answers and get reset_token
router.post(
    '/challenge/verify',
    authenticate,
    authLimiter,
    aiUnlockController.submitChallenge
);

// Consume reset token and restore access
router.post(
    '/reset-credentials',
    authenticate,
    authLimiter,
    authController.resetCredentials
);

export default router;
