# 🚀 Complete Deployment Guide

## 📋 Table of Contents

1. [Current Status](#current-status)
2. [Quick Start](#quick-start)
3. [DNS & SSL Setup](#dns--ssl-setup)
4. [Architecture](#architecture)
5. [Troubleshooting](#troubleshooting)

---

## Current Status

### ✅ What's Working

- ✅ **Backend API**: Built and running
- ✅ **Docker Images**: Auto-built and pushed to GHCR
- ✅ **CI/CD Pipeline**: Automated testing and deployment
- ✅ **EC2 Deployment**: Automatic deployment on push
- ✅ **MongoDB**: Running in production
- ✅ **Health Checks**: Automated monitoring
- ✅ **Security**: Helmet, CORS, Rate Limiting
- ✅ **Logging**: Structured logging with Pino
- ✅ **API Documentation**: Swagger/OpenAPI
- ✅ **Testing**: Unit and E2E tests with >90% coverage

### 🔧 Recent Fixes

- ✅ Fixed Docker image names to be lowercase (ghcr.io requirement)
- ✅ Fixed port mapping in docker-compose.prod.yml (ports vs expose)
- ✅ Added automatic copy of production docker-compose to EC2
- ✅ Removed obsolete `version` field from docker-compose
- ✅ Improved deployment verification (now checks from within EC2)

---

## Quick Start

### Current Access (HTTP)

Your backend is currently accessible at:

```
Backend API:     http://YOUR_EC2_IP:3000/api/v1
Health Check:    http://YOUR_EC2_IP:3000/api/v1
API Docs:        http://YOUR_EC2_IP:3000/api/v1/docs
Test Signup:     http://YOUR_EC2_IP:3000/api/v1/auth/signup
```

### Test Your API

```bash
# Health check
curl http://YOUR_EC2_IP:3000/api/v1

# Signup
curl -X POST http://YOUR_EC2_IP:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "SecurePass123!"
  }'

# Signin
curl -X POST http://YOUR_EC2_IP:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

---

## DNS & SSL Setup

### Overview

To enable your domain `mtauth.online` with HTTPS:

**URLs after SSL setup:**

- `https://api.mtauth.online/api/v1` → Backend API
- `https://api.mtauth.online/api/v1/docs` → API Docs
- `https://mtauth.online` → Frontend (when deployed)

### Step 1: Configure DNS (One-time, 1-2 hours)

#### 1.1 Create Route53 Hosted Zone

1. AWS Console → Route53 → Create hosted zone
2. Domain: `mtauth.online`
3. Type: Public
4. **Copy the 4 nameservers** (e.g., `ns-123.awsdns-12.com`)

#### 1.2 Update Namecheap

1. Namecheap → Domain List → Manage `mtauth.online`
2. Nameservers → Custom DNS
3. Add the 4 Route53 nameservers
4. Save → Wait 1-2 hours for DNS propagation

#### 1.3 Create A Records in Route53

| Record              | Type | Value              |
| ------------------- | ---- | ------------------ |
| `mtauth.online`     | A    | Your EC2 Public IP |
| `www.mtauth.online` | A    | Your EC2 Public IP |
| `api.mtauth.online` | A    | Your EC2 Public IP |

#### 1.4 Verify DNS Propagation

```bash
# Wait until these return your EC2 IP
dig +short mtauth.online
dig +short api.mtauth.online
dig +short www.mtauth.online
```

### Step 2: Update EC2 Security Group

Ensure ports are open:

| Type       | Port | Source    | Description                   |
| ---------- | ---- | --------- | ----------------------------- |
| SSH        | 22   | Your IP   | SSH access                    |
| HTTP       | 80   | 0.0.0.0/0 | Let's Encrypt & HTTP redirect |
| HTTPS      | 443  | 0.0.0.0/0 | HTTPS traffic                 |
| Custom TCP | 3000 | 0.0.0.0/0 | Direct API access             |

### Step 3: Run SSL Setup Script on EC2

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd /home/ubuntu/deployment

# Make script executable
chmod +x deployment/setup-ssl.sh

# Run SSL setup
./deployment/setup-ssl.sh
```

The script will:

1. Check DNS resolution
2. Create nginx configuration
3. Request SSL certificates from Let's Encrypt
4. Configure nginx with SSL
5. Set up automatic certificate renewal

### Step 4: Deploy with SSL Profile

```bash
# On EC2, restart with SSL enabled
cd /home/ubuntu/deployment
docker compose --profile with-ssl up -d
```

### Step 5: Verify HTTPS

```bash
# Test HTTPS
curl https://api.mtauth.online/api/v1

# Open in browser
https://api.mtauth.online/api/v1/docs
```

---

## Architecture

### Current Deployment

```
GitHub Repository
    ↓
GitHub Actions CI/CD
    ├─ Lint & Test
    ├─ Build Docker Image
    ├─ Push to ghcr.io/mhmodtayel/auth-server:latest
    └─ Deploy to EC2
         ↓
EC2 Instance (/home/ubuntu/deployment)
    ├─ docker-compose.yml (from docker-compose.prod.yml)
    ├─ .env (secrets)
    └─ Containers:
        ├─ mongodb (internal)
        ├─ backend (port 3000)
        └─ Optional: nginx + certbot (ports 80, 443)
```

### With SSL Enabled

```
Internet
    ↓ (HTTPS)
nginx (port 443)
    ├─ https://api.mtauth.online → backend:3000
    └─ https://mtauth.online → frontend:80 (future)
    ↓
backend:3000 (internal network)
    ↓
mongodb:27017 (internal network)
```

---

## CI/CD Pipeline

### Triggers

- Push to `main` or `master` branch
- Pull requests (tests only, no deployment)

### Jobs

1. **Lint & Code Quality**
   - ESLint
   - Prettier
   - Commit message validation

2. **Unit Tests**
   - Matrix: Node 18.x, 20.x
   - Coverage upload to Codecov
   - Controllers, Services, Strategies

3. **E2E Tests**
   - MongoDB service
   - Full API integration tests
   - Authentication flows

4. **Build & Push Docker Image**
   - Multi-stage build
   - Push to `ghcr.io/mhmodtayel/auth-server:latest`
   - Lowercase image name enforcement

5. **Deploy to EC2**
   - Copy `docker-compose.prod.yml` to EC2
   - Pull latest image
   - Restart backend service
   - Health check verification

---

## Environment Variables

### Required on EC2 (.env file)

```bash
# Node Environment
NODE_ENV=production

# MongoDB
MONGO_USERNAME=your_mongo_user
MONGO_PASSWORD=your_secure_password
MONGO_DATABASE=auth

# JWT
JWT_SECRET=your_very_long_secret_key_at_least_32_characters
JWT_EXPIRES_IN=7d

# Docker Image
BACKEND_IMAGE=ghcr.io/mhmodtayel/auth-server:latest
```

### Optional

```bash
# CORS
CORS_ORIGIN=https://mtauth.online,https://www.mtauth.online

# Frontend Image (when ready)
FRONTEND_IMAGE=ghcr.io/mhmodtayel/auth-frontend:latest
```

---

## Docker Compose Profiles

The `docker-compose.prod.yml` supports multiple deployment scenarios:

### Basic (Backend + MongoDB only)

```bash
docker compose up -d
```

Services: `mongodb`, `backend`

### With SSL (Backend + nginx + certbot)

```bash
docker compose --profile with-ssl up -d
```

Services: `mongodb`, `backend`, `nginx`, `certbot`

### With Frontend (Full stack)

```bash
docker compose --profile with-ssl --profile with-frontend up -d
```

Services: `mongodb`, `backend`, `nginx`, `certbot`, `frontend`

---

## Troubleshooting

### Deployment Failed

```bash
# SSH to EC2 and check logs
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd /home/ubuntu/deployment
docker compose logs backend
```

### Port 3000 Not Accessible

```bash
# Check if container is running
docker compose ps

# Should show: 0.0.0.0:3000->3000/tcp
# If not, update docker-compose.yml with latest from repo

# Pull latest config
git pull  # on local machine
# Then push to trigger redeployment
```

### SSL Certificate Issues

```bash
# Check if certificates exist
ls -la /home/ubuntu/deployment/certbot/conf/live/

# Check nginx logs
docker compose logs nginx

# Re-run SSL setup
./deployment/setup-ssl.sh
```

### DNS Not Resolving

```bash
# Check nameservers
dig NS mtauth.online

# Should show AWS Route53 nameservers
# If not, check Namecheap configuration

# Check from different DNS servers
dig @8.8.8.8 mtauth.online +short
dig @1.1.1.1 api.mtauth.online +short
```

### Backend Health Check Failing

```bash
# Check backend logs
docker compose logs backend

# Check MongoDB connection
docker compose exec backend sh
# Inside container:
curl http://localhost:3000/api/v1
```

### Frontend Container Unhealthy

```bash
# This is expected if frontend not deployed yet
# Deploy frontend when ready:
docker compose --profile with-frontend up -d
```

---

## Manual Deployment

If CI/CD fails, you can deploy manually:

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd /home/ubuntu/deployment

# Login to GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull latest image
docker pull ghcr.io/mhmodtayel/auth-server:latest

# Update .env
echo "BACKEND_IMAGE=ghcr.io/mhmodtayel/auth-server:latest" >> .env

# Restart
docker compose up -d backend

# Check status
docker compose ps
docker compose logs backend -f
```

---

## Next Steps

### 1. Complete SSL Setup (if not done)

Follow the [DNS & SSL Setup](#dns--ssl-setup) section above.

### 2. Deploy Frontend

When your frontend is ready:

1. Update frontend repo with similar CI/CD
2. Push frontend image to `ghcr.io/mhmodtayel/auth-frontend:latest`
3. On EC2:
   ```bash
   docker compose --profile with-ssl --profile with-frontend up -d
   ```

### 3. Add Monitoring (Optional)

Consider adding:

- CloudWatch for logs
- Prometheus + Grafana for metrics
- Sentry for error tracking
- Uptime monitoring (UptimeRobot, Pingdom)

### 4. Database Backups

Set up automated MongoDB backups:

```bash
# Create backup script
docker compose exec mongodb mongodump \
  --uri="mongodb://user:pass@localhost:27017/auth?authSource=admin" \
  --out=/backups/$(date +%Y%m%d)
```

### 5. Production Checklist

- [ ] SSL certificates installed
- [ ] DNS fully propagated
- [ ] Firewall rules configured
- [ ] Environment variables secured
- [ ] Database backups automated
- [ ] Monitoring set up
- [ ] Frontend deployed
- [ ] Load testing completed
- [ ] Documentation updated

---

## Support & Resources

- **GitHub Repository**: https://github.com/MhmodTayel/auth-server
- **API Documentation**: http://YOUR_EC2_IP:3000/api/v1/docs (or https://api.mtauth.online/api/v1/docs after SSL)
- **Deployment Scripts**: `./deployment/` directory
- **Quick SSL Setup**: `./deployment/QUICK-SSL-SETUP.md`

---

**Your backend is production-ready! 🎉**
