import crypto from 'crypto';
import config from '../config/config.js';

/**
 * Secure Signed URL Utility
 * 
 * Generates temporary, HMAC-signed download tokens that expire after a given time.
 * This prevents permanent download links from being shared or reused.
 * 
 * SECURITY:
 * - HMAC-SHA256 signature ensures token can't be forged
 * - Embedded expiry prevents replay attacks
 * - User ID binding prevents token theft across accounts
 */

const SIGNING_SECRET = config.encryption.masterKey; // Reuse master key for HMAC

/**
 * Generate a signed download token
 * @param {string} fileId - UUID of the file
 * @param {string} userId - UUID of the requesting user
 * @param {number} expiryMinutes - How long the link is valid (default: 5 min)
 * @returns {Object} { token: string, expiresAt: Date, downloadUrl: string }
 */
export function generateSignedUrl(fileId, userId, expiryMinutes = 5) {
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);

    // Payload: fileId|userId|expiresAt
    const payload = `${fileId}|${userId}|${expiresAt}`;

    // HMAC-SHA256 signature
    const signature = crypto
        .createHmac('sha256', SIGNING_SECRET)
        .update(payload)
        .digest('hex');

    // Token = base64(payload) + '.' + signature
    const encodedPayload = Buffer.from(payload).toString('base64url');
    const token = `${encodedPayload}.${signature}`;

    const downloadUrl = `/api/${config.apiVersion}/files/${fileId}/download?token=${token}`;

    return {
        token,
        expiresAt: new Date(expiresAt),
        downloadUrl
    };
}

/**
 * Verify a signed download token
 * @param {string} token - The signed token to verify
 * @returns {Object} { valid: boolean, fileId?: string, userId?: string, error?: string }
 */
export function verifySignedUrl(token) {
    try {
        if (!token || typeof token !== 'string') {
            return { valid: false, error: 'Token is required' };
        }

        const parts = token.split('.');
        if (parts.length !== 2) {
            return { valid: false, error: 'Malformed token' };
        }

        const [encodedPayload, providedSignature] = parts;

        // Decode payload
        const payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
        const [fileId, userId, expiresAtStr] = payload.split('|');

        if (!fileId || !userId || !expiresAtStr) {
            return { valid: false, error: 'Invalid token payload' };
        }

        // Recompute signature
        const expectedSignature = crypto
            .createHmac('sha256', SIGNING_SECRET)
            .update(payload)
            .digest('hex');

        // Timing-safe comparison to prevent timing attacks
        const sigBuffer1 = Buffer.from(providedSignature, 'hex');
        const sigBuffer2 = Buffer.from(expectedSignature, 'hex');

        if (sigBuffer1.length !== sigBuffer2.length || !crypto.timingSafeEqual(sigBuffer1, sigBuffer2)) {
            return { valid: false, error: 'Invalid signature' };
        }

        // Check expiry
        const expiresAt = parseInt(expiresAtStr, 10);
        if (Date.now() > expiresAt) {
            return { valid: false, error: 'Token has expired' };
        }

        return { valid: true, fileId, userId };

    } catch (error) {
        return { valid: false, error: 'Token verification failed' };
    }
}

export default { generateSignedUrl, verifySignedUrl };
