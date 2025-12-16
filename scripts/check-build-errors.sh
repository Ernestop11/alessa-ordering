#!/bin/bash
# Check for common build errors in Xcode project
# Usage: ./scripts/check-build-errors.sh

set -e

echo "🔍 Checking for common build errors..."
echo ""

cd "$(dirname "$0")/../ios/App"

ERRORS=0

# Check for Swift compilation errors
echo "📝 Checking Swift files..."
if find App -name "*.swift" -type f | grep -q .; then
    echo "✅ Swift files found"
    
    # Check AppDelegate
    if [ -f "App/AppDelegate.swift" ]; then
        echo "✅ AppDelegate.swift exists"
        # Check for syntax errors
        if swiftc -typecheck App/AppDelegate.swift 2>&1 | grep -q "error:"; then
            echo "❌ AppDelegate.swift has errors:"
            swiftc -typecheck App/AppDelegate.swift 2>&1 | grep "error:"
            ((ERRORS++))
        else
            echo "✅ AppDelegate.swift compiles"
        fi
    fi
else
    echo "⚠️  No Swift files found"
fi
echo ""

# Check Info.plist
echo "📋 Checking Info.plist..."
if [ -f "App/Info.plist" ]; then
    echo "✅ Info.plist exists"
    if plutil -lint App/Info.plist 2>&1 | grep -q "error"; then
        echo "❌ Info.plist has errors:"
        plutil -lint App/Info.plist
        ((ERRORS++))
    else
        echo "✅ Info.plist is valid"
    fi
else
    echo "❌ Info.plist not found"
    ((ERRORS++))
fi
echo ""

# Check Capacitor config
echo "⚙️  Checking Capacitor config..."
if [ -f "App/capacitor.config.json" ]; then
    echo "✅ capacitor.config.json exists"
    if ! python3 -m json.tool App/capacitor.config.json > /dev/null 2>&1; then
        echo "❌ capacitor.config.json is invalid JSON"
        ((ERRORS++))
    else
        echo "✅ capacitor.config.json is valid"
    fi
else
    echo "❌ capacitor.config.json not found"
    ((ERRORS++))
fi
echo ""

# Check Pods
echo "📦 Checking CocoaPods..."
if [ -d "Pods" ]; then
    echo "✅ Pods directory exists"
    if [ -f "Podfile.lock" ]; then
        echo "✅ Podfile.lock exists"
    else
        echo "⚠️  Podfile.lock missing - run 'pod install'"
    fi
else
    echo "❌ Pods directory not found - run 'pod install'"
    ((ERRORS++))
fi
echo ""

# Check for common Xcode project issues
echo "🔧 Checking Xcode project..."
if [ -f "App.xcodeproj/project.pbxproj" ]; then
    echo "✅ project.pbxproj exists"
    
    # Check for PRODUCT_NAME with spaces (can cause issues)
    if grep -q 'PRODUCT_NAME = ".* .*"' App.xcodeproj/project.pbxproj; then
        echo "⚠️  PRODUCT_NAME contains spaces (may cause issues)"
        grep 'PRODUCT_NAME = ".* .*"' App.xcodeproj/project.pbxproj | head -2
    fi
    
    # Check bundle identifier
    if grep -q "PRODUCT_BUNDLE_IDENTIFIER = com.alessa.ordering" App.xcodeproj/project.pbxproj; then
        echo "✅ Bundle ID is correct"
    else
        echo "⚠️  Bundle ID may be incorrect"
    fi
else
    echo "❌ project.pbxproj not found"
    ((ERRORS++))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ No obvious errors found"
    echo ""
    echo "If you're still seeing errors in Xcode:"
    echo "1. Check the Issue Navigator (⌘5) in Xcode"
    echo "2. Look for red error icons"
    echo "3. Try Product → Clean Build Folder (⇧⌘K)"
    echo "4. Try building again"
else
    echo "❌ Found $ERRORS potential issue(s)"
    echo "Please fix the issues above"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

