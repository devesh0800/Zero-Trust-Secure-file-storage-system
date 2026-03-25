import { verifyAccessToken } from '../utils/jwt.js';
import { User, RefreshToken } from '../models/index.js';
import { logSecurityEvent } from '../utils/logger.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authenticate(req, res, next) {
    try {
        // Extract token from Authorization header or cookie
        let token = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        // Real-time session verification (if sid is present)
        if (decoded.sid) {
            const session = await RefreshToken.findOne({
                where: { id: decoded.sid, is_revoked: false }
            });

            if (!session || !session.isValid()) {
                logSecurityEvent('revoked_session_access_attempt', {
                    userId: decoded.userId,
                    sid: decoded.sid,
                    ip: req.ip
                });

                return res.status(401).json({
                    success: false,
                    message: 'Session has been revoked'
                });
            }
        }

        // Fetch user from database
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is active
        if (!user.is_active) {
            logSecurityEvent('inactive_user_access_attempt', {
                userId: user.id,
                ip: req.ip
            });

            return res.status(403).json({
                success: false,
                message: 'Account is inactive'
            });
        }

        // Check if account is locked
        if (user.isAccountLocked()) {
            logSecurityEvent('locked_account_access_attempt', {
                userId: user.id,
                ip: req.ip
            });

            return res.status(403).json({
                success: false,
                message: 'Account is locked due to multiple failed login attempts'
            });
        }

        // Attach user to request
        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        logSecurityEvent('authentication_error', {
            error: error.message,
            ip: req.ip
        });

        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
}

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            logSecurityEvent('unauthorized_access_attempt', {
                userId: req.user.id,
                role: req.user.role,
                requiredRoles: allowedRoles,
                path: req.path,
                ip: req.ip
            });

            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export async function optionalAuth(req, res, next) {
    try {
        let token = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (token) {
            try {
                const decoded = verifyAccessToken(token);

                if (decoded.sid) {
                    const session = await RefreshToken.findOne({
                        where: { id: decoded.sid, is_revoked: false }
                    });

                    if (session && session.isValid()) {
                        const user = await User.findByPk(decoded.userId);
                        if (user && user.is_active && !user.isAccountLocked()) {
                            req.user = user;
                        }
                    }
                } else {
                    const user = await User.findByPk(decoded.userId);
                    if (user && user.is_active && !user.isAccountLocked()) {
                        req.user = user;
                    }
                }
            } catch (err) {
                // Ignore token errors for optional auth
            }
        }

        next();
    } catch (error) {
        // Silently fail for optional auth
        next();
    }
}

/**
 * Require Full Access (Block Restricted Users)
 * Applied to state-changing routes to enforce Read-Only unlock flow
 */
export function requireFullAccess(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.is_restricted) {
        logSecurityEvent('restricted_access_attempt', {
            userId: req.user.id,
            path: req.path,
            method: req.method,
            ip: req.ip
        });

        return res.status(403).json({
            success: false,
            message: 'Account is in RESTRICTED mode. Please complete the AI verification to restore full access.'
        });
    }

    next();
}

export default {
    authenticate,
    authorize,
    optionalAuth,
    requireFullAccess
};
