#!/bin/bash
# Quick SSL setup script for lapoblanitamexicanfood.com

set -e

DOMAIN="lapoblanitamexicanfood.com"
VPS_IP="77.243.85.8"

echo "🔒 SSL Certificate Setup for $DOMAIN"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
  echo "📦 Installing Certbot..."
  apt update
  apt install -y certbot python3-certbot-nginx
fi

# Check DNS
echo "🌐 Checking DNS..."
DNS_IP=$(nslookup $DOMAIN | grep -A 1 "Name:" | tail -1 | awk '{print $2}' || echo "")
if [ -z "$DNS_IP" ]; then
  echo "⚠️  Could not resolve DNS. Please ensure:"
  echo "   1. DNS A record points to $VPS_IP"
  echo "   2. DNS has propagated (can take 5-30 minutes)"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo "✅ DNS resolves to: $DNS_IP"
fi

# Check Nginx config
echo ""
echo "🔍 Checking Nginx configuration..."
if [ ! -f "/etc/nginx/sites-available/lapoblanita" ] && [ ! -f "/etc/nginx/sites-enabled/lapoblanita" ]; then
  echo "⚠️  Nginx config not found. Creating basic config..."
  
  cat > /etc/nginx/sites-available/lapoblanita <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

  # Enable site
  ln -sf /etc/nginx/sites-available/lapoblanita /etc/nginx/sites-enabled/
  
  # Test and reload
  nginx -t && systemctl reload nginx
  echo "✅ Nginx config created"
fi

# Request certificate
echo ""
echo "📜 Requesting SSL certificate from Let's Encrypt..."
echo "   This will prompt for:"
echo "   - Email address (for renewal notices)"
echo "   - Agreement to terms"
echo "   - HTTP to HTTPS redirect (recommend Yes)"
echo ""

certbot --nginx -d $DOMAIN -d www.$DOMAIN

# Verify
echo ""
echo "✅ SSL setup complete!"
echo ""
echo "📋 Verification:"
certbot certificates | grep -A 5 "$DOMAIN" || echo "   Certificate installed"

echo ""
echo "🧪 Test:"
echo "   Visit: https://$DOMAIN/order"
echo "   Should show secure connection (green lock)"
echo ""
echo "🔄 Auto-renewal is automatically configured"
echo "   Test renewal: certbot renew --dry-run"

