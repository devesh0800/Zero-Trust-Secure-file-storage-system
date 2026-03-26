import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import File from './File.js';
import User from './User.js';

/**
 * SharedFile Model (Advanced P2PE)
 * Manages encrypted peer-to-peer file sharing with granular permissions and tracking.
 */
const SharedFile = sequelize.define('shared_files', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    file_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'files', key: 'id' },
        onDelete: 'CASCADE'
    },
    shared_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    // P2PE: The receiver of the share
    receiver_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        comment: 'If null, this is a public/token-based share'
    },
    share_token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    // P2PE: AES key encrypted with receiver public key
    encrypted_aes_key: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'AES file key wrapped with receiver RSA public key'
    },
    access_type: {
        type: DataTypes.ENUM('public', 'private', 'password_protected', 'p2pe'),
        defaultValue: 'public'
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Granular Permissions
    permission_mode: {
        type: DataTypes.ENUM('read', 'edit', 'view_once', 'no_download'),
        defaultValue: 'read'
    },
    // Share lifecycle
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'revoked', 'expired'),
        defaultValue: 'pending'
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    max_downloads: {
        type: DataTypes.INTEGER,
        defaultValue: -1
    },
    // Activity Tracking (Blue Tick System)
    is_viewed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_downloaded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    view_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    download_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    last_access_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'shared_files',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['file_id'] },
        { fields: ['share_token'] },
        { fields: ['shared_by'] },
        { fields: ['receiver_id'] }
    ]
});

// Relationships
SharedFile.belongsTo(File, { foreignKey: 'file_id', as: 'file' });
File.hasMany(SharedFile, { foreignKey: 'file_id', as: 'shares' });

SharedFile.belongsTo(User, { foreignKey: 'shared_by', as: 'sharer' });
SharedFile.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

export default SharedFile;
