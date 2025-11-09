#!/bin/bash

# Super Admin CRUD Test Script
# Tests all CRUD operations for Super Admin Dashboard

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
COOKIES_FILE="test-cookies.txt"
PASS_COUNT=0
FAIL_COUNT=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Super Admin CRUD Test Suite${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Cleanup function
cleanup() {
  rm -f "$COOKIES_FILE"
}
trap cleanup EXIT

# Test 1: Login as Super Admin
echo -e "${YELLOW}[1/9]${NC} Testing super admin authentication..."
LOGIN_RESULT=$(curl -s -c "$COOKIES_FILE" -X POST "$BASE_URL/api/auth/signin/credentials" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ernesto@alessacloud.com",
    "password": "superadmin123"
  }')

if [ -f "$COOKIES_FILE" ]; then
    echo -e "${GREEN}✓${NC} Super admin authenticated"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} Authentication failed"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    exit 1
fi
echo ""

# Test 2: GET /api/super/tenants
echo -e "${YELLOW}[2/9]${NC} Testing GET /api/super/tenants..."
TENANTS=$(curl -s -b "$COOKIES_FILE" "$BASE_URL/api/super/tenants")

if echo "$TENANTS" | jq -e '. | length > 0' > /dev/null 2>&1; then
    TENANT_COUNT=$(echo "$TENANTS" | jq '. | length')
    echo -e "${GREEN}✓${NC} GET tenants successful ($TENANT_COUNT tenants)"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} GET tenants failed"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 3: POST /api/super/tenants (Create without demo)
echo -e "${YELLOW}[3/9]${NC} Testing POST /api/super/tenants (basic create)..."
CREATE_BASIC=$(curl -s -b "$COOKIES_FILE" -X POST "$BASE_URL/api/super/tenants" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Restaurant Basic",
    "slug": "test-basic-'$(date +%s)'",
    "contactEmail": "test@basic.com"
  }')

BASIC_TENANT_ID=$(echo "$CREATE_BASIC" | jq -r '.id // empty')
if [ -n "$BASIC_TENANT_ID" ]; then
    echo -e "${GREEN}✓${NC} Created basic tenant: $BASIC_TENANT_ID"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} Failed to create basic tenant"
    echo "$CREATE_BASIC"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 4: POST /api/super/tenants (Create with demo seed)
echo -e "${YELLOW}[4/9]${NC} Testing POST /api/super/tenants (with demo seed)..."
CREATE_DEMO=$(curl -s -b "$COOKIES_FILE" -X POST "$BASE_URL/api/super/tenants" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Taqueria Demo",
    "slug": "test-taqueria-'$(date +%s)'",
    "seedDemo": true,
    "templateId": "taqueria"
  }')

DEMO_TENANT_ID=$(echo "$CREATE_DEMO" | jq -r '.id // empty')
if [ -n "$DEMO_TENANT_ID" ]; then
    echo -e "${GREEN}✓${NC} Created demo tenant: $DEMO_TENANT_ID"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} Failed to create demo tenant"
    echo "$CREATE_DEMO"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 5: POST /api/super/tenants (Duplicate slug - should fail)
echo -e "${YELLOW}[5/9]${NC} Testing duplicate slug rejection..."
DUPLICATE=$(curl -s -b "$COOKIES_FILE" -X POST "$BASE_URL/api/super/tenants" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another Restaurant",
    "slug": "lapoblanita"
  }')

if echo "$DUPLICATE" | jq -e '.error | contains("already in use")' > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Duplicate slug correctly rejected"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} Duplicate slug should have been rejected"
    echo "$DUPLICATE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 6: PATCH /api/super/tenants
if [ -n "$BASIC_TENANT_ID" ]; then
    echo -e "${YELLOW}[6/9]${NC} Testing PATCH /api/super/tenants..."
    UPDATE=$(curl -s -b "$COOKIES_FILE" -X PATCH "$BASE_URL/api/super/tenants" \
      -H "Content-Type: application/json" \
      -d '{
        "id": "'$BASIC_TENANT_ID'",
        "name": "Updated Test Restaurant",
        "contactEmail": "updated@test.com",
        "platformPercentFee": 0.035
      }')

    UPDATED_NAME=$(echo "$UPDATE" | jq -r '.name // empty')
    if [ "$UPDATED_NAME" = "Updated Test Restaurant" ]; then
        echo -e "${GREEN}✓${NC} Updated tenant successfully"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗${NC} Failed to update tenant"
        echo "$UPDATE"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
else
    echo -e "${YELLOW}[6/9]${NC} Skipping PATCH test (no tenant ID)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 7: GET /api/super/metrics
echo -e "${YELLOW}[7/9]${NC} Testing GET /api/super/metrics..."
METRICS=$(curl -s -b "$COOKIES_FILE" "$BASE_URL/api/super/metrics")

if echo "$METRICS" | jq -e '.totalTenants' > /dev/null 2>&1; then
    TOTAL_TENANTS=$(echo "$METRICS" | jq '.totalTenants')
    TOTAL_ORDERS=$(echo "$METRICS" | jq '.totalOrders')
    echo -e "${GREEN}✓${NC} Metrics retrieved: $TOTAL_TENANTS tenants, $TOTAL_ORDERS orders"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗${NC} Failed to get metrics"
    echo "$METRICS"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 8: DELETE /api/super/tenants (delete basic tenant)
if [ -n "$BASIC_TENANT_ID" ]; then
    echo -e "${YELLOW}[8/9]${NC} Testing DELETE /api/super/tenants (basic tenant)..."
    DELETE_BASIC=$(curl -s -b "$COOKIES_FILE" -X DELETE "$BASE_URL/api/super/tenants?id=$BASIC_TENANT_ID")

    if echo "$DELETE_BASIC" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Deleted basic tenant successfully"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗${NC} Failed to delete basic tenant"
        echo "$DELETE_BASIC"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
else
    echo -e "${YELLOW}[8/9]${NC} Skipping DELETE test (no basic tenant ID)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# Test 9: DELETE /api/super/tenants (delete demo tenant)
if [ -n "$DEMO_TENANT_ID" ]; then
    echo -e "${YELLOW}[9/9]${NC} Testing DELETE /api/super/tenants (demo tenant)..."
    DELETE_DEMO=$(curl -s -b "$COOKIES_FILE" -X DELETE "$BASE_URL/api/super/tenants?id=$DEMO_TENANT_ID")

    if echo "$DELETE_DEMO" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Deleted demo tenant successfully (with cascade)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗${NC} Failed to delete demo tenant"
        echo "$DELETE_DEMO"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
else
    echo -e "${YELLOW}[9/9]${NC} Skipping DELETE test (no demo tenant ID)"
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
    echo "  • Test via Super Admin Dashboard UI"
    echo "  • Create tenant via Onboarding wizard"
    echo "  • Test Edit functionality in dashboard"
    echo "  • Test Delete with ✕ button"
    echo "  • Click Refresh button to update metrics"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  • Check that npm run dev is running"
    echo "  • Verify super admin credentials are correct"
    echo "  • Check database connection"
    echo "  • Review error messages above"
    exit 1
fi
