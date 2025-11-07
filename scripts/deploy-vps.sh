#!/bin/bash
# ============================================
# VPS Deployment Script for Alessa Ordering
# ============================================
# Usage: ./scripts/deploy-vps.sh [vps-ip-or-hostname]
# Example: ./scripts/deploy-vps.sh root@your-vps-ip
# ============================================

set -e  # Exit on any error

VPS_HOST="${1:-root@YOUR_VPS_IP}"
DEPLOY_PATH="/var/www/alessa-ordering"
REPO_URL="${2:-$(git config --get remote.origin.url)}"

echo "🚀 Deploying Alessa Ordering to VPS"
echo "   Host: $VPS_HOST"
echo "   Path: $DEPLOY_PATH"
echo ""

# Check if .env.production exists locally
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production not found!"
    echo "   Create it first with production credentials"
    exit 1
fi

echo "📦 Step 1: Initial VPS Setup"
ssh $VPS_HOST << 'ENDSSH'
    # Update system
    sudo apt update
    sudo apt upgrade -y

    # Install Node.js 18
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    fi

    # Install PostgreSQL 14
    if ! command -v psql &> /dev/null; then
        sudo apt install -y postgresql postgresql-contrib
    fi

    # Install Nginx
    if ! command -v nginx &> /dev/null; then
        sudo apt install -y nginx
    fi

    # Install PM2 globally
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
    fi

    echo "✅ System packages installed"
ENDSSH

echo ""
echo "🗄️  Step 2: Database Setup"
ssh $VPS_HOST << 'ENDSSH'
    DB_PASSWORD=$(openssl rand -base64 32)

    sudo -u postgres psql << EOF
        -- Create role if not exists
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'alessa_ordering_user') THEN
                CREATE ROLE alessa_ordering_user WITH LOGIN PASSWORD '$DB_PASSWORD';
            END IF;
        END
        \$\$;

        -- Create database if not exists
        SELECT 'CREATE DATABASE alessa_ordering OWNER alessa_ordering_user'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'alessa_ordering')\gexec

        -- Grant privileges
        GRANT ALL PRIVILEGES ON DATABASE alessa_ordering TO alessa_ordering_user;
EOF

    echo "✅ Database created"
    echo "⚠️  Save this DB password: $DB_PASSWORD"
ENDSSH

echo ""
echo "📂 Step 3: Clone/Update Repository"
ssh $VPS_HOST << ENDSSH
    # Create directory if doesn't exist
    if [ ! -d "$DEPLOY_PATH" ]; then
        sudo mkdir -p $DEPLOY_PATH
        sudo chown \$USER:\$USER $DEPLOY_PATH
        cd $DEPLOY_PATH
        git clone $REPO_URL .
    else
        cd $DEPLOY_PATH
        git fetch origin
        git reset --hard origin/main
        git clean -fd
    fi

    echo "✅ Repository ready"
ENDSSH

echo ""
echo "📤 Step 4: Upload Production Config"
scp .env.production $VPS_HOST:$DEPLOY_PATH/.env
echo "✅ Environment file uploaded"

echo ""
echo "📦 Step 5: Install Dependencies & Build"
ssh $VPS_HOST << ENDSSH
    cd $DEPLOY_PATH
    npm install --production=false
    npm run build
    echo "✅ Application built"
ENDSSH

echo ""
echo "🗄️  Step 6: Database Migration"
ssh $VPS_HOST << ENDSSH
    cd $DEPLOY_PATH
    npx prisma db push
    npm run seed
    echo "✅ Database migrated"
ENDSSH

echo ""
echo "🌐 Step 7: Nginx Configuration"
ssh $VPS_HOST << 'ENDSSH'
    sudo tee /etc/nginx/sites-available/alessa-ordering > /dev/null << 'EOF'
server {
    listen 80;
    server_name alessacloud.com www.alessacloud.com;

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
        client_max_body_size 10M;
    }
}

server {
    listen 80;
    server_name *.alessacloud.com;

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
        client_max_body_size 10M;
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/alessa-ordering /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx

    echo "✅ Nginx configured"
ENDSSH

echo ""
echo "🔄 Step 8: PM2 Process Management"
ssh $VPS_HOST << ENDSSH
    cd $DEPLOY_PATH
    pm2 delete alessa-ordering 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u \$USER --hp \$HOME

    echo "✅ PM2 configured"
ENDSSH

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Configure DNS to point to this VPS"
echo "   2. Install SSL: ssh $VPS_HOST 'sudo certbot --nginx -d alessacloud.com -d \"*.alessacloud.com\"'"
echo "   3. Update STRIPE_WEBHOOK_SECRET in .env after webhook setup"
echo "   4. Test the application at http://alessacloud.com"
echo ""
echo "📊 Monitor logs:"
echo "   ssh $VPS_HOST 'cd $DEPLOY_PATH && pm2 logs alessa-ordering'"
echo ""
echo "🔄 To redeploy:"
echo "   ./scripts/deploy-vps.sh $VPS_HOST"
