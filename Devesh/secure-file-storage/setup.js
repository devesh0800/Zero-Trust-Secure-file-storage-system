#!/usr/bin/env node

/**
 * Setup Script
 * Generates secure keys and creates .env file
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('='.repeat(60));
console.log('🔐 SECURE FILE STORAGE - SETUP WIZARD');
console.log('='.repeat(60));
console.log();

// Generate secure random keys
console.log('Generating secure keys...\n');

const masterKey = crypto.randomBytes(32).toString('hex');
const jwtAccessSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
const cookieSecret = crypto.randomBytes(32).toString('hex');

console.log('✓ Master Encryption Key generated (64 chars)');
console.log('✓ JWT Access Secret generated');
console.log('✓ JWT Refresh Secret generated');
console.log('✓ Cookie Secret generated');
console.log();

// Create .env file
const envContent = `# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=secure_file_storage
DB_USER=postgres
DB_PASSWORD=CHANGE_THIS_PASSWORD
DB_DIALECT=postgres

# Master Encryption Key (CRITICAL - NEVER COMMIT THIS)
MASTER_ENCRYPTION_KEY=${masterKey}

# JWT Configuration
JWT_ACCESS_SECRET=${jwtAccessSecret}
JWT_REFRESH_SECRET=${jwtRefreshSecret}
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security Configuration
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=3
ACCOUNT_LOCK_DURATION=900000
PASSWORD_MIN_LENGTH=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# File Upload Configuration
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png,zip
UPLOAD_DIR=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Cookie Configuration
COOKIE_SECRET=${cookieSecret}
COOKIE_SECURE=false
COOKIE_SAME_SITE=strict

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./src/logs
`;

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists!');
    console.log('   Backup created as .env.backup');
    fs.copyFileSync(envPath, path.join(__dirname, '.env.backup'));
}

fs.writeFileSync(envPath, envContent);

console.log('✓ .env file created successfully');
console.log();

console.log('='.repeat(60));
console.log('📋 NEXT STEPS:');
console.log('='.repeat(60));
console.log();
console.log('1. Update DB_PASSWORD in .env file');
console.log('2. Create PostgreSQL database:');
console.log('   createdb secure_file_storage');
console.log();
console.log('3. Install dependencies:');
console.log('   npm install');
console.log();
console.log('4. Start the server:');
console.log('   npm run dev');
console.log();
console.log('='.repeat(60));
console.log('⚠️  SECURITY REMINDERS:');
console.log('='.repeat(60));
console.log();
console.log('• NEVER commit .env to version control');
console.log('• Keep your MASTER_ENCRYPTION_KEY secure');
console.log('• Use strong database passwords');
console.log('• Enable HTTPS in production');
console.log('• Set COOKIE_SECURE=true in production');
console.log('• Regularly rotate your secrets');
console.log();
console.log('✓ Setup complete!');
console.log();
