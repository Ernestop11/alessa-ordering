#!/bin/bash

# Template Structure Verification Script
# Verifies the TEMPLATE_SECTIONS are correctly defined in the code

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Template Structure Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Extract template data from route.ts
ROUTE_FILE="app/api/super/tenants/route.ts"

if [ ! -f "$ROUTE_FILE" ]; then
    echo -e "${YELLOW}Error: $ROUTE_FILE not found${NC}"
    exit 1
fi

echo -e "${CYAN}Template Definitions:${NC}"
echo ""

# Template 1: Taqueria
echo -e "${GREEN}1. Taqueria Template${NC}"
echo "   Expected: 3 sections, 8 items"
echo "   Sections:"
grep -A 3 "taqueria: \[" "$ROUTE_FILE" | grep "name:" | head -3 | sed 's/.*name: /     • /' | sed "s/',//"
TAQUERIA_ITEMS=$(grep -A 35 "taqueria: \[" "$ROUTE_FILE" | grep -c "{ name:")
echo "   Items: $TAQUERIA_ITEMS"
echo ""

# Template 2: Panadería
echo -e "${GREEN}2. Panadería Template${NC}"
echo "   Expected: 1 section, 4 items"
echo "   Sections:"
grep -A 3 "panaderia: \[" "$ROUTE_FILE" | grep "name:" | head -1 | sed 's/.*name: /     • /' | sed "s/',//"
PANADERIA_ITEMS=$(grep -A 12 "panaderia: \[" "$ROUTE_FILE" | grep -c "{ name:")
echo "   Items: $PANADERIA_ITEMS"
echo ""

# Template 3: Coffee
echo -e "${GREEN}3. Coffee Template${NC}"
echo "   Expected: 2 sections, 7 items"
echo "   Sections:"
grep -A 3 "coffee: \[" "$ROUTE_FILE" | grep "name:" | head -2 | sed 's/.*name: /     • /' | sed "s/',//"
COFFEE_ITEMS=$(grep -A 22 "coffee: \[" "$ROUTE_FILE" | grep -c "{ name:")
echo "   Items: $COFFEE_ITEMS"
echo ""

# Template 4: Pizza
echo -e "${GREEN}4. Pizza Template${NC}"
echo "   Expected: 2 sections, 6 items"
echo "   Sections:"
grep -A 3 "pizza: \[" "$ROUTE_FILE" | grep "name:" | head -2 | sed 's/.*name: /     • /' | sed "s/',//"
PIZZA_ITEMS=$(grep -A 18 "pizza: \[" "$ROUTE_FILE" | grep -c "{ name:")
echo "   Items: $PIZZA_ITEMS"
echo ""

# Template 5: Grocery
echo -e "${GREEN}5. Grocery Template${NC}"
echo "   Expected: 2 sections, 6 items"
echo "   Sections:"
grep -A 3 "grocery: \[" "$ROUTE_FILE" | grep "name:" | head -2 | sed 's/.*name: /     • /' | sed "s/',//"
GROCERY_ITEMS=$(grep -A 18 "grocery: \[" "$ROUTE_FILE" | grep -c "{ name:")
echo "   Items: $GROCERY_ITEMS"
echo ""

# Summary
TOTAL_ITEMS=$((TAQUERIA_ITEMS + PANADERIA_ITEMS + COFFEE_ITEMS + PIZZA_ITEMS + GROCERY_ITEMS))

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Summary:${NC}"
echo "  Total Templates: 5"
echo "  Total Sections: 10 (3 + 1 + 2 + 2 + 2)"
echo "  Total Items: $TOTAL_ITEMS (expected: 31)"
echo ""

if [ "$TOTAL_ITEMS" -eq 31 ]; then
    echo -e "${GREEN}✓ All templates correctly defined!${NC}"
else
    echo -e "${YELLOW}⚠ Item count mismatch (expected 31, got $TOTAL_ITEMS)${NC}"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
