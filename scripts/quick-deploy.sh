#!/bin/bash
# Quick deployment script - updates code and runs migrations
# Usage: ./scripts/quick-deploy.sh

set -e

VPS_HOST="root@77.243.85.8"
DEPLOY_PATH="/var/www/alessa-ordering"

echo "🚀 Quick Deploy to VPS"
echo "   Host: $VPS_HOST"
echo "   Path: $DEPLOY_PATH"
echo ""

echo "📥 Step 1: Pull latest code"
ssh $VPS_HOST << ENDSSH
    cd $DEPLOY_PATH
    git fetch origin
    git reset --hard origin/main
    git clean -fd
    echo "✅ Code updated"
ENDSSH

echo ""
echo "📦 Step 2: Install dependencies & build"
ssh $VPS_HOST << ENDSSH
    cd $DEPLOY_PATH
    npm install --production=false
    npm run build
    echo "✅ Application built"
ENDSSH

echo ""
echo "🗄️  Step 3: Run database migrations"
ssh $VPS_HOST << ENDSSH
    cd $DEPLOY_PATH
    npx prisma db push
    echo "✅ Database migrated"
ENDSSH

echo ""
echo "🌱 Step 4: Seed global templates"
ssh $VPS_HOST << ENDSSH
    cd $DEPLOY_PATH
    npx tsx scripts/create-global-templates.ts || echo "⚠️  Templates may already exist"
    echo "✅ Templates seeded"
ENDSSH

echo ""
echo "🔄 Step 5: Restart application"
ssh $VPS_HOST << ENDSSH
    cd $DEPLOY_PATH
    pm2 restart alessa-ordering
    pm2 save
    echo "✅ Application restarted"
ENDSSH

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📊 Check status:"
echo "   ssh $VPS_HOST 'cd $DEPLOY_PATH && pm2 logs alessa-ordering --lines 50'"

