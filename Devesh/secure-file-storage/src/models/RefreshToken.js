import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

/**
 * RefreshToken Model
 * Stores refresh tokens for JWT authentication
 * Enables token revocation and session management
 */
const RefreshToken = sequelize.define('refresh_tokens', {
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
    token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    is_revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    revoked_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
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
        { fields: ['token'] },
        { fields: ['expires_at'] },
        { fields: ['is_revoked'] }
    ]
});

/**
 * Define relationship with User
 */
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refresh_tokens' });

/**
 * Instance method to check if token is valid
 */
RefreshToken.prototype.isValid = function () {
    if (this.is_revoked) return false;
    if (new Date() > this.expires_at) return false;
    return true;
};

/**
 * Instance method to revoke token
 */
RefreshToken.prototype.revoke = async function () {
    this.is_revoked = true;
    this.revoked_at = new Date();
    await this.save();
};

export default RefreshToken;
