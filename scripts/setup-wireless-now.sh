#!/usr/bin/env bash
set -euo pipefail

# Quick Wireless Setup - Opens Xcode and guides you

echo "📡 Quick Wireless Setup"
echo "======================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Ensure Xcode is open
if ! pgrep -x "Xcode" > /dev/null; then
    echo "Opening Xcode..."
    open -a Xcode
    sleep 4
fi

# Open Devices window using menu
osascript <<'EOF'
tell application "Xcode"
    activate
    delay 1
end tell

tell application "System Events"
    tell process "Xcode"
        -- Try menu approach
        try
            click menu bar item "Window" of menu bar 1
            delay 0.5
            click menu item "Devices and Simulators" of menu "Window" of menu bar item "Window" of menu bar 1
            delay 1
        end try
    end tell
end tell
EOF

echo -e "${GREEN}✅ Devices window should be open!${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FOLLOW THESE EXACT STEPS:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "1. In the Devices window (that just opened):"
echo ""
echo "   📱 Look for 'iPad' in the LEFT SIDEBAR"
echo "   👆 CLICK on 'iPad' to select it"
echo ""
echo "2. In the RIGHT PANE, you'll see iPad details:"
echo ""
echo "   ☐ Look for checkbox: 'Connect via network'"
echo "   ✅ CHECK that box"
echo ""
echo "3. Wait 10-30 seconds..."
echo ""
echo "   🌐 You should see a NETWORK/GLOBE icon appear"
echo "      next to 'iPad' in the left sidebar"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Keep USB connected until you see the network icon!${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

read -p "Press Enter when you've checked 'Connect via network' and see the network icon..."

echo ""
echo "4. Testing wireless connection..."
echo ""
read -p "Now DISCONNECT the USB cable, then press Enter..."

sleep 3

echo ""
echo "Checking if iPad is still connected wirelessly..."
DEVICES=$(xcrun xctrace list devices 2>/dev/null || echo "")
IPAD=$(echo "$DEVICES" | grep -i "ipad" | head -1)

if [ -n "$IPAD" ]; then
    echo ""
    echo -e "${GREEN}🎉 SUCCESS! Wireless deployment is working!${NC}"
    echo ""
    echo "Your iPad: $IPAD"
    echo ""
    echo "✅ You can now deploy without USB cable!"
    echo ""
    echo "To deploy:"
    echo "   npm run deploy:ipad"
    echo ""
    echo "Or in Xcode:"
    echo "   Select iPad → Product → Run (Cmd+R)"
else
    echo ""
    echo -e "${YELLOW}⚠️  iPad not visible wirelessly${NC}"
    echo ""
    echo "Try this:"
    echo "  1. Reconnect USB cable"
    echo "  2. Make sure 'Connect via network' is checked"
    echo "  3. Wait longer for network icon (up to 1 minute)"
    echo "  4. Make sure iPad and Mac are on same WiFi"
    echo "  5. Try disconnecting USB again"
    echo ""
    echo "Then run this script again:"
    echo "   npm run ipad:wireless"
fi

echo ""
echo "✅ Setup complete!"














