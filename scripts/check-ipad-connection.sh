#!/usr/bin/env bash
set -euo pipefail

# Check iPad Connection and Set Up Wireless Deployment

echo "🔍 iPad Connection Diagnostic & Wireless Setup"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if device is connected
echo "1️⃣  Checking iPad Connection..."
DEVICES=$(xcrun xctrace list devices 2>/dev/null || echo "")

if [ -z "$DEVICES" ]; then
    echo -e "${RED}❌ No devices found${NC}"
    echo ""
    echo "Please ensure:"
    echo "  - iPad is connected via USB"
    echo "  - iPad is unlocked"
    echo "  - You've trusted this computer"
    exit 1
fi

# Extract iPad info
IPAD_INFO=$(echo "$DEVICES" | grep -i "ipad" | head -1)
if [ -z "$IPAD_INFO" ]; then
    echo -e "${YELLOW}⚠️  No iPad found in connected devices${NC}"
    echo "Connected devices:"
    echo "$DEVICES" | sed 's/^/   /'
    exit 1
fi

echo -e "${GREEN}✅ iPad found:${NC}"
echo "   $IPAD_INFO"

# Extract UDID
UDID=$(echo "$IPAD_INFO" | grep -oE '[A-F0-9-]{36}' | head -1)
if [ -n "$UDID" ]; then
    echo "   UDID: $UDID"
fi

echo ""

# Check connection method
echo "2️⃣  Checking Connection Method..."
if command -v ideviceinfo &> /dev/null; then
    if [ -n "$UDID" ]; then
        # Try to get device info via USB
        USB_CONNECTED=$(ideviceinfo -u "$UDID" -k DeviceName 2>/dev/null || echo "")
        if [ -n "$USB_CONNECTED" ]; then
            echo -e "${GREEN}✅ USB connection active${NC}"
            echo "   Device name: $USB_CONNECTED"
        else
            echo -e "${YELLOW}⚠️  USB connection may be unstable${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  libimobiledevice not installed${NC}"
    echo "   Install via: brew install libimobiledevice"
    echo "   This helps test USB connection quality"
fi

echo ""

# Check if wireless is enabled
echo "3️⃣  Checking Wireless Deployment Status..."
# Note: We can't directly check this via command line, but we can guide the user
echo "   To check/enable wireless deployment:"
echo "   1. Open Xcode"
echo "   2. Window → Devices and Simulators (Cmd+Shift+2)"
echo "   3. Select your iPad in the left sidebar"
echo "   4. Check 'Connect via network' checkbox"
echo ""

# Test cable quality by checking if we can get device info repeatedly
echo "4️⃣  Testing Cable Quality..."
if command -v ideviceinfo &> /dev/null && [ -n "$UDID" ]; then
    echo "   Running 5 connection tests..."
    SUCCESS=0
    for i in {1..5}; do
        if ideviceinfo -u "$UDID" -k DeviceName &>/dev/null; then
            SUCCESS=$((SUCCESS + 1))
            echo -n "   ✓"
        else
            echo -n "   ✗"
        fi
        sleep 0.5
    done
    echo ""
    echo ""
    if [ $SUCCESS -eq 5 ]; then
        echo -e "${GREEN}✅ Cable connection is stable (5/5 tests passed)${NC}"
    elif [ $SUCCESS -ge 3 ]; then
        echo -e "${YELLOW}⚠️  Cable connection is intermittent ($SUCCESS/5 tests passed)${NC}"
        echo "   Consider trying a different cable or USB port"
    else
        echo -e "${RED}❌ Cable connection is unstable ($SUCCESS/5 tests passed)${NC}"
        echo "   Strongly recommend:"
        echo "   - Try a different cable"
        echo "   - Try a different USB port"
        echo "   - Set up wireless deployment"
    fi
else
    echo -e "${YELLOW}⚠️  Cannot test cable quality (libimobiledevice not installed)${NC}"
    echo "   Install via: brew install libimobiledevice"
fi

echo ""

# Instructions for wireless setup
echo "5️⃣  Setting Up Wireless Deployment"
echo "===================================="
echo ""
echo "To enable wireless deployment (recommended if cable is unstable):"
echo ""
echo "Step 1: Connect via USB (one time setup)"
echo "  - Keep iPad connected via USB"
echo "  - Open Xcode"
echo ""
echo "Step 2: Enable Network Connection"
echo "  - In Xcode: Window → Devices and Simulators (Cmd+Shift+2)"
echo "  - Select your iPad in the left sidebar"
echo "  - Check the box: 'Connect via network'"
echo "  - Wait for the network icon to appear next to iPad name"
echo ""
echo "Step 3: Disconnect USB"
echo "  - Once network icon appears, you can disconnect USB"
echo "  - iPad will now appear with a network icon"
echo ""
echo "Step 4: Deploy Wirelessly"
echo "  - Select iPad from device dropdown in Xcode"
echo "  - Product → Run (Cmd+R)"
echo "  - Deployment will happen over WiFi"
echo ""
echo -e "${GREEN}✅ Wireless deployment is more reliable than USB!${NC}"
echo ""

# Check if we can open Xcode Devices window
echo "6️⃣  Opening Xcode Devices Window..."
read -p "Open Xcode Devices window now? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    # Open Xcode if not already open
    if ! pgrep -x "Xcode" > /dev/null; then
        echo "   Opening Xcode..."
        open -a Xcode
        sleep 2
    fi
    
    # Try to open Devices window (this requires Xcode to be running)
    echo "   Opening Devices and Simulators window..."
    osascript <<EOF 2>/dev/null || echo "   (Please manually open: Window → Devices and Simulators)"
tell application "Xcode"
    activate
    tell application "System Events"
        keystroke "2" using {command down, shift down}
    end tell
end tell
EOF
    echo ""
    echo -e "${GREEN}✅ Xcode Devices window should be open${NC}"
    echo "   Look for your iPad and check 'Connect via network'"
fi

echo ""
echo "📋 Summary"
echo "========="
echo ""
echo "Your iPad is registered and connected."
echo ""
if command -v ideviceinfo &> /dev/null && [ -n "$UDID" ]; then
    if [ $SUCCESS -lt 5 ] 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Cable may be unstable - set up wireless deployment${NC}"
    else
        echo -e "${GREEN}✅ Cable connection appears stable${NC}"
    fi
else
    echo -e "${YELLOW}💡 Tip: Install libimobiledevice to test cable quality${NC}"
    echo "   brew install libimobiledevice"
fi
echo ""
echo "Next steps:"
echo "  1. Enable wireless deployment in Xcode (see instructions above)"
echo "  2. Once enabled, you can deploy without USB cable"
echo "  3. Wireless is more reliable for repeated deployments"












