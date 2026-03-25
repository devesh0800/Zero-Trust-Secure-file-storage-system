import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * ActionToken Model
 * Used for storing magic links (like Account Unlock, Password Reset via AI, etc.)
 */
const ActionToken = sequelize.define('action_tokens', {
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
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    action_type: {
        type: DataTypes.ENUM('unlock_account', 'reset_credentials'),
        allowNull: false
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    is_used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['token'] },
        { fields: ['user_id', 'action_type'] }
    ]
});

export default ActionToken;
