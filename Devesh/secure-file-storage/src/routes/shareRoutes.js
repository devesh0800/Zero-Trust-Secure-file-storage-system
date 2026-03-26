import express from 'express';
import { createShare, getSharedInfo, downloadShared } from '../controllers/shareController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * Share Routes
 * PUBLIC ACCESS (marked explicit where needed)
 */

// Private: Create share
router.post('/', authenticate, createShare);

// Public: Get info about share
router.get('/:token', getSharedInfo);

// Public: Download share
router.get('/:token/download', downloadShared);
router.post('/:token/download', downloadShared); // POST for password entry

export default router;
