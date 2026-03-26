import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcrypt';
import config from '../config/config.js';

/**
 * User Model
 * Stores user authentication and profile information
 * Passwords are hashed using bcrypt before storage
 */
const User = sequelize.define('users', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 30]
        }
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
        allowNull: true
    },
    dob: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    profile_pic: {
        type: DataTypes.STRING,
        allowNull: true
    },
    unique_share_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    is_locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_restricted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    locked_until: {
        type: DataTypes.DATE,
        allowNull: true
    },
    failed_login_attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user'
    },
    // Multi-Factor Authentication Fields
    mfa_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    mfa_secret: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mfa_backup_codes: {
        // Stored as an array of JSON objects or simple string array if dialect supports it. 
        // Using TEXT for basic JSON arrays in SQLite.
        type: DataTypes.TEXT,
        allowNull: true
    },
    // User-specific encryption key (encrypted with master key)
    // This enables per-user encryption for additional security
    encrypted_user_key: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    user_key_iv: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_key_auth_tag: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Advanced Security: Public Key for Asymmetric Encryption
    public_key: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'RSA-OAEP Public Key for secure sharing'
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
        { fields: ['email'] },
        { fields: ['is_active'] }
    ]
});

/**
 * Hash password and generate unique share ID before creating user
 */
User.beforeCreate(async (user) => {
    if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, config.security.bcryptRounds);
    }
    
    // Generate a unique 8-character alphanumeric string for sharing
    let isUnique = false;
    while (!isUnique) {
        const shareId = Math.random().toString(36).substring(2, 10).toUpperCase();
        const existing = await User.findOne({ where: { unique_share_id: shareId } });
        if (!existing) {
            user.unique_share_id = shareId;
            isUnique = true;
        }
    }
});

/**
 * Hash password before updating if it changed
 */
User.beforeUpdate(async (user) => {
    if (user.changed('password_hash')) {
        user.password_hash = await bcrypt.hash(user.password_hash, config.security.bcryptRounds);
    }
});

/**
 * Instance method to verify password
 */
User.prototype.verifyPassword = async function (password) {
    return await bcrypt.compare(password, this.password_hash);
};

/**
 * Instance method to check if account is locked
 */
User.prototype.isAccountLocked = function () {
    return this.is_locked;
};

/**
 * Instance method to increment failed login attempts
 */
User.prototype.incrementFailedAttempts = async function () {
    this.failed_login_attempts += 1;

    if (this.failed_login_attempts >= config.security.maxLoginAttempts) {
        this.is_locked = true;
        // The account is permanently locked until the user unlocks it 
        // through the AI-driven unlock flow.
    }

    await this.save();
};

/**
 * Instance method to reset failed login attempts
 */
User.prototype.resetFailedAttempts = async function () {
    this.failed_login_attempts = 0;
    this.is_locked = false;
    this.last_login = new Date();
    await this.save();
};

/**
 * Remove sensitive data from JSON output
 */
User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.encrypted_user_key;
    delete values.user_key_iv;
    delete values.user_key_auth_tag;
    delete values.mfa_secret;
    delete values.mfa_backup_codes;
    return values;
};

export default User;
