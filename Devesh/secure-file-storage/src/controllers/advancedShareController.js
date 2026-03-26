import advancedShareService from '../services/advancedShareService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import notificationService from '../services/notificationService.js';

/**
 * Advanced Share Controller (P2PE)
 */

/** POST /api/v1/advanced-shares - Create P2PE share */
export const createShare = asyncHandler(async (req, res) => {
    const { fileId, receiverId, encryptedAesKey, permissionMode, expiresAt } = req.body;

    const share = await advancedShareService.createAdvancedShare(req.user.id, {
        fileId, receiverId, encryptedAesKey, permissionMode, expiresAt
    });

    // Notify receiver
    try {
        await notificationService.createNotification(
            receiverId,
            'file_shared',
            `${req.user.username} shared a file with you.`
        );
    } catch (e) { /* non-critical */ }

    res.status(201).json({ success: true, message: 'File shared securely.', data: share });
});

/** PUT /api/v1/advanced-shares/:id/accept */
export const acceptShare = asyncHandler(async (req, res) => {
    const share = await advancedShareService.acceptShare(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Share accepted.', data: share });
});

/** PUT /api/v1/advanced-shares/:id/reject */
export const rejectShare = asyncHandler(async (req, res) => {
    const result = await advancedShareService.rejectShare(req.params.id, req.user.id);
    res.status(200).json({ success: true, ...result });
});

/** PUT /api/v1/advanced-shares/:id/revoke */
export const revokeShare = asyncHandler(async (req, res) => {
    const share = await advancedShareService.revokeShare(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Share revoked.', data: share });
});

/** PUT /api/v1/advanced-shares/:id/track-view */
export const trackView = asyncHandler(async (req, res) => {
    const share = await advancedShareService.trackView(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: share });
});

/** PUT /api/v1/advanced-shares/:id/track-download */
export const trackDownload = asyncHandler(async (req, res) => {
    const share = await advancedShareService.trackDownload(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: share });
});

/** GET /api/v1/advanced-shares/sent */
export const getSentShares = asyncHandler(async (req, res) => {
    const shares = await advancedShareService.getSentShares(req.user.id);
    res.status(200).json({ success: true, data: shares });
});

/** GET /api/v1/advanced-shares/received */
export const getReceivedShares = asyncHandler(async (req, res) => {
    const shares = await advancedShareService.getReceivedShares(req.user.id);
    res.status(200).json({ success: true, data: shares });
});
