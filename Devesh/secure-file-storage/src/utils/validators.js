import { body, param, validationResult } from 'express-validator';
import config from '../config/config.js';

/**
 * Input validation and sanitization utilities
 * Protects against injection attacks and malformed input
 */

/**
 * Password validation rules
 * Enforces strong password policy
 */
export const passwordValidation = () => {
    return body('password')
        .isLength({ min: config.security.passwordMinLength })
        .withMessage(`Password must be at least ${config.security.passwordMinLength} characters`)
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/)
        .withMessage('Password must contain at least one special character');
};

/**
 * Email validation
 */
export const emailValidation = () => {
    return body('email')
        .isEmail()
        .withMessage('Invalid email address')
        .normalizeEmail()
        .trim();
};

/**
 * Registration validation rules
 */
export const registerValidation = [
    emailValidation(),
    passwordValidation(),
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores')
];

/**
 * Login validation rules
 */
export const loginValidation = [
    body('identifier')
        .notEmpty()
        .withMessage('Email or Username is required')
        .trim(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

/**
 * File upload validation
 */
export const fileUploadValidation = [
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
];

/**
 * UUID parameter validation
 */
export const uuidValidation = (paramName = 'id') => {
    return param(paramName)
        .isUUID()
        .withMessage('Invalid ID format');
};

/**
 * Validate file type
 * @param {string} filename - Original filename
 * @returns {boolean} True if file type is allowed
 */
export function isAllowedFileType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    return config.upload.allowedTypes.includes(extension);
}

/**
 * Sanitize filename
 * Removes potentially dangerous characters
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.+/g, '.')
        .substring(0, 255);
}

/**
 * Middleware to check validation results
 */
export function validate(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log('Validation Errors:', errors.array());
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg
            }))
        });
    }

    next();
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
        .replace(/[<>]/g, '')
        .trim();
}

export default {
    passwordValidation,
    emailValidation,
    registerValidation,
    loginValidation,
    fileUploadValidation,
    uuidValidation,
    validate,
    isAllowedFileType,
    sanitizeFilename,
    sanitizeInput
};
