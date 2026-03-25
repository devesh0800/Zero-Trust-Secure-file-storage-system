import { logSecurityEvent } from '../utils/logger.js';

/**
 * Intrusion Detection System (IDS) Middleware
 * 
 * Application-level intrusion detection that monitors:
 * 1. Brute force patterns (rapid failed requests from same IP)
 * 2. Path traversal attempts
 * 3. SQL injection patterns in request body/params
 * 4. Suspicious user-agent patterns (scanners, bots)
 * 5. Request flood detection
 * 
 * SECURITY: This supplements rate limiting by looking at
 * attack PATTERNS, not just request volume.
 */

// In-memory tracking (use Redis in production for multi-instance)
const ipTracker = new Map();  // IP → { failedAttempts, timestamps[], blocked, blockedUntil }
const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes
const FAILED_THRESHOLD = 10; // 10 failed requests in window = suspicious
const WINDOW_MS = 5 * 60 * 1000; // 5-minute sliding window
const FLOOD_THRESHOLD = 50; // 50 requests in 10 seconds
const FLOOD_WINDOW = 10 * 1000;

// Suspicious patterns
const SQL_INJECTION_PATTERNS = [
    /(\b(union|select|insert|update|delete|drop|alter|create|exec|execute)\b.*\b(from|into|table|database)\b)/i,
    /(;|--|\/\*|\*\/|xp_|sp_)/i,
    /(1\s*=\s*1|1\s*=\s*'1'|'or'|'and')/i,
];

const PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//,
    /\.\.\\/, 
    /%2e%2e/i,
    /%252e%252e/i,
];

const SUSPICIOUS_USER_AGENTS = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /burpsuite/i,
    /dirbuster/i,
    /gobuster/i,
    /wpscan/i,
    /nessus/i,
    /openvas/i,
    /acunetix/i,
];

/**
 * Clean up old entries periodically (memory management)
 */
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipTracker.entries()) {
        // Remove entries older than 1 hour
        if (data.lastSeen && (now - data.lastSeen) > 60 * 60 * 1000) {
            ipTracker.delete(ip);
        }
    }
}, 5 * 60 * 1000); // Every 5 minutes

/**
 * Get or create IP tracking entry
 */
function getIpData(ip) {
    if (!ipTracker.has(ip)) {
        ipTracker.set(ip, {
            failedAttempts: 0,
            requestTimestamps: [],
            blocked: false,
            blockedUntil: null,
            alerts: [],
            lastSeen: Date.now()
        });
    }
    const data = ipTracker.get(ip);
    data.lastSeen = Date.now();
    return data;
}

/**
 * Check if a request contains SQL injection patterns
 */
function detectSqlInjection(req) {
    const targets = [
        JSON.stringify(req.body || {}),
        JSON.stringify(req.query || {}),
        JSON.stringify(req.params || {}),
        req.originalUrl || ''
    ];

    const combined = targets.join(' ');
    for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(combined)) {
            return true;
        }
    }
    return false;
}

/**
 * Check for path traversal attempts
 */
function detectPathTraversal(req) {
    const url = req.originalUrl || '';
    for (const pattern of PATH_TRAVERSAL_PATTERNS) {
        if (pattern.test(url)) {
            return true;
        }
    }
    return false;
}

/**
 * Check for suspicious scanner user-agents
 */
function detectSuspiciousAgent(userAgent) {
    if (!userAgent) return false;
    for (const pattern of SUSPICIOUS_USER_AGENTS) {
        if (pattern.test(userAgent)) {
            return true;
        }
    }
    return false;
}

/**
 * Check for request flooding
 */
function detectFlood(ipData) {
    const now = Date.now();
    // Remove timestamps outside the flood window
    ipData.requestTimestamps = ipData.requestTimestamps.filter(t => (now - t) < FLOOD_WINDOW);
    ipData.requestTimestamps.push(now);
    return ipData.requestTimestamps.length > FLOOD_THRESHOLD;
}

/**
 * Main IDS middleware
 * Checks every request for suspicious patterns
 */
export function intrusionDetection(req, res, next) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || '';
    const ipData = getIpData(ip);
    const threats = [];

    // 1. Check if IP is currently blocked
    if (ipData.blocked) {
        if (Date.now() > ipData.blockedUntil) {
            // Unblock
            ipData.blocked = false;
            ipData.blockedUntil = null;
            ipData.failedAttempts = 0;
        } else {
            logSecurityEvent('ids_blocked_request', {
                ip,
                path: req.path,
                severity: 'CRITICAL'
            });
            return res.status(403).json({
                success: false,
                message: 'Access temporarily blocked due to suspicious activity'
            });
        }
    }

    // 2. Detect SQL injection
    if (detectSqlInjection(req)) {
        threats.push('SQL_INJECTION_ATTEMPT');
    }

    // 3. Detect path traversal
    if (detectPathTraversal(req)) {
        threats.push('PATH_TRAVERSAL_ATTEMPT');
    }

    // 4. Detect suspicious user-agent
    if (detectSuspiciousAgent(userAgent)) {
        threats.push('SUSPICIOUS_SCANNER_DETECTED');
    }

    // 5. Detect request flooding
    if (detectFlood(ipData)) {
        threats.push('REQUEST_FLOOD_DETECTED');
    }

    // Process threats
    if (threats.length > 0) {
        ipData.failedAttempts += threats.length;

        logSecurityEvent('ids_threat_detected', {
            ip,
            path: req.originalUrl,
            method: req.method,
            threats,
            userAgent: userAgent.substring(0, 100),
            totalAlerts: ipData.failedAttempts,
            severity: ipData.failedAttempts >= FAILED_THRESHOLD ? 'CRITICAL' : 'HIGH'
        });

        // Block IP if threshold exceeded
        if (ipData.failedAttempts >= FAILED_THRESHOLD) {
            ipData.blocked = true;
            ipData.blockedUntil = Date.now() + BLOCK_DURATION;

            logSecurityEvent('ids_ip_blocked', {
                ip,
                reason: 'Exceeded threat threshold',
                blockedFor: '30 minutes',
                totalAlerts: ipData.failedAttempts,
                severity: 'CRITICAL'
            });

            return res.status(403).json({
                success: false,
                message: 'Access blocked due to detected security threats'
            });
        }
    }

    next();
}

/**
 * Record a failed authentication attempt for IDS tracking
 * Call this from auth middleware on 401/403 responses
 */
export function recordFailedAttempt(ip) {
    const ipData = getIpData(ip);
    ipData.failedAttempts++;
    
    if (ipData.failedAttempts >= FAILED_THRESHOLD) {
        ipData.blocked = true;
        ipData.blockedUntil = Date.now() + BLOCK_DURATION;
        
        logSecurityEvent('ids_brute_force_blocked', {
            ip,
            failedAttempts: ipData.failedAttempts,
            severity: 'CRITICAL'
        });
    }
}

/**
 * Get IDS status (for admin monitoring)
 */
export function getIdsStatus() {
    const entries = [];
    for (const [ip, data] of ipTracker.entries()) {
        if (data.failedAttempts > 0) {
            entries.push({
                ip,
                failedAttempts: data.failedAttempts,
                blocked: data.blocked,
                blockedUntil: data.blockedUntil ? new Date(data.blockedUntil) : null,
                lastSeen: new Date(data.lastSeen)
            });
        }
    }
    return entries.sort((a, b) => b.failedAttempts - a.failedAttempts);
}

export default { intrusionDetection, recordFailedAttempt, getIdsStatus };
