import express from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();
router.use(authenticate); // All routes here require authentication

/**
 * @route   GET /api/v1/notifications
 * @desc    Get all notifications for logged in user
 * @access  Private
 */
router.get('/', getNotifications);

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', markAllAsRead);

/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark a specific notification as read
 * @access  Private
 */
router.put('/:id/read', markAsRead);

export default router;
