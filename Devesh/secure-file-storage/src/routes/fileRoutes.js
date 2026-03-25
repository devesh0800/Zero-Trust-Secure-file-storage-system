import express from 'express';
import fileController from '../controllers/fileController.js';
import { authenticate, requireFullAccess } from '../middlewares/auth.js';
import { upload, handleUploadError } from '../middlewares/upload.js';
import { uploadLimiter, downloadLimiter } from '../middlewares/rateLimiter.js';
import { fileUploadValidation, uuidValidation, validate } from '../utils/validators.js';

const router = express.Router();

/**
 * File Routes
 * All routes require authentication
 */

// Upload file
router.post(
    '/upload',
    authenticate,
    requireFullAccess,
    uploadLimiter,
    upload.single('file'),
    handleUploadError,
    fileUploadValidation,
    validate,
    fileController.uploadFile
);

// Generate signed download URL (must be before /:id to avoid conflict)
router.get(
    '/:id/signed-url',
    authenticate,
    uuidValidation('id'),
    validate,
    fileController.getSignedDownloadUrl
);

// Download file (supports signed token OR authentication)
router.get(
    '/:id/download',
    (req, res, next) => {
        // If a signed token is present, skip authentication middleware
        if (req.query.token) {
            return next();
        }
        return authenticate(req, res, next);
    },
    downloadLimiter,
    uuidValidation('id'),
    validate,
    fileController.downloadFile
);

// Get all user files
router.get(
    '/',
    authenticate,
    fileController.getFiles
);

// Get file metadata
router.get(
    '/:id',
    authenticate,
    uuidValidation('id'),
    validate,
    fileController.getFileMetadata
);

// Delete file
router.delete(
    '/:id',
    authenticate,
    requireFullAccess,
    uuidValidation('id'),
    validate,
    fileController.deleteFile
);

export default router;
