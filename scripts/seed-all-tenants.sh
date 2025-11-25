#!/bin/bash

# Seed All New Tenants Script
# This script seeds the three new restaurants with alessa.com subdomains

set -e

echo "🚀 Seeding new tenants..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Tenant configurations
declare -a TENANTS=(
  "lasreinas:lasreinascolusa.com:lasreinas.alessa.com"
  "taqueriarosita:taqueriarosita.com:taqueriarosita.alessa.com"
  "villacorona:villacoronacatering.com:villacorona.alessa.com"
)

for tenant_config in "${TENANTS[@]}"; do
  IFS=':' read -r slug source_domain subdomain <<< "$tenant_config"
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}Seeding: ${slug}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  SEED_FILE="scripts/seed-data/${slug}.json"
  
  if [ ! -f "$SEED_FILE" ]; then
    echo -e "${YELLOW}⚠️  Seed file not found: ${SEED_FILE}${NC}"
    echo -e "${YELLOW}   Creating template...${NC}"
    node scripts/scrape-website-data.mjs --url="https://${source_domain}" --output="${SEED_FILE}" --slug="${slug}"
    echo -e "${YELLOW}   Please update ${SEED_FILE} with actual data from ${source_domain}${NC}"
    echo ""
    continue
  fi
  
  echo -e "${GREEN}✓${NC} Seed file found: ${SEED_FILE}"
  echo -e "${BLUE}→${NC} Running seed script..."
  
  node scripts/seed-tenant.mjs \
    --slug="${slug}" \
    --input="${SEED_FILE}" \
    --domain="${subdomain}" \
    --force
  
  echo -e "${GREEN}✅${NC} ${slug} seeded successfully!"
  echo -e "${BLUE}   Preview: https://${subdomain}${NC}"
  echo ""
done

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 All tenants seeded!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review tenants in Super Admin: /super-admin"
echo "  2. Update seed files with actual menu/contact data from websites"
echo "  3. Re-run this script with --force to update"
echo "  4. Once approved, change status to 'READY_FOR_APPROVAL'"
echo "  5. After client approval, change to 'APPROVED' → 'LIVE'"
echo ""

