import { SharedFile, File, User, Connection } from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import crypto from 'crypto';
import { Op } from 'sequelize';

/**
 * Advanced Share Service (P2PE)
 * Handles encrypted peer-to-peer file sharing with granular permissions.
 */

/**
 * Create an advanced P2PE share.
 * Sender wraps the AES file key with receiver's public key.
 */
export async function createAdvancedShare(senderId, data) {
    const { fileId, receiverId, encryptedAesKey, permissionMode, expiresAt } = data;

    // Verify file ownership
    const file = await File.findOne({ where: { id: fileId, user_id: senderId } });
    if (!file) throw new AppError('File not found or you do not own it.', 404);

    // Verify connection is active
    const connection = await Connection.findOne({
        where: {
            status: 'active',
            [Op.or]: [
                { sender_id: senderId, receiver_id: receiverId },
                { sender_id: receiverId, receiver_id: senderId }
            ]
        }
    });
    if (!connection) throw new AppError('You must have an active connection with this user.', 403);

    // Generate unique share token
    const shareToken = crypto.randomBytes(32).toString('hex');

    const share = await SharedFile.create({
        file_id: fileId,
        shared_by: senderId,
        receiver_id: receiverId,
        share_token: shareToken,
        encrypted_aes_key: encryptedAesKey,
        access_type: 'p2pe',
        permission_mode: permissionMode || 'read',
        status: 'pending',
        expires_at: expiresAt || null
    });

    return share;
}

/**
 * Accept a pending share (receiver).
 */
export async function acceptShare(shareId, userId) {
    const share = await SharedFile.findByPk(shareId);
    if (!share) throw new AppError('Share not found.', 404);
    if (share.receiver_id !== userId) throw new AppError('Unauthorized.', 403);
    if (share.status !== 'pending') throw new AppError(`Cannot accept a ${share.status} share.`, 400);

    share.status = 'accepted';
    await share.save();
    return share;
}

/**
 * Reject a pending share (receiver).
 */
export async function rejectShare(shareId, userId) {
    const share = await SharedFile.findByPk(shareId);
    if (!share) throw new AppError('Share not found.', 404);
    if (share.receiver_id !== userId) throw new AppError('Unauthorized.', 403);
    if (share.status !== 'pending') throw new AppError(`Cannot reject a ${share.status} share.`, 400);

    await share.destroy();
    return { message: 'Share rejected and removed.' };
}

/**
 * Revoke a share (sender).
 */
export async function revokeShare(shareId, userId) {
    const share = await SharedFile.findByPk(shareId);
    if (!share) throw new AppError('Share not found.', 404);
    if (share.shared_by !== userId) throw new AppError('Only the sender can revoke.', 403);

    share.status = 'revoked';
    share.is_active = false;
    await share.save();
    return share;
}

/**
 * Track file view (called when receiver opens the file).
 */
export async function trackView(shareId, userId) {
    const share = await SharedFile.findByPk(shareId, {
        include: [
            { model: File, as: 'file', attributes: ['id', 'original_filename', 'file_extension', 'file_size', 'mime_type'] },
            { model: User, as: 'sharer', attributes: ['id', 'username', 'full_name'] }
        ]
    });
    if (!share) throw new AppError('Share not found.', 404);
    if (share.receiver_id !== userId) throw new AppError('Unauthorized.', 403);
    if (share.status !== 'accepted') throw new AppError('Share is not active.', 403);

    // Check expiry
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
        share.status = 'expired';
        share.is_active = false;
        await share.save();
        throw new AppError('This share has expired.', 410);
    }

    // View Once: auto-revoke after initial viewing session
    if (share.permission_mode === 'view_once' && share.is_viewed) {
        const firstViewAt = new Date(share.last_access_at).getTime();
        const now = new Date().getTime();
        // Allow a 30-second window for the initial load/refreshes
        // After 30s, any new request to trackView will revoke it permanently
        if (now - firstViewAt > 30000) {
            share.status = 'revoked';
            share.is_active = false;
            await share.save();
            throw new AppError('This was a view-once share. Access has been revoked.', 410);
        }
    }

    share.is_viewed = true;
    share.view_count += 1;
    share.last_access_at = new Date();
    await share.save();

    return share;
}

/**
 * Track file download.
 */
export async function trackDownload(shareId, userId) {
    const share = await SharedFile.findByPk(shareId);
    if (!share) throw new AppError('Share not found.', 404);
    if (share.receiver_id !== userId) throw new AppError('Unauthorized.', 403);

    // No Download mode
    if (share.permission_mode === 'no_download') {
        throw new AppError('Download is disabled for this share.', 403);
    }

    share.is_downloaded = true;
    share.download_count += 1;
    share.last_access_at = new Date();
    await share.save();

    return share;
}

/**
 * Get all shares sent by a user (Sender Dashboard).
 */
export async function getSentShares(userId) {
    const shares = await SharedFile.findAll({
        where: { shared_by: userId, access_type: 'p2pe' },
        include: [
            { model: File, as: 'file', attributes: ['id', 'original_filename', 'file_extension', 'file_size'] },
            { model: User, as: 'receiver', attributes: ['id', 'username', 'full_name', 'unique_share_id'] }
        ],
        order: [['created_at', 'DESC']]
    });
    return shares;
}

/**
 * Get all shares received by a user (Receiver Inbox).
 */
export async function getReceivedShares(userId) {
    const shares = await SharedFile.findAll({
        where: { receiver_id: userId, access_type: 'p2pe' },
        include: [
            { model: File, as: 'file', attributes: ['id', 'original_filename', 'file_extension', 'file_size'] },
            { model: User, as: 'sharer', attributes: ['id', 'username', 'full_name', 'unique_share_id'] }
        ],
        order: [['created_at', 'DESC']]
    });
    return shares;
}

/**
 * Revoke ALL shares for a specific file (Master Kill Switch).
 * Sets is_active = false and status = 'revoked' for every share associated with this file.
 */
export async function revokeAllFileShares(fileId, userId) {
    // Verify file ownership
    const file = await File.findOne({ where: { id: fileId, user_id: userId } });
    if (!file) throw new AppError('File not found or you do not own it.', 404);

    const result = await SharedFile.update(
        { is_active: false, status: 'revoked' },
        { where: { file_id: fileId, shared_by: userId } }
    );

    return { message: 'All file shares have been revoked successfully.', affectedCount: result[0] };
}

export default {
    createAdvancedShare,
    acceptShare,
    rejectShare,
    revokeShare,
    trackView,
    trackDownload,
    getSentShares,
    getReceivedShares,
    revokeAllFileShares
};
