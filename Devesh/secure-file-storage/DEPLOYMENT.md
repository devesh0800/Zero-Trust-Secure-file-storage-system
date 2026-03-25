# Deployment Guide

Production deployment guide for the Secure File Storage Backend.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [HTTPS Configuration](#https-configuration)
6. [Process Management](#process-management)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup Strategy](#backup-strategy)
9. [Security Hardening](#security-hardening)

---

## Prerequisites

### Server Requirements
- Ubuntu 20.04 LTS or newer (recommended)
- 2+ CPU cores
- 4GB+ RAM
- 20GB+ storage
- Static IP address

### Software Requirements
- Node.js 18+ LTS
- PostgreSQL 12+
- Nginx (reverse proxy)
- PM2 (process manager)
- Certbot (SSL certificates)

---

## Server Setup

### 1. Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js

```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql --version
```

### 4. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. Install PM2

```bash
sudo npm install -g pm2
```

---

## Database Setup

### 1. Create Database User

```bash
sudo -u postgres psql

# In PostgreSQL shell:
CREATE USER filestore_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE secure_file_storage OWNER filestore_user;
GRANT ALL PRIVILEGES ON DATABASE secure_file_storage TO filestore_user;
\q
```

### 2. Configure PostgreSQL

Edit `/etc/postgresql/12/main/pg_hba.conf`:

```
# Add this line for local connections
local   secure_file_storage   filestore_user   md5
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### 3. Test Connection

```bash
psql -U filestore_user -d secure_file_storage -h localhost
```

---

## Application Deployment

### 1. Create Application User

```bash
sudo adduser --system --group --home /opt/filestore filestore
```

### 2. Clone/Upload Application

```bash
# Option 1: Clone from repository
sudo -u filestore git clone <your-repo> /opt/filestore/app

# Option 2: Upload via SCP
scp -r secure-file-storage user@server:/tmp/
sudo mv /tmp/secure-file-storage /opt/filestore/app
sudo chown -R filestore:filestore /opt/filestore/app
```

### 3. Install Dependencies

```bash
cd /opt/filestore/app
sudo -u filestore npm install --production
```

### 4. Configure Environment

```bash
# Generate keys
node setup.js

# Edit .env
sudo -u filestore nano .env
```

Update production values:

```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=secure_file_storage
DB_USER=filestore_user
DB_PASSWORD=your_secure_password

# Use the generated keys from setup.js
MASTER_ENCRYPTION_KEY=<generated>
JWT_ACCESS_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>
COOKIE_SECRET=<generated>

# Production settings
COOKIE_SECURE=true
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=warn
```

### 5. Create Required Directories

```bash
sudo -u filestore mkdir -p /opt/filestore/app/uploads
sudo -u filestore mkdir -p /opt/filestore/app/src/logs
```

### 6. Set Permissions

```bash
sudo chown -R filestore:filestore /opt/filestore/app
sudo chmod 700 /opt/filestore/app/uploads
sudo chmod 700 /opt/filestore/app/src/logs
sudo chmod 600 /opt/filestore/app/.env
```

---

## HTTPS Configuration

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Configure Nginx

Create `/etc/nginx/sites-available/filestore`:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

# Upstream Node.js application
upstream filestore_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/filestore_access.log;
    error_log /var/log/nginx/filestore_error.log;

    # Client body size (for file uploads)
    client_max_body_size 50M;

    # API endpoints
    location /api/v1/auth {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://filestore_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/v1 {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://filestore_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for large file uploads
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }

    # Health check
    location /health {
        proxy_pass http://filestore_backend;
        access_log off;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/filestore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Process Management

### 1. Create PM2 Ecosystem File

Create `/opt/filestore/app/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'secure-file-storage',
    script: './src/server.js',
    cwd: '/opt/filestore/app',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/opt/filestore/app/src/logs/pm2-error.log',
    out_file: '/opt/filestore/app/src/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M'
  }]
};
```

### 2. Start Application

```bash
cd /opt/filestore/app
sudo -u filestore pm2 start ecosystem.config.js
sudo -u filestore pm2 save
```

### 3. Setup PM2 Startup

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u filestore --hp /opt/filestore
```

### 4. Useful PM2 Commands

```bash
# View status
sudo -u filestore pm2 status

# View logs
sudo -u filestore pm2 logs

# Restart
sudo -u filestore pm2 restart secure-file-storage

# Stop
sudo -u filestore pm2 stop secure-file-storage

# Monitor
sudo -u filestore pm2 monit
```

---

## Monitoring & Logging

### 1. Log Rotation

Create `/etc/logrotate.d/filestore`:

```
/opt/filestore/app/src/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 filestore filestore
    sharedscripts
    postrotate
        sudo -u filestore pm2 reloadLogs
    endscript
}

/var/log/nginx/filestore*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
```

### 2. Setup Monitoring

Install monitoring tools:

```bash
# Install htop for system monitoring
sudo apt install -y htop

# Install fail2ban for security
sudo apt install -y fail2ban
```

Configure fail2ban for SSH:

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Application Health Checks

Create a health check script `/opt/filestore/health-check.sh`:

```bash
#!/bin/bash

HEALTH_URL="http://localhost:5000/api/v1/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): Health check passed"
    exit 0
else
    echo "$(date): Health check failed - HTTP $RESPONSE"
    sudo -u filestore pm2 restart secure-file-storage
    exit 1
fi
```

Add to crontab:

```bash
sudo crontab -e

# Add this line (check every 5 minutes)
*/5 * * * * /opt/filestore/health-check.sh >> /opt/filestore/health-check.log 2>&1
```

---

## Backup Strategy

### 1. Database Backup

Create `/opt/filestore/backup-db.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/filestore/backups/db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD='your_secure_password' pg_dump \
    -U filestore_user \
    -h localhost \
    secure_file_storage \
    > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "$(date): Database backup completed: $BACKUP_FILE.gz"
```

### 2. File Backup

Create `/opt/filestore/backup-files.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/filestore/backups/files"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/files_$DATE.tar.gz"

mkdir -p $BACKUP_DIR

# Backup encrypted files
tar -czf $BACKUP_FILE /opt/filestore/app/uploads/

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "$(date): File backup completed: $BACKUP_FILE"
```

### 3. Schedule Backups

```bash
sudo crontab -e

# Database backup daily at 2 AM
0 2 * * * /opt/filestore/backup-db.sh >> /opt/filestore/backup.log 2>&1

# File backup daily at 3 AM
0 3 * * * /opt/filestore/backup-files.sh >> /opt/filestore/backup.log 2>&1
```

---

## Security Hardening

### 1. Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Enable firewall
sudo ufw enable
```

### 2. Secure PostgreSQL

Edit `/etc/postgresql/12/main/postgresql.conf`:

```
# Listen only on localhost
listen_addresses = 'localhost'

# Enable SSL
ssl = on
```

### 3. Secure File Permissions

```bash
# Application files
sudo chmod -R 750 /opt/filestore/app
sudo chmod 600 /opt/filestore/app/.env

# Uploads directory
sudo chmod 700 /opt/filestore/app/uploads

# Logs directory
sudo chmod 700 /opt/filestore/app/src/logs
```

### 4. Regular Updates

```bash
# Create update script
sudo nano /opt/filestore/update.sh
```

```bash
#!/bin/bash

echo "Updating system packages..."
sudo apt update
sudo apt upgrade -y

echo "Updating Node.js packages..."
cd /opt/filestore/app
sudo -u filestore npm audit fix
sudo -u filestore npm update

echo "Restarting application..."
sudo -u filestore pm2 restart secure-file-storage

echo "Update completed at $(date)"
```

Schedule monthly updates:

```bash
sudo crontab -e

# Run updates on first day of month at 4 AM
0 4 1 * * /opt/filestore/update.sh >> /opt/filestore/update.log 2>&1
```

---

## Post-Deployment Checklist

- [ ] Application starts successfully
- [ ] Database connection works
- [ ] HTTPS is enabled and working
- [ ] SSL certificate auto-renewal configured
- [ ] PM2 process manager running
- [ ] Logs are being written
- [ ] Log rotation configured
- [ ] Backups are scheduled
- [ ] Firewall is enabled
- [ ] Health checks are running
- [ ] Monitoring is set up
- [ ] All secrets are secure
- [ ] File permissions are correct
- [ ] CORS is configured correctly
- [ ] Rate limiting is working
- [ ] Error handling doesn't leak info

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
sudo -u filestore pm2 logs

# Check system logs
sudo journalctl -u pm2-filestore

# Check Nginx logs
sudo tail -f /var/log/nginx/filestore_error.log
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Test connection
psql -U filestore_user -d secure_file_storage -h localhost
```

### SSL Certificate Issues

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Check certificate expiry
sudo certbot certificates

# Renew manually
sudo certbot renew
```

---

**Your production deployment is complete! Monitor logs regularly and keep the system updated.**
