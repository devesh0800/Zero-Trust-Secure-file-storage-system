import { Router } from 'express';
import * as advancedShareController from '../controllers/advancedShareController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();
router.use(authenticate);

router.post('/', advancedShareController.createShare);
router.get('/sent', advancedShareController.getSentShares);
router.get('/received', advancedShareController.getReceivedShares);
router.put('/:id/accept', advancedShareController.acceptShare);
router.put('/:id/reject', advancedShareController.rejectShare);
router.put('/:id/revoke', advancedShareController.revokeShare);
router.put('/:id/track-view', advancedShareController.trackView);
router.put('/:id/track-download', advancedShareController.trackDownload);

export default router;
