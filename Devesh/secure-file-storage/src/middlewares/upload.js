import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/config.js';
import { isAllowedFileType } from '../utils/validators.js';
import { AppError } from './errorHandler.js';

/**
 * Multer configuration for file uploads
 * Files are stored temporarily before encryption
 */

/**
 * Storage configuration
 * Files are stored with UUID names to prevent conflicts
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.upload.uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}_temp`;
        cb(null, uniqueName);
    }
});

/**
 * File filter
 * Validates file type and prevents malicious uploads
 */
const fileFilter = (req, file, cb) => {
    // Check file type
    if (!isAllowedFileType(file.originalname)) {
        const allowedTypes = config.upload.allowedTypes.join(', ');
        return cb(
            new AppError(
                `File type not allowed. Allowed types: ${allowedTypes}`,
                400
            ),
            false
        );
    }

    // Additional MIME type validation
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'application/zip',
        'application/x-zip-compressed'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(
            new AppError('Invalid file MIME type', 400),
            false
        );
    }

    cb(null, true);
};

/**
 * Multer upload middleware
 */
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize,
        files: 1 // Only allow single file upload at a time
    }
});

/**
 * File upload error handler
 */
export function handleUploadError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size: ${config.upload.maxFileSize / 1024 / 1024}MB`
            });
        }

        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Upload one file at a time'
            });
        }

        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field'
            });
        }

        return res.status(400).json({
            success: false,
            message: 'File upload error'
        });
    }

    next(err);
}

export default {
    upload,
    handleUploadError
};
