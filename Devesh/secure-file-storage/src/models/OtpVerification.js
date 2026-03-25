import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * OtpVerification Model
 * Temporarily stores OTPs for registration, login, and profile updates.
 */
const OtpVerification = sequelize.define('otp_verifications', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_identifier: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Email or Phone Number'
    },
    otp_code: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Hashed OTP code for security'
    },
    purpose: {
        type: DataTypes.ENUM('registration', 'login_email', 'login_phone', 'update_email', 'update_phone'),
        allowNull: false
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    is_used: {
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
        { fields: ['user_identifier'] },
        { fields: ['purpose'] }
    ]
});

export default OtpVerification;
