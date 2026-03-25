import { logSecurityEvent } from './logger.js';

/**
 * Virus/Malware Scanner Utility
 * 
 * Scans uploaded files for known malware signatures before encryption.
 * Uses a built-in signature-based approach for portability.
 * In production, integrate with ClamAV via the 'clamscan' npm package.
 * 
 * SECURITY ARCHITECTURE:
 * Upload → Virus Scan → Encrypt → Store
 * If malware is detected, the file is rejected immediately.
 */

// Known dangerous file signatures (magic bytes)
const MALWARE_SIGNATURES = [
    // EICAR test virus (standard antivirus test string)
    { name: 'EICAR-Test-Virus', hex: '58354f2150254041505b345c505a58353428505e2937434329377d2445494341522d5354414e444152442d414e544956495255532d544553542d46494c452124482b482a' },
    // Windows PE executables
    { name: 'Windows-Executable', hex: '4d5a' },
    // ELF (Linux executables)
    { name: 'Linux-Executable', hex: '7f454c46' },
    // Mach-O (macOS executables)
    { name: 'macOS-Executable-32', hex: 'feedface' },
    { name: 'macOS-Executable-64', hex: 'feedfacf' },
    // Java class files (can be malicious)
    { name: 'Java-Class', hex: 'cafebabe' },
    // Windows shortcut (LNK - often used in phishing)
    { name: 'Windows-LNK', hex: '4c00000001140200' },
    // Microsoft Cabinet (often bundled with malware)
    { name: 'MS-Cabinet', hex: '4d534346' },
];

// Dangerous file extensions (comprehensive blocklist)
const DANGEROUS_EXTENSIONS = [
    'exe', 'dll', 'bat', 'cmd', 'sh', 'bash', 'ps1', 'psm1',
    'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh', 'msi', 'msp',
    'com', 'scr', 'pif', 'hta', 'cpl', 'msc', 'inf', 'reg',
    'rgs', 'sct', 'ws', 'php', 'php5', 'phtml', 'asp', 'aspx',
    'jsp', 'cgi', 'pl', 'py', 'rb', 'jar', 'war', 'ear',
    'app', 'action', 'command', 'workflow', 'ipa', 'apk'
];

// Suspicious content patterns (regex-based heuristic scanning)
const SUSPICIOUS_PATTERNS = [
    // Script injection in non-script files
    { name: 'Script-Injection', pattern: /<script[\s>]/i },
    // PowerShell commands embedded in files
    { name: 'PowerShell-Command', pattern: /powershell\s+(-[a-z]+\s+)*-?(enc|encodedcommand|e)\s/i },
    // Command injection attempts
    { name: 'Command-Injection', pattern: /;\s*(rm|del|format|fdisk|mkfs)\s/i },
    // Base64-encoded executable payloads (common obfuscation)
    { name: 'Base64-PE-Header', pattern: /TVqQAAMAAAAEAAAA/  },  // Base64 of MZ header
];

/**
 * Scan a file buffer for malware signatures
 * @param {Buffer} fileBuffer - The file content to scan
 * @param {string} originalFilename - Original filename for extension checking
 * @returns {Object} { safe: boolean, threats: string[], scanTime: number }
 */
export function scanFile(fileBuffer, originalFilename) {
    const startTime = Date.now();
    const threats = [];

    // 1. Extension check
    const ext = originalFilename.split('.').pop().toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
        threats.push(`Dangerous-Extension: .${ext}`);
    }

    // 2. Double extension check (e.g., "file.pdf.exe")
    const parts = originalFilename.split('.');
    if (parts.length > 2) {
        const secondExt = parts[parts.length - 2].toLowerCase();
        if (DANGEROUS_EXTENSIONS.includes(secondExt)) {
            threats.push(`Double-Extension-Attack: .${secondExt}.${ext}`);
        }
    }

    // 3. Magic byte / signature scanning
    const fileHex = fileBuffer.toString('hex').toLowerCase();
    for (const sig of MALWARE_SIGNATURES) {
        if (fileHex.startsWith(sig.hex.toLowerCase())) {
            threats.push(`Signature-Match: ${sig.name}`);
        }
    }

    // 4. EICAR test string check (plaintext)
    const fileText = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 1024));
    if (fileText.includes('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*')) {
        if (!threats.some(t => t.includes('EICAR'))) {
            threats.push('Signature-Match: EICAR-Test-Virus');
        }
    }

    // 5. Heuristic content scanning (for non-binary files < 1MB)
    if (fileBuffer.length < 1024 * 1024) {
        const content = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 65536));
        for (const { name, pattern } of SUSPICIOUS_PATTERNS) {
            if (pattern.test(content)) {
                threats.push(`Heuristic-Match: ${name}`);
            }
        }
    }

    // 6. Null-byte injection check (used to bypass extension filters)
    if (originalFilename.includes('\0') || originalFilename.includes('%00')) {
        threats.push('Null-Byte-Injection: filename contains null bytes');
    }

    const scanTime = Date.now() - startTime;
    const safe = threats.length === 0;

    // Log scan result
    if (!safe) {
        logSecurityEvent('malware_detected', {
            filename: originalFilename,
            threats,
            scanTime: `${scanTime}ms`
        });
    }

    return { safe, threats, scanTime };
}

/**
 * Quick check if a filename has a dangerous extension
 * @param {string} filename 
 * @returns {boolean}
 */
export function isDangerousExtension(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return DANGEROUS_EXTENSIONS.includes(ext);
}

export default { scanFile, isDangerousExtension };
