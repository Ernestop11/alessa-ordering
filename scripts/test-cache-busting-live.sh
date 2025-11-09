#!/bin/bash

# Live Cache-Busting Test Script
# Tests end-to-end image cache-busting on production VPS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VPS="root@77.243.85.8"
TENANT_SLUG="lapoblanita"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Live Cache-Busting Test${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Get current state
echo -e "${YELLOW}[1/5]${NC} Fetching current tenant state..."
CURRENT_STATE=$(ssh $VPS "cd /var/www/alessa-ordering && node -e \"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tenant.findFirst({ where: { slug: '$TENANT_SLUG' } })
  .then(t => {
    console.log(JSON.stringify({
      logoUrl: t.logoUrl,
      updatedAt: t.updatedAt,
      timestamp: new Date(t.updatedAt).getTime()
    }));
  })
  .finally(() => prisma.\\\$disconnect());
\"")

CURRENT_LOGO=$(echo $CURRENT_STATE | jq -r '.logoUrl')
CURRENT_TIMESTAMP=$(echo $CURRENT_STATE | jq -r '.timestamp')

echo -e "${GREEN}✓${NC} Current State:"
echo "  Logo URL: $CURRENT_LOGO"
echo "  Timestamp: $CURRENT_TIMESTAMP"
echo ""

# Step 2: Check HTML output
echo -e "${YELLOW}[2/5]${NC} Checking HTML cache-buster..."
HTML_CHECK=$(ssh $VPS "curl -s http://localhost:4000/order | grep -o 'logoUrl\":\"[^\"]*' | head -1")

if echo "$HTML_CHECK" | grep -q "?t=$CURRENT_TIMESTAMP"; then
    echo -e "${GREEN}✓${NC} HTML cache-buster matches database timestamp"
else
    echo -e "${RED}✗${NC} HTML cache-buster DOES NOT match database"
    echo "  Expected: ?t=$CURRENT_TIMESTAMP"
    echo "  Found: $HTML_CHECK"
fi
echo ""

# Step 3: Wait for user to upload
echo -e "${YELLOW}[3/5]${NC} Waiting for image upload..."
echo ""
echo -e "${BLUE}ACTION REQUIRED:${NC}"
echo "  1. Open: https://lapoblanita.alessacloud.com/admin/login"
echo "  2. Login to admin panel"
echo "  3. Navigate to Settings/Branding"
echo "  4. Upload a new logo image"
echo "  5. Click 'Save' or 'Update Settings'"
echo ""
read -p "Press ENTER after you've uploaded and saved the new logo..."
echo ""

# Step 4: Check new state
echo -e "${YELLOW}[4/5]${NC} Fetching new tenant state..."
sleep 2  # Give DB a moment to update

NEW_STATE=$(ssh $VPS "cd /var/www/alessa-ordering && node -e \"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tenant.findFirst({ where: { slug: '$TENANT_SLUG' } })
  .then(t => {
    console.log(JSON.stringify({
      logoUrl: t.logoUrl,
      updatedAt: t.updatedAt,
      timestamp: new Date(t.updatedAt).getTime()
    }));
  })
  .finally(() => prisma.\\\$disconnect());
\"")

NEW_LOGO=$(echo $NEW_STATE | jq -r '.logoUrl')
NEW_TIMESTAMP=$(echo $NEW_STATE | jq -r '.timestamp')

echo -e "${GREEN}✓${NC} New State:"
echo "  Logo URL: $NEW_LOGO"
echo "  Timestamp: $NEW_TIMESTAMP"
echo ""

# Step 5: Compare and verify
echo -e "${YELLOW}[5/5]${NC} Verifying cache-busting..."
echo ""

# Check if timestamp changed
if [ "$NEW_TIMESTAMP" -gt "$CURRENT_TIMESTAMP" ]; then
    DIFF=$((NEW_TIMESTAMP - CURRENT_TIMESTAMP))
    echo -e "${GREEN}✓${NC} Timestamp updated (+${DIFF}ms)"
else
    echo -e "${RED}✗${NC} Timestamp NOT updated"
    echo "  Old: $CURRENT_TIMESTAMP"
    echo "  New: $NEW_TIMESTAMP"
fi

# Check if logo URL changed
if [ "$NEW_LOGO" != "$CURRENT_LOGO" ]; then
    echo -e "${GREEN}✓${NC} Logo URL changed"
else
    echo -e "${YELLOW}⚠${NC} Logo URL unchanged (you may have uploaded to same URL)"
fi

# Check HTML
sleep 2
NEW_HTML_CHECK=$(ssh $VPS "curl -s http://localhost:4000/order | grep -o 'logoUrl\":\"[^\"]*' | head -1")

if echo "$NEW_HTML_CHECK" | grep -q "?t=$NEW_TIMESTAMP"; then
    echo -e "${GREEN}✓${NC} HTML cache-buster updated to new timestamp"
else
    echo -e "${RED}✗${NC} HTML cache-buster NOT updated"
    echo "  Expected: ?t=$NEW_TIMESTAMP"
    echo "  Found: $NEW_HTML_CHECK"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Test Results${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Before Upload:"
echo "    - Logo: $CURRENT_LOGO"
echo "    - Timestamp: $CURRENT_TIMESTAMP"
echo ""
echo "  After Upload:"
echo "    - Logo: $NEW_LOGO"
echo "    - Timestamp: $NEW_TIMESTAMP"
echo ""
echo "  Verification:"
if [ "$NEW_TIMESTAMP" -gt "$CURRENT_TIMESTAMP" ]; then
    echo -e "    ${GREEN}✓ Database timestamp updated${NC}"
else
    echo -e "    ${RED}✗ Database timestamp NOT updated${NC}"
fi

if echo "$NEW_HTML_CHECK" | grep -q "?t=$NEW_TIMESTAMP"; then
    echo -e "    ${GREEN}✓ HTML cache-buster correct${NC}"
else
    echo -e "    ${RED}✗ HTML cache-buster incorrect${NC}"
fi
echo ""
echo "  Next Step: Visit https://lapoblanita.alessacloud.com/order"
echo "            and verify the new logo appears without hard refresh"
echo ""
