#!/usr/bin/env bash
set -euo pipefail

# Fix "Unable to download shared cache files" error
# This error prevents wireless setup

echo "🔧 Fixing 'Unable to download shared cache files' Error"
echo "======================================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "This error prevents the 'Connect via network' option from appearing."
echo ""
echo "Let's fix it step by step:"
echo ""

# Step 1: Clean derived data
echo "1️⃣  Cleaning Xcode Derived Data..."
DERIVED_DATA="$HOME/Library/Developer/Xcode/DerivedData"
if [ -d "$DERIVED_DATA" ]; then
    rm -rf "$DERIVED_DATA"/*
    echo -e "${GREEN}✅ Derived data cleaned${NC}"
else
    echo "   No derived data to clean"
fi

# Step 2: Clean device support files
echo ""
echo "2️⃣  Cleaning Device Support Files..."
DEVICE_SUPPORT="$HOME/Library/Developer/Xcode/iOS DeviceSupport"
if [ -d "$DEVICE_SUPPORT" ]; then
    # Find iPad-specific support files
    IPAD_SUPPORT=$(find "$DEVICE_SUPPORT" -name "*iPad*" -o -name "*00008020*" 2>/dev/null | head -1)
    if [ -n "$IPAD_SUPPORT" ]; then
        echo "   Found iPad support files, cleaning..."
        rm -rf "$IPAD_SUPPORT"
        echo -e "${GREEN}✅ iPad support files cleaned${NC}"
    else
        echo "   No iPad-specific support files found"
    fi
else
    echo "   No device support directory found"
fi

# Step 3: Clean archives
echo ""
echo "3️⃣  Cleaning Archives (optional)..."
ARCHIVES="$HOME/Library/Developer/Xcode/Archives"
if [ -d "$ARCHIVES" ]; then
    SIZE=$(du -sh "$ARCHIVES" 2>/dev/null | cut -f1)
    echo "   Archives size: $SIZE"
    echo -e "${YELLOW}   (Skipping archive cleanup - keeping your builds)${NC}"
fi

echo ""
echo "4️⃣  Next Steps in Xcode:"
echo "========================"
echo ""
echo "Step 1: Close and Reopen Devices Window"
echo "  - Close the Devices and Simulators window"
echo "  - Press Cmd+Shift+2 to reopen it"
echo ""
echo "Step 2: Unpair and Re-pair iPad"
echo "  - Right-click on 'iPad' in the left sidebar"
echo "  - Select 'Unpair Device'"
echo "  - Wait a few seconds"
echo "  - Reconnect USB cable if needed"
echo "  - Trust computer on iPad if prompted"
echo ""
echo -e "${BLUE}Step 3: Wait for Device Setup${NC}"
echo "  - Xcode will re-download device support files"
echo "  - This may take 1-2 minutes"
echo "  - Watch for progress indicator"
echo ""
echo -e "${BLUE}Step 4: Look for Network Option${NC}"
echo "  - After device is fully set up, scroll down in the right pane"
echo "  - Look for 'Connect via network' checkbox"
echo "  - It may appear after the error is resolved"
echo ""

read -p "Press Enter when ready to continue..."

echo ""
echo "5️⃣  Alternative: Try Device Registration"
echo "========================================="
echo ""
echo "If the error persists, try:"
echo ""
echo "  1. In Xcode: Window → Devices and Simulators"
echo "  2. Select iPad"
echo "  3. Click 'Use for Development' button (if visible)"
echo "  4. Wait for setup to complete"
echo ""

echo ""
echo "6️⃣  Check iPad Storage"
echo "======================"
echo ""
echo "Low storage can cause this error. Check:"
echo "  - Settings → General → iPad Storage"
echo "  - Free up at least 2-3GB if needed"
echo ""

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "Now try:"
echo "  1. Close Devices window (Cmd+W)"
echo "  2. Reopen it (Cmd+Shift+2)"
echo "  3. Unpair and re-pair iPad"
echo "  4. Wait for device setup to complete"
echo "  5. Look for 'Connect via network' option"
echo ""

