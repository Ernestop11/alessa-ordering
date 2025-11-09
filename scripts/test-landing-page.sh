#!/bin/bash

# Landing Page Automated Test Script
# Tests landing page routing and functionality

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VPS="root@77.243.85.8"
PASS_COUNT=0
FAIL_COUNT=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Landing Page Automated Test${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test 1: Component exists
echo -e "${YELLOW}[1/8]${NC} Checking landing page component..."
if [ -f "components/LandingPage.tsx" ]; then
    echo -e "${GREEN}✓${NC} LandingPage.tsx exists"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} LandingPage.tsx not found"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 2: Routing logic exists
echo -e "${YELLOW}[2/8]${NC} Checking routing logic..."
if grep -q "ROOT_DOMAIN" app/page.tsx; then
    echo -e "${GREEN}✓${NC} Routing logic present in app/page.tsx"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} Routing logic missing"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 3: Responsive CSS
echo -e "${YELLOW}[3/8]${NC} Checking responsive CSS classes..."
RESPONSIVE_COUNT=$(grep -c "className.*\(sm:\|md:\|lg:\)" components/LandingPage.tsx || echo "0")
if [ "$RESPONSIVE_COUNT" -gt 5 ]; then
    echo -e "${GREEN}✓${NC} Found $RESPONSIVE_COUNT responsive CSS classes"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} Only $RESPONSIVE_COUNT responsive classes (expected >5)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 4: Session awareness
echo -e "${YELLOW}[4/8]${NC} Checking session-aware navigation..."
if grep -q "useSession" components/LandingPage.tsx; then
    echo -e "${GREEN}✓${NC} Session-aware navigation implemented"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} Session-aware navigation missing"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 5: VPS landing page
echo -e "${YELLOW}[5/8]${NC} Testing landing page on VPS..."
VPS_RESULT=$(ssh $VPS "curl -s http://localhost:4000 | grep -o 'Multi-Tenant Restaurant' | head -1" || echo "")
if [ -n "$VPS_RESULT" ]; then
    echo -e "${GREEN}✓${NC} Landing page working on VPS: $VPS_RESULT"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} Landing page not found on VPS"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 6: Tenant redirect
echo -e "${YELLOW}[6/8]${NC} Testing tenant subdomain redirect..."
REDIRECT_TEST=$(ssh $VPS "curl -s -o /dev/null -w '%{http_code}' -H 'Host: lapoblanita.alessacloud.com' http://localhost:4000/order")
if [ "$REDIRECT_TEST" == "200" ]; then
    echo -e "${GREEN}✓${NC} Tenant redirect working (HTTP 200 on /order)"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} Tenant redirect failed (HTTP $REDIRECT_TEST)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 7: Features grid
echo -e "${YELLOW}[7/8]${NC} Checking features grid..."
FEATURES=$(ssh $VPS "curl -s http://localhost:4000 | grep -o '💳\|📱\|🚀\|🎨\|👥\|📊' | wc -l")
if [ "$FEATURES" -ge 6 ]; then
    echo -e "${GREEN}✓${NC} Found $FEATURES feature icons (6 expected)"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} Only $FEATURES feature icons (6 expected)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 8: CTA section
echo -e "${YELLOW}[8/8]${NC} Checking CTA section..."
if ssh $VPS "curl -s http://localhost:4000 | grep -q 'Ready to get started'"; then
    echo -e "${GREEN}✓${NC} CTA section present"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} CTA section missing"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Summary
TOTAL=$((PASS_COUNT + FAIL_COUNT))
PERCENTAGE=$((PASS_COUNT * 100 / TOTAL))

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Test Results${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Tests Passed:  ${GREEN}$PASS_COUNT/$TOTAL${NC}"
echo -e "  Tests Failed:  ${RED}$FAIL_COUNT/$TOTAL${NC}"
echo -e "  Success Rate:  ${BLUE}$PERCENTAGE%${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  • Visit https://alessacloud.com to see live landing page"
    echo "  • Visit https://lapoblanita.alessacloud.com to test tenant redirect"
    echo "  • Test responsive design with browser DevTools"
    echo "  • Verify admin login links work"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  • Check VPS deployment: ./deploy.sh"
    echo "  • Verify environment variables: grep ROOT_DOMAIN .env"
    echo "  • Check PM2 logs: ssh $VPS 'pm2 logs alessa-ordering'"
    exit 1
fi
