import express from 'express';
import mfaController from '../controllers/mfaController.js';
import { authenticate, requireFullAccess } from '../middlewares/auth.js';

const router = express.Router();

/**
 * MFA Routes (All require authentication with at least an access token)
 */

router.post(
    '/setup',
    authenticate,
    requireFullAccess,
    mfaController.setupMFA
);

router.post(
    '/enable',
    authenticate,
    requireFullAccess,
    mfaController.enableMFA
);

router.post(
    '/disable',
    authenticate,
    requireFullAccess,
    mfaController.disableMFA
);

export default router;
