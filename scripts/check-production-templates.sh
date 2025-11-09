#!/bin/bash

# Production Template Verification Script
# Checks which templates have been created on production

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Production Template Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${CYAN}Checking production database on VPS...${NC}"
echo ""

# Get all tenants with menu structure
RESULT=$(ssh root@77.243.85.8 "sudo -u postgres psql -d alessa_ordering -t -c \"SELECT t.name, t.slug, COUNT(DISTINCT ms.id) as sections, COUNT(mi.id) as items, string_agg(DISTINCT ms.type::text, ', ' ORDER BY ms.type::text) as types FROM \\\"Tenant\\\" t LEFT JOIN \\\"MenuSection\\\" ms ON t.id = ms.\\\"tenantId\\\" LEFT JOIN \\\"MenuItem\\\" mi ON ms.id = mi.\\\"menuSectionId\\\" GROUP BY t.id, t.name, t.slug ORDER BY t.\\\"createdAt\\\" DESC;\"" 2>/dev/null)

if [ -z "$RESULT" ]; then
    echo -e "${RED}✗ Failed to connect to database${NC}"
    exit 1
fi

echo -e "${GREEN}Current Tenants:${NC}"
echo ""

printf "%-35s %-20s %10s %8s %s\n" "NAME" "SLUG" "SECTIONS" "ITEMS" "TYPES"
echo "────────────────────────────────────────────────────────────────────────────────────────"

echo "$RESULT" | while IFS='|' read -r name slug sections items types; do
    # Trim whitespace
    name=$(echo "$name" | xargs)
    slug=$(echo "$slug" | xargs)
    sections=$(echo "$sections" | xargs)
    items=$(echo "$items" | xargs)
    types=$(echo "$types" | xargs)

    printf "%-35s %-20s %10s %8s %s\n" "$name" "$slug" "$sections" "$items" "$types"
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check for test templates
echo -e "${CYAN}Looking for test template tenants...${NC}"
echo ""

TEST_TEMPLATES=$(ssh root@77.243.85.8 "sudo -u postgres psql -d alessa_ordering -t -c \"SELECT t.slug, COUNT(DISTINCT ms.id) as sections, COUNT(mi.id) as items FROM \\\"Tenant\\\" t LEFT JOIN \\\"MenuSection\\\" ms ON t.id = ms.\\\"tenantId\\\" LEFT JOIN \\\"MenuItem\\\" mi ON ms.id = mi.\\\"menuSectionId\\\" WHERE t.slug LIKE 'test-%' GROUP BY t.slug ORDER BY t.\\\"createdAt\\\" DESC;\"" 2>/dev/null)

if [ -z "$TEST_TEMPLATES" ]; then
    echo -e "${YELLOW}No test template tenants found${NC}"
    echo ""
    echo -e "${CYAN}Expected test tenant patterns:${NC}"
    echo "  • test-taqueria-*   (3 sections, 8 items)"
    echo "  • test-panaderia-*  (1 section, 4 items)"
    echo "  • test-coffee-*     (2 sections, 7 items)"
    echo "  • test-pizza-*      (2 sections, 6 items)"
    echo "  • test-grocery-*    (2 sections, 6 items)"
else
    echo -e "${GREEN}Test Template Tenants Found:${NC}"
    echo ""
    printf "%-30s %10s %8s %s\n" "SLUG" "SECTIONS" "ITEMS" "MATCH"
    echo "────────────────────────────────────────────────────────────────"

    echo "$TEST_TEMPLATES" | while IFS='|' read -r slug sections items; do
        slug=$(echo "$slug" | xargs)
        sections=$(echo "$sections" | xargs)
        items=$(echo "$items" | xargs)

        # Determine expected template
        match=""
        if [[ "$slug" == *"taqueria"* ]]; then
            if [ "$sections" = "3" ] && [ "$items" = "8" ]; then
                match="${GREEN}✓ Taqueria${NC}"
            else
                match="${RED}✗ Taqueria (expected 3/8)${NC}"
            fi
        elif [[ "$slug" == *"panaderia"* ]]; then
            if [ "$sections" = "1" ] && [ "$items" = "4" ]; then
                match="${GREEN}✓ Panadería${NC}"
            else
                match="${RED}✗ Panadería (expected 1/4)${NC}"
            fi
        elif [[ "$slug" == *"coffee"* ]]; then
            if [ "$sections" = "2" ] && [ "$items" = "7" ]; then
                match="${GREEN}✓ Coffee${NC}"
            else
                match="${RED}✗ Coffee (expected 2/7)${NC}"
            fi
        elif [[ "$slug" == *"pizza"* ]]; then
            if [ "$sections" = "2" ] && [ "$items" = "6" ]; then
                match="${GREEN}✓ Pizza${NC}"
            else
                match="${RED}✗ Pizza (expected 2/6)${NC}"
            fi
        elif [[ "$slug" == *"grocery"* ]]; then
            if [ "$sections" = "2" ] && [ "$items" = "6" ]; then
                match="${GREEN}✓ Grocery${NC}"
            else
                match="${RED}✗ Grocery (expected 2/6)${NC}"
            fi
        else
            match="${YELLOW}? Unknown${NC}"
        fi

        printf "%-30s %10s %8s " "$slug" "$sections" "$items"
        echo -e "$match"
    done
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${CYAN}Template Testing Checklist:${NC}"
echo ""
echo "  [ ] Taqueria  - 3 sections, 8 items  (FOOD, BEVERAGE)"
echo "  [ ] Panadería - 1 section,  4 items  (BAKERY)"
echo "  [ ] Coffee    - 2 sections, 7 items  (BEVERAGE, BAKERY)"
echo "  [ ] Pizza     - 2 sections, 6 items  (FOOD)"
echo "  [ ] Grocery   - 2 sections, 6 items  (GROCERY)"
echo ""

echo -e "${YELLOW}To create test templates, use:${NC}"
echo "  • Super Admin Dashboard: https://alessacloud.com/super-admin"
echo "  • Automated Script: ./scripts/test-template-seeds.sh"
echo ""
