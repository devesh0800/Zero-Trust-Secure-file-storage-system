import User from './User.js';
import File from './File.js';
import AuditLog from './AuditLog.js';
import RefreshToken from './RefreshToken.js';
import KnownDevice from './KnownDevice.js';
import ActionToken from './ActionToken.js';
import Notification from './Notification.js';
import OtpVerification from './OtpVerification.js';

/**
 * Central export for all models
 * Ensures relationships are properly established
 */

// Define Relationships
ActionToken.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(ActionToken, { foreignKey: 'user_id' });

Notification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });

// OtpVerification doesn't heavily rely on a tight User mapping for anonymous flows (like registration)
// But it uses user_identifier (email/phone) as the index.

export {
    User,
    File,
    AuditLog,
    RefreshToken,
    KnownDevice,
    ActionToken,
    Notification,
    OtpVerification
};

export default {
    User,
    File,
    AuditLog,
    RefreshToken,
    KnownDevice,
    ActionToken,
    Notification,
    OtpVerification
};
