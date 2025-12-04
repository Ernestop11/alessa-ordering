#!/bin/bash
# Alessa Cloud VPS Diagnostic Script
# Checks the status of alessacloud.com on the VPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VPS_HOST="${VPS_HOST:-root@77.243.85.8}"
VPS_PATH="/var/www/alessa-ordering"
PM2_PROCESS="alessa-ordering"
DOMAIN="alessacloud.com"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Alessa Cloud VPS Diagnostic${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}VPS:${NC} $VPS_HOST"
echo -e "${YELLOW}Path:${NC} $VPS_PATH"
echo -e "${YELLOW}Domain:${NC} $DOMAIN"
echo ""

# Function to run command on VPS
run_vps() {
    ssh $VPS_HOST "$1"
}

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# 1. Check SSH connectivity
echo -e "${YELLOW}[1/8]${NC} Checking SSH connectivity..."
if ssh -o ConnectTimeout=5 -o BatchMode=yes $VPS_HOST "echo 'Connected'" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} SSH connection successful"
else
    echo -e "${RED}✗${NC} Cannot connect to VPS. Please check:"
    echo "   - SSH key is set up"
    echo "   - VPS IP is correct: 77.243.85.8"
    echo "   - Firewall allows SSH"
    exit 1
fi
echo ""

# 2. Check PM2 process status
echo -e "${YELLOW}[2/8]${NC} Checking PM2 process status..."
PM2_STATUS=$(run_vps "pm2 list | grep $PM2_PROCESS || echo 'NOT_FOUND'")
if echo "$PM2_STATUS" | grep -q "online"; then
    echo -e "${GREEN}✓${NC} PM2 process is online"
    run_vps "pm2 describe $PM2_PROCESS | grep -E 'status|uptime|restarts|memory'"
elif echo "$PM2_STATUS" | grep -q "errored\|stopped"; then
    echo -e "${RED}✗${NC} PM2 process is errored or stopped"
    echo -e "${YELLOW}   Attempting to restart...${NC}"
    run_vps "cd $VPS_PATH && pm2 restart $PM2_PROCESS"
    sleep 3
    run_vps "pm2 status $PM2_PROCESS"
else
    echo -e "${RED}✗${NC} PM2 process not found"
    echo -e "${YELLOW}   Attempting to start...${NC}"
    run_vps "cd $VPS_PATH && pm2 start ecosystem.config.js"
    sleep 3
    run_vps "pm2 status $PM2_PROCESS"
fi
echo ""

# 3. Check application directory
echo -e "${YELLOW}[3/8]${NC} Checking application directory..."
if run_vps "test -d $VPS_PATH && echo 'EXISTS'" | grep -q "EXISTS"; then
    echo -e "${GREEN}✓${NC} Application directory exists"
    run_vps "ls -la $VPS_PATH | head -10"
else
    echo -e "${RED}✗${NC} Application directory not found: $VPS_PATH"
    exit 1
fi
echo ""

# 4. Check if application is built
echo -e "${YELLOW}[4/8]${NC} Checking if application is built..."
if run_vps "test -f $VPS_PATH/.next/BUILD_ID && echo 'BUILT'" | grep -q "BUILT"; then
    echo -e "${GREEN}✓${NC} Application is built"
    BUILD_ID=$(run_vps "cat $VPS_PATH/.next/BUILD_ID 2>/dev/null || echo 'N/A'")
    echo -e "${BLUE}   Build ID:${NC} $BUILD_ID"
else
    echo -e "${YELLOW}⚠${NC}  Application not built. Building now..."
    run_vps "cd $VPS_PATH && npm run build"
fi
echo ""

# 5. Check PM2 logs for errors
echo -e "${YELLOW}[5/8]${NC} Checking recent PM2 logs..."
echo -e "${BLUE}Recent logs (last 20 lines):${NC}"
run_vps "pm2 logs $PM2_PROCESS --lines 20 --nostream" || echo "Could not retrieve logs"
echo ""

# 6. Check if application responds locally
echo -e "${YELLOW}[6/8]${NC} Checking if application responds on localhost..."
LOCAL_PORT=$(run_vps "pm2 describe $PM2_PROCESS | grep 'port' | head -1 | awk '{print \$2}' || echo '4000'")
HTTP_STATUS=$(run_vps "curl -s -o /dev/null -w '%{http_code}' http://localhost:$LOCAL_PORT/order || echo '000'")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "307" ]; then
    echo -e "${GREEN}✓${NC} Application responding on port $LOCAL_PORT (HTTP $HTTP_STATUS)"
else
    echo -e "${RED}✗${NC} Application not responding (HTTP $HTTP_STATUS)"
    echo -e "${YELLOW}   Checking what's listening on port $LOCAL_PORT...${NC}"
    run_vps "lsof -i :$LOCAL_PORT || echo 'Nothing listening on port $LOCAL_PORT'"
fi
echo ""

# 7. Check Nginx configuration
echo -e "${YELLOW}[7/8]${NC} Checking Nginx configuration..."
if run_vps "test -f /etc/nginx/sites-enabled/$DOMAIN && echo 'EXISTS'" | grep -q "EXISTS"; then
    echo -e "${GREEN}✓${NC} Nginx config exists for $DOMAIN"
    echo -e "${BLUE}Nginx config:${NC}"
    run_vps "cat /etc/nginx/sites-enabled/$DOMAIN | grep -E 'server_name|proxy_pass|listen' | head -10"
    
    # Check if Nginx is running
    if run_vps "systemctl is-active nginx" | grep -q "active"; then
        echo -e "${GREEN}✓${NC} Nginx is running"
    else
        echo -e "${RED}✗${NC} Nginx is not running"
        echo -e "${YELLOW}   Attempting to start Nginx...${NC}"
        run_vps "systemctl start nginx"
    fi
    
    # Test Nginx config
    if run_vps "nginx -t 2>&1" | grep -q "syntax is ok"; then
        echo -e "${GREEN}✓${NC} Nginx configuration is valid"
    else
        echo -e "${RED}✗${NC} Nginx configuration has errors"
        run_vps "nginx -t"
    fi
else
    echo -e "${RED}✗${NC} Nginx config not found for $DOMAIN"
    echo -e "${YELLOW}   Available Nginx configs:${NC}"
    run_vps "ls -la /etc/nginx/sites-enabled/ | grep -v '^d'"
fi
echo ""

# 8. Check domain accessibility
echo -e "${YELLOW}[8/8]${NC} Checking domain accessibility..."
echo -e "${BLUE}Testing https://$DOMAIN...${NC}"
PUBLIC_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$DOMAIN" || echo "000")
if [ "$PUBLIC_STATUS" = "200" ] || [ "$PUBLIC_STATUS" = "307" ] || [ "$PUBLIC_STATUS" = "301" ]; then
    echo -e "${GREEN}✓${NC} Domain is accessible (HTTP $PUBLIC_STATUS)"
else
    echo -e "${RED}✗${NC} Domain not accessible (HTTP $PUBLIC_STATUS)"
    echo -e "${YELLOW}   Possible issues:${NC}"
    echo "   - DNS not pointing to VPS"
    echo "   - SSL certificate expired"
    echo "   - Firewall blocking port 443"
    echo "   - Nginx not configured correctly"
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Diagnostic Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Quick Fix Commands:${NC}"
echo ""
echo -e "${YELLOW}Restart PM2:${NC}"
echo "  ssh $VPS_HOST 'cd $VPS_PATH && pm2 restart $PM2_PROCESS'"
echo ""
echo -e "${YELLOW}Restart Nginx:${NC}"
echo "  ssh $VPS_HOST 'systemctl restart nginx'"
echo ""
echo -e "${YELLOW}View PM2 logs:${NC}"
echo "  ssh $VPS_HOST 'pm2 logs $PM2_PROCESS --lines 50'"
echo ""
echo -e "${YELLOW}Rebuild application:${NC}"
echo "  ssh $VPS_HOST 'cd $VPS_PATH && npm run build && pm2 restart $PM2_PROCESS'"
echo ""
echo -e "${YELLOW}Check environment variables:${NC}"
echo "  ssh $VPS_HOST 'cd $VPS_PATH && grep -E \"NEXTAUTH_URL|ROOT_DOMAIN|PORT\" .env | head -5'"
echo ""

