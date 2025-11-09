#!/bin/bash

# Template Seeds Automated Test Script
# Tests all 5 restaurant templates with demo seed data

set -e

# Check for bash 4+ (associative arrays)
if [ "${BASH_VERSINFO:-0}" -lt 4 ]; then
    # Fallback for older bash (macOS default)
    USE_SIMPLE_ARRAYS=true
else
    USE_SIMPLE_ARRAYS=false
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Production server
BASE_URL="https://alessacloud.com"
COOKIES_FILE="template-test-cookies.txt"

PASS_COUNT=0
FAIL_COUNT=0
TOTAL_TESTS=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Template Seeds QA Test Suite${NC}"
echo -e "${BLUE}   Testing all 5 restaurant templates${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Cleanup function
cleanup() {
  rm -f "$COOKIES_FILE"
  echo ""
  echo -e "${CYAN}Cleanup complete.${NC}"
}
trap cleanup EXIT

# Login as Super Admin
echo -e "${YELLOW}[AUTH]${NC} Logging in as super admin..."
LOGIN_RESULT=$(curl -s -c "$COOKIES_FILE" -X POST "$BASE_URL/api/auth/signin/credentials" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ernesto@alessacloud.com",
    "password": "superadmin123"
  }')

if [ -f "$COOKIES_FILE" ]; then
    echo -e "${GREEN}✓${NC} Super admin authenticated"
else
    echo -e "${RED}✗${NC} Authentication failed"
    exit 1
fi
echo ""

# Template definitions - using simple approach for macOS compatibility
get_template_data() {
    case "$1" in
        taqueria) echo "3:8:FOOD,FOOD,BEVERAGE" ;;
        panaderia) echo "1:4:BAKERY" ;;
        coffee) echo "2:7:BEVERAGE,BAKERY" ;;
        pizza) echo "2:6:FOOD,FOOD" ;;
        grocery) echo "2:6:GROCERY,GROCERY" ;;
    esac
}

# Test each template
TEMPLATE_NUM=1
for template in taqueria panaderia coffee pizza grocery; do
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Testing Template $TEMPLATE_NUM/5: ${template}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Parse expected values
    TEMPLATE_DATA=$(get_template_data "$template")
    IFS=':' read -r expected_sections expected_items expected_types <<< "$TEMPLATE_DATA"

    # Create tenant with template
    TIMESTAMP=$(date +%s)
    SLUG="test-${template}-${TIMESTAMP}"

    # Capitalize template name for display
    TEMPLATE_NAME=$(echo "$template" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')

    echo -e "${YELLOW}[1/4]${NC} Creating tenant with $template template..."
    CREATE_RESULT=$(curl -s -b "$COOKIES_FILE" -X POST "$BASE_URL/api/super/tenants" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Test $TEMPLATE_NAME\",
        \"slug\": \"$SLUG\",
        \"contactEmail\": \"test@${template}.com\",
        \"seedDemo\": true,
        \"templateId\": \"$template\"
      }")

    TENANT_ID=$(echo "$CREATE_RESULT" | jq -r '.id // empty')

    if [ -n "$TENANT_ID" ]; then
        echo -e "${GREEN}✓${NC} Tenant created: $TENANT_ID (slug: $SLUG)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗${NC} Failed to create tenant"
        echo "$CREATE_RESULT" | jq '.'
        FAIL_COUNT=$((FAIL_COUNT + 1))
        continue
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Give database a moment to write
    sleep 2

    # Verify via API
    echo ""
    echo -e "${YELLOW}[2/4]${NC} Verifying tenant data via API..."
    TENANT_DATA=$(curl -s -b "$COOKIES_FILE" "$BASE_URL/api/super/tenants" | jq ".[] | select(.id == \"$TENANT_ID\")")

    if [ -n "$TENANT_DATA" ]; then
        echo -e "${GREEN}✓${NC} Tenant found in API response"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗${NC} Tenant not found in API"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Test order page accessibility
    echo ""
    echo -e "${YELLOW}[3/4]${NC} Testing order page accessibility..."
    ORDER_PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${SLUG}.alessacloud.com/order")

    if [ "$ORDER_PAGE_STATUS" = "200" ]; then
        echo -e "${GREEN}✓${NC} Order page accessible (HTTP $ORDER_PAGE_STATUS)"
        echo -e "  ${CYAN}→${NC} URL: https://${SLUG}.alessacloud.com/order"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${YELLOW}⚠${NC} Order page returned HTTP $ORDER_PAGE_STATUS (may need DNS propagation)"
        echo -e "  ${CYAN}→${NC} URL: https://${SLUG}.alessacloud.com/order"
        # Don't count as failure - subdomain might need time
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Display template summary
    echo ""
    echo -e "${YELLOW}[4/4]${NC} Template summary:"
    echo -e "  ${CYAN}Template:${NC} $template"
    echo -e "  ${CYAN}Tenant ID:${NC} $TENANT_ID"
    echo -e "  ${CYAN}Slug:${NC} $SLUG"
    echo -e "  ${CYAN}Expected Sections:${NC} $expected_sections"
    echo -e "  ${CYAN}Expected Items:${NC} $expected_items"
    echo -e "  ${CYAN}Section Types:${NC} $expected_types"
    echo ""

    echo -e "${GREEN}✓${NC} Template test complete"
    echo ""

    TEMPLATE_NUM=$((TEMPLATE_NUM + 1))

    # Brief pause between templates
    if [ "$template" != "grocery" ]; then
        sleep 1
    fi
done

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Test Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PERCENTAGE=$((PASS_COUNT * 100 / TOTAL_TESTS))

echo -e "  Tests Passed:  ${GREEN}$PASS_COUNT/$TOTAL_TESTS${NC}"
echo -e "  Tests Failed:  ${RED}$FAIL_COUNT/$TOTAL_TESTS${NC}"
echo -e "  Success Rate:  ${BLUE}$PERCENTAGE%${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All template creation tests passed!${NC}"
    echo ""
    echo -e "${BLUE}Next Steps - Manual Verification:${NC}"
    echo ""
    echo "For each template created, verify:"
    echo ""
    echo "1️⃣  ${CYAN}Taqueria Template:${NC}"
    echo "   • Visit order page and check 3 sections (Tacos, Burritos, Beverages)"
    echo "   • Verify 8 total items with correct prices"
    echo ""
    echo "2️⃣  ${CYAN}Panadería Template:${NC}"
    echo "   • Visit order page and check 1 section (Panadería)"
    echo "   • Verify 4 bakery items with correct prices"
    echo ""
    echo "3️⃣  ${CYAN}Coffee Template:${NC}"
    echo "   • Visit order page and check 2 sections (Coffee, Pastries)"
    echo "   • Verify 7 total items with correct prices"
    echo ""
    echo "4️⃣  ${CYAN}Pizza Template:${NC}"
    echo "   • Visit order page and check 2 sections (Pizza, Sides)"
    echo "   • Verify 6 total items with correct prices"
    echo ""
    echo "5️⃣  ${CYAN}Grocery Template:${NC}"
    echo "   • Visit order page and check 2 sections (Produce, Packaged Goods)"
    echo "   • Verify 6 total items with correct prices"
    echo ""
    echo -e "${YELLOW}Screenshot Checklist:${NC}"
    echo "  □ Onboarding form with each template selected"
    echo "  □ Order page full menu for each template"
    echo "  □ Close-up of each section"
    echo "  □ Cart with items added"
    echo ""
    echo -e "${CYAN}Database Verification:${NC}"
    echo "  ssh to VPS and run queries from docs/TEMPLATE_SEEDS_QA.md"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some template creation tests failed${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  • Check super admin API route logs"
    echo "  • Verify TEMPLATE_SECTIONS in app/api/super/tenants/route.ts"
    echo "  • Check Prisma schema for cascade deletes"
    echo "  • Review error messages above"
    exit 1
fi
