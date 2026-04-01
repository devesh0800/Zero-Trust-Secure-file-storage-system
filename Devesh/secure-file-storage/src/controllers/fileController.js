import fileService from '../services/fileService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { generateSignedUrl, verifySignedUrl } from '../utils/signedUrl.js';
import { logSecurityEvent } from '../utils/logger.js';
import { revokeAllFileShares as revokeShares } from '../services/advancedShareService.js';

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
        
        // Security PIN verification
        const securityPin = req.headers['x-security-pin'] || req.query.pin;
        const hasHash = !!req.user.security_pin_hash;
        
        console.log(`[DEBUG] PIN Strict Check - User: ${req.user.email}, HasHash: ${hasHash}, PinProvided: ${!!securityPin}`);
        
        // Strictly enforce PIN for all downloads in Zero-Trust model
        if (!hasHash) {
            return res.status(403).json({ 
                success: false, 
                message: 'Security PIN NOT set. For your security, please create a 6-digit Security PIN in your profile settings before downloading files.',
                needsPin: true
            });
        }

        if (!securityPin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Security PIN required for download',
                requiresPin: true
            });
        }

        const isPinValid = await req.user.verifySecurityPin(securityPin);
        if (!isPinValid) {
            logSecurityEvent('invalid_pin_download', {
                fileId: id,
                userId: req.user.id,
                ip: req.ip
            });
            return res.status(403).json({ success: false, message: 'Invalid Security PIN' });
        }
        
        userId = req.user.id;
    }

    const { content, filename, mimetype } = await fileService.downloadFile(
        id,
        userId,
        req.ip,
        req.get('user-agent')
    );

    // Sanitize filename to prevent header errors
    const safeFilename = filename.replace(/[^\x20-\x7E]/g, '');
    
    // Set headers for file download
    res.setHeader('Content-Type', mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
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

/**
 * @route   PUT /api/v1/files/:id/revoke-all
 * @desc    Revoke all shares for a file (public links + private shares)
 * @access  Private
 */
export const revokeAllShares = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const result = await revokeShares(id, req.user.id);
    
    logSecurityEvent('all_shares_revoked', {
        fileId: id,
        userId: req.user.id,
        affectedCount: result.affectedCount,
        ip: req.ip
    });

    res.status(200).json({
        success: true,
        message: 'All access points for this file have been terminated.',
        data: result
    });
});

export default {
    uploadFile,
    downloadFile,
    getFiles,
    getFileMetadata,
    deleteFile,
    getSignedDownloadUrl,
    revokeAllShares
};
