#!/bin/bash
# DNS Configuration Script for Las Reinas
# This script configures Nginx and environment for lasreinascolusa.com

set -e

echo "🚀 Setting up DNS configuration for lasreinascolusa.com"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

APP_DIR="/var/www/alessa-ordering"
ENV_FILE="$APP_DIR/.env"
NGINX_SITE="/etc/nginx/sites-available/lasreinascolusa.com"
NGINX_ENABLED="/etc/nginx/sites-enabled/lasreinascolusa.com"

echo "📝 Step 1: Update CUSTOM_DOMAIN_MAP in .env"
if [ -f "$ENV_FILE" ]; then
  # Remove existing CUSTOM_DOMAIN_MAP if present
  sed -i '/^CUSTOM_DOMAIN_MAP=/d' "$ENV_FILE"
  
  # Add new CUSTOM_DOMAIN_MAP
  echo 'CUSTOM_DOMAIN_MAP={"lasreinascolusa.com":"lasreinas","www.lasreinascolusa.com":"lasreinas"}' >> "$ENV_FILE"
  echo -e "${GREEN}✅ CUSTOM_DOMAIN_MAP updated${NC}"
else
  echo -e "${YELLOW}⚠️  .env file not found at $ENV_FILE${NC}"
  echo "Creating .env file..."
  echo 'CUSTOM_DOMAIN_MAP={"lasreinascolusa.com":"lasreinas","www.lasreinascolusa.com":"lasreinas"}' > "$ENV_FILE"
  echo -e "${GREEN}✅ Created .env file${NC}"
fi

echo ""
echo "📝 Step 2: Configure Nginx"
cat > "$NGINX_SITE" << 'EOF'
server {
    listen 80;
    server_name lasreinascolusa.com www.lasreinascolusa.com;
    
    # Redirect HTTP to HTTPS (after SSL is set up)
    # return 301 https://$server_name$request_uri;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
if [ ! -L "$NGINX_ENABLED" ]; then
  ln -s "$NGINX_SITE" "$NGINX_ENABLED"
  echo -e "${GREEN}✅ Nginx site enabled${NC}"
else
  echo -e "${GREEN}✅ Nginx site already enabled${NC}"
fi

# Test Nginx configuration
echo ""
echo "📝 Step 3: Test Nginx configuration"
if nginx -t; then
  echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
  systemctl reload nginx
  echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
  echo -e "${YELLOW}⚠️  Nginx configuration test failed${NC}"
  exit 1
fi

echo ""
echo "📝 Step 4: SSL Certificate Setup"
echo "To set up SSL certificate, run:"
echo "  sudo certbot --nginx -d lasreinascolusa.com -d www.lasreinascolusa.com"
echo ""
echo "After SSL is set up, uncomment the redirect line in $NGINX_SITE"

echo ""
echo "📝 Step 5: Restart application"
cd "$APP_DIR"
if command -v pm2 &> /dev/null; then
  pm2 restart alessa-ordering || echo -e "${YELLOW}⚠️  PM2 restart failed (app may not be running)${NC}"
  echo -e "${GREEN}✅ Application restarted${NC}"
else
  echo -e "${YELLOW}⚠️  PM2 not found. Please restart the application manually${NC}"
fi

echo ""
echo -e "${GREEN}✅ DNS configuration complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Update DNS records at your domain registrar:"
echo "   - Type: A"
echo "   - Name: @ (or lasreinascolusa.com)"
echo "   - Value: $(curl -s ifconfig.me || echo 'YOUR_SERVER_IP')"
echo ""
echo "   - Type: CNAME"
echo "   - Name: www"
echo "   - Value: lasreinascolusa.com"
echo ""
echo "2. Wait for DNS propagation (5-30 minutes)"
echo "3. Run SSL certificate setup:"
echo "   sudo certbot --nginx -d lasreinascolusa.com -d www.lasreinascolusa.com"
echo ""
echo "4. Test the domain:"
echo "   curl -I http://lasreinascolusa.com"
echo ""







