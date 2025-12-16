#!/usr/bin/env bash
set -euo pipefail

# Xcode Deployment Diagnostic Script
# This script helps diagnose "unable to download shared cache files" errors

echo "🔍 Xcode Deployment Diagnostic Tool"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Xcode is installed
echo "1️⃣  Checking Xcode Installation..."
if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -n 1)
    echo -e "${GREEN}✅ Xcode found: $XCODE_VERSION${NC}"
    
    # Check Xcode path
    XCODE_PATH=$(xcode-select -p)
    echo "   Path: $XCODE_PATH"
else
    echo -e "${RED}❌ Xcode not found. Please install Xcode from the App Store.${NC}"
    exit 1
fi

echo ""

# Check if device is connected
echo "2️⃣  Checking Connected iOS Devices..."
DEVICES=$(xcrun xctrace list devices 2>/dev/null | grep -i "ipad\|iphone" || echo "")
if [ -z "$DEVICES" ]; then
    echo -e "${YELLOW}⚠️  No iOS devices detected.${NC}"
    echo "   Please:"
    echo "   - Connect your iPad via USB"
    echo "   - Unlock your iPad"
    echo "   - Trust this computer if prompted"
    echo "   - Run: xcrun xctrace list devices"
else
    echo -e "${GREEN}✅ Devices found:${NC}"
    echo "$DEVICES" | sed 's/^/   /'
fi

echo ""

# Check Xcode derived data
echo "3️⃣  Checking Xcode Derived Data..."
DERIVED_DATA="$HOME/Library/Developer/Xcode/DerivedData"
if [ -d "$DERIVED_DATA" ]; then
    SIZE=$(du -sh "$DERIVED_DATA" 2>/dev/null | cut -f1)
    COUNT=$(find "$DERIVED_DATA" -type d -maxdepth 1 2>/dev/null | wc -l | tr -d ' ')
    echo "   Derived Data size: $SIZE"
    echo "   Project folders: $((COUNT - 1))"
    
    if [ "$COUNT" -gt 10 ]; then
        echo -e "${YELLOW}⚠️  Large derived data cache detected. Consider cleaning.${NC}"
    fi
else
    echo "   No derived data found (this is normal for fresh installs)"
fi

echo ""

# Check Xcode archives
echo "4️⃣  Checking Xcode Archives..."
ARCHIVES="$HOME/Library/Developer/Xcode/Archives"
if [ -d "$ARCHIVES" ]; then
    SIZE=$(du -sh "$ARCHIVES" 2>/dev/null | cut -f1)
    echo "   Archives size: $SIZE"
else
    echo "   No archives found"
fi

echo ""

# Check device storage (if device connected)
echo "5️⃣  Checking Device Storage..."
if command -v ideviceinfo &> /dev/null; then
    DEVICE_UUID=$(xcrun xctrace list devices 2>/dev/null | grep -i "ipad" | head -1 | grep -oE '[A-F0-9-]{36}' || echo "")
    if [ -n "$DEVICE_UUID" ]; then
        echo "   Attempting to check device storage..."
        # This requires libimobiledevice
        ideviceinfo -u "$DEVICE_UUID" -k TotalDataCapacity 2>/dev/null || echo "   (libimobiledevice not installed - install via: brew install libimobiledevice)"
    fi
else
    echo -e "${YELLOW}⚠️  libimobiledevice not installed${NC}"
    echo "   Install via: brew install libimobiledevice"
    echo "   This allows checking device storage remotely"
fi

echo ""

# Check network connectivity
echo "6️⃣  Checking Network Connectivity..."
if ping -c 1 -W 2 developer.apple.com &> /dev/null; then
    echo -e "${GREEN}✅ Can reach Apple Developer servers${NC}"
else
    echo -e "${RED}❌ Cannot reach Apple Developer servers${NC}"
    echo "   This may cause signing/provisioning issues"
fi

echo ""

# Check signing certificates
echo "7️⃣  Checking Code Signing Certificates..."
CERTIFICATES=$(security find-identity -v -p codesigning 2>/dev/null | grep "Developer" || echo "")
if [ -z "$CERTIFICATES" ]; then
    echo -e "${YELLOW}⚠️  No development certificates found${NC}"
    echo "   You may need to:"
    echo "   - Open Xcode → Settings → Accounts"
    echo "   - Add your Apple ID"
    echo "   - Download certificates"
else
    echo -e "${GREEN}✅ Development certificates found:${NC}"
    echo "$CERTIFICATES" | head -3 | sed 's/^/   /'
fi

echo ""

# Check project build status
echo "8️⃣  Checking iOS Project..."
IOS_PROJECT="ios/App/App.xcworkspace"
if [ -f "$IOS_PROJECT/contents.xcworkspacedata" ]; then
    echo -e "${GREEN}✅ iOS project found${NC}"
    
    # Check if Pods are installed
    if [ -d "ios/App/Pods" ]; then
        echo "   ✅ CocoaPods installed"
    else
        echo -e "${YELLOW}⚠️  CocoaPods not installed${NC}"
        echo "   Run: cd ios/App && pod install"
    fi
else
    echo -e "${RED}❌ iOS project not found at $IOS_PROJECT${NC}"
fi

echo ""

# Summary and recommendations
echo "📋 Diagnostic Summary"
echo "===================="
echo ""
echo "Common fixes for 'unable to download shared cache files':"
echo ""
echo "1. Clean Xcode Derived Data:"
echo "   rm -rf ~/Library/Developer/Xcode/DerivedData/*"
echo ""
echo "2. Clean Xcode Archives:"
echo "   rm -rf ~/Library/Developer/Xcode/Archives/*"
echo ""
echo "3. Clean Build Folder in Xcode:"
echo "   Product → Clean Build Folder (Cmd+Shift+K)"
echo ""
echo "4. Reset Device Connection:"
echo "   - Disconnect iPad"
echo "   - Restart iPad"
echo "   - Reconnect iPad"
echo "   - Trust computer again"
echo ""
echo "5. Check iPad Storage:"
echo "   Settings → General → iPad Storage"
echo "   Ensure at least 2GB free space"
echo ""
echo "6. Try Different USB Port/Cable:"
echo "   - Use original Apple cable"
echo "   - Try different USB port"
echo "   - Avoid USB hubs"
echo ""
echo "7. Restart Xcode:"
echo "   Quit Xcode completely and reopen"
echo ""
echo "8. Update Xcode:"
echo "   App Store → Updates → Update Xcode"
echo ""
echo "9. Reset Provisioning Profiles:"
echo "   Xcode → Settings → Accounts → Download Manual Profiles"
echo ""
echo "10. Try Wireless Deployment (if supported):"
echo "    Window → Devices and Simulators → Enable 'Connect via network'"
echo ""




