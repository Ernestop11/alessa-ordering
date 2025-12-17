#!/bin/bash

# Setup Star Printer SDK for iOS
# This script helps set up the StarXpand SDK for Star TSP100III printer support

echo "============================================"
echo "Star Printer iOS Setup"
echo "============================================"
echo ""

cd "$(dirname "$0")/.."

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed. Please install Xcode from the App Store."
    exit 1
fi

echo "✅ Xcode found"
echo ""

# Sync Capacitor
echo "📱 Syncing Capacitor iOS project..."
npx cap sync ios

echo ""
echo "============================================"
echo "MANUAL STEPS REQUIRED IN XCODE"
echo "============================================"
echo ""
echo "1. Open the iOS project in Xcode:"
echo "   cd ios/App && open App.xcworkspace"
echo ""
echo "2. Add StarXpand SDK Swift Package:"
echo "   - In Xcode menu: File > Add Package Dependencies..."
echo "   - Enter URL: https://github.com/star-micronics/StarXpand-SDK-iOS"
echo "   - Select version 2.6.0 or latest"
echo "   - Click 'Add Package'"
echo ""
echo "3. Add StarPrinterPlugin files to build:"
echo "   - In Project Navigator, expand App folder"
echo "   - Verify StarPrinterPlugin.swift and StarPrinterPlugin.m are listed"
echo "   - If not, right-click App folder > Add Files to 'App'..."
echo "   - Select both .swift and .m files"
echo ""
echo "4. Add required permissions to Info.plist:"
echo "   - NSBluetoothAlwaysUsageDescription"
echo "   - NSBluetoothPeripheralUsageDescription"
echo ""
echo "5. Build and run on iPad device (not simulator)"
echo ""
echo "Opening Xcode now..."
echo ""

# Open Xcode workspace
cd ios/App
open App.xcworkspace

echo "============================================"
echo "After completing the Xcode steps, rebuild:"
echo "  npx cap open ios"
echo "  Then: Product > Build (⌘B)"
echo "============================================"
