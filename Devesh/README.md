# 🔐 SecureVault: Zero-Trust Encrypted File Storage System

SecureVault is a high-security, **Zero-Trust Architecture** file storage ecosystem. It ensures that your files are encrypted on YOUR device using the WebCrypto API before they are uploaded. This means not even the server or database administrators can ever see your private data.

---

## 🚀 Recent Improvements & Milestones

In our latest development sprint, we have finalized the core security and user experience features:
- **Refined Registration Flow:** A sophisticated 2-step registration process with email-based OTP verification.
- **Client-Side Identity Keys:** Integrated RSA-OAEP and AES-GCM key generation during signup for true end-to-end encryption.
- **Security PIN Integration:** Added a mandatory 6-digit Security PIN (stored locally/encrypted) to authorize high-stakes actions like file downloads.
- **Captcha Safeguards:** Implemented a visual Captcha system on critical routes to prevent automated brute-force or bot registrations.
- **Premium Glassmorphic UI:** A complete redesign of the Login and Register pages with advanced CSS animations, morphing background orbs, and a futuristic aesthetic.
- **Inactivity Sentinel:** A proactive security guard that monitors user idle time and auto-locks the session to prevent unauthorized access to open tabs.

---

## 🌟 Core Feature Set

### 1. **Zero-Trust Security**
- **E2EE (End-to-End Encryption):** Files are encrypted using **AES-256-GCM** on the client side.
- **Secure Key Derivation:** Uses your password and a unique salt to derive high-entropy encryption keys.
- **Identity Locking:** Your private identity key is encrypted with your **Security PIN**, ensuring even if your session is hijacked, your files remain locked.

### 2. **Advanced Authentication**
- **Dual-Step Verification:** Registration requires a verified email OTP before account creation.
- **Smart Captcha:** Prevents bot signups with a refreshable, backend-verified Captcha system.
- **MFA Ready:** Built-in support for Multi-Factor Authentication via email delivery.
- **JWT Protection:** Uses HttpOnly, Secure, and SameSite cookies to prevent XSS-based token theft.

### 3. **Premium UX & UI**
- **Modern Dashboard:** A clean, glass-textured interface for managing your secure vault.
- **Reactive States:** Real-time password strength monitoring and requirement checklists.
- **Responsive Design:** Fully optimized for mobile, tablet, and desktop viewing.

---

## 🛠️ Technology Stack

| Component | Technical Choice |
| :--- | :--- |
| **Frontend** | Next.js 15+, React 19, Tailwind CSS 4, Framer Motion |
| **Backend** | Node.js (Express), SQLite (Sequelize ORM), Winston Logging |
| **Cryptography** | WebCrypto API (Native Browser Support), Bcrypt (Password Hashing) |
| **Security** | Express-Validator, Rate-Limiting, Helmet.js Security Headers |

---

## 📂 Project Structure

```text
DEVESH/
├── frontend/                 # Next.js Application
│   ├── app/                  # Main Application Logic (Register/Login/Dashboard)
│   ├── lib/                  # Crypto Helpers, Auth Context, API Client
│   └── components/           # Reusable UI Elements (Modals, Guards)
├── secure-file-storage/      # Node.js API (Backend)
│   ├── src/
│   │   ├── controllers/      # Auth, OTP, File & Captcha Handlers
│   │   ├── models/           # User & File Database Schemas
│   │   └── services/         # Mailer, OTP, and Auth Logic
│   └── uploads/              # Encrypted storage directory (.enc files)
└── README.md                 # Project Overview (This file)
```

---

## 🛡️ Security Audit & Logs
The system maintains an immutable **Audit Log** for every action:
- Successful/Failed Login attempts (with IP tracking).
- Identity key modifications.
- File upload/download/deletion events.
- PIN resets and security setting changes.

---

## 👤 Credits
Developed by **Devesh** with support from the **Antigravity AI Team**.
**Current Version:** 1.0.0-PROD
**Status:** All Security Systems Nominal. 🚀
