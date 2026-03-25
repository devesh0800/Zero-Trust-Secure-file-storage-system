# API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

All protected endpoints require a JWT access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

Refresh tokens are stored in HttpOnly cookies.

---

## Authentication Endpoints

### 1. Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!@#",
  "full_name": "John Doe"
}
```

**Password Requirements:**
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400` - Validation error
- `409` - Email already registered
- `429` - Too many requests

---

### 2. Login

Authenticate and receive access token.

**Endpoint:** `POST /auth/login`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!@#"
}
```

**Success Response (200 - Normal):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "last_login": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Partial Success Response (200 - MFA Required):**
```json
{
  "success": true,
  "message": "MFA Required",
  "data": {
    "mfa_required": true,
    "temp_token": "uuid"
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `403` - Account locked or inactive
- `429` - Too many requests

**Account Locking:**
- Account locks after 3 failed login attempts
- Lock duration: 15 minutes
- Failed attempts reset on successful login

---

### 3. Verify MFA Login

Complete login using a TOTP token (if MFA is enabled).

**Endpoint:** `POST /auth/verify-mfa`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**
```json
{
  "temp_token": "uuid",
  "mfa_token": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful with MFA",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "last_login": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400` - Missing tokens
- `401` - Invalid MFA token or Backup Code

---

### 4. Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Request:**
- Refresh token automatically sent via HttpOnly cookie
- Or include in request body:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `401` - Invalid or expired refresh token

---

### 5. Logout

Invalidate current refresh token.

**Endpoint:** `POST /auth/logout`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 6. Logout All Devices

Invalidate all refresh tokens for the user.

**Endpoint:** `POST /auth/logout-all`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

---

### 7. Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /auth/me`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "is_active": true,
      "last_login": "2024-01-01T00:00:00.000Z",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 8. Setup MFA

Initialize Two-Factor Authentication (TOTP).

**Endpoint:** `POST /auth/mfa/setup`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "MFA setup initialized",
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "data:image/png;base64,...",
    "backupCodes": ["A1B2C3D4", "E5F6G7H8"]
  }
}
```

**Note:** MFA is not fully active until verified via the `/auth/mfa/verify-setup` endpoint.

---

### 9. Verify MFA Setup

Verify the TOTP code to finalize MFA enablement.

**Endpoint:** `POST /auth/mfa/verify-setup`

**Authentication:** Required

**Request Body:**
```json
{
  "token": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "MFA has been successfully enabled"
}
```

**Error Responses:**
- `400` - Invalid MFA token

---

## File Endpoints

### 1. Upload File

Upload and encrypt a file.

**Endpoint:** `POST /files/upload`

**Authentication:** Required

**Rate Limit:** 20 uploads per hour

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file`
- Optional: `description` field

**Example (cURL):**
```bash
curl -X POST http://localhost:5000/api/v1/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/file.pdf" \
  -F "description=Important document"
```

**File Restrictions:**
- Max size: 50MB
- Allowed types: pdf, doc, docx, txt, jpg, jpeg, png, zip

**Success Response (201):**
```json
{
  "success": true,
  "message": "File uploaded and encrypted successfully",
  "data": {
    "file": {
      "id": "uuid",
      "original_filename": "document.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400` - No file uploaded / Invalid file type / File too large
- `429` - Upload limit exceeded

---

### 2. Download File

Download and decrypt a file.

**Endpoint:** `GET /files/:id/download`

**Authentication:** Required

**Rate Limit:** 50 downloads per 15 minutes

**Example:**
```bash
curl -X GET http://localhost:5000/api/v1/files/<file-id>/download \
  -H "Authorization: Bearer <token>" \
  --output downloaded-file.pdf
```

**Success Response (200):**
- Content-Type: Original file MIME type
- Content-Disposition: `attachment; filename="original-filename"`
- Body: Decrypted file binary data

**Error Responses:**
- `403` - Access denied (not file owner)
- `404` - File not found
- `500` - Decryption failed / Integrity check failed

**Security:**
- Only file owner can download
- File is decrypted on-the-fly
- Integrity verified before sending
- Access is logged

---

### 3. List Files

Get all files for authenticated user.

**Endpoint:** `GET /files`

**Authentication:** Required

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `sortBy` (default: created_at) - Sort field
- `order` (default: DESC) - Sort order (ASC/DESC)

**Example:**
```
GET /files?page=1&limit=10&sortBy=created_at&order=DESC
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "uuid",
        "original_filename": "document.pdf",
        "file_size": 1024000,
        "mime_type": "application/pdf",
        "file_extension": "pdf",
        "created_at": "2024-01-01T00:00:00.000Z",
        "last_accessed": "2024-01-01T00:00:00.000Z",
        "access_count": 5
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

---

### 4. Get File Metadata

Get metadata for a specific file.

**Endpoint:** `GET /files/:id`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "uuid",
      "original_filename": "document.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "file_extension": "pdf",
      "description": "Important document",
      "created_at": "2024-01-01T00:00:00.000Z",
      "last_accessed": "2024-01-01T00:00:00.000Z",
      "access_count": 5
    }
  }
}
```

**Error Responses:**
- `404` - File not found

---

### 5. Delete File

Soft delete a file.

**Endpoint:** `DELETE /files/:id`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Error Responses:**
- `404` - File not found

**Note:** This is a soft delete. The encrypted file remains on disk but is marked as deleted in the database.

---

## Health Check

### Check API Status

**Endpoint:** `GET /health`

**Authentication:** Not required

**Success Response (200):**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limits

| Endpoint Type | Limit |
|--------------|-------|
| General API | 100 requests per 15 minutes |
| Authentication | 5 requests per 15 minutes |
| File Upload | 20 uploads per hour |
| File Download | 50 downloads per 15 minutes |

Rate limit headers are included in responses:
- `RateLimit-Limit` - Request limit
- `RateLimit-Remaining` - Remaining requests
- `RateLimit-Reset` - Time when limit resets

---

## Security Headers

All responses include security headers:
- `Strict-Transport-Security` - HSTS
- `X-Content-Type-Options` - nosniff
- `X-Frame-Options` - DENY
- `X-XSS-Protection` - 1; mode=block
- `Content-Security-Policy` - CSP rules

---

## Example Workflows

### Complete Upload/Download Flow

```bash
# 1. Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!@#",
    "full_name": "John Doe"
  }'

# 2. Login (save the accessToken)
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!@#"
  }'

# 3. Upload file
curl -X POST http://localhost:5000/api/v1/files/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@document.pdf"

# 4. List files
curl -X GET http://localhost:5000/api/v1/files \
  -H "Authorization: Bearer <access_token>"

# 5. Download file
curl -X GET http://localhost:5000/api/v1/files/<file-id>/download \
  -H "Authorization: Bearer <access_token>" \
  --output downloaded.pdf

# 6. Delete file
curl -X DELETE http://localhost:5000/api/v1/files/<file-id> \
  -H "Authorization: Bearer <access_token>"

# 7. Logout
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer <access_token>"
```

---

## Postman Collection

Import this JSON into Postman for easy testing:

```json
{
  "info": {
    "name": "Secure File Storage API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api/v1"
    },
    {
      "key": "accessToken",
      "value": ""
    }
  ]
}
```

---

**For more information, see the main README.md**
