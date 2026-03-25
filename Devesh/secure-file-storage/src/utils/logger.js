import winston from 'winston';
import path from 'path';
import config from '../config/config.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Winston logger configuration
 * Implements structured logging for security events and application monitoring
 */

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

/**
 * Create logger instance
 */
const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'secure-file-storage' },
    transports: [
        // Error logs
        new winston.transports.File({
            filename: path.join(config.logging.filePath, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Combined logs
        new winston.transports.File({
            filename: path.join(config.logging.filePath, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Security audit logs
        new winston.transports.File({
            filename: path.join(config.logging.filePath, 'security.log'),
            level: 'warn',
            maxsize: 5242880, // 5MB
            maxFiles: 10
        })
    ]
});

/**
 * Add console transport in development
 */
if (config.env === 'development') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

/**
 * Security event logger
 * @param {string} event - Event type
 * @param {Object} details - Event details
 */
export function logSecurityEvent(event, details) {
    logger.warn('SECURITY_EVENT', {
        event,
        ...details,
        timestamp: new Date().toISOString()
    });
}

/**
 * Log authentication events
 */
export function logAuthEvent(type, userId, success, details = {}) {
    const level = success ? 'info' : 'warn';
    logger.log(level, 'AUTH_EVENT', {
        type,
        userId,
        success,
        ...details
    });
}

/**
 * Log file operations
 */
export function logFileOperation(operation, userId, fileId, details = {}) {
    logger.info('FILE_OPERATION', {
        operation,
        userId,
        fileId,
        ...details
    });
}

/**
 * Log errors with context
 */
export function logError(error, context = {}) {
    logger.error('APPLICATION_ERROR', {
        message: error.message,
        stack: error.stack,
        ...context
    });
}

/**
 * Log suspicious activity with CRITICAL severity
 * Used by IDS and device fingerprinting for high-priority alerts
 * These entries appear prominently in security.log for monitoring tools
 */
export function logSuspiciousActivity(event, details) {
    logger.error('🚨 SUSPICIOUS_ACTIVITY', {
        event,
        severity: 'CRITICAL',
        ...details,
        timestamp: new Date().toISOString(),
        alert: true
    });
}

export default logger;
