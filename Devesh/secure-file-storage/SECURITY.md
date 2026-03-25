# Security Architecture Documentation

## Table of Contents
1. [Zero-Trust Encryption Model](#zero-trust-encryption-model)
2. [Threat Model](#threat-model)
3. [Security Controls](#security-controls)
4. [Attack Vectors & Mitigations](#attack-vectors--mitigations)
5. [Cryptographic Implementation](#cryptographic-implementation)
6. [Authentication & Authorization](#authentication--authorization)
7. [Audit & Compliance](#audit--compliance)
8. [Security Best Practices](#security-best-practices)

---

## Zero-Trust Encryption Model

### Core Principle
**"Never trust, always verify. Even the server cannot read user files."**

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ENCRYPTION LAYERS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: File Content Encryption                               │
│  ├─ Algorithm: AES-256-GCM                                      │
│  ├─ Key: Unique random 256-bit key per file                    │
│  ├─ IV: Random 128-bit initialization vector                   │
│  └─ Auth Tag: 128-bit authentication tag (prevents tampering)  │
│                                                                  │
│  Layer 2: File Key Encryption                                   │
│  ├─ Algorithm: AES-256-GCM                                      │
│  ├─ Key: Master key (from environment)                         │
│  ├─ IV: Random 128-bit initialization vector                   │
│  └─ Auth Tag: 128-bit authentication tag                       │
│                                                                  │
│  Layer 3: Integrity Verification                                │
│  ├─ Algorithm: SHA-256                                          │
│  ├─ Checksum: Hash of original file                            │
│  └─ Verification: On every download                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Approach?

1. **Per-File Encryption Keys**
   - Each file has a unique encryption key
   - Compromise of one key doesn't affect other files
   - Enables future key rotation without re-encrypting all files

2. **Master Key Encryption**
   - File keys are encrypted with master key
   - Master key never stored in database
   - Master key rotation possible without decrypting files

3. **Authenticated Encryption (GCM)**
   - Provides both confidentiality and integrity
   - Prevents tampering and bit-flipping attacks
   - Fails fast if data is modified

4. **Zero-Knowledge Architecture**
   - Server stores only encrypted data
   - Server admin cannot decrypt files
   - Database compromise doesn't reveal file contents

---

## Threat Model

### Assets to Protect
1. User files (confidentiality, integrity)
2. User credentials
3. Encryption keys
4. User metadata
5. Audit logs

### Threat Actors
1. **External Attackers**
   - Motivation: Data theft, ransomware
   - Capabilities: Network access, automated tools
   
2. **Malicious Insiders**
   - Motivation: Data theft, sabotage
   - Capabilities: Database access, server access
   
3. **Compromised Accounts**
   - Motivation: Varies
   - Capabilities: User-level access

### Attack Scenarios

| Scenario | Impact | Likelihood | Mitigation |
|----------|--------|------------|------------|
| Brute force login | Account takeover | High | Rate limiting + account locking |
| SQL injection | Data breach | Medium | ORM + input validation |
| XSS attack | Session hijacking | Medium | Input sanitization + CSP |
| CSRF attack | Unauthorized actions | Medium | SameSite cookies + CORS |
| Database compromise | Data exposure | Low | Encryption at rest |
| Server compromise | Full system access | Low | Zero-trust encryption |
| Man-in-the-middle | Credential theft | Medium | HTTPS + secure cookies |
| Token theft | Session hijacking | Medium | HttpOnly cookies + short expiry |

---

## Security Controls

### 1. Authentication Controls

#### Password Security
```javascript
// Password requirements enforced
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

// Hashing
- Algorithm: bcrypt
- Rounds: 12 (configurable)
- Salt: Automatically generated per password
```

#### Account Locking
```javascript
// Brute force protection
- Max attempts: 3 (configurable)
- Lock duration: 15 minutes (configurable)
- Automatic unlock after duration
- Manual unlock by admin (future)
```

#### Token Management
```javascript
// Access Token
- Type: JWT
- Expiry: 15 minutes
- Storage: Authorization header or cookie
- Algorithm: HS256

// Refresh Token
- Type: JWT
- Expiry: 7 days
- Storage: HttpOnly cookie + database
- Revocable: Yes
- Rotation: On every refresh
```

### 2. File Security Controls

#### Upload Security
```javascript
// File validation
- Type whitelist: pdf, doc, docx, txt, jpg, jpeg, png, zip
- MIME type verification
- Size limit: 50MB (configurable)
- Filename sanitization

// Encryption
- Algorithm: AES-256-GCM
- Unique key per file
- Random IV per file
- Authentication tag verification
```

#### Download Security
```javascript
// Access control
- Ownership verification
- Authentication required
- Authorization check

// Integrity
- Checksum verification
- Auth tag validation
- Decryption error handling
```

### 3. Network Security Controls

#### Rate Limiting
```javascript
// General API
- Window: 15 minutes
- Max requests: 100

// Authentication
- Window: 15 minutes
- Max requests: 5

// File upload
- Window: 1 hour
- Max requests: 20

// File download
- Window: 15 minutes
- Max requests: 50
```

#### Security Headers
```javascript
// Helmet.js configuration
- Strict-Transport-Security: max-age=31536000
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: restrictive policy
```

### 4. Data Security Controls

#### Input Validation
```javascript
// All inputs validated using express-validator
- Email format validation
- Password strength validation
- UUID format validation
- File type validation
- Size limit validation
```

#### Output Encoding
```javascript
// Prevent information leakage
- Sensitive fields excluded from JSON
- No stack traces in production
- Generic error messages
- Sanitized log output
```

---

## Attack Vectors & Mitigations

### 1. Brute Force Attacks

**Attack:** Automated password guessing

**Mitigations:**
- Rate limiting (5 attempts per 15 minutes)
- Account locking (after 3 failed attempts)
- Progressive delays
- CAPTCHA (future enhancement)
- Audit logging of failed attempts

### 2. Credential Stuffing

**Attack:** Using leaked credentials from other breaches

**Mitigations:**
- Account locking
- Email verification (future)
- Unusual activity detection (future)
- Password strength requirements
- Audit logging

### 3. SQL Injection

**Attack:** Malicious SQL in user input

**Mitigations:**
- Sequelize ORM (parameterized queries)
- Input validation
- Least privilege database user
- No dynamic SQL construction

### 4. Cross-Site Scripting (XSS)

**Attack:** Injecting malicious scripts

**Mitigations:**
- Input sanitization
- Output encoding
- Content Security Policy
- HttpOnly cookies (prevents JavaScript access)
- Helmet.js security headers

### 5. Cross-Site Request Forgery (CSRF)

**Attack:** Unauthorized actions via authenticated session

**Mitigations:**
- SameSite cookies (strict mode)
- CORS configuration
- Token validation
- Referer checking (future)

### 6. Man-in-the-Middle (MITM)

**Attack:** Intercepting network traffic

**Mitigations:**
- HTTPS required in production
- Secure cookie flag
- HSTS header
- Certificate pinning (future)

### 7. Insider Threats

**Attack:** Malicious admin accessing user data

**Mitigations:**
- Zero-trust encryption (admin can't decrypt)
- Audit logging (all actions logged)
- Least privilege access
- Separation of duties
- Regular access reviews (future)

### 8. Token Theft

**Attack:** Stealing JWT tokens

**Mitigations:**
- HttpOnly cookies (XSS protection)
- Short token expiry (15 minutes)
- Token rotation on refresh
- Secure cookie flag
- Token revocation support

### 9. File Upload Attacks

**Attack:** Uploading malicious files

**Mitigations:**
- File type whitelist
- MIME type verification
- Size limits
- Virus scanning (future)
- Sandboxed storage
- No direct execution

### 10. Denial of Service (DoS)

**Attack:** Resource exhaustion

**Mitigations:**
- Rate limiting
- Request size limits
- Connection pooling
- Timeout configurations
- Resource quotas (future)

---

## Cryptographic Implementation

### Encryption Algorithm: AES-256-GCM

**Why AES-256-GCM?**
- Industry standard for file encryption
- NIST approved
- Provides both confidentiality and authenticity
- Resistant to known attacks
- Hardware acceleration available

**Key Properties:**
```
Algorithm: AES (Advanced Encryption Standard)
Mode: GCM (Galois/Counter Mode)
Key Size: 256 bits
Block Size: 128 bits
IV Size: 128 bits (96 bits recommended, we use 128 for extra security)
Auth Tag Size: 128 bits
```

### Key Generation

```javascript
// File encryption key (per file)
const fileKey = crypto.randomBytes(32); // 256 bits

// Initialization vector (per encryption operation)
const iv = crypto.randomBytes(16); // 128 bits

// Both are cryptographically secure random
```

### Encryption Process

```javascript
// 1. Generate random file key
const fileKey = generateEncryptionKey();

// 2. Generate random IV
const iv = generateIV();

// 3. Encrypt file content
const cipher = crypto.createCipheriv('aes-256-gcm', fileKey, iv);
const encrypted = Buffer.concat([
  cipher.update(fileBuffer),
  cipher.final()
]);

// 4. Get authentication tag
const authTag = cipher.getAuthTag();

// 5. Encrypt file key with master key
const encryptedKey = encryptFileKey(fileKey);

// 6. Store: encrypted content, encrypted key, IV, auth tag
```

### Decryption Process

```javascript
// 1. Decrypt file key using master key
const fileKey = decryptFileKey(encryptedKey, keyIV, keyAuthTag);

// 2. Create decipher
const decipher = crypto.createDecipheriv('aes-256-gcm', fileKey, contentIV);

// 3. Set authentication tag
decipher.setAuthTag(authTag);

// 4. Decrypt content
const decrypted = Buffer.concat([
  decipher.update(encryptedContent),
  decipher.final() // Throws if auth tag doesn't match
]);

// 5. Verify checksum
if (calculateChecksum(decrypted) !== storedChecksum) {
  throw new Error('Integrity check failed');
}
```

### Key Management

**Master Key:**
- 256-bit (64 hex characters)
- Stored in environment variable
- Never in database or code
- Should be rotated periodically
- Backup in secure key management system

**File Keys:**
- 256-bit random per file
- Encrypted with master key before storage
- Stored in database (encrypted)
- Unique per file (key compromise is isolated)

---

## Authentication & Authorization

### JWT Token Structure

**Access Token Payload:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234568790,
  "iss": "secure-file-storage",
  "aud": "secure-file-storage-users"
}
```

**Refresh Token:**
- Same structure as access token
- Longer expiry (7 days)
- Stored in database for revocation
- Rotated on every use

### Authorization Flow

```
1. User logs in
   ↓
2. Server validates credentials
   ↓
3. Server generates access + refresh tokens
   ↓
4. Access token sent in response
   Refresh token sent as HttpOnly cookie
   ↓
5. Client includes access token in requests
   ↓
6. Server validates token on each request
   ↓
7. When access token expires:
   - Client sends refresh token
   - Server validates and issues new tokens
   - Old refresh token revoked
```

### Role-Based Access Control (RBAC)

**Current Roles:**
- `user` - Standard user (default)
- `admin` - Administrator (future features)

**Permission Model:**
```javascript
// File operations
- Upload: Authenticated users
- Download: File owner only
- Delete: File owner only
- List: Own files only

// Admin operations (future)
- View all files metadata: Admin only
- Manage users: Admin only
- View audit logs: Admin only
```

---

## Audit & Compliance

### Audit Log Design

**Immutability:**
```javascript
// Audit logs cannot be modified or deleted
AuditLog.beforeUpdate(() => {
  throw new Error('Audit logs are immutable');
});

AuditLog.beforeDestroy(() => {
  throw new Error('Audit logs cannot be deleted');
});
```

**Logged Events:**
- User registration
- Login success/failure
- Account locking
- Password changes
- Token refresh
- File upload
- File download
- File deletion
- Unauthorized access attempts
- Suspicious activity

**Log Structure:**
```javascript
{
  id: UUID,
  user_id: UUID,
  event_type: ENUM,
  event_description: TEXT,
  ip_address: STRING,
  user_agent: TEXT,
  resource_type: STRING,
  resource_id: UUID,
  status: ENUM('success', 'failure', 'warning'),
  metadata: JSONB,
  created_at: TIMESTAMP
}
```

### Compliance Considerations

**GDPR:**
- User data minimization
- Right to access (export user data)
- Right to deletion (soft delete with retention)
- Consent management (future)
- Data breach notification (audit logs)

**SOC 2:**
- Access controls
- Encryption at rest and in transit
- Audit logging
- Incident response (logs)
- Change management (version control)

**HIPAA (if applicable):**
- Encryption (AES-256)
- Access controls
- Audit trails
- Integrity controls (checksums)
- Transmission security (HTTPS)

---

## Security Best Practices

### Development

1. **Never commit secrets**
   - Use .env files
   - Add .env to .gitignore
   - Use environment variables

2. **Code review**
   - Security-focused reviews
   - Automated security scanning
   - Dependency auditing

3. **Testing**
   - Unit tests for security functions
   - Integration tests for auth flows
   - Penetration testing (periodic)

### Deployment

1. **Environment separation**
   - Development
   - Staging
   - Production

2. **Secrets management**
   - Use secret management service
   - Rotate secrets regularly
   - Limit secret access

3. **Monitoring**
   - Log aggregation
   - Anomaly detection
   - Alert on suspicious activity

### Operations

1. **Regular updates**
   - Security patches
   - Dependency updates
   - npm audit

2. **Backup strategy**
   - Database backups
   - Encrypted file backups
   - Master key backup (secure)

3. **Incident response**
   - Response plan
   - Log analysis
   - Communication plan

### User Education

1. **Password guidelines**
   - Use password manager
   - Unique passwords
   - Regular changes

2. **Security awareness**
   - Phishing awareness
   - Secure device usage
   - Report suspicious activity

---

## Security Checklist

### Pre-Production

- [ ] All secrets generated securely
- [ ] Master encryption key backed up securely
- [ ] Database password is strong
- [ ] HTTPS enabled
- [ ] COOKIE_SECURE=true
- [ ] CORS configured correctly
- [ ] Rate limits configured
- [ ] Logging configured
- [ ] Error handling doesn't leak info
- [ ] Input validation on all endpoints
- [ ] File upload restrictions in place
- [ ] Security headers configured

### Post-Production

- [ ] Monitor logs regularly
- [ ] Review audit logs
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Backup database daily
- [ ] Test disaster recovery
- [ ] Review access controls
- [ ] Penetration test annually

---

## Incident Response

### Security Incident Types

1. **Unauthorized Access**
   - Review audit logs
   - Identify compromised accounts
   - Force password reset
   - Revoke all tokens

2. **Data Breach**
   - Assess scope
   - Notify affected users
   - Review encryption
   - Patch vulnerability

3. **DoS Attack**
   - Identify attack pattern
   - Adjust rate limits
   - Block malicious IPs
   - Scale resources

### Response Steps

1. **Detect** - Monitor logs and alerts
2. **Contain** - Limit damage
3. **Investigate** - Analyze logs
4. **Remediate** - Fix vulnerability
5. **Recover** - Restore normal operations
6. **Learn** - Update procedures

---

**This security architecture is designed to be defense-in-depth. Multiple layers of security ensure that even if one layer is compromised, others remain intact.**
