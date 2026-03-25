import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

/**
 * File Model
 * Stores encrypted file metadata and encryption parameters
 * CRITICAL: Files are stored encrypted on disk, this model stores the encryption metadata
 */
const File = sequelize.define('files', {
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
    original_filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    stored_filename: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'UUID-based filename with .enc extension'
    },
    file_size: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Original file size in bytes'
    },
    encrypted_size: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Encrypted file size in bytes'
    },
    mime_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_extension: {
        type: DataTypes.STRING,
        allowNull: false
    },

    // Encryption metadata - CRITICAL SECURITY FIELDS
    // Each file has its own encryption key, encrypted with master key
    encrypted_file_key: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'File encryption key, encrypted with master key'
    },
    file_key_iv: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'IV used to encrypt the file key'
    },
    file_key_auth_tag: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Auth tag for file key encryption'
    },

    // File content encryption parameters
    content_iv: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'IV used to encrypt the actual file content'
    },
    content_auth_tag: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Auth tag for file content encryption (GCM mode)'
    },

    // Integrity verification
    checksum: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'SHA-256 checksum of original file for integrity verification'
    },

    // Metadata
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Soft delete flag'
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    last_accessed: {
        type: DataTypes.DATE,
        allowNull: true
    },
    access_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    indexes: [
        { fields: ['user_id'] },
        { fields: ['stored_filename'] },
        { fields: ['is_deleted'] },
        { fields: ['created_at'] }
    ]
});

/**
 * Define relationship with User
 */
File.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
User.hasMany(File, { foreignKey: 'user_id', as: 'files' });

/**
 * Instance method to mark file as accessed
 */
File.prototype.markAccessed = async function () {
    this.last_accessed = new Date();
    this.access_count += 1;
    await this.save();
};

/**
 * Instance method for soft delete
 */
File.prototype.softDelete = async function () {
    this.is_deleted = true;
    this.deleted_at = new Date();
    await this.save();
};

export default File;
