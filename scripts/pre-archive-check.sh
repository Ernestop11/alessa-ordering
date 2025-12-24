#!/bin/bash

# Pre-Archive Verification Script
# Checks that everything is ready before archiving in Xcode

set -e

echo "🔍 Pre-Archive Verification Checklist"
echo "======================================"
echo ""

PROJECT_DIR="/Users/ernestoponce/alessa-ordering"
IOS_DIR="$PROJECT_DIR/ios/App"

# Check 1: Pods installed
echo "✅ Checking CocoaPods..."
if [ -d "$IOS_DIR/Pods" ]; then
    echo "   ✓ Pods directory exists"
else
    echo "   ❌ Pods not installed. Run: cd ios/App && pod install"
    exit 1
fi

# Check 2: Required Swift files exist
echo "✅ Checking Swift plugin files..."
if [ -f "$IOS_DIR/App/StarPrinterPlugin.swift" ]; then
    echo "   ✓ StarPrinterPlugin.swift exists"
else
    echo "   ❌ StarPrinterPlugin.swift missing!"
    exit 1
fi

if [ -f "$IOS_DIR/App/BluetoothPrinterPlugin.swift" ]; then
    echo "   ✓ BluetoothPrinterPlugin.swift exists"
else
    echo "   ❌ BluetoothPrinterPlugin.swift missing!"
    exit 1
fi

if [ -f "$IOS_DIR/App/AppDelegate.swift" ]; then
    echo "   ✓ AppDelegate.swift exists"
else
    echo "   ❌ AppDelegate.swift missing!"
    exit 1
fi

# Check 3: Info.plist has required keys
echo "✅ Checking Info.plist..."
if grep -q "jp.star-m.starpro" "$IOS_DIR/App/Info.plist"; then
    echo "   ✓ Star printer protocol configured"
else
    echo "   ❌ Missing Star printer protocol in Info.plist!"
    exit 1
fi

if grep -q "NSBluetoothAlwaysUsageDescription" "$IOS_DIR/App/Info.plist"; then
    echo "   ✓ Bluetooth permissions configured"
else
    echo "   ❌ Missing Bluetooth permissions in Info.plist!"
    exit 1
fi

# Check 4: TypeScript build succeeded
echo "✅ Checking TypeScript build..."
if [ -d "$PROJECT_DIR/.next" ]; then
    echo "   ✓ Next.js build exists"
else
    echo "   ⚠️  Next.js build not found (may need to run: npm run build)"
fi

# Check 5: Capacitor sync
echo "✅ Checking Capacitor sync..."
if [ -f "$IOS_DIR/App/App/capacitor.config.json" ] || [ -f "$PROJECT_DIR/capacitor.config.ts" ]; then
    echo "   ✓ Capacitor config exists"
else
    echo "   ⚠️  Capacitor config not found"
fi

# Check 6: Xcode workspace
echo "✅ Checking Xcode workspace..."
if [ -f "$IOS_DIR/App.xcworkspace/contents.xcworkspacedata" ]; then
    echo "   ✓ Xcode workspace exists"
else
    echo "   ❌ Xcode workspace missing!"
    exit 1
fi

echo ""
echo "✅ All checks passed! Ready for Xcode archive."
echo ""
echo "Next steps:"
echo "1. Open Xcode: open $IOS_DIR/App.xcworkspace"
echo "2. Select 'Any iOS Device' or your iPad as target"
echo "3. Product → Archive"
echo "4. Wait for archive to complete"
echo "5. Distribute App → Upload to App Store Connect"
echo ""

