#!/bin/bash
# Deployment script for Alessa Ordering fixes
# Run this on your VPS

set -e

echo "🚀 Starting deployment..."

# Navigate to project directory (adjust path as needed)
cd /path/to/alessa-ordering || cd ~/alessa-ordering || cd /var/www/alessa-ordering

echo "📦 Pulling latest changes..."
git pull origin main || echo "⚠️  Git pull skipped (not a git repo or no changes)"

echo "🧹 Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache

echo "📥 Installing dependencies..."
npm install --production=false

echo "🔨 Building application..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart all
pm2 save

echo "🌐 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx || echo "⚠️  Nginx reload skipped"

echo "✅ Deployment complete!"
echo ""
echo "📊 Checking PM2 status..."
pm2 status

echo ""
echo "🔍 Recent logs:"
pm2 logs --lines 20 --nostream

echo ""
echo "✨ All done! Test at: https://lasreinas.alessacloud.com/order"




