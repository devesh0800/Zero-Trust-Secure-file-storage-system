# Secure File Storage Backend

A production-grade, zero-trust secure file storage system built with Node.js, Express.js, and PostgreSQL. This system implements banking-level security practices where files are encrypted before storage, and even server administrators cannot access user files without proper authentication.

## 🔐 Security Architecture

### Zero-Trust Encryption Model

```
┌─────────────────────────────────────────────────────────────┐
│                    ENCRYPTION FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Upload                                                 │
│       ↓                                                      │
│  Generate Random AES-256 Key (per file)                     │
│       ↓                                                      │
│  Encrypt File Content (AES-256-GCM)                         │
│       ↓                                                      │
│  Encrypt File Key with Master Key                           │
│       ↓                                                      │
│  Store Encrypted File + Encrypted Key in DB                 │
│       ↓                                                      │
│  Calculate SHA-256 Checksum                                 │
│                                                              │
│  User Download                                               │
│       ↓                                                      │
│  Verify Ownership                                            │
│       ↓                                                      │
│  Decrypt File Key with Master Key                           │
│       ↓                                                      │
│  Decrypt File Content                                        │
│       ↓                                                      │
│  Verify Integrity (Checksum)                                │
│       ↓                                                      │
│  Stream to Authenticated User                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Security Features

✅ **File Encryption**
- AES-256-GCM authenticated encryption
- Unique encryption key per file
- File keys encrypted with master key
- Integrity verification via SHA-256 checksums

✅ **Authentication & Authorization**
- JWT-based dual-token system (access + refresh)
- HttpOnly cookies for refresh tokens
- Account locking after 3 failed login attempts
- Strong password policy enforcement

✅ **Attack Protection**
- Rate limiting on all endpoints
- Brute force protection
- SQL injection prevention (Sequelize ORM)
- XSS protection
- CSRF protection
- Input validation and sanitization

✅ **Audit & Compliance**
- Immutable audit logs
- Comprehensive security event logging
- Access tracking
- Tamper-proof log design

## 📁 Project Structure

```
secure-file-storage/
├── src/
│   ├── config/
│   │   ├── config.js              # Centralized configuration
│   │   └── database.js            # Database connection
│   ├── controllers/
│   │   ├── authController.js      # Authentication endpoints
│   │   └── fileController.js      # File operation endpoints
│   ├── middlewares/
│   │   ├── auth.js                # Authentication & authorization
│   │   ├── errorHandler.js        # Centralized error handling
│   │   ├── rateLimiter.js         # Rate limiting
│   │   └── upload.js              # File upload handling
│   ├── models/
│   │   ├── User.js                # User model
│   │   ├── File.js                # File metadata model
│   │   ├── AuditLog.js            # Audit log model
│   │   ├── RefreshToken.js        # Refresh token model
│   │   └── index.js               # Model exports
│   ├── routes/
│   │   ├── authRoutes.js          # Auth routes
│   │   ├── fileRoutes.js          # File routes
│   │   └── index.js               # Route aggregator
│   ├── services/
│   │   ├── authService.js         # Authentication business logic
│   │   └── fileService.js         # File encryption/decryption logic
│   ├── utils/
│   │   ├── encryption.js          # Encryption utilities (CRITICAL)
│   │   ├── jwt.js                 # JWT utilities
│   │   ├── validators.js          # Input validation
│   │   └── logger.js              # Winston logger
│   ├── logs/                      # Application logs
│   └── server.js                  # Application entry point
├── uploads/                       # Encrypted file storage
├── .env.example                   # Environment template
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 12
- npm or yarn

### Installation

1. **Clone and navigate to the project**
```bash
cd secure-file-storage
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up PostgreSQL database**
```bash
# Create database
createdb secure_file_storage

# Or using psql
psql -U postgres
CREATE DATABASE secure_file_storage;
\q
```

4. **Configure environment variables**
```bash
cp .env.example .env
```

5. **Generate secure keys**
```bash
# Generate master encryption key (64-character hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT secrets (at least 32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

6. **Update .env file with generated keys**
```env
MASTER_ENCRYPTION_KEY=your_generated_64_char_hex_key
JWT_ACCESS_SECRET=your_generated_access_secret
JWT_REFRESH_SECRET=your_generated_refresh_secret
COOKIE_SECRET=your_generated_cookie_secret
DB_PASSWORD=your_database_password
```

7. **Start the server**
```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Authentication

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!@#",
  "full_name": "John Doe"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!@#"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Cookie: refreshToken=<token>
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

### File Operations

#### Upload File
```http
POST /api/v1/files/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <binary_file>
description: "Optional file description"
```

#### Download File
```http
GET /api/v1/files/:id/download
Authorization: Bearer <access_token>
```

#### List Files
```http
GET /api/v1/files?page=1&limit=20&sortBy=created_at&order=DESC
Authorization: Bearer <access_token>
```

#### Get File Metadata
```http
GET /api/v1/files/:id
Authorization: Bearer <access_token>
```

#### Delete File
```http
DELETE /api/v1/files/:id
Authorization: Bearer <access_token>
```

## 🔒 Security Best Practices Implemented

### 1. Password Security
- Minimum 12 characters
- Must contain: uppercase, lowercase, number, special character
- Hashed with bcrypt (12 rounds)
- Never stored in plaintext

### 2. Authentication Security
- JWT with short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days) stored in database
- HttpOnly cookies prevent XSS token theft
- Token revocation support
- Account locking after 3 failed attempts (15-minute lockout)

### 3. File Security
- AES-256-GCM authenticated encryption
- Unique key per file
- File keys encrypted with master key
- Integrity verification via checksums
- Ownership verification before access
- No direct file URL access

### 4. Network Security
- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 req/15min general, 5 req/15min auth)
- Request size limits
- HTTPS recommended in production

### 5. Data Security
- Input validation and sanitization
- SQL injection prevention (ORM)
- XSS protection
- No stack trace leakage in production
- Sensitive data excluded from JSON responses

### 6. Audit & Monitoring
- Immutable audit logs
- Security event logging
- Failed login tracking
- File access logging
- Winston-based structured logging

## 🏗️ Database Schema

### Users Table
```sql
- id (UUID, PK)
- email (UNIQUE)
- password_hash
- full_name
- is_active
- is_locked
- locked_until
- failed_login_attempts
- last_login
- role (user/admin)
- created_at
- updated_at
```

### Files Table
```sql
- id (UUID, PK)
- user_id (FK → users)
- original_filename
- stored_filename
- file_size
- encrypted_size
- mime_type
- file_extension
- encrypted_file_key
- file_key_iv
- file_key_auth_tag
- content_iv
- content_auth_tag
- checksum
- is_deleted
- last_accessed
- access_count
- created_at
- updated_at
```

### Audit Logs Table
```sql
- id (UUID, PK)
- user_id (FK → users)
- event_type
- event_description
- ip_address
- user_agent
- resource_type
- resource_id
- status
- metadata (JSONB)
- created_at
```

### Refresh Tokens Table
```sql
- id (UUID, PK)
- user_id (FK → users)
- token
- expires_at
- is_revoked
- revoked_at
- ip_address
- user_agent
- created_at
```

## 🛡️ Threat Model & Mitigations

| Threat | Mitigation |
|--------|-----------|
| Brute Force Attacks | Rate limiting + account locking |
| Credential Stuffing | Account locking + audit logging |
| SQL Injection | Sequelize ORM + input validation |
| XSS | Input sanitization + CSP headers |
| CSRF | SameSite cookies + CORS |
| Man-in-the-Middle | HTTPS (production) + secure cookies |
| Insider Attacks | Zero-trust encryption (admin can't read files) |
| Token Theft | HttpOnly cookies + short expiry |
| File Tampering | GCM auth tags + checksums |
| Data Breach | Encrypted files + encrypted keys |

## 📊 Performance Considerations

- Database connection pooling
- Compression middleware
- Efficient file streaming
- Indexed database queries
- Rate limiting prevents resource exhaustion

## 🔧 Configuration

All configuration is centralized in `src/config/config.js` and loaded from environment variables:

- **Server**: Port, environment, API version
- **Database**: Connection settings, pooling
- **Security**: Bcrypt rounds, login attempts, lock duration
- **JWT**: Secrets, expiry times
- **File Upload**: Max size, allowed types
- **Rate Limiting**: Window sizes, max requests
- **Logging**: Level, file paths

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 📝 Logging

Logs are stored in `src/logs/`:
- `error.log` - Error-level logs
- `combined.log` - All logs
- `security.log` - Security events

## 🚨 Error Handling

- Centralized error handling middleware
- No stack trace leakage in production
- Structured error responses
- Comprehensive error logging

## 🔐 Environment Variables

See `.env.example` for all required variables. **NEVER commit `.env` to version control.**

Critical variables:
- `MASTER_ENCRYPTION_KEY` - 64-char hex (CRITICAL)
- `JWT_ACCESS_SECRET` - Min 32 chars
- `JWT_REFRESH_SECRET` - Min 32 chars
- `COOKIE_SECRET` - Min 32 chars
- `DB_PASSWORD` - Database password

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use strong, randomly generated secrets
3. Enable HTTPS
4. Set `COOKIE_SECURE=true`
5. Configure proper CORS origins
6. Set up database backups
7. Monitor logs regularly
8. Implement log rotation
9. Use a reverse proxy (nginx)
10. Set up monitoring and alerting

## 📚 Future Enhancements

- [ ] Two-factor authentication (TOTP)
- [ ] Email verification
- [ ] Password reset flow
- [ ] File sharing with expiring links
- [ ] File versioning
- [ ] Virus scanning
- [ ] Admin dashboard
- [ ] User storage quotas
- [ ] File preview generation
- [ ] Bulk operations
- [ ] WebSocket for real-time updates
- [ ] Redis for session management
- [ ] S3-compatible storage backend

## 🤝 Contributing

This is a production-grade reference implementation. Contributions should maintain the security-first approach.

## 📄 License

MIT

## ⚠️ Security Disclosure

If you discover a security vulnerability, please email security@example.com instead of using the issue tracker.

---

**Built with security in mind. Zero trust. Zero compromise.**
