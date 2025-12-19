#!/bin/bash

# Alfred AI Assistant - Deployment Script
# This script sets up Alfred on the VPS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VPS_HOST="root@77.243.85.8"
ALFRED_PATH="/srv/agent-console"
ALFRED_PORT=4010

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Alfred AI Assistant - Deployment Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Check port availability
echo -e "${YELLOW}[1/8]${NC} Checking port ${ALFRED_PORT} availability..."
PORT_IN_USE=$(ssh $VPS_HOST "lsof -i :${ALFRED_PORT} 2>/dev/null | wc -l")
if [ "$PORT_IN_USE" -gt 0 ]; then
    echo -e "${RED}✗${NC} Port ${ALFRED_PORT} is already in use!"
    echo -e "${YELLOW}→${NC} Checking what's using it..."
    ssh $VPS_HOST "lsof -i :${ALFRED_PORT}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Port ${ALFRED_PORT} is available"
fi
echo ""

# Step 2: Copy ecosystem config
echo -e "${YELLOW}[2/8]${NC} Copying ecosystem config..."
scp ecosystem.config.cjs $VPS_HOST:$ALFRED_PATH/ecosystem.config.cjs
echo -e "${GREEN}✓${NC} Ecosystem config copied"
echo ""

# Step 3: Create API routes directory
echo -e "${YELLOW}[3/8]${NC} Creating API routes..."
ssh $VPS_HOST "mkdir -p $ALFRED_PATH/app/api/alfred"
scp app/api/alfred/*.ts $VPS_HOST:$ALFRED_PATH/app/api/alfred/
echo -e "${GREEN}✓${NC} API routes created"
echo ""

# Step 4: Update environment variables
echo -e "${YELLOW}[4/8]${NC} Updating environment variables..."
ssh $VPS_HOST << ENDSSH
cd $ALFRED_PATH
if ! grep -q "PORT=4010" .env.local 2>/dev/null; then
    echo "" >> .env.local
    echo "# Alfred Configuration" >> .env.local
    echo "PORT=4010" >> .env.local
    echo "ALFRED_MODE=production" >> .env.local
    echo "ALESSA_API_URL=http://localhost:4000" >> .env.local
    echo -e "${GREEN}✓${NC} Environment variables updated"
else
    echo -e "${YELLOW}⊘${NC} Environment variables already set"
fi
ENDSSH
echo ""

# Step 5: Install dependencies
echo -e "${YELLOW}[5/8]${NC} Installing dependencies..."
ssh $VPS_HOST "cd $ALFRED_PATH && npm install --legacy-peer-deps"
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Step 6: Build application
echo -e "${YELLOW}[6/8]${NC} Building application..."
ssh $VPS_HOST "cd $ALFRED_PATH && npm run build"
echo -e "${GREEN}✓${NC} Build completed"
echo ""

# Step 7: Start with PM2
echo -e "${YELLOW}[7/8]${NC} Starting Alfred with PM2..."
ssh $VPS_HOST << ENDSSH
cd $ALFRED_PATH
pm2 delete alfred-ai 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
ENDSSH
echo -e "${GREEN}✓${NC} PM2 process started"
echo ""

# Step 8: Verify deployment
echo -e "${YELLOW}[8/8]${NC} Verifying deployment..."
sleep 3
HTTP_STATUS=$(ssh $VPS_HOST "curl -s -o /dev/null -w '%{http_code}' http://localhost:${ALFRED_PORT}/api/alfred/status" || echo "000")
if [ "$HTTP_STATUS" == "200" ]; then
    echo -e "${GREEN}✓${NC} Alfred is responding (HTTP $HTTP_STATUS)"
else
    echo -e "${RED}✗${NC} Alfred not responding (HTTP $HTTP_STATUS)"
    echo -e "${YELLOW}→${NC} Check logs: ssh $VPS_HOST 'pm2 logs alfred-ai --lines 50'"
fi
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Configure Caddy/Nginx to route alfred.alessacloud.com → port 4010"
echo "  2. Update Alessa Ordering .env with ALFRED_API_URL=http://localhost:4010"
echo "  3. Test in Super Admin: https://alessacloud.com/super-admin → Alfred tab"
echo "  4. Check logs: ssh $VPS_HOST 'pm2 logs alfred-ai'"
echo ""

