import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Notification Model
 * Stores system notifications, security alerts, and other user notifications.
 */
const Notification = sequelize.define('notifications', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('security', 'system', 'alert'),
        defaultValue: 'system'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['is_read'] }
    ]
});

export default Notification;
