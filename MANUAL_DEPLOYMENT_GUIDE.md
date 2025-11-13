# Protocol Bank - Manual Deployment Guide

**Version**: 1.0  
**Last Updated**: November 13, 2025  
**Target Environment**: AWS EC2 (Ubuntu 22.04)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v22.13.0 (already installed)
- **pnpm**: Latest version (already installed)
- **PostgreSQL**: 14 or higher
- **Redis**: 7.0 or higher (optional, for background jobs)
- **Git**: For code deployment
- **PM2**: For process management (recommended)

### Required Access

- SSH access to AWS EC2 server
- GitHub repository access
- Domain DNS configured to point to server IP

---

## Server Setup

### 1. Connect to AWS EC2

```bash
ssh -i your-key.pem ubuntu@your-server-ip
```

### 2. Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Install PostgreSQL

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql-14 postgresql-contrib-14

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

### 4. Install Redis (Optional)

```bash
sudo apt install -y redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Check status
sudo systemctl status redis-server
```

### 5. Install PM2 Process Manager

```bash
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions printed by the command above
```

---

## Database Setup

### 1. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell, run:
CREATE DATABASE protocol_bank;
CREATE USER protocol_bank_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE protocol_bank TO protocol_bank_user;

# Grant schema privileges
\c protocol_bank
GRANT ALL ON SCHEMA public TO protocol_bank_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO protocol_bank_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO protocol_bank_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO protocol_bank_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO protocol_bank_user;

# Exit PostgreSQL
\q
```

### 2. Initialize Database Schema

```bash
# Clone repository (if not already done)
cd /home/ubuntu
git clone https://github.com/everest-an/Protocol-Bank.git protocol-bank-repo
cd protocol-bank-repo

# Initialize database
sudo -u postgres psql -d protocol_bank -f apps/backend/init-db.sql
sudo -u postgres psql -d protocol_bank -f apps/backend/init-notifications.sql
sudo -u postgres psql -d protocol_bank -f apps/backend/create-missing-tables.sql

# Optional: Initialize AML/KYC tables
# sudo -u postgres psql -d protocol_bank -f apps/backend/init-aml.sql
# sudo -u postgres psql -d protocol_bank -f apps/backend/init-kyc.sql
```

### 3. Verify Database Tables

```bash
sudo -u postgres psql -d protocol_bank -c "\dt"
```

You should see tables like:
- `accounts`
- `transactions`
- `stream_payments`
- `batch_payments`
- `scheduled_payments`
- `notifications`
- `automation_flows`
- etc.

---

## Backend Deployment

### 1. Navigate to Backend Directory

```bash
cd /home/ubuntu/protocol-bank-repo/apps/backend
```

### 2. Create Environment Variables File

```bash
nano .env
```

**Copy and paste the following**, replacing placeholders with actual values:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=protocol_bank
DB_USER=protocol_bank_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# JWT Configuration
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_HERE_CHANGE_THIS
JWT_EXPIRES_IN=7d

# Redis Configuration (if using Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS Configuration
CORS_ORIGIN=https://protocolbanks.com,https://www.protocolbanks.com

# Blockchain Configuration
ETHEREUM_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHEREUM_CHAIN_ID=11155111

# X402 Configuration
X402_BATCH_SETTLEMENT_ADDRESS=0x47C1eC37fB91E69e0FCD901B2F89b40FD724E11b
MOCK_USDC_ADDRESS=0x114E248bdF47Bad9948bF94d84848bAC1E36b75C

# Notification Configuration
NOTIFICATION_EMAIL_ENABLED=false
NOTIFICATION_SMS_ENABLED=false

# AML/KYC Configuration
AML_ENABLED=false
KYC_ENABLED=false
```

**Important**: 
- Generate a strong JWT secret: `openssl rand -base64 32`
- Use the database password you set earlier

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Test Backend Locally

```bash
# Test run
node server.js
```

You should see:
```
🚀 Server running on port 3001
📍 Health check: http://localhost:3001/health
🔌 Socket.IO server is ready
✅ Database connection successful
```

Press `Ctrl+C` to stop.

### 5. Start Backend with PM2

```bash
# Start backend
pm2 start server.js --name protocol-bank-backend

# Check status
pm2 status

# View logs
pm2 logs protocol-bank-backend

# Save PM2 configuration
pm2 save
```

### 6. Configure Firewall

```bash
# Allow backend port (if needed for internal communication)
sudo ufw allow 3001/tcp

# Ensure SSH is allowed
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

---

## Frontend Deployment

### 1. Navigate to Frontend Directory

```bash
cd /home/ubuntu/protocol-bank-repo/apps/frontend
```

### 2. Create Environment Variables File

```bash
nano .env
```

**Copy and paste the following**:

```env
# API Configuration
VITE_API_BASE_URL=https://protocolbanks.com/api/v1
VITE_SOCKET_URL=https://protocolbanks.com

# Blockchain Configuration
VITE_ETHEREUM_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_ETHEREUM_CHAIN_ID=11155111

# X402 Configuration
VITE_X402_BATCH_SETTLEMENT_ADDRESS=0x47C1eC37fB91E69e0FCD901B2F89b40FD724E11b
VITE_MOCK_USDC_ADDRESS=0x114E248bdF47Bad9948bF94d84848bAC1E36b75C

# Feature Flags
VITE_ENABLE_X402=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_AUTOMATION=true
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Build Frontend

```bash
pnpm run build
```

This creates a `dist` directory with optimized production files.

### 5. Setup Nginx (Web Server)

#### Install Nginx

```bash
sudo apt install -y nginx
```

#### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/protocolbanks.com
```

**Copy and paste the following**:

```nginx
# Frontend server
server {
    listen 80;
    listen [::]:80;
    server_name protocolbanks.com www.protocolbanks.com;

    root /home/ubuntu/protocol-bank-repo/apps/frontend/dist;
    index index.html;

    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO proxy
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

#### Enable Site and Restart Nginx

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/protocolbanks.com /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx on boot
sudo systemctl enable nginx
```

### 6. Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d protocolbanks.com -d www.protocolbanks.com

# Follow the prompts and choose to redirect HTTP to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Verification

### 1. Check Backend Health

```bash
curl http://localhost:3001/health
```

Expected output:
```json
{"status":"ok","timestamp":"2025-11-13T..."}
```

### 2. Check Frontend

Open browser and visit:
- http://protocolbanks.com (or https:// if SSL is configured)

You should see the homepage.

### 3. Test User Registration

1. Click "Connect Wallet"
2. Click "Need an account? Register"
3. Fill in:
   - Username: testuser
   - Email: test@example.com
   - Password: TestPassword123!
4. Click "Register"

**Expected**: Success message and redirect to dashboard

**If it fails**: Check backend logs:
```bash
pm2 logs protocol-bank-backend
```

### 4. Check Database Connection

```bash
sudo -u postgres psql -d protocol_bank -c "SELECT * FROM accounts;"
```

You should see the newly registered user.

### 5. Test All Features

- **Analytics**: Visit `/analytics` - should show cash flow charts
- **Payments**: Visit `/payments` - should show payment forms
- **Batch Payment**: Try uploading a CSV file
- **X402**: Enable X402 mode and test batch settlement
- **Automation**: Visit `/automation` - should show flow builder

---

## Troubleshooting

### Backend Not Starting

**Check logs**:
```bash
pm2 logs protocol-bank-backend --lines 100
```

**Common issues**:

1. **Database connection failed**
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check database credentials in `.env`
   - Test connection: `psql -U protocol_bank_user -d protocol_bank -h localhost`

2. **Port already in use**
   - Check what's using port 3001: `sudo lsof -i :3001`
   - Kill the process or change PORT in `.env`

3. **Missing dependencies**
   - Reinstall: `cd apps/backend && pnpm install`

### Frontend Not Loading

**Check Nginx logs**:
```bash
sudo tail -f /var/log/nginx/error.log
```

**Common issues**:

1. **404 errors**
   - Verify `dist` directory exists: `ls apps/frontend/dist`
   - Rebuild: `cd apps/frontend && pnpm run build`

2. **API calls failing**
   - Check Nginx proxy configuration
   - Verify backend is running: `pm2 status`
   - Test API directly: `curl http://localhost:3001/health`

3. **CORS errors**
   - Update `CORS_ORIGIN` in backend `.env`
   - Restart backend: `pm2 restart protocol-bank-backend`

### Database Issues

**Reset database** (WARNING: This deletes all data):
```bash
sudo -u postgres psql -c "DROP DATABASE protocol_bank;"
sudo -u postgres psql -c "CREATE DATABASE protocol_bank;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE protocol_bank TO protocol_bank_user;"
sudo -u postgres psql -d protocol_bank -f apps/backend/init-db.sql
```

**Check table structure**:
```bash
sudo -u postgres psql -d protocol_bank -c "\d accounts"
```

### PM2 Process Management

```bash
# View all processes
pm2 list

# Restart backend
pm2 restart protocol-bank-backend

# Stop backend
pm2 stop protocol-bank-backend

# Delete process
pm2 delete protocol-bank-backend

# View detailed info
pm2 show protocol-bank-backend

# Monitor in real-time
pm2 monit
```

---

## Updating the Application

### Update Backend

```bash
# Pull latest code
cd /home/ubuntu/protocol-bank-repo
git pull origin main

# Install new dependencies
cd apps/backend
pnpm install

# Restart backend
pm2 restart protocol-bank-backend
```

### Update Frontend

```bash
# Pull latest code (if not already done)
cd /home/ubuntu/protocol-bank-repo
git pull origin main

# Rebuild frontend
cd apps/frontend
pnpm install
pnpm run build

# Nginx will automatically serve the new files
```

### Database Migrations

If there are new database tables or schema changes:

```bash
# Run migration scripts
sudo -u postgres psql -d protocol_bank -f apps/backend/migration-xxx.sql
```

---

## Performance Optimization

### Enable PM2 Cluster Mode

For better performance, run multiple backend instances:

```bash
pm2 delete protocol-bank-backend
pm2 start server.js --name protocol-bank-backend -i max
pm2 save
```

### Configure PostgreSQL

Edit PostgreSQL configuration for better performance:

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Recommended settings:
```
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

---

## Security Checklist

- [ ] Strong database password set
- [ ] Unique JWT secret generated
- [ ] SSL certificate installed (HTTPS)
- [ ] Firewall configured (only necessary ports open)
- [ ] SSH key-based authentication enabled
- [ ] Regular backups configured
- [ ] Environment variables not committed to Git
- [ ] CORS properly configured
- [ ] Rate limiting enabled (optional)
- [ ] Security headers configured in Nginx

---

## Backup Strategy

### Database Backup

```bash
# Create backup
sudo -u postgres pg_dump protocol_bank > /home/ubuntu/backups/protocol_bank_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
sudo -u postgres psql protocol_bank < /home/ubuntu/backups/protocol_bank_20251113_120000.sql
```

### Automated Daily Backups

```bash
# Create backup script
nano /home/ubuntu/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump protocol_bank > $BACKUP_DIR/protocol_bank_$(date +%Y%m%d).sql
# Keep only last 7 days
find $BACKUP_DIR -name "protocol_bank_*.sql" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /home/ubuntu/backup.sh

# Add to crontab
crontab -e
```

Add this line:
```
0 2 * * * /home/ubuntu/backup.sh
```

---

## Monitoring

### Setup PM2 Monitoring

```bash
# Enable PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Check System Resources

```bash
# CPU and memory usage
htop

# Disk usage
df -h

# Database size
sudo -u postgres psql -d protocol_bank -c "SELECT pg_size_pretty(pg_database_size('protocol_bank'));"
```

---

## Support

If you encounter issues not covered in this guide:

1. Check backend logs: `pm2 logs protocol-bank-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-14-main.log`
4. Review the TEST_ISSUES_LOG.md file in the repository

---

**Deployment Guide Version**: 1.0  
**Last Updated**: November 13, 2025  
**Maintained by**: Manus AI
