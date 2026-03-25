import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized configuration object
 * All environment variables are validated and exported from here
 */
const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiVersion: process.env.API_VERSION || 'v1',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'secure_file_storage',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },

  // Encryption - CRITICAL SECURITY COMPONENT
  encryption: {
    masterKey: process.env.MASTER_ENCRYPTION_KEY,
    algorithm: 'aes-256-gcm',
    ivLength: 16,
    authTagLength: 16,
    saltLength: 32
  },

  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: 'secure-file-storage',
    audience: 'secure-file-storage-users'
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 3,
    accountLockDuration: parseInt(process.env.ACCOUNT_LOCK_DURATION, 10) || 900000, // 15 minutes
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 12
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 900000,
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 5
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800, // 50MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip'],
    uploadDir: process.env.UPLOAD_DIR || './uploads'
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },

  // Cookie
  cookie: {
    secret: process.env.COOKIE_SECRET,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'strict',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './src/logs'
  }
};

/**
 * Validate critical configuration on startup
 * Fail fast if required security configurations are missing
 */
export function validateConfig() {
  const required = [
    { key: 'MASTER_ENCRYPTION_KEY', value: config.encryption.masterKey, minLength: 64 },
    { key: 'JWT_ACCESS_SECRET', value: config.jwt.accessSecret, minLength: 32 },
    { key: 'JWT_REFRESH_SECRET', value: config.jwt.refreshSecret, minLength: 32 },
    { key: 'COOKIE_SECRET', value: config.cookie.secret, minLength: 32 }
  ];

  // Only require DB_PASSWORD for non-SQLite databases
  if (config.database.dialect !== 'sqlite') {
    required.push({ key: 'DB_PASSWORD', value: config.database.password, minLength: 8 });
  }

  const missing = [];
  const tooShort = [];

  for (const { key, value, minLength } of required) {
    if (!value) {
      missing.push(key);
    } else if (value.length < minLength) {
      tooShort.push(`${key} (minimum ${minLength} characters)`);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (tooShort.length > 0) {
    throw new Error(`Environment variables too short: ${tooShort.join(', ')}`);
  }

  // Validate master encryption key is hex
  if (!/^[0-9a-fA-F]{64}$/.test(config.encryption.masterKey)) {
    throw new Error('MASTER_ENCRYPTION_KEY must be a 64-character hexadecimal string');
  }

  console.log('✓ Configuration validated successfully');
}

export default config;
