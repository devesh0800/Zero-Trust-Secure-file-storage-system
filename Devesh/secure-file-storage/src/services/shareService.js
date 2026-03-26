import { SharedFile, File, User } from '../models/index.js';
import crypto from 'crypto';
import fileService from './fileService.js';
import { logSecurityEvent } from '../utils/logger.js';

/**
 * Share Service
 * Manages logic for sharing files
 */
class ShareService {
    /**
     * Create a new share link for a file
     */
    async createShare(fileId, userId, options = {}) {
        // 1. Verify file exists and user owns it
        const file = await File.findOne({
            where: { id: fileId, user_id: userId, is_deleted: false }
        });

        if (!file) {
            throw new Error('File not found or access denied');
        }

        // 2. Generate a unique token
        const shareToken = crypto.randomBytes(16).toString('hex');

        // 3. Create share record
        const share = await SharedFile.create({
            file_id: fileId,
            shared_by: userId,
            share_token: shareToken,
            access_type: options.accessType || 'public',
            expires_at: options.expiresAt || null,
            max_downloads: options.maxDownloads || -1,
            password_hash: options.password ? crypto.createHash('sha256').update(options.password).digest('hex') : null
        });

        return share;
    }

    /**
     * Get shared file info by token (no decryption, just metadata)
     */
    async getSharedFileInfo(token) {
        const share = await SharedFile.findOne({
            where: { share_token: token, is_active: true },
            include: [
                {
                    model: File,
                    as: 'file',
                    attributes: ['id', 'original_filename', 'file_size', 'mime_type', 'file_extension', 'created_at']
                },
                {
                    model: User,
                    as: 'sharer',
                    attributes: ['full_name', 'username']
                }
            ]
        });

        if (!share) {
            throw new Error('Share link invalid or expired');
        }

        // Check expiry
        if (share.expires_at && new Date() > share.expires_at) {
            share.is_active = false;
            await share.save();
            throw new Error('Share link has expired');
        }

        // Check max downloads
        if (share.max_downloads !== -1 && share.download_count >= share.max_downloads) {
            share.is_active = false;
            await share.save();
            throw new Error('Maximum download limit reached');
        }

        return share;
    }

    /**
     * Download a shared file
     */
    async downloadSharedFile(token, password = null, ip, userAgent) {
        const share = await this.getSharedFileInfo(token);

        // Check password if required
        if (share.access_type === 'password_protected') {
            if (!password) {
                throw new Error('Password required to access this file');
            }
            const inputHash = crypto.createHash('sha256').update(password).digest('hex');
            if (inputHash !== share.password_hash) {
                throw new Error('Invalid password');
            }
        }

        // Use existing fileService to get the decrypted content
        // We bypass the standard ownership check because this is a valid share
        const { content, filename, mimetype } = await fileService.downloadFile(
            share.file_id,
            share.shared_by, // Use the sharer's ID to bypass check
            ip,
            userAgent,
            true // Trigger flag for shared access if needed (for logging)
        );

        // Update share stats
        share.download_count += 1;
        if (share.max_downloads !== -1 && share.download_count >= share.max_downloads) {
            share.is_active = false;
        }
        await share.save();

        return { content, filename, mimetype };
    }
}

export default new ShareService();
