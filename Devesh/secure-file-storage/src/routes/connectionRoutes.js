import { Router } from 'express';
import * as connectionController from '../controllers/connectionController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/request', connectionController.sendRequest);
router.get('/', connectionController.getConnections);
router.put('/:id/accept', connectionController.acceptRequest);
router.put('/:id/reject', connectionController.rejectRequest);
router.put('/:id/verify', connectionController.verifyConnection);
router.get('/:id/safety-number', connectionController.getSafetyNumber);
router.delete('/:id', connectionController.revokeConnection);

export default router;
