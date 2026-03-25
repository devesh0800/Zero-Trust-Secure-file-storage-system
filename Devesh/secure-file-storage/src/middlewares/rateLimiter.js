import rateLimit from 'express-rate-limit';
import config from '../config/config.js';
import { logSecurityEvent } from '../utils/logger.js';

/**
 * Rate limiting middleware
 * Protects against brute force and DDoS attacks
 */

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logSecurityEvent('rate_limit_exceeded', {
            ip: req.ip,
            path: req.path,
            userAgent: req.get('user-agent')
        });

        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later'
        });
    }
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login
 */
export const authLimiter = rateLimit({
    windowMs: config.rateLimit.authWindowMs,
    max: config.rateLimit.authMaxRequests,
    skipSuccessfulRequests: true, // Don't count successful logins
    message: {
        success: false,
        message: 'Too many login attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logSecurityEvent('auth_rate_limit_exceeded', {
            ip: req.ip,
            email: req.body?.email,
            userAgent: req.get('user-agent')
        });

        res.status(429).json({
            success: false,
            message: 'Too many login attempts, please try again in 15 minutes'
        });
    }
});

/**
 * File upload rate limiter
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: {
        success: false,
        message: 'Upload limit exceeded, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logSecurityEvent('upload_rate_limit_exceeded', {
            ip: req.ip,
            userId: req.user?.id,
            userAgent: req.get('user-agent')
        });

        res.status(429).json({
            success: false,
            message: 'Too many uploads, please try again in an hour'
        });
    }
});

/**
 * Download rate limiter
 */
export const downloadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 downloads per 15 minutes
    message: {
        success: false,
        message: 'Download limit exceeded, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

export default {
    apiLimiter,
    authLimiter,
    uploadLimiter,
    downloadLimiter
};
