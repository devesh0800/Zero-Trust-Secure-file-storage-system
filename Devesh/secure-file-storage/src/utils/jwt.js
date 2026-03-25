import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { RefreshToken } from '../models/index.js';

/**
 * JWT Token Utilities
 * Implements dual-token authentication (access + refresh)
 */

/**
 * Generate access token (short-lived)
 * @param {Object} payload - User data to encode
 * @returns {string} JWT access token
 */
export function generateAccessToken(payload) {
    return jwt.sign(
        payload,
        config.jwt.accessSecret,
        {
            expiresIn: config.jwt.accessExpiry,
            issuer: config.jwt.issuer,
            audience: config.jwt.audience
        }
    );
}

/**
 * Generate refresh token (long-lived)
 * @param {Object} payload - User data to encode
 * @returns {string} JWT refresh token
 */
export function generateRefreshToken(payload) {
    return jwt.sign(
        payload,
        config.jwt.refreshSecret,
        {
            expiresIn: config.jwt.refreshExpiry,
            issuer: config.jwt.issuer,
            audience: config.jwt.audience
        }
    );
}

/**
 * Verify access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyAccessToken(token) {
    return jwt.verify(token, config.jwt.accessSecret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
    });
}

/**
 * Verify refresh token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyRefreshToken(token) {
    return jwt.verify(token, config.jwt.refreshSecret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
    });
}

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @param {string} ipAddress - Client IP
 * @param {string} userAgent - Client user agent
 * @returns {Object} { accessToken, refreshToken }
 */
import crypto from 'crypto';

export async function generateTokenPair(user, ipAddress, userAgent) {
    const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        jti: crypto.randomUUID()
    });

    // Store refresh token in database first to get the record ID (session ID)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshTokenRecord = await RefreshToken.create({
        user_id: user.id,
        token: refreshToken,
        expires_at: expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent
    });

    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        sid: refreshTokenRecord.id // Link access token to the specific session
    };

    const accessToken = generateAccessToken(payload);

    return { accessToken, refreshToken };
}

/**
 * Revoke a refresh token
 * @param {string} token - Refresh token to revoke
 */
export async function revokeRefreshToken(token) {
    const refreshToken = await RefreshToken.findOne({ where: { token } });
    if (refreshToken) {
        await refreshToken.revoke();
    }
}

/**
 * Revoke all refresh tokens for a user
 * @param {string} userId - User ID
 */
export async function revokeAllUserTokens(userId) {
    await RefreshToken.update(
        { is_revoked: true, revoked_at: new Date() },
        { where: { user_id: userId, is_revoked: false } }
    );
}

/**
 * Validate refresh token from database
 * @param {string} token - Refresh token
 * @returns {Object|null} RefreshToken instance or null
 */
export async function validateRefreshToken(token) {
    const refreshToken = await RefreshToken.findOne({ where: { token } });

    if (!refreshToken || !refreshToken.isValid()) {
        return null;
    }

    return refreshToken;
}

export default {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateTokenPair,
    revokeRefreshToken,
    revokeAllUserTokens,
    validateRefreshToken
};
