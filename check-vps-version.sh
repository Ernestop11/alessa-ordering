#!/bin/bash

# VPS Version Checker - Check if "perfect" La Poblanita UI version exists on VPS
# VPS: 77.243.85.8
# App: /var/www/alessa-ordering

set -e

VPS_HOST="root@77.243.85.8"
APP_DIR="/var/www/alessa-ordering"
FILE="components/order/OrderPageClient.tsx"

echo "🔍 Checking VPS for 'perfect' UI version..."
echo "=========================================="
echo ""

# Check 1: Header Buttons Layout
echo "📋 CHECK 1: Header Buttons Layout (Lines 1178-1260)"
echo "---------------------------------------------------"
ssh $VPS_HOST "cd $APP_DIR && sed -n '1178,1260p' $FILE" | grep -E "(Tab Bar|Catering|ADA|Rewards|Cart|button)" | head -20
echo ""

# Check 2: Are all 4 buttons in same row?
echo "📋 CHECK 2: Are ADA, Catering, Rewards, Cart all in same row?"
echo "-------------------------------------------------------------"
ssh $VPS_HOST "cd $APP_DIR && awk '/Tab Bar: Catering, ADA, Cart/,/View Toggles/{print NR\": \"\$0}' $FILE | head -30"
echo ""

# Check 3: Checkout Upsell Bundles
echo "📋 CHECK 3: Checkout Upsell Bundles in Cart/CartDrawer"
echo "-------------------------------------------------------"
ssh $VPS_HOST "cd $APP_DIR && grep -n 'checkout.*upsell\|upsell.*checkout\|checkoutUpsells\|cartUpsells\|surfaces.*checkout' components/CartDrawer.tsx components/Cart.tsx components/EnhancedCheckout.tsx 2>/dev/null || echo '❌ No checkout upsells found in Cart components'"
echo ""

# Check 4: Upsell bundles configuration check
echo "📋 CHECK 4: Upsell Bundle Configuration"
echo "----------------------------------------"
ssh $VPS_HOST "cd $APP_DIR && grep -n 'surfaces.*checkout\|checkout.*surfaces' components/order/OrderPageClient.tsx | head -5"
echo ""

# Check 5: Git commit history
echo "📋 CHECK 5: Recent Git Commits"
echo "------------------------------"
ssh $VPS_HOST "cd $APP_DIR && git log --oneline -10 -- $FILE"
echo ""

# Check 6: Git status (uncommitted changes?)
echo "📋 CHECK 6: Git Status"
echo "---------------------"
ssh $VPS_HOST "cd $APP_DIR && git status --short | head -10"
echo ""

# Check 7: Get specific lines for header buttons
echo "📋 CHECK 7: Full Header Button Section"
echo "--------------------------------------"
ssh $VPS_HOST "cd $APP_DIR && sed -n '1175,1225p' $FILE"
echo ""

# Check 8: Check if Rewards is in separate row
echo "📋 CHECK 8: Rewards Button Location"
echo "-----------------------------------"
ssh $VPS_HOST "cd $APP_DIR && grep -n 'Rewards' $FILE | grep -E '(button|onClick|setRewardsOpen)' | head -5"
echo ""

# Check 9: Download the file for comparison
echo "📋 CHECK 9: Downloading VPS version for comparison..."
echo "------------------------------------------------------"
mkdir -p vps-backup 2>/dev/null || true
scp $VPS_HOST:$APP_DIR/$FILE ./vps-backup/OrderPageClient-VPS.tsx 2>/dev/null && echo "✅ Downloaded to ./vps-backup/OrderPageClient-VPS.tsx" || echo "❌ Could not download file"
echo ""

# Summary
echo "=========================================="
echo "✅ VPS Check Complete!"
echo ""
echo "Next steps:"
echo "1. Review the output above"
echo "2. Compare: diff components/order/OrderPageClient.tsx vps-backup/OrderPageClient-VPS.tsx"
echo "3. If perfect version found, restore it locally"
echo ""





















