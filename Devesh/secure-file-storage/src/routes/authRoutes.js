import express from 'express';
import authController from '../controllers/authController.js';
import captchaController from '../controllers/captchaController.js';
import aiUnlockRoutes from './aiUnlockRoutes.js';
import { authenticate } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { registerValidation, loginValidation, validate } from '../utils/validators.js';

const router = express.Router();

/**
 * Authentication Routes
 */

// Public routes
router.get('/captcha', captchaController.generateCaptcha);
router.post(
    '/register',
    authLimiter,
    registerValidation,
    validate,
    authController.register
);

router.post(
    '/login',
    authLimiter,
    loginValidation,
    validate,
    authController.login
);

// OTP verification route
router.post('/verify-login-otp', authLimiter, authController.verifyLoginOtp);

// Legacy MFA Token Routes
router.post('/verify-mfa', authLimiter, authController.verifyMfa);

router.post(
    '/refresh',
    authController.refresh
);

// Unlock Flow Routes
router.post(
    '/unlock/request',
    authLimiter,
    authController.requestUnlock
);

router.post(
    '/unlock/verify',
    authLimiter,
    authController.verifyUnlock
);

router.use('/unlock', aiUnlockRoutes);

// Protected routes
router.post(
    '/logout',
    authenticate,
    authController.logout
);

router.post(
    '/logout-all',
    authenticate,
    authController.logoutAll
);

router.get(
    '/me',
    authenticate,
    authController.getCurrentUser
);

router.get(
    '/sessions',
    authenticate,
    authController.getSessions
);

router.delete(
    '/sessions/:sessionId',
    authenticate,
    authController.revokeSession
);

router.get(
    '/audit-logs',
    authenticate,
    authController.getAuditLogs
);

router.post(
    '/mfa/setup',
    authenticate,
    authController.setupMfa
);

router.post(
    '/mfa/verify-setup',
    authenticate,
    authController.verifyMfaSetup
);

export default router;
