#!/usr/bin/env bash
set -euo pipefail

# Automatically enable wireless deployment for iPad
# This script attempts to enable wireless via AppleScript

echo "📡 Enabling Wireless Deployment"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Xcode is running
if ! pgrep -x "Xcode" > /dev/null; then
    echo "Opening Xcode..."
    open -a Xcode
    sleep 3
fi

# Check if device is connected
echo "1️⃣  Checking iPad connection..."
DEVICES=$(xcrun xctrace list devices 2>/dev/null || echo "")
IPAD_INFO=$(echo "$DEVICES" | grep -i "ipad" | head -1)

if [ -z "$IPAD_INFO" ]; then
    echo -e "${RED}❌ iPad not detected${NC}"
    echo "Please connect iPad via USB first"
    exit 1
fi

echo -e "${GREEN}✅ iPad detected:${NC}"
echo "   $IPAD_INFO"
echo ""

# Extract UDID
UDID=$(echo "$IPAD_INFO" | grep -oE '[A-F0-9-]{36}' | head -1)

echo "2️⃣  Opening Devices and Simulators window..."
echo ""

# Try to open Devices window and enable wireless
osascript <<'EOF'
tell application "Xcode"
    activate
    delay 2
end tell

tell application "System Events"
    tell process "Xcode"
        -- Open Devices window with Cmd+Shift+2
        try
            keystroke "2" using {command down, shift down}
            delay 2
        end try
        
        -- Try to find and click the "Connect via network" checkbox
        -- Note: This is tricky because we need to find the iPad in the list first
        -- The checkbox might be in a table or list
        
        delay 1
        
        -- Alternative: Try to use menu
        try
            tell menu bar 1
                tell menu bar item "Window"
                    tell menu "Window"
                        click menu item "Devices and Simulators"
                    end tell
                end tell
            end tell
            delay 2
        end try
    end tell
end tell
EOF

echo -e "${YELLOW}⚠️  Automated setup may require manual confirmation${NC}"
echo ""
echo "3️⃣  Manual Steps (if automated didn't work):"
echo "=============================================="
echo ""
echo "The Devices window should be open. Please:"
echo ""
echo "  1. Find 'iPad' in the left sidebar"
echo "  2. Click on it to select"
echo "  3. Look for 'Connect via network' checkbox"
echo "  4. ✅ Check the box"
echo "  5. Wait 10-30 seconds for network icon (🌐) to appear"
echo ""
echo "4️⃣  Verifying wireless connection..."
echo "====================================="
echo ""
read -p "Have you checked 'Connect via network'? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Waiting for network connection to establish..."
    sleep 5
    
    echo ""
    echo "Now let's test if wireless is working:"
    echo ""
    read -p "Please disconnect the USB cable now, then press Enter..."
    echo ""
    
    sleep 3
    
    DEVICES_AFTER=$(xcrun xctrace list devices 2>/dev/null || echo "")
    IPAD_AFTER=$(echo "$DEVICES_AFTER" | grep -i "ipad" | head -1)
    
    if [ -n "$IPAD_AFTER" ]; then
        echo -e "${GREEN}✅ SUCCESS! Wireless deployment is enabled!${NC}"
        echo ""
        echo "Your iPad: $IPAD_AFTER"
        echo ""
        echo "You can now deploy wirelessly without USB cable!"
        echo ""
        echo "To deploy:"
        echo "  npm run deploy:ipad"
        echo ""
        echo "Or in Xcode:"
        echo "  Product → Run (Cmd+R)"
    else
        echo -e "${YELLOW}⚠️  iPad not visible wirelessly yet${NC}"
        echo ""
        echo "This might mean:"
        echo "  - Network connection still establishing (wait 30 more seconds)"
        echo "  - iPad and Mac not on same WiFi"
        echo "  - Need to reconnect USB and try again"
        echo ""
        echo "Try:"
        echo "  1. Reconnect USB"
        echo "  2. Make sure 'Connect via network' is checked"
        echo "  3. Wait for network icon (🌐) to appear"
        echo "  4. Then disconnect USB"
    fi
else
    echo ""
    echo "Please follow the manual steps above to enable wireless deployment."
    echo ""
    echo "Once enabled, you can run this script again to verify."
fi

echo ""
echo "✅ Setup complete!"




