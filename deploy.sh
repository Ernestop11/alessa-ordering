#!/bin/bash

# Alessa Ordering Platform - Deployment Script
# This script automates deployment to the VPS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="root@77.243.85.8"
VPS_PATH="/var/www/alessa-ordering"
PM2_PROCESS="alessa-ordering"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Alessa Ordering Platform - Deployment Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Commit and push changes to git
echo -e "${YELLOW}[1/7]${NC} Checking git status..."
if [[ -n $(git status -s) ]]; then
    echo -e "${GREEN}✓${NC} Uncommitted changes found"
    echo ""
    git status -s
    echo ""
    read -p "Enter commit message (or press Enter to skip commit): " COMMIT_MSG

    if [[ -n "$COMMIT_MSG" ]]; then
        echo -e "${YELLOW}→${NC} Adding all changes..."
        git add .

        echo -e "${YELLOW}→${NC} Committing changes..."
        git commit -m "$COMMIT_MSG"

        echo -e "${YELLOW}→${NC} Pushing to origin..."
        git push origin main

        echo -e "${GREEN}✓${NC} Changes committed and pushed"
    else
        echo -e "${YELLOW}⊘${NC} Skipping commit (continuing with deployment)"
    fi
else
    echo -e "${GREEN}✓${NC} Working directory clean"
fi
echo ""

# Step 2: SSH into VPS and pull latest changes
echo -e "${YELLOW}[2/7]${NC} Pulling latest changes on VPS..."
ssh $VPS_HOST "cd $VPS_PATH && git pull origin main"
echo -e "${GREEN}✓${NC} Changes pulled"
echo ""

# Step 3: Install dependencies
echo -e "${YELLOW}[3/7]${NC} Installing dependencies on VPS..."
ssh $VPS_HOST "cd $VPS_PATH && npm install --production"
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Step 4: Build the application
echo -e "${YELLOW}[4/7]${NC} Building application on VPS..."
ssh $VPS_HOST "cd $VPS_PATH && npm run build"
echo -e "${GREEN}✓${NC} Build completed"
echo ""

# Step 5: Restart PM2 process
echo -e "${YELLOW}[5/7]${NC} Restarting PM2 process..."
ssh $VPS_HOST "pm2 restart $PM2_PROCESS"
echo -e "${GREEN}✓${NC} PM2 process restarted"
echo ""

# Step 6: Wait for application to start
echo -e "${YELLOW}[6/7]${NC} Waiting for application to start (5 seconds)..."
sleep 5
echo -e "${GREEN}✓${NC} Wait complete"
echo ""

# Step 7: Check status
echo -e "${YELLOW}[7/7]${NC} Checking deployment status..."
echo ""

echo -e "${BLUE}PM2 Process Status:${NC}"
ssh $VPS_HOST "pm2 status $PM2_PROCESS"
echo ""

echo -e "${BLUE}Recent Logs:${NC}"
ssh $VPS_HOST "pm2 logs $PM2_PROCESS --lines 10 --nostream"
echo ""

echo -e "${BLUE}Application Health Check:${NC}"
HTTP_STATUS=$(ssh $VPS_HOST "curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/order")
if [[ "$HTTP_STATUS" == "200" ]]; then
    echo -e "${GREEN}✓${NC} Application responding (HTTP $HTTP_STATUS)"
else
    echo -e "${RED}✗${NC} Application not responding correctly (HTTP $HTTP_STATUS)"
    exit 1
fi
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Deployment Successful!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  • Visit https://lapoblanita.alessacloud.com/order to test"
echo "  • Check admin dashboard: https://lapoblanita.alessacloud.com/admin"
echo "  • Monitor logs: ssh $VPS_HOST 'pm2 logs $PM2_PROCESS'"
echo ""
