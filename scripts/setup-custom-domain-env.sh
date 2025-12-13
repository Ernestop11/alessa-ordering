#!/bin/bash
# Script to update CUSTOM_DOMAIN_MAP in .env file

ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env file not found: $ENV_FILE"
  exit 1
fi

# Check if CUSTOM_DOMAIN_MAP already exists
if grep -q "CUSTOM_DOMAIN_MAP" "$ENV_FILE"; then
  echo "⚠️  CUSTOM_DOMAIN_MAP already exists in $ENV_FILE"
  echo "   Current value:"
  grep "CUSTOM_DOMAIN_MAP" "$ENV_FILE"
  echo ""
  echo "   Please update manually or remove the line and run this script again."
  exit 1
fi

# Add CUSTOM_DOMAIN_MAP
echo "" >> "$ENV_FILE"
echo "# Custom domain mapping for tenants" >> "$ENV_FILE"
echo 'CUSTOM_DOMAIN_MAP={"lapoblanitamexicanfood.com":"lapoblanita","lasreinascolusa.com":"lasreinas"}' >> "$ENV_FILE"

echo "✅ Added CUSTOM_DOMAIN_MAP to $ENV_FILE"
echo ""
echo "   Value:"
echo '   CUSTOM_DOMAIN_MAP={"lapoblanitamexicanfood.com":"lapoblanita","lasreinascolusa.com":"lasreinas"}'
echo ""
echo "💡 Next steps:"
echo "   1. Restart PM2: pm2 restart alessa-ordering"
echo "   2. Test domain: https://lapoblanitamexicanfood.com/order"

