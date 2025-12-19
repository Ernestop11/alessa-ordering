#!/bin/bash
# Fix preview URL issue and audit VPS configuration

VPS_HOST="root@77.243.85.8"
DEPLOY_PATH="/var/www/alessa-ordering"

echo "🔧 Fixing Preview URL & Auditing VPS"
echo "====================================="
echo ""

echo "📥 Step 1: Pull latest code with fixes"
ssh $VPS_HOST << ENDSSH
    cd $DEPLOY_PATH
    git fetch origin
    git reset --hard origin/main
    git clean -fd
    echo "✅ Code updated"
ENDSSH

echo ""
echo "📦 Step 2: Build application"
ssh $VPS_HOST << ENDSSH
    cd $DEPLOY_PATH
    npm run build
    echo "✅ Application built"
ENDSSH

echo ""
echo "🔄 Step 3: Restart application"
ssh $VPS_HOST << ENDSSH
    cd $DEPLOY_PATH
    pm2 restart alessa-ordering
    pm2 save
    echo "✅ Application restarted"
ENDSSH

echo ""
echo "🔍 Step 4: Verify Configuration"
ssh $VPS_HOST << 'ENDSSH'
    cd /var/www/alessa-ordering
    
    echo "📊 PM2 Status:"
    pm2 describe alessa-ordering | grep -E "(status|port|uptime)" || echo "  Process not found"
    
    echo ""
    echo "🔌 Port Check:"
    netstat -tlnp | grep -E ":(4000|3000)" | head -5
    
    echo ""
    echo "🌐 Nginx Config Check:"
    echo "  Alessa Cloud:"
    grep -E "(server_name|proxy_pass)" /etc/nginx/sites-enabled/alessacloud.com | head -4
    echo "  La Poblanita:"
    grep -E "(server_name|proxy_pass)" /etc/nginx/sites-enabled/lapoblanita 2>/dev/null | head -4 || echo "    Config not found"
    
    echo ""
    echo "🗄️  Tenant Check:"
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.tenant.findMany({
      select: { slug: true, name: true, id: true },
      orderBy: { slug: 'asc' }
    }).then(tenants => {
      console.log('  Tenants in database:');
      tenants.forEach(t => console.log(\`    - \${t.slug}: \${t.name}\`));
      prisma.\$disconnect();
    }).catch(err => {
      console.error('  Error:', err.message);
      prisma.\$disconnect();
    });
    " 2>&1 | grep -E "(Tenants|Error|lapoblanita|lasreinas)" | head -10
    
    echo ""
    echo "✅ Audit Complete"
ENDSSH

echo ""
echo "🎉 Fixes Applied!"
echo ""
echo "📋 Test URLs:"
echo "  - La Poblanita: https://lapoblanitamexicanfood.com/order?preview=true"
echo "  - Template Builder: https://alessacloud.com/super-admin/template-builder"
echo "  - Preview should work now!"

