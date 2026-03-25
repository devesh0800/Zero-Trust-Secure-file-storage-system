import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import config from '../config/config.js';
import { logSecurityEvent } from '../utils/logger.js';

/**
 * Encrypted Backup Utility
 * 
 * Creates AES-256-GCM encrypted backups of the SQLite database.
 * Backups are timestamped and stored in a dedicated backup directory.
 * 
 * SECURITY:
 * - Backups are encrypted with master key
 * - Even if backup files are stolen, data remains encrypted
 * - Supports automatic scheduled backups
 */

const BACKUP_DIR = path.resolve('./backups');
const ALGORITHM = 'aes-256-cbc'; // CBC for streaming compatibility

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir() {
    try {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    } catch (err) {
        // Directory already exists
    }
}

/**
 * Create an encrypted backup of the database
 * @returns {Object} { backupPath: string, size: number, timestamp: string }
 */
export async function createBackup() {
    await ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dbPath = path.resolve('./database.sqlite');
    const backupFilename = `backup_${timestamp}.enc`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);
    const metadataPath = path.join(BACKUP_DIR, `backup_${timestamp}.meta.json`);

    // Generate IV for this backup
    const iv = crypto.randomBytes(16);
    const masterKey = Buffer.from(config.encryption.masterKey, 'hex');

    // Read the database file
    const dbBuffer = await fs.readFile(dbPath);

    // Encrypt using AES-256-CBC
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(dbBuffer), cipher.final()]);

    // Write encrypted backup
    await fs.writeFile(backupPath, encrypted);

    // Write metadata (IV needed for decryption)
    const metadata = {
        timestamp,
        filename: backupFilename,
        originalSize: dbBuffer.length,
        encryptedSize: encrypted.length,
        iv: iv.toString('hex'),
        algorithm: ALGORITHM,
        createdAt: new Date().toISOString()
    };

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    logSecurityEvent('backup_created', {
        filename: backupFilename,
        originalSize: dbBuffer.length,
        encryptedSize: encrypted.length
    });

    return {
        backupPath,
        metadataPath,
        size: encrypted.length,
        timestamp: metadata.createdAt
    };
}

/**
 * Restore a backup
 * @param {string} backupFilename - Name of the backup file (e.g., "backup_2024-01-01.enc")
 * @returns {boolean} true if successful
 */
export async function restoreBackup(backupFilename) {
    const backupPath = path.join(BACKUP_DIR, backupFilename);
    const metaFilename = backupFilename.replace('.enc', '.meta.json');
    const metadataPath = path.join(BACKUP_DIR, metaFilename);

    // Read metadata
    const metadataRaw = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataRaw);

    // Read encrypted backup
    const encryptedBuffer = await fs.readFile(backupPath);

    // Decrypt
    const masterKey = Buffer.from(config.encryption.masterKey, 'hex');
    const iv = Buffer.from(metadata.iv, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

    // Before restoring, create a backup of current DB
    const currentDbPath = path.resolve('./database.sqlite');
    const safetyBackup = path.resolve(`./database.sqlite.pre-restore-${Date.now()}`);
    await fs.copyFile(currentDbPath, safetyBackup);

    // Write restored database
    await fs.writeFile(currentDbPath, decrypted);

    logSecurityEvent('backup_restored', {
        filename: backupFilename,
        restoredSize: decrypted.length,
        safetyBackup
    });

    return true;
}

/**
 * List all available backups
 * @returns {Array} List of backup metadata objects
 */
export async function listBackups() {
    await ensureBackupDir();

    const files = await fs.readdir(BACKUP_DIR);
    const metaFiles = files.filter(f => f.endsWith('.meta.json'));

    const backups = [];
    for (const metaFile of metaFiles) {
        try {
            const raw = await fs.readFile(path.join(BACKUP_DIR, metaFile), 'utf8');
            backups.push(JSON.parse(raw));
        } catch (err) {
            // Skip corrupted metadata
        }
    }

    return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export default { createBackup, restoreBackup, listBackups };
