#!/usr/bin/env bash
set -euo pipefail

# Xcode Deployment Fix Script
# This script performs common fixes for deployment issues

echo "🔧 Xcode Deployment Fix Script"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Clean Derived Data
echo "1️⃣  Cleaning Xcode Derived Data..."
DERIVED_DATA="$HOME/Library/Developer/Xcode/DerivedData"
if [ -d "$DERIVED_DATA" ]; then
    rm -rf "$DERIVED_DATA"/*
    echo -e "${GREEN}✅ Derived data cleaned${NC}"
else
    echo "   No derived data to clean"
fi

# Step 2: Clean Archives (optional - comment out if you want to keep archives)
echo ""
echo "2️⃣  Cleaning Xcode Archives (optional)..."
read -p "   Clean archives? This will delete all archived builds. (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ARCHIVES="$HOME/Library/Developer/Xcode/Archives"
    if [ -d "$ARCHIVES" ]; then
        rm -rf "$ARCHIVES"/*
        echo -e "${GREEN}✅ Archives cleaned${NC}"
    fi
else
    echo "   Skipped archive cleanup"
fi

# Step 3: Clean iOS build folder
echo ""
echo "3️⃣  Cleaning iOS build folder..."
if [ -d "ios/App/build" ]; then
    rm -rf ios/App/build
    echo -e "${GREEN}✅ iOS build folder cleaned${NC}"
else
    echo "   No build folder found"
fi

# Step 4: Reinstall Pods
echo ""
echo "4️⃣  Reinstalling CocoaPods..."
cd ios/App
if [ -f "Podfile" ]; then
    pod deintegrate 2>/dev/null || true
    pod install
    echo -e "${GREEN}✅ Pods reinstalled${NC}"
else
    echo -e "${YELLOW}⚠️  Podfile not found${NC}"
fi
cd ../..

# Step 5: Sync Capacitor
echo ""
echo "5️⃣  Syncing Capacitor..."
npm run build
npx cap sync ios
echo -e "${GREEN}✅ Capacitor synced${NC}"

# Step 6: Open Xcode
echo ""
echo "6️⃣  Opening Xcode..."
echo -e "${GREEN}✅ Ready to deploy!${NC}"
echo ""
echo "Next steps in Xcode:"
echo "1. Product → Clean Build Folder (Cmd+Shift+K)"
echo "2. Connect your iPad"
echo "3. Select iPad as target device"
echo "4. Product → Run (Cmd+R)"
echo ""
read -p "Open Xcode now? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    npx cap open ios
fi














