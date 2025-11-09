#!/bin/bash

# 🧪 Cache-Busting Verification Script
# This script verifies that cache-busting is working correctly

set -e

echo "🧪 Cache-Busting Verification Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="root@77.243.85.8"
APP_PATH="/var/www/alessa-ordering"
TENANT_SLUG="lapoblanita"
SITE_URL="http://lapoblanitamexicanfood.com:4000"

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

echo "1️⃣ Checking PM2 Status..."
PM2_STATUS=$(ssh $VPS_HOST "pm2 list | grep alessa-ordering | awk '{print \$10}'" || echo "offline")
if [ "$PM2_STATUS" = "online" ]; then
    print_success "PM2 process is online"
else
    print_error "PM2 process is not online (status: $PM2_STATUS)"
    exit 1
fi

echo ""
echo "2️⃣ Checking Database Timestamps..."
DB_OUTPUT=$(ssh $VPS_HOST "cd $APP_PATH && node -e \"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Check tenant timestamp
    const tenant = await prisma.tenant.findFirst({
      where: { slug: '$TENANT_SLUG' },
      select: { name: true, logoUrl: true, updatedAt: true }
    });
    
    if (tenant) {
      const timestamp = new Date(tenant.updatedAt).getTime();
      console.log('TENANT_TIMESTAMP:' + timestamp);
      console.log('TENANT_NAME:' + tenant.name);
      console.log('TENANT_LOGO:' + tenant.logoUrl);
    }
    
    // Check menu item timestamp
    const menuItem = await prisma.menuItem.findFirst({
      where: { image: { startsWith: '/uploads/' } },
      orderBy: { updatedAt: 'desc' },
      select: { name: true, image: true, updatedAt: true }
    });
    
    if (menuItem) {
      const timestamp = new Date(menuItem.updatedAt).getTime();
      console.log('MENU_TIMESTAMP:' + timestamp);
      console.log('MENU_NAME:' + menuItem.name);
      console.log('MENU_IMAGE:' + menuItem.image);
    }
    
    await prisma.\\\$disconnect();
  } catch (err) {
    console.error('ERROR:' + err.message);
    process.exit(1);
  }
})();
\"" 2>&1)

if echo "$DB_OUTPUT" | grep -q "ERROR"; then
    print_error "Database connection failed"
    echo "$DB_OUTPUT"
    exit 1
fi

TENANT_TIMESTAMP=$(echo "$DB_OUTPUT" | grep "TENANT_TIMESTAMP:" | cut -d: -f2)
TENANT_NAME=$(echo "$DB_OUTPUT" | grep "TENANT_NAME:" | cut -d: -f2-)
MENU_TIMESTAMP=$(echo "$DB_OUTPUT" | grep "MENU_TIMESTAMP:" | cut -d: -f2)
MENU_NAME=$(echo "$DB_OUTPUT" | grep "MENU_NAME:" | cut -d: -f2-)

if [ -n "$TENANT_TIMESTAMP" ]; then
    print_success "Tenant timestamp found: $TENANT_TIMESTAMP"
    print_info "  Tenant: $TENANT_NAME"
    print_info "  Cache-buster: ?t=$TENANT_TIMESTAMP"
else
    print_warning "No tenant timestamp found"
fi

if [ -n "$MENU_TIMESTAMP" ]; then
    print_success "Menu item timestamp found: $MENU_TIMESTAMP"
    print_info "  Item: $MENU_NAME"
    print_info "  Cache-buster: ?t=$MENU_TIMESTAMP"
else
    print_warning "No menu item timestamp found"
fi

echo ""
echo "3️⃣ Checking Cache-Busting in Live HTML..."
HTML_OUTPUT=$(curl -s "$SITE_URL/order" 2>&1)
TIMESTAMPS_FOUND=$(echo "$HTML_OUTPUT" | grep -o "?t=[0-9]\{13\}" | head -5 | sort -u)

if [ -n "$TIMESTAMPS_FOUND" ]; then
    print_success "Cache-busting timestamps found in HTML:"
    echo "$TIMESTAMPS_FOUND" | while read -r ts; do
        print_info "  $ts"
    done
    
    # Check if database timestamps match HTML timestamps
    if [ -n "$TENANT_TIMESTAMP" ]; then
        if echo "$TIMESTAMPS_FOUND" | grep -q "?t=$TENANT_TIMESTAMP"; then
            print_success "Tenant timestamp matches HTML"
        else
            print_warning "Tenant timestamp not found in HTML (may need refresh)"
        fi
    fi
    
    if [ -n "$MENU_TIMESTAMP" ]; then
        if echo "$TIMESTAMPS_FOUND" | grep -q "?t=$MENU_TIMESTAMP"; then
            print_success "Menu item timestamp matches HTML"
        else
            print_warning "Menu item timestamp not found in HTML (may need refresh)"
        fi
    fi
else
    print_error "No cache-busting timestamps found in HTML"
    print_info "This may indicate cache-busting is not working"
fi

echo ""
echo "4️⃣ Checking Implementation Files..."
IMPLEMENTATION_CHECK=$(ssh $VPS_HOST "cd $APP_PATH && grep -q 'tenantTimestamp' app/layout.tsx && echo 'FOUND' || echo 'NOT_FOUND'")
if [ "$IMPLEMENTATION_CHECK" = "FOUND" ]; then
    print_success "Cache-busting implementation found in app/layout.tsx"
else
    print_error "Cache-busting implementation NOT found in app/layout.tsx"
fi

REVALIDATION_CHECK=$(ssh $VPS_HOST "cd $APP_PATH && grep -q 'revalidatePath' app/api/admin/assets/upload/route.ts && echo 'FOUND' || echo 'NOT_FOUND'")
if [ "$REVALIDATION_CHECK" = "FOUND" ]; then
    print_success "Path revalidation found in upload route"
else
    print_error "Path revalidation NOT found in upload route"
fi

echo ""
echo "======================================"
echo "📊 Verification Summary"
echo "======================================"

if [ -n "$TENANT_TIMESTAMP" ] && [ -n "$TIMESTAMPS_FOUND" ]; then
    print_success "Cache-busting appears to be working!"
    echo ""
    print_info "To test end-to-end:"
    echo "  1. Upload a new image via admin panel"
    echo "  2. Check that the timestamp increases"
    echo "  3. Verify the new image appears on frontend"
else
    print_warning "Some checks failed. Review the output above."
fi

echo ""
echo "✅ Verification complete!"

