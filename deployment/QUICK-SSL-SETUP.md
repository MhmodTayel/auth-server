# ⚡ Quick SSL Setup Guide

Complete SSL setup for **mtauth.online** in 3 steps.

---

## 📋 Prerequisites

- ✅ EC2 instance running with Docker
- ✅ Domain: mtauth.online (Namecheap)
- ✅ Backend already deployed and running on port 3000

---

## Step 1: Configure DNS (One-time setup)

### 1.1 Create Route53 Hosted Zone

1. Go to AWS Route53: https://console.aws.amazon.com/route53
2. Create hosted zone for `mtauth.online`
3. Copy the 4 nameservers (e.g., `ns-123.awsdns-12.com`)

### 1.2 Update Namecheap

1. Login to Namecheap: https://www.namecheap.com
2. Go to Domain List → Manage `mtauth.online`
3. Change nameservers to "Custom DNS"
4. Add the 4 Route53 nameservers
5. Save and wait 1-2 hours for propagation

### 1.3 Create A Records in Route53

| Record              | Type | Value              |
| ------------------- | ---- | ------------------ |
| `mtauth.online`     | A    | Your EC2 Public IP |
| `www.mtauth.online` | A    | Your EC2 Public IP |
| `api.mtauth.online` | A    | Your EC2 Public IP |

### 1.4 Verify DNS

```bash
# Check if domains resolve (wait until they do)
dig +short mtauth.online
dig +short api.mtauth.online

# Should return your EC2 IP
```

---

## Step 2: Open Ports on EC2

Update your EC2 Security Group:

| Type       | Port | Source    | Description           |
| ---------- | ---- | --------- | --------------------- |
| SSH        | 22   | Your IP   | SSH access            |
| HTTP       | 80   | 0.0.0.0/0 | Let's Encrypt & HTTP  |
| HTTPS      | 443  | 0.0.0.0/0 | HTTPS traffic         |
| Custom TCP | 3000 | 0.0.0.0/0 | Direct API (optional) |

---

## Step 3: Run SSL Setup Script

### 3.1 SSH to EC2

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd /home/ubuntu/deployment
```

### 3.2 Run the Setup Script

```bash
# Make executable
chmod +x setup-ssl.sh

# Run it
./setup-ssl.sh
```

The script will:

1. ✅ Check DNS resolution
2. ✅ Create nginx directories
3. ✅ Start nginx for ACME challenge
4. ✅ Request SSL certificates (you'll need to provide an email)
5. ✅ Configure nginx with SSL
6. ✅ Set up auto-renewal

### 3.3 Follow the Prompts

```
🔒 SSL Setup for mtauth.online

📋 Checking prerequisites...
Checking DNS resolution...
  mtauth.online resolves to: 54.123.45.67
  api.mtauth.online resolves to: 54.123.45.67
  This EC2 instance IP: 54.123.45.67

📁 Creating required directories...
📝 Creating nginx.conf...
🚀 Starting nginx for certificate challenge...
⏳ Waiting for nginx to be ready...

🔐 Requesting SSL certificates from Let's Encrypt...
Please enter your email address for Let's Encrypt notifications:
Email: your-email@example.com

Requesting certificate for mtauth.online and www.mtauth.online...
✅ Certificate obtained successfully

Requesting certificate for api.mtauth.online...
✅ Certificate obtained successfully

📝 Updating nginx configuration with SSL...
🔄 Reloading nginx with SSL configuration...
🧪 Testing nginx configuration...
nginx: configuration file /etc/nginx/nginx.conf test is successful

✅ SSL setup completed successfully!

📍 Your application is now available at:
  - https://api.mtauth.online/api/v1 (Backend API)
  - https://api.mtauth.online/api/v1/docs (API Documentation)
  - https://mtauth.online (Frontend - when deployed)
```

---

## Step 4: Update Your Deployment

### 4.1 Restart with SSL Profile

```bash
cd /home/ubuntu/deployment

# Stop backend on port 3000 (nginx will proxy it)
docker compose down backend

# Start everything with SSL
docker compose --profile with-ssl up -d
```

### 4.2 Verify

```bash
# Test HTTPS
curl https://api.mtauth.online/api/v1

# Should return: {"status":"ok","timestamp":"..."}

# Test Swagger docs
curl -I https://api.mtauth.online/api/v1/docs

# Should return: HTTP/2 200
```

---

## 🎉 You're Done!

Your API is now live at:

- **Backend API**: https://api.mtauth.online/api/v1
- **API Docs**: https://api.mtauth.online/api/v1/docs
- **Health Check**: https://api.mtauth.online/api/v1

---

## 🔧 Update Frontend

In your React app, update the API URL:

```javascript
// .env or config
REACT_APP_API_URL=https://api.mtauth.online/api/v1
```

---

## 🆘 Troubleshooting

### DNS not resolving

```bash
# Wait longer or flush DNS
dig +short api.mtauth.online @8.8.8.8
```

### Certificate request failed

```bash
# Check nginx logs
docker compose logs nginx

# Ensure port 80 is accessible
curl http://api.mtauth.online/.well-known/acme-challenge/test
```

### nginx not starting

```bash
# Check if files exist
ls -la nginx/
ls -la nginx/conf.d/

# Check nginx config
docker compose exec nginx nginx -t
```

### Want to start over?

```bash
# Remove certificates
sudo rm -rf certbot/conf/live/*
sudo rm -rf certbot/conf/archive/*
sudo rm -rf certbot/conf/renewal/*

# Run setup script again
./setup-ssl.sh
```

---

## 📝 Manual Commands

If you prefer manual setup:

```bash
# Request certificate manually
docker compose --profile with-ssl run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  -d api.mtauth.online

# Renew certificates
docker compose --profile with-ssl run --rm certbot renew

# Restart nginx
docker compose restart nginx
```

---

## 🔄 Certificate Auto-Renewal

Certbot automatically renews certificates every 12 hours. To check:

```bash
# View certificate info
docker compose --profile with-ssl run --rm certbot certificates

# Manual renewal test
docker compose --profile with-ssl run --rm certbot renew --dry-run
```

---

## 📊 Current Status Check

```bash
# Check all services
docker compose ps

# View logs
docker compose logs -f backend nginx

# Test endpoints
curl https://api.mtauth.online/api/v1
curl -X POST https://api.mtauth.online/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","password":"Test123!@#"}'
```

---

**That's it! Your backend is production-ready with HTTPS! 🚀**
