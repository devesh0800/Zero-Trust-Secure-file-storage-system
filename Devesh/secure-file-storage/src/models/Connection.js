import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Connection Model
 * Manages trusted peer-to-peer connections between users.
 * Only "active" connections can share files securely.
 */
const Connection = sequelize.define('connections', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    receiver_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    status: {
        type: DataTypes.ENUM('pending', 'active', 'rejected', 'blocked'),
        defaultValue: 'pending'
    },
    // Safety Number: Used for out-of-band verification (Anti-MITM)
    safety_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    connected_at: {
        type: DataTypes.DATE,
        allowNull: true
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
        { fields: ['sender_id'] },
        { fields: ['receiver_id'] },
        { unique: true, fields: ['sender_id', 'receiver_id'] }
    ]
});

export default Connection;
