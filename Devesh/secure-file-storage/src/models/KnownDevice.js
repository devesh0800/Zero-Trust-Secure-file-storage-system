import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * KnownDevice Model
 * Tracks devices used by each user for suspicious login detection
 * 
 * ZERO-TRUST: Every new device triggers a security alert
 */
const KnownDevice = sequelize.define('known_devices', {
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
        }
    },
    device_fingerprint: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'SHA-256 hash of User-Agent + IP subnet'
    },
    device_name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Human-readable device description (parsed from UA)'
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_trusted: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    last_used: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    first_seen: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    login_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
}, {
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['device_fingerprint'] },
        { fields: ['user_id', 'device_fingerprint'], unique: true }
    ]
});

export default KnownDevice;
