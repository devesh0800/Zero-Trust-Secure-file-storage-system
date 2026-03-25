import notificationService from '../services/notificationService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

/**
 * Get all notifications for the authenticated user
 */
export const getNotifications = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await notificationService.getUserNotifications(req.user.id, limit, offset);
    const unreadCount = await notificationService.getUnreadCount(req.user.id);

    res.status(200).json({
        success: true,
        data: {
            notifications: result.rows,
            total: result.count,
            unreadCount
        }
    });
});

/**
 * Mark a specific notification as read
 */
export const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await notificationService.markAsRead(req.user.id, id);

    res.status(200).json({
        success: true,
        message: 'Notification marked as read'
    });
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user.id);

    res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
    });
});

export default {
    getNotifications,
    markAsRead,
    markAllAsRead
};
