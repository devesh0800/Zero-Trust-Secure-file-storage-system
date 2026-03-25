import express from 'express';
import { authenticate, requireFullAccess } from '../middlewares/auth.js';
import { createBackup, restoreBackup, listBackups } from '../utils/backup.js';
import { getIdsStatus } from '../middlewares/intrusionDetection.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { KnownDevice } from '../models/index.js';

const router = express.Router();

/**
 * Admin Routes (Authenticated users)
 */

// Create encrypted backup
router.post(
    '/backup',
    authenticate,
    requireFullAccess,
    asyncHandler(async (req, res) => {
        const result = await createBackup();

        res.status(201).json({
            success: true,
            message: 'Encrypted backup created successfully',
            data: result
        });
    })
);

// List all backups
router.get(
    '/backups',
    authenticate,
    asyncHandler(async (req, res) => {
        const backups = await listBackups();

        res.status(200).json({
            success: true,
            data: { backups }
        });
    })
);

// Restore a backup
router.post(
    '/backup/restore',
    authenticate,
    requireFullAccess,
    asyncHandler(async (req, res) => {
        const { filename } = req.body;

        if (!filename) {
            return res.status(400).json({
                success: false,
                message: 'Backup filename is required'
            });
        }

        await restoreBackup(filename);

        res.status(200).json({
            success: true,
            message: 'Backup restored successfully. Server restart may be required.'
        });
    })
);

// IDS Status - View active threats and blocked IPs
router.get(
    '/ids/status',
    authenticate,
    asyncHandler(async (req, res) => {
        const status = getIdsStatus();

        res.status(200).json({
            success: true,
            data: {
                activeThreatEntries: status.length,
                entries: status
            }
        });
    })
);

// Known Devices - View devices for current user
router.get(
    '/devices',
    authenticate,
    asyncHandler(async (req, res) => {
        const devices = await KnownDevice.findAll({
            where: { user_id: req.user.id },
            order: [['last_used', 'DESC']],
            attributes: ['id', 'device_name', 'ip_address', 'is_trusted', 'last_used', 'first_seen', 'login_count']
        });

        res.status(200).json({
            success: true,
            data: { devices }
        });
    })
);

export default router;
