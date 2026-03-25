import crypto from 'crypto';
import config from '../config/config.js';

/**
 * CRITICAL SECURITY MODULE: File Encryption Utilities
 * 
 * ZERO-TRUST ARCHITECTURE:
 * 1. Each file gets a unique AES-256 encryption key
 * 2. File encryption keys are themselves encrypted with the master key
 * 3. Uses AES-256-GCM for authenticated encryption (prevents tampering)
 * 4. Server stores only encrypted files - plaintext never touches disk
 * 5. Even database compromise won't reveal file contents without master key
 * 
 * ENCRYPTION FLOW:
 * Upload: File → Generate Random Key → Encrypt File → Encrypt Key → Store Both
 * Download: Decrypt Key → Decrypt File → Stream to User
 */

/**
 * Generate a random encryption key
 * @returns {Buffer} 32-byte random key for AES-256
 */
export function generateEncryptionKey() {
    return crypto.randomBytes(32);
}

/**
 * Generate a random initialization vector
 * @returns {Buffer} 16-byte random IV
 */
export function generateIV() {
    return crypto.randomBytes(config.encryption.ivLength);
}

/**
 * Encrypt data using AES-256-GCM
 * @param {Buffer} data - Data to encrypt
 * @param {Buffer} key - Encryption key
 * @param {Buffer} iv - Initialization vector
 * @returns {Object} { encrypted: Buffer, authTag: Buffer }
 */
export function encryptData(data, key, iv) {
    const cipher = crypto.createCipheriv(config.encryption.algorithm, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(data),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return { encrypted, authTag };
}

/**
 * Decrypt data using AES-256-GCM
 * @param {Buffer} encryptedData - Data to decrypt
 * @param {Buffer} key - Decryption key
 * @param {Buffer} iv - Initialization vector
 * @param {Buffer} authTag - Authentication tag
 * @returns {Buffer} Decrypted data
 * @throws {Error} If authentication fails (data was tampered with)
 */
export function decryptData(encryptedData, key, iv, authTag) {
    const decipher = crypto.createDecipheriv(config.encryption.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
    ]);

    return decrypted;
}

/**
 * Encrypt a file encryption key using the master key
 * This enables key rotation and secure key storage
 * 
 * @param {Buffer} fileKey - The file's encryption key
 * @returns {Object} { encryptedKey: string, iv: string, authTag: string }
 */
export function encryptFileKey(fileKey) {
    const masterKey = Buffer.from(config.encryption.masterKey, 'hex');
    const iv = generateIV();

    const { encrypted, authTag } = encryptData(fileKey, masterKey, iv);

    return {
        encryptedKey: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
    };
}

/**
 * Decrypt a file encryption key using the master key
 * 
 * @param {string} encryptedKey - Base64 encoded encrypted key
 * @param {string} iv - Base64 encoded IV
 * @param {string} authTag - Base64 encoded auth tag
 * @returns {Buffer} Decrypted file key
 */
export function decryptFileKey(encryptedKey, iv, authTag) {
    const masterKey = Buffer.from(config.encryption.masterKey, 'hex');

    const encryptedBuffer = Buffer.from(encryptedKey, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const authTagBuffer = Buffer.from(authTag, 'base64');

    return decryptData(encryptedBuffer, masterKey, ivBuffer, authTagBuffer);
}

/**
 * Calculate SHA-256 checksum of data
 * Used for integrity verification
 * 
 * @param {Buffer} data - Data to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function calculateChecksum(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify data integrity using checksum
 * 
 * @param {Buffer} data - Data to verify
 * @param {string} expectedChecksum - Expected checksum
 * @returns {boolean} True if checksums match
 */
export function verifyChecksum(data, expectedChecksum) {
    const actualChecksum = calculateChecksum(data);
    return crypto.timingSafeEqual(
        Buffer.from(actualChecksum, 'hex'),
        Buffer.from(expectedChecksum, 'hex')
    );
}

/**
 * Encrypt a file buffer
 * Complete encryption flow for file upload
 * 
 * @param {Buffer} fileBuffer - Original file data
 * @returns {Object} Encryption metadata and encrypted data
 */
export function encryptFile(fileBuffer) {
    // Generate unique key for this file
    const fileKey = generateEncryptionKey();
    const contentIV = generateIV();

    // Encrypt the file content
    const { encrypted: encryptedContent, authTag: contentAuthTag } = encryptData(
        fileBuffer,
        fileKey,
        contentIV
    );

    // Encrypt the file key with master key
    const { encryptedKey, iv: keyIV, authTag: keyAuthTag } = encryptFileKey(fileKey);

    // Calculate checksum of original file
    const checksum = calculateChecksum(fileBuffer);

    return {
        encryptedContent,
        encryptedFileKey: encryptedKey,
        fileKeyIV: keyIV,
        fileKeyAuthTag: keyAuthTag,
        contentIV: contentIV.toString('base64'),
        contentAuthTag: contentAuthTag.toString('base64'),
        checksum
    };
}

/**
 * Decrypt a file
 * Complete decryption flow for file download
 * 
 * @param {Buffer} encryptedContent - Encrypted file data
 * @param {Object} metadata - Encryption metadata from database
 * @returns {Buffer} Decrypted file data
 */
export function decryptFile(encryptedContent, metadata) {
    // Decrypt the file key
    const fileKey = decryptFileKey(
        metadata.encrypted_file_key,
        metadata.file_key_iv,
        metadata.file_key_auth_tag
    );

    // Decrypt the file content
    const decryptedContent = decryptData(
        encryptedContent,
        fileKey,
        Buffer.from(metadata.content_iv, 'base64'),
        Buffer.from(metadata.content_auth_tag, 'base64')
    );

    return decryptedContent;
}

/**
 * Generate a secure random token
 * Used for CSRF tokens, session IDs, etc.
 * 
 * @param {number} length - Token length in bytes
 * @returns {string} Hex-encoded random token
 */
export function generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

export default {
    generateEncryptionKey,
    generateIV,
    encryptData,
    decryptData,
    encryptFileKey,
    decryptFileKey,
    calculateChecksum,
    verifyChecksum,
    encryptFile,
    decryptFile,
    generateSecureToken
};
