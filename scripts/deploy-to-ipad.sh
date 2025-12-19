#!/usr/bin/env bash
set -euo pipefail

# Deploy to iPad - Complete Workflow
# This script prepares and deploys the app to iPad via Xcode

echo "📱 Deploying to iPad"
echo "==================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Clean derived data (most common fix)
echo "1️⃣  Cleaning Xcode cache..."
DERIVED_DATA="$HOME/Library/Developer/Xcode/DerivedData"
if [ -d "$DERIVED_DATA" ]; then
    rm -rf "$DERIVED_DATA"/* 2>/dev/null || true
    echo -e "${GREEN}✅ Derived data cleaned${NC}"
fi

# Step 2: Build Next.js app
echo ""
echo "2️⃣  Building Next.js app..."
npm run build
echo -e "${GREEN}✅ Build complete${NC}"

# Step 3: Sync Capacitor
echo ""
echo "3️⃣  Syncing Capacitor..."
npx cap sync ios
echo -e "${GREEN}✅ Capacitor synced${NC}"

# Step 4: Check Pods
echo ""
echo "4️⃣  Checking CocoaPods..."
cd ios/App
if [ ! -d "Pods" ] || [ "Podfile" -nt "Podfile.lock" ]; then
    echo "   Installing/updating pods..."
    pod install
    echo -e "${GREEN}✅ Pods ready${NC}"
else
    echo -e "${GREEN}✅ Pods up to date${NC}"
fi
cd ../..

# Step 5: Check device connection
echo ""
echo "5️⃣  Checking device connection..."
DEVICES=$(xcrun xctrace list devices 2>/dev/null | grep -i "ipad\|iphone" || echo "")
if [ -z "$DEVICES" ]; then
    echo -e "${YELLOW}⚠️  No iOS devices detected${NC}"
    echo ""
    echo "Please ensure:"
    echo "  - iPad is connected via USB"
    echo "  - iPad is unlocked"
    echo "  - You've trusted this computer on iPad"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Device detected:${NC}"
    echo "$DEVICES" | head -1 | sed 's/^/   /'
fi

# Step 6: Open Xcode
echo ""
echo "6️⃣  Opening Xcode..."
echo ""
echo -e "${GREEN}✅ Ready to deploy!${NC}"
echo ""
echo "In Xcode, please:"
echo "  1. Product → Clean Build Folder (Cmd+Shift+K)"
echo "  2. Select your iPad from device dropdown"
echo "  3. Product → Run (Cmd+R)"
echo ""
echo "If you see 'unable to download shared cache files':"
echo "  - Try disconnecting and reconnecting iPad"
echo "  - Check iPad storage (Settings → General → iPad Storage)"
echo "  - Try a different USB port/cable"
echo ""

read -p "Open Xcode now? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    npx cap open ios
fi









