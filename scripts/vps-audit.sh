#!/bin/bash
# VPS Audit Script - Check ports, processes, tenant isolation

VPS_HOST="root@77.243.85.8"
DEPLOY_PATH="/var/www/alessa-ordering"

echo "🔍 VPS Audit Report"
echo "=================="
echo ""

echo "📊 PM2 Processes:"
ssh $VPS_HOST 'pm2 list'
echo ""

echo "🔌 Port Usage:"
ssh $VPS_HOST 'netstat -tlnp | grep -E ":(3000|4000|3001|3002|80|443|5432)" | sort'
echo ""

echo "🌐 Nginx Status:"
ssh $VPS_HOST 'systemctl status nginx --no-pager | head -15'
echo ""

echo "📁 Alessa Ordering Status:"
ssh $VPS_HOST << 'ENDSSH'
    cd /var/www/alessa-ordering
    echo "  Directory: $(pwd)"
    echo "  Git branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
    echo "  Git commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
    echo "  Node version: $(node --version 2>/dev/null || echo 'not found')"
    echo "  PM2 status:"
    pm2 describe alessa-ordering 2>/dev/null | grep -E "(status|uptime|memory|cpu|port)" || echo "    Process not found"
ENDSSH
echo ""

echo "🗄️  Database Tenants:"
ssh $VPS_HOST << 'ENDSSH'
    cd /var/www/alessa-ordering
    export PGPASSWORD=$(grep DATABASE_URL .env | cut -d'=' -f2- | cut -d'@' -f1 | cut -d':' -f3)
    export DB_USER=$(grep DATABASE_URL .env | cut -d'=' -f2- | cut -d'@' -f1 | cut -d'/' -f1 | cut -d':' -f2)
    export DB_NAME=$(grep DATABASE_URL .env | cut -d'=' -f2- | cut -d'@' -f2 | cut -d'/' -f2 | cut -d'?' -f1)
    export DB_HOST=$(grep DATABASE_URL .env | cut -d'=' -f2- | cut -d'@' -f2 | cut -d':' -f1)
    
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT slug, name, id, status FROM \"Tenant\" ORDER BY slug;" 2>&1 | head -20
ENDSSH
echo ""

echo "🔐 Environment Check:"
ssh $VPS_HOST << 'ENDSSH'
    cd /var/www/alessa-ordering
    echo "  ROOT_DOMAIN: $(grep ROOT_DOMAIN .env | cut -d'=' -f2 | head -1)"
    echo "  DEFAULT_TENANT: $(grep DEFAULT_TENANT_SLUG .env | cut -d'=' -f2 | head -1)"
    echo "  PORT: $(grep PORT .env | cut -d'=' -f2 | head -1 || echo 'not set')"
ENDSSH
echo ""

echo "🌍 Nginx Config Check:"
ssh $VPS_HOST 'ls -la /etc/nginx/sites-enabled/ | grep -E "(alessa|lapoblanita)"'
echo ""

echo "✅ Audit Complete"

