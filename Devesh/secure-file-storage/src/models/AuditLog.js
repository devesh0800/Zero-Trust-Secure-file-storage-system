import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

/**
 * AuditLog Model
 * Immutable audit trail for security events
 * Implements append-only logging for compliance and forensics
 */
const AuditLog = sequelize.define('audit_logs', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'Null for failed login attempts with invalid email'
    },
    event_type: {
        type: DataTypes.ENUM(
            'user_registered',
            'login_success',
            'login_failed',
            'logout',
            'account_locked',
            'password_changed',
            'file_uploaded',
            'file_downloaded',
            'file_deleted',
            'unauthorized_access',
            'token_refreshed',
            'suspicious_activity'
        ),
        allowNull: false
    },
    event_description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    resource_type: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'e.g., file, user, auth'
    },
    resource_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID of the resource being accessed'
    },
    status: {
        type: DataTypes.ENUM('success', 'failure', 'warning'),
        allowNull: false
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional context data'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    updatedAt: false,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['event_type'] },
        { fields: ['created_at'] },
        { fields: ['status'] },
        { fields: ['ip_address'] }
    ]
});

/**
 * Prevent updates to audit logs (append-only)
 */
AuditLog.beforeUpdate(() => {
    throw new Error('Audit logs are immutable and cannot be updated');
});

/**
 * Prevent deletion of audit logs
 */
AuditLog.beforeDestroy(() => {
    throw new Error('Audit logs cannot be deleted');
});

/**
 * Define relationship with User
 */
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default AuditLog;
