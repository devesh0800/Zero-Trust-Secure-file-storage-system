import shareService from '../services/shareService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { logSecurityEvent } from '../utils/logger.js';

/**
 * Share Controller
 * Handles HTTP requests for file sharing operations
 */

/**
 * @route   POST /api/v1/shares
 * @desc    Create a share link for a file
 * @access  Private
 */
export const createShare = asyncHandler(async (req, res) => {
    const { fileId, accessType, expiresAt, maxDownloads, password } = req.body;

    if (!fileId) {
        return res.status(400).json({ success: false, message: 'File ID is required' });
    }

    const share = await shareService.createShare(fileId, req.user.id, {
        accessType, expiresAt, maxDownloads, password
    });

    res.status(201).json({
        success: true,
        message: 'Share link created successfully',
        data: {
            share_token: share.share_token,
            share_id: share.id,
            expires_at: share.expires_at,
            access_type: share.access_type
        }
    });

    logSecurityEvent('share_link_created', {
        fileId,
        userId: req.user.id,
        shareToken: share.share_token,
        ip: req.ip
    });
});

/**
 * @route   GET /api/v1/shares/:token
 * @desc    Get information about a shared file (metadata only)
 * @access  Public
 */
export const getSharedInfo = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const share = await shareService.getSharedFileInfo(token);

    res.status(200).json({
        success: true,
        data: {
            shareable_filename: share.file.original_filename,
            file_size: share.file.file_size,
            mime_type: share.file.mime_type,
            shared_by: share.sharer.full_name || share.sharer.username,
            created_at: share.created_at,
            expires_at: share.expires_at,
            access_type: share.access_type,
            is_password_required: share.access_type === 'password_protected'
        }
    });

    logSecurityEvent('share_link_visited', {
        shareToken: token,
        ip: req.ip
    });
});

/**
 * @route   GET/POST /api/v1/shares/:token/download
 * @desc    Download the shared file
 * @access  Public (may require password)
 */
export const downloadShared = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.query; // Also allow GET style password for easy download links if needed, but safer to use body if using POST

    const { content, filename, mimetype } = await shareService.downloadSharedFile(
        token,
        password || req.body.password,
        req.ip,
        req.get('user-agent')
    );

    // Set headers for file download
    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="SHARED_${filename}"`);
    res.setHeader('Content-Length', content.length);

    // Send decrypted file
    res.send(content);

    logSecurityEvent('shared_file_downloaded', {
        shareToken: token,
        ip: req.ip
    });
});

export default {
    createShare,
    getSharedInfo,
    downloadShared
};
