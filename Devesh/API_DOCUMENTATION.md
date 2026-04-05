# 🛠️ SecureVault API Endpoint Registry (v1)

This document provides a comprehensive list of all backend API endpoints, their methods, and access levels.

## 🔐 1. Authentication (`/api/v1/auth`)
| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/captcha` | `GET` | Public | Generate a new security captcha. |
| `/register` | `POST` | Public | Register a new user node. |
| `/login` | `POST` | Public | Authenticate and get temporary session token. |
| `/verify-login-otp`| `POST` | Public | Verify Email/Phone OTP for login. |
| `/verify-mfa` | `POST` | Public | Verify MFA token (TOTP/Authenticator). |
| `/refresh` | `POST` | Public | Refresh the access token using HTTP-only cookie. |
| `/unlock/request` | `POST` | Public | Request account unlock (Zero-Trust recovery). |
| `/unlock/verify` | `POST` | Public | Verify recovery token. |
| `/logout` | `POST` | Private | Terminate current session. |
| `/logout-all` | `POST` | Private | Terminate all active sessions globally. |
| `/me` | `GET` | Private | Get authenticated user identity data. |
| `/sessions` | `GET` | Private | List all active device sessions. |
| `/sessions/:id` | `DELETE`| Private | Revoke a specific device session. |
| `/audit-logs` | `GET` | Private | Fetch immutable security audit logs. |

## 📁 2. File Management (`/api/v1/files`)
| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/upload` | `POST` | Full | Encrypt and upload a new binary object. |
| `/` | `GET` | Private | List all objects in the user's vault. |
| `/:id` | `GET` | Private | Get detailed metadata for a specific object. |
| `/:id/download` | `GET` | Private | Decrypt and download object (Requires PIN). |
| `/:id/signed-url` | `GET` | Private | Generate a time-limited signed download link. |
| `/:id` | `DELETE`| Full | Permanently purge an object from storage. |
| `/:id/revoke-all` | `PUT` | Full | Revoke all active shares for a specific file. |

## 👤 3. Profile & Security (`/api/v1/profile`)
*All endpoints in this section are **Private***.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Get profile details (Name, Node Type, Email). |
| `/` | `PUT` | Update basic profile metadata. |
| `/email` | `PUT` | Securely update email address (Requires OTP). |
| `/password` | `PUT` | Update account password. |
| `/storage` | `GET` | Get storage breakdown and usage stats. |
| `/activity` | `GET` | Get detailed device-grouped activity trace. |
| `/security` | `GET` | Get security status (MFA, PIN registration). |
| `/security-pin/request-otp` | `POST` | Request OTP to create/update Security PIN. |
| `/security-pin/update` | `POST` | Create or update the 6-digit Security PIN. |
| `/log-archive` | `POST` | Export full security audit trace (Requires PIN). |
| `/delete-everything` | `DELETE`| Purge all files while keeping account active. |
| `/delete-account` | `DELETE`| Permanent destruction of account and all data. |

## 🔗 4. Sharing & Connections
### Shares (`/api/v1/shares`)
| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | `POST` | Private | Create a public or password-protected share. |
| `/:token` | `GET` | Public | Get metadata for a shared file. |
| `/:token/download` | `GET/POST`| Public | Download shared file (Verify password if set). |

### Connections (`/api/v1/connections`)
| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/request` | `POST` | Private | Send a connection request via Email/Username. |
| `/` | `GET` | Private | List all active and pending connections. |
| `/:id/accept` | `PUT` | Private | Accept an incoming connection request. |

### Advanced Shares (`/api/v1/advanced-shares`)
| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/received` | `GET` | Private | List all files shared directly with you. |
| `/:id/accept` | `PUT` | Private | Accept a peer-to-peer file share. |

---
**Security Legend:**
- **Public:** No authentication required.
- **Private:** Valid JWT Access Token required in Header.
- **Full:** Full access required (Not in Restricted/Read-Only mode).
- **Requires PIN:** 6-digit Security PIN registry must be verified.
