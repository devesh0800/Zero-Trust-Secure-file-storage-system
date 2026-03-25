import fileService from '../services/fileService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { generateSignedUrl, verifySignedUrl } from '../utils/signedUrl.js';
import { logSecurityEvent } from '../utils/logger.js';

/**
 * File Controller
 * Handles HTTP requests for file operations
 */

/**
 * @route   POST /api/v1/files/upload
 * @desc    Upload and encrypt a file
 * @access  Private
 */
export const uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const file = await fileService.uploadFile(
        req.file,
        req.user.id,
        req.ip,
        req.get('user-agent')
    );

    res.status(201).json({
        success: true,
        message: 'File uploaded and encrypted successfully',
        data: {
            file: {
                id: file.id,
                original_filename: file.original_filename,
                file_size: file.file_size,
                mime_type: file.mime_type,
                created_at: file.created_at
            }
        }
    });
});

/**
 * @route   GET /api/v1/files/:id/download
 * @desc    Download and decrypt a file (supports signed token access)
 * @access  Private (or via signed token)
 */
export const downloadFile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { token } = req.query;

    let userId;

    // If a signed token is provided, verify it instead of requiring auth
    if (token) {
        const verification = verifySignedUrl(token);
        if (!verification.valid) {
            logSecurityEvent('signed_url_rejected', {
                fileId: id,
                error: verification.error,
                ip: req.ip
            });
            return res.status(403).json({
                success: false,
                message: `Download link invalid: ${verification.error}`
            });
        }
        if (verification.fileId !== id) {
            return res.status(403).json({
                success: false,
                message: 'Token does not match this file'
            });
        }
        userId = verification.userId;
    } else {
        // Standard authenticated download
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        userId = req.user.id;
    }

    const { content, filename, mimetype } = await fileService.downloadFile(
        id,
        userId,
        req.ip,
        req.get('user-agent')
    );

    // Set headers for file download
    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', content.length);

    // Send decrypted file
    res.send(content);
});

/**
 * @route   GET /api/v1/files/:id/signed-url
 * @desc    Generate a temporary signed download URL (expires in 5 minutes)
 * @access  Private
 */
export const getSignedDownloadUrl = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const expiryMinutes = parseInt(req.query.expiry) || 5;

    // Verify the user owns the file
    await fileService.getFileMetadata(id, req.user.id);

    // Generate signed URL
    const { token, expiresAt, downloadUrl } = generateSignedUrl(
        id,
        req.user.id,
        Math.min(expiryMinutes, 30) // Cap at 30 minutes max
    );

    res.status(200).json({
        success: true,
        message: 'Signed download URL generated',
        data: {
            downloadUrl,
            token,
            expiresAt,
            expiryMinutes: Math.min(expiryMinutes, 30)
        }
    });
});

/**
 * @route   GET /api/v1/files
 * @desc    Get user's files
 * @access  Private
 */
export const getFiles = asyncHandler(async (req, res) => {
    const { page, limit, sortBy, order } = req.query;

    const result = await fileService.getUserFiles(req.user.id, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sortBy: sortBy || 'created_at',
        order: order || 'DESC'
    });

    res.status(200).json({
        success: true,
        data: result
    });
});

/**
 * @route   GET /api/v1/files/:id
 * @desc    Get file metadata
 * @access  Private
 */
export const getFileMetadata = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const file = await fileService.getFileMetadata(id, req.user.id);

    res.status(200).json({
        success: true,
        data: { file }
    });
});

/**
 * @route   DELETE /api/v1/files/:id
 * @desc    Delete a file (soft delete)
 * @access  Private
 */
export const deleteFile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await fileService.deleteFile(
        id,
        req.user.id,
        req.ip,
        req.get('user-agent')
    );

    res.status(200).json({
        success: true,
        message: 'File deleted successfully'
    });
});

export default {
    uploadFile,
    downloadFile,
    getFiles,
    getFileMetadata,
    deleteFile,
    getSignedDownloadUrl
};
