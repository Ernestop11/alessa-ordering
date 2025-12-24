#!/usr/bin/env bash
set -euo pipefail

# Setup Wireless Deployment for iPad
# This script guides you through enabling wireless deployment

echo "📡 Setting Up Wireless Deployment for iPad"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if device is connected
echo "1️⃣  Checking iPad Connection..."
DEVICES=$(xcrun xctrace list devices 2>/dev/null || echo "")
IPAD_INFO=$(echo "$DEVICES" | grep -i "ipad" | head -1)

if [ -z "$IPAD_INFO" ]; then
    echo -e "${YELLOW}⚠️  iPad not detected${NC}"
    echo ""
    echo "Please connect your iPad via USB first, then run this script again."
    exit 1
fi

echo -e "${GREEN}✅ iPad detected:${NC}"
echo "   $IPAD_INFO"
echo ""

# Extract UDID
UDID=$(echo "$IPAD_INFO" | grep -oE '[A-F0-9-]{36}' | head -1)

echo "2️⃣  Opening Xcode Devices Window..."
echo ""
echo -e "${BLUE}Follow these steps:${NC}"
echo ""
echo "Step 1: Devices Window"
echo "  → Xcode should open the Devices and Simulators window"
echo "  → If not, press: Cmd+Shift+2"
echo ""
echo "Step 2: Find Your iPad"
echo "  → Look for 'iPad' in the left sidebar"
echo "  → It should show as connected via USB"
echo ""
echo "Step 3: Enable Network Connection"
echo "  → Click on your iPad in the left sidebar"
echo "  → Check the box: 'Connect via network'"
echo "  → Wait for network icon (globe) to appear"
echo ""
echo "Step 4: Verify"
echo "  → You should see a network icon next to iPad name"
echo "  → You can now disconnect USB cable"
echo "  → iPad will remain available for wireless deployment"
echo ""

# Try to open Xcode and Devices window
if pgrep -x "Xcode" > /dev/null; then
    echo "   Xcode is already running..."
else
    echo "   Opening Xcode..."
    open -a Xcode
    sleep 3
fi

# Open Devices window using AppleScript
echo "   Opening Devices and Simulators window..."
osascript <<'EOF' 2>/dev/null || echo "   (If window didn't open, press Cmd+Shift+2 in Xcode)"
tell application "Xcode"
    activate
    delay 1
end tell

tell application "System Events"
    tell process "Xcode"
        -- Try keyboard shortcut: Cmd+Shift+2
        keystroke "2" using {command down, shift down}
        delay 1
    end tell
end tell
EOF

echo ""
echo -e "${GREEN}✅ Devices window should be open now!${NC}"
echo ""
echo "3️⃣  What to Look For"
echo "===================="
echo ""
echo "In the Devices and Simulators window:"
echo ""
echo "  BEFORE enabling wireless:"
echo "    📱 iPad (USB icon)"
echo ""
echo "  AFTER enabling wireless:"
echo "    📱 iPad (Network/Globe icon)"
echo ""
echo "4️⃣  Testing Wireless Connection"
echo "================================"
echo ""
echo "Once you've enabled 'Connect via network':"
echo ""
echo "  1. Disconnect USB cable"
echo "  2. Wait 5-10 seconds"
echo "  3. Check Xcode device dropdown"
echo "  4. iPad should still appear (with network icon)"
echo ""
echo "If iPad disappears after disconnecting:"
echo "  → Reconnect USB"
echo "  → Make sure 'Connect via network' is checked"
echo "  → Wait for network icon to appear"
echo "  → Try disconnecting again"
echo ""
echo "5️⃣  Deploying Wirelessly"
echo "========================"
echo ""
echo "Once wireless is set up:"
echo ""
echo "  ✅ No USB cable needed"
echo "  ✅ More reliable than USB"
echo "  ✅ Faster deployment"
echo "  ✅ Works as long as iPad and Mac are on same WiFi"
echo ""
echo "To deploy:"
echo "  1. Select iPad from device dropdown in Xcode"
echo "  2. Product → Run (Cmd+R)"
echo "  3. App will deploy over WiFi"
echo ""
echo -e "${GREEN}💡 Tip: Wireless deployment is much more reliable!${NC}"
echo ""
read -p "Press Enter when you've enabled wireless deployment..."

# Verify wireless is enabled
echo ""
echo "6️⃣  Verifying Wireless Connection..."
echo ""
echo "Please disconnect your USB cable now."
read -p "Have you disconnected the USB cable? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Checking if iPad is still visible..."
    sleep 2
    
    DEVICES_AFTER=$(xcrun xctrace list devices 2>/dev/null || echo "")
    IPAD_AFTER=$(echo "$DEVICES_AFTER" | grep -i "ipad" | head -1)
    
    if [ -n "$IPAD_AFTER" ]; then
        echo -e "${GREEN}✅ SUCCESS! iPad is connected wirelessly!${NC}"
        echo "   $IPAD_AFTER"
        echo ""
        echo "You can now deploy without USB cable!"
    else
        echo -e "${YELLOW}⚠️  iPad not visible wirelessly${NC}"
        echo ""
        echo "This might mean:"
        echo "  - Wireless not fully enabled yet"
        echo "  - iPad and Mac not on same WiFi network"
        echo "  - Need to reconnect USB and try again"
        echo ""
        echo "Try:"
        echo "  1. Reconnect USB"
        echo "  2. Make sure 'Connect via network' is checked"
        echo "  3. Wait for network icon"
        echo "  4. Disconnect again"
    fi
else
    echo ""
    echo "Keep USB connected until wireless is fully set up."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next time you want to deploy:"
echo "  npm run deploy:ipad"
echo ""
echo "The app will deploy wirelessly (no cable needed)!"














