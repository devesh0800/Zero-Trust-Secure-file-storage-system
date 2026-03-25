# Quick Start Guide

Get your secure file storage backend up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- Terminal/Command line access

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd secure-file-storage
npm install
```

This will install all required packages including Express, Sequelize, bcrypt, JWT, and security middleware.

### 2. Set Up Database

Create a PostgreSQL database:

```bash
# Using createdb command
createdb secure_file_storage

# OR using psql
psql -U postgres
CREATE DATABASE secure_file_storage;
\q
```

### 3. Generate Security Keys

Run the automated setup script:

```bash
node setup.js
```

This will:
- Generate a secure 256-bit master encryption key
- Generate JWT access and refresh secrets
- Generate cookie secret
- Create a `.env` file with all configurations

### 4. Configure Database Password

Open the `.env` file and update the database password:

```env
DB_PASSWORD=your_actual_postgres_password
```

### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# OR production mode
npm start
```

You should see:

```
✓ Configuration validated successfully
✓ Database connection established successfully
✓ Database synchronized successfully
✓ Application initialized successfully

==================================================
🚀 SECURE FILE STORAGE BACKEND
==================================================
Environment: development
Server running on port: 5000
API Version: v1
API URL: http://localhost:5000/api/v1
==================================================

✓ Server is ready to accept requests
```

## Test the API

### 1. Register a User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!@#",
    "full_name": "Test User"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!@#"
  }'
```

Save the `accessToken` from the response.

### 3. Upload a File

```bash
curl -X POST http://localhost:5000/api/v1/files/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/your/file.pdf"
```

### 4. List Your Files

```bash
curl -X GET http://localhost:5000/api/v1/files \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Download a File

```bash
curl -X GET http://localhost:5000/api/v1/files/FILE_ID/download \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  --output downloaded-file.pdf
```

## Project Structure Overview

```
secure-file-storage/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utilities (encryption, JWT, etc.)
│   └── server.js        # Entry point
├── uploads/             # Encrypted files (created automatically)
├── .env                 # Environment variables (DO NOT COMMIT)
└── package.json
```

## Common Issues

### Database Connection Failed

**Error:** `Unable to connect to database`

**Solution:**
1. Ensure PostgreSQL is running: `pg_isready`
2. Check database exists: `psql -l | grep secure_file_storage`
3. Verify credentials in `.env`

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
1. Change port in `.env`: `PORT=5001`
2. Or kill process using port 5000: `lsof -ti:5000 | xargs kill`

### Configuration Validation Failed

**Error:** `Missing required environment variables`

**Solution:**
1. Run `node setup.js` again
2. Ensure all keys in `.env` are at least the minimum length
3. Verify `MASTER_ENCRYPTION_KEY` is 64 hex characters

### File Upload Failed

**Error:** `File type not allowed`

**Solution:**
1. Check allowed file types in `.env`: `ALLOWED_FILE_TYPES`
2. Verify file MIME type is correct
3. Check file size is under 50MB

## Next Steps

1. **Read the Documentation**
   - `README.md` - Full project documentation
   - `API_DOCUMENTATION.md` - API reference
   - `SECURITY.md` - Security architecture

2. **Customize Configuration**
   - Adjust rate limits in `.env`
   - Configure CORS for your frontend
   - Set up HTTPS for production

3. **Production Deployment**
   - Set `NODE_ENV=production`
   - Enable HTTPS
   - Set `COOKIE_SECURE=true`
   - Use a process manager (PM2)
   - Set up monitoring and logging

4. **Frontend Integration**
   - Use the API endpoints documented in `API_DOCUMENTATION.md`
   - Store access token securely
   - Implement token refresh logic
   - Handle file uploads with FormData

## Useful Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start

# Generate new encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Check PostgreSQL status
pg_isready

# View PostgreSQL databases
psql -l

# Connect to database
psql -d secure_file_storage

# View logs (if using PM2)
pm2 logs

# Stop server (if using PM2)
pm2 stop secure-file-storage
```

## Security Reminders

⚠️ **IMPORTANT:**
- Never commit `.env` file to version control
- Keep your `MASTER_ENCRYPTION_KEY` secure
- Use strong database passwords
- Enable HTTPS in production
- Regularly update dependencies: `npm audit`
- Monitor logs for suspicious activity

## Getting Help

- Check `README.md` for detailed information
- Review `API_DOCUMENTATION.md` for API usage
- Read `SECURITY.md` for security details
- Check logs in `src/logs/` for errors

---

**You're all set! Your secure file storage backend is ready to use. 🚀**
