import crypto from 'crypto';

/**
 * CSRF Protection Middleware
 * Implements Double-Submit Cookie Pattern
 * 
 * How it works:
 * 1. On every response, set a `XSRF-TOKEN` cookie (readable by JS, NOT HttpOnly)
 * 2. The frontend reads this cookie and sends it back in the `X-CSRF-Token` header
 * 3. This middleware validates that the header matches the cookie
 * 
 * Safe methods (GET, HEAD, OPTIONS) are excluded from verification.
 */

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Sets a CSRF token cookie on every response
 */
export function csrfTokenSetter(req, res, next) {
    // If no CSRF cookie exists, generate one
    if (!req.cookies[CSRF_COOKIE_NAME]) {
        const token = crypto.randomBytes(32).toString('hex');
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: false,   // Must be readable by frontend JS
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'strict',
            path: '/'
        });
    }
    next();
}

/**
 * Validates that the CSRF header matches the CSRF cookie
 * Only enforced on state-changing methods (POST, PUT, DELETE, PATCH)
 */
export const csrfValidator = (req, res, next) => {
    // Exempt GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Bypass CSRF in development for automated testing scripts 
    if (process.env.NODE_ENV === 'development') {
        return next();
    }

    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.get(CSRF_HEADER_NAME); // Use req.get for case-insensitive header retrieval

    if (!cookieToken || !headerToken) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token missing. Refresh the page and try again.'
        });
    }

    // Constant-time comparison to prevent timing attacks
    if (cookieToken.length !== headerToken.length ||
        !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token mismatch. Possible cross-site request forgery detected.'
        });
    }

    next();
}
