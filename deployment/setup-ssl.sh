#!/bin/bash
# SSL Certificate Setup Script using Let's Encrypt
# Run this on your EC2 instance after domain DNS is configured

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔒 SSL Setup for mtauth.online${NC}"
echo ""

# Check if running on EC2
if [ ! -d "/home/ubuntu/deployment" ]; then
    echo -e "${RED}❌ Error: /home/ubuntu/deployment not found${NC}"
    echo "Please run this script on your EC2 instance"
    exit 1
fi

cd /home/ubuntu/deployment

# Prerequisites check
echo -e "${BLUE}📋 Checking prerequisites...${NC}"
echo ""

# Check if domain resolves
echo -e "${YELLOW}Checking DNS resolution...${NC}"
DOMAIN_IP=$(dig +short mtauth.online | head -n1)
API_DOMAIN_IP=$(dig +short api.mtauth.online | head -n1)
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo "  mtauth.online resolves to: $DOMAIN_IP"
echo "  api.mtauth.online resolves to: $API_DOMAIN_IP"
echo "  This EC2 instance IP: $EC2_PUBLIC_IP"
echo ""

if [ "$DOMAIN_IP" != "$EC2_PUBLIC_IP" ] || [ "$API_DOMAIN_IP" != "$EC2_PUBLIC_IP" ]; then
    echo -e "${RED}❌ DNS not configured correctly!${NC}"
    echo ""
    echo "Please ensure:"
    echo "  1. Route53 A records point to this EC2 IP: $EC2_PUBLIC_IP"
    echo "  2. Namecheap nameservers are set to Route53"
    echo "  3. DNS propagation is complete (can take up to 48 hours)"
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create required directories
echo -e "${YELLOW}📁 Creating required directories...${NC}"
mkdir -p nginx/conf.d
mkdir -p certbot/www
mkdir -p certbot/conf

# Create nginx.conf if it doesn't exist
if [ ! -f "nginx/nginx.conf" ]; then
    echo -e "${YELLOW}📝 Creating nginx.conf...${NC}"
    cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;

    include /etc/nginx/conf.d/*.conf;
}
EOF
fi

# Create initial nginx config for certificate challenge
echo -e "${YELLOW}📝 Creating initial nginx configuration for ACME challenge...${NC}"
cat > nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name mtauth.online www.mtauth.online api.mtauth.online;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "SSL setup in progress...\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Start nginx and certbot with SSL profile
echo -e "${YELLOW}🚀 Starting nginx for certificate challenge...${NC}"
docker compose --profile with-ssl up -d nginx certbot

# Wait for nginx to start
echo -e "${YELLOW}⏳ Waiting for nginx to be ready...${NC}"
sleep 5

# Request SSL certificates
echo -e "${GREEN}🔐 Requesting SSL certificates from Let's Encrypt...${NC}"
echo -e "${YELLOW}Note: This will request certificates for:${NC}"
echo "  - mtauth.online"
echo "  - www.mtauth.online"
echo "  - api.mtauth.online"
echo ""
echo -e "${YELLOW}Please enter your email address for Let's Encrypt notifications:${NC}"
read -p "Email: " EMAIL

if [ -z "$EMAIL" ]; then
    echo -e "${RED}❌ Email is required${NC}"
    exit 1
fi

# Request certificate for main domains
echo -e "${YELLOW}Requesting certificate for mtauth.online and www.mtauth.online...${NC}"
docker compose --profile with-ssl run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d mtauth.online \
    -d www.mtauth.online

# Request certificate for API subdomain
echo -e "${YELLOW}Requesting certificate for api.mtauth.online...${NC}"
docker compose --profile with-ssl run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d api.mtauth.online

# Create production nginx configuration with SSL
echo -e "${YELLOW}📝 Updating nginx configuration with SSL...${NC}"
cat > nginx/conf.d/default.conf << 'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name mtauth.online www.mtauth.online api.mtauth.online;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS - API Backend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.mtauth.online;

    ssl_certificate /etc/letsencrypt/live/api.mtauth.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.mtauth.online/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# HTTPS - Frontend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mtauth.online www.mtauth.online;

    ssl_certificate /etc/letsencrypt/live/mtauth.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mtauth.online/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Reload nginx
echo -e "${YELLOW}🔄 Reloading nginx with SSL configuration...${NC}"
docker compose --profile with-ssl restart nginx

# Test nginx configuration
echo -e "${YELLOW}🧪 Testing nginx configuration...${NC}"
docker compose exec nginx nginx -t

echo ""
echo -e "${GREEN}✅ SSL setup completed successfully!${NC}"
echo ""
echo -e "${GREEN}📍 Your application is now available at:${NC}"
echo "  - https://api.mtauth.online/api/v1 (Backend API)"
echo "  - https://api.mtauth.online/api/v1/docs (API Documentation)"
echo "  - https://mtauth.online (Frontend - when deployed with --profile with-frontend)"
echo ""
echo -e "${YELLOW}📝 To deploy with SSL enabled:${NC}"
echo "  docker compose --profile with-ssl up -d"
echo ""
echo -e "${YELLOW}📝 To deploy with both SSL and frontend:${NC}"
echo "  docker compose --profile with-ssl --profile with-frontend up -d"
echo ""
echo -e "${BLUE}🔄 Certificates will auto-renew every 12 hours${NC}"
echo ""
