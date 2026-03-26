import logger, { logError } from '../utils/logger.js';
import config from '../config/config.js';

/**
 * Centralized error handling middleware
 * Prevents stack trace leakage in production
 */

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Not found error handler
 */
export function notFound(req, res, next) {
    const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
    next(error);
}

/**
 * Global error handler
 */
export function errorHandler(err, req, res, next) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        err.statusCode = 400;
        err.message = err.errors?.map(e => e.message).join(', ') || err.message;
        logError(err, {
            path: req.path,
            method: req.method,
            ip: req.ip,
            validationErrors: err.errors
        });
    } else {
        logError(err, {
            path: req.path,
            method: req.method,
            ip: req.ip,
            userId: req.user?.id
        });
    }

    // Development error response (detailed)
    if (config.env === 'development') {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            stack: err.stack,
            error: err
        });
    }

    // Production error response (minimal)
    // Never leak stack traces or internal details
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    // Programming or unknown errors - send generic message
    return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred'
    });
}

/**
 * Async error wrapper
 * Catches errors in async route handlers
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Validation error formatter
 */
export function formatValidationError(errors) {
    return errors.map(err => ({
        field: err.param,
        message: err.msg
    }));
}

export default {
    AppError,
    notFound,
    errorHandler,
    asyncHandler,
    formatValidationError
};
