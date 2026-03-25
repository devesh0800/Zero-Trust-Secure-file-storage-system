import crypto from 'crypto';
import { logSecurityEvent } from './logger.js';

/**
 * Device Fingerprinting Utility
 * 
 * Creates a unique fingerprint for each device based on:
 * - User-Agent string
 * - IP subnet (first 3 octets for IPv4)
 * 
 * ZERO-TRUST: Every login is checked against known devices.
 * New devices trigger security alerts.
 */

/**
 * Generate a device fingerprint hash
 * @param {string} userAgent - Browser User-Agent string
 * @param {string} ipAddress - Client IP address
 * @returns {string} SHA-256 hash of device characteristics
 */
export function generateFingerprint(userAgent, ipAddress) {
    // Use IP subnet (not full IP) so users on dynamic IPs aren't constantly flagged
    const ipSubnet = extractSubnet(ipAddress);
    const raw = `${userAgent || 'unknown'}|${ipSubnet}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Extract subnet from IP address
 * IPv4: keeps first 3 octets (e.g., 192.168.1.x → 192.168.1)
 * IPv6: keeps first 4 groups
 * @param {string} ip
 * @returns {string}
 */
function extractSubnet(ip) {
    if (!ip) return 'unknown';

    // Handle ::1 and ::ffff:127.0.0.1 (localhost)
    if (ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1') {
        return 'localhost';
    }

    // IPv4
    if (ip.includes('.') && !ip.includes(':')) {
        const parts = ip.split('.');
        return parts.slice(0, 3).join('.');
    }

    // IPv4-mapped IPv6 (::ffff:x.x.x.x)
    if (ip.startsWith('::ffff:')) {
        const ipv4 = ip.replace('::ffff:', '');
        const parts = ipv4.split('.');
        return parts.slice(0, 3).join('.');
    }

    // Pure IPv6
    const groups = ip.split(':');
    return groups.slice(0, 4).join(':');
}

/**
 * Parse a User-Agent string into a human-readable device name
 * @param {string} userAgent
 * @returns {string}
 */
export function parseDeviceName(userAgent) {
    if (!userAgent) return 'Unknown Device';

    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // Detect browser
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edg/')) browser = 'Edge';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('node')) browser = 'Node.js/API';

    // Detect OS
    if (userAgent.includes('Windows NT 10')) os = 'Windows 10/11';
    else if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS X')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    return `${browser} on ${os}`;
}

/**
 * Check if a device is known for a user and register/update it
 * @param {Object} KnownDevice - The KnownDevice Sequelize model
 * @param {string} userId - User UUID
 * @param {string} userAgent - Browser UA string
 * @param {string} ipAddress - Client IP address
 * @returns {Object} { isNew: boolean, device: Object }
 */
export async function checkAndRegisterDevice(KnownDevice, userId, userAgent, ipAddress) {
    const fingerprint = generateFingerprint(userAgent, ipAddress);
    const deviceName = parseDeviceName(userAgent);

    // Check if device is already known
    let device = await KnownDevice.findOne({
        where: {
            user_id: userId,
            device_fingerprint: fingerprint
        }
    });

    if (device) {
        // Known device — update last used
        await device.update({
            last_used: new Date(),
            login_count: device.login_count + 1,
            ip_address: ipAddress
        });

        return { isNew: false, device };
    }

    // New device — register it and raise alert
    device = await KnownDevice.create({
        user_id: userId,
        device_fingerprint: fingerprint,
        device_name: deviceName,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_trusted: true,
        first_seen: new Date(),
        last_used: new Date(),
        login_count: 1
    });

    logSecurityEvent('new_device_login', {
        userId,
        deviceName,
        fingerprint: fingerprint.substring(0, 16) + '...',
        ip: ipAddress,
        severity: 'HIGH',
        message: `⚠️  NEW DEVICE DETECTED for user ${userId}: ${deviceName} from IP ${ipAddress}`
    });

    return { isNew: true, device };
}

export default { generateFingerprint, parseDeviceName, checkAndRegisterDevice };
