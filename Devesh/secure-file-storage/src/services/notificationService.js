import { Notification } from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Notification Service
 * Handles creating and retrieving in-app notifications
 */

export async function createNotification(userId, title, message, type = 'system') {
    return await Notification.create({
        user_id: userId,
        title,
        message,
        type
    });
}

export async function getUserNotifications(userId, limit = 50, offset = 0) {
    return await Notification.findAndCountAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit,
        offset
    });
}

export async function getUnreadCount(userId) {
    return await Notification.count({
        where: { user_id: userId, is_read: false }
    });
}

export async function markAsRead(userId, notificationId) {
    const notification = await Notification.findOne({
        where: { id: notificationId, user_id: userId }
    });

    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    notification.is_read = true;
    await notification.save();
    return notification;
}

export async function markAllAsRead(userId) {
    await Notification.update(
        { is_read: true },
        { where: { user_id: userId, is_read: false } }
    );
    return true;
}

export default {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};
