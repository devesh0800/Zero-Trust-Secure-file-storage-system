import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { File, AuditLog } from '../models/index.js';
import { encryptFile, decryptFile, calculateChecksum } from '../utils/encryption.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logFileOperation, logSecurityEvent } from '../utils/logger.js';
import { scanFile } from '../utils/virusScanner.js';
import config from '../config/config.js';

/**
 * File Service
 * Handles encrypted file storage and retrieval
 * 
 * SECURITY ARCHITECTURE:
 * 1. Files are encrypted before storage
 * 2. Each file has a unique encryption key
 * 3. Encryption keys are encrypted with master key
 * 4. Only file owner can decrypt
 * 5. Server admin cannot read file contents
 */

import { fileTypeFromBuffer } from 'file-type';

/**
 * Upload and encrypt a file
 */
export async function uploadFile(fileData, userId, ipAddress, userAgent) {
    const { path: tempPath, originalname, mimetype, size } = fileData;

    try {
        // Read file from temporary location
        const fileBuffer = await fs.readFile(tempPath);

        // ==========================================
        // VIRUS / MALWARE SCANNING
        // ==========================================
        const scanResult = scanFile(fileBuffer, originalname);
        if (!scanResult.safe) {
            logSecurityEvent('malware_upload_blocked', {
                userId,
                filename: originalname,
                threats: scanResult.threats,
                scanTime: `${scanResult.scanTime}ms`,
                ip: ipAddress
            });

            // Delete the dangerous temp file immediately
            await fs.unlink(tempPath);

            throw new AppError(
                `Security Scan Failed: File blocked due to detected threats: ${scanResult.threats.join(', ')}`,
                403
            );
        }

        // Security Hardening: Validate Magic Numbers using file-type
        const detectedType = await fileTypeFromBuffer(fileBuffer);

        if (detectedType) {
            const dangerousExtensions = ['exe', 'dll', 'bat', 'cmd', 'sh', 'php', 'pl', 'jsp', 'asp', 'msi', 'vbs'];
            if (dangerousExtensions.includes(detectedType.ext)) {
                throw new AppError(`Security Policy Violation: Upload of executable/script files (${detectedType.ext}) is strictly prohibited.`, 403);
            }
        }

        // Encrypt file
        const {
            encryptedContent,
            encryptedFileKey,
            fileKeyIV,
            fileKeyAuthTag,
            contentIV,
            contentAuthTag,
            checksum
        } = encryptFile(fileBuffer);

        // Generate unique filename for encrypted file
        const fileExtension = path.extname(originalname);
        const storedFilename = `${uuidv4()}.enc`;
        const storedPath = path.join(config.upload.uploadDir, storedFilename);

        // Write encrypted file to disk
        await fs.writeFile(storedPath, encryptedContent);

        // Delete temporary file
        await fs.unlink(tempPath);

        // Store metadata in database
        const file = await File.create({
            user_id: userId,
            original_filename: originalname,
            stored_filename: storedFilename,
            file_size: size,
            encrypted_size: encryptedContent.length,
            mime_type: mimetype,
            file_extension: fileExtension.substring(1),
            encrypted_file_key: encryptedFileKey,
            file_key_iv: fileKeyIV,
            file_key_auth_tag: fileKeyAuthTag,
            content_iv: contentIV,
            content_auth_tag: contentAuthTag,
            checksum
        });

        // Log file upload
        await AuditLog.create({
            user_id: userId,
            event_type: 'file_uploaded',
            event_description: `File uploaded: ${originalname}`,
            ip_address: ipAddress,
            user_agent: userAgent,
            resource_type: 'file',
            resource_id: file.id,
            status: 'success',
            metadata: {
                filename: originalname,
                size: size,
                mime_type: mimetype
            }
        });

        logFileOperation('upload', userId, file.id, {
            filename: originalname,
            size,
            ip: ipAddress
        });

        return file;

    } catch (error) {
        // Clean up temporary file if it exists
        try {
            await fs.unlink(tempPath);
        } catch (unlinkError) {
            // Ignore if file doesn't exist
        }

        throw error;
    }
}

/**
 * Download and decrypt a file
 */
export async function downloadFile(fileId, userId, ipAddress, userAgent) {
    // Get file metadata
    const file = await File.findOne({
        where: {
            id: fileId,
            is_deleted: false
        }
    });

    if (!file) {
        throw new AppError('File not found', 404);
    }

    // Verify ownership
    if (file.user_id !== userId) {
        await AuditLog.create({
            user_id: userId,
            event_type: 'unauthorized_access',
            event_description: `Unauthorized file access attempt: ${file.original_filename}`,
            ip_address: ipAddress,
            user_agent: userAgent,
            resource_type: 'file',
            resource_id: fileId,
            status: 'failure'
        });

        logSecurityEvent('unauthorized_file_access', {
            userId,
            fileId,
            ownerId: file.user_id,
            ip: ipAddress
        });

        throw new AppError('Access denied', 403);
    }

    // Read encrypted file
    const encryptedPath = path.join(config.upload.uploadDir, file.stored_filename);

    let encryptedContent;
    try {
        encryptedContent = await fs.readFile(encryptedPath);
    } catch (error) {
        logSecurityEvent('file_not_found_on_disk', {
            fileId,
            storedFilename: file.stored_filename
        });

        throw new AppError('File not found on disk', 404);
    }

    // Decrypt file
    let decryptedContent;
    try {
        decryptedContent = decryptFile(encryptedContent, {
            encrypted_file_key: file.encrypted_file_key,
            file_key_iv: file.file_key_iv,
            file_key_auth_tag: file.file_key_auth_tag,
            content_iv: file.content_iv,
            content_auth_tag: file.content_auth_tag
        });
    } catch (error) {
        logSecurityEvent('file_decryption_failed', {
            fileId,
            userId,
            error: error.message
        });

        throw new AppError('File decryption failed', 500);
    }

    // Verify integrity
    const isValid = calculateChecksum(decryptedContent) === file.checksum;
    if (!isValid) {
        logSecurityEvent('file_integrity_check_failed', {
            fileId,
            userId
        });

        throw new AppError('File integrity check failed', 500);
    }

    // Update access metadata
    await file.markAccessed();

    // Log file download
    await AuditLog.create({
        user_id: userId,
        event_type: 'file_downloaded',
        event_description: `File downloaded: ${file.original_filename}`,
        ip_address: ipAddress,
        user_agent: userAgent,
        resource_type: 'file',
        resource_id: fileId,
        status: 'success'
    });

    logFileOperation('download', userId, fileId, {
        filename: file.original_filename,
        ip: ipAddress
    });

    return {
        content: decryptedContent,
        filename: file.original_filename,
        mimetype: file.mime_type
    };
}

/**
 * Get user's files
 */
export async function getUserFiles(userId, options = {}) {
    const { page = 1, limit = 20, sortBy = 'created_at', order = 'DESC' } = options;

    const offset = (page - 1) * limit;

    const { count, rows } = await File.findAndCountAll({
        where: {
            user_id: userId,
            is_deleted: false
        },
        order: [[sortBy, order]],
        limit,
        offset,
        attributes: [
            'id',
            'original_filename',
            'file_size',
            'mime_type',
            'file_extension',
            'created_at',
            'last_accessed',
            'access_count'
        ]
    });

    return {
        files: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        }
    };
}

/**
 * Get file metadata
 */
export async function getFileMetadata(fileId, userId) {
    const file = await File.findOne({
        where: {
            id: fileId,
            user_id: userId,
            is_deleted: false
        },
        attributes: [
            'id',
            'original_filename',
            'file_size',
            'mime_type',
            'file_extension',
            'created_at',
            'last_accessed',
            'access_count',
            'description'
        ]
    });

    if (!file) {
        throw new AppError('File not found', 404);
    }

    return file;
}

/**
 * Delete file (soft delete)
 */
export async function deleteFile(fileId, userId, ipAddress, userAgent) {
    const file = await File.findOne({
        where: {
            id: fileId,
            user_id: userId,
            is_deleted: false
        }
    });

    if (!file) {
        throw new AppError('File not found', 404);
    }

    // Soft delete
    await file.softDelete();

    // Log deletion
    await AuditLog.create({
        user_id: userId,
        event_type: 'file_deleted',
        event_description: `File deleted: ${file.original_filename}`,
        ip_address: ipAddress,
        user_agent: userAgent,
        resource_type: 'file',
        resource_id: fileId,
        status: 'success'
    });

    logFileOperation('delete', userId, fileId, {
        filename: file.original_filename,
        ip: ipAddress
    });

    return file;
}

/**
 * Permanently delete file (admin only)
 */
export async function permanentlyDeleteFile(fileId) {
    const file = await File.findByPk(fileId);

    if (!file) {
        throw new AppError('File not found', 404);
    }

    // Delete encrypted file from disk
    const filePath = path.join(config.upload.uploadDir, file.stored_filename);
    try {
        await fs.unlink(filePath);
    } catch (error) {
        // File might already be deleted
        console.error('Error deleting file from disk:', error);
    }

    // Delete from database
    await file.destroy();

    return true;
}

export default {
    uploadFile,
    downloadFile,
    getUserFiles,
    getFileMetadata,
    deleteFile,
    permanentlyDeleteFile
};
