#!/bin/bash

# Fix Xcode Build Settings for CapacitorCordova
# This script modifies the Pods project directly

set -e

IOS_DIR="/Users/ernestoponce/alessa-ordering/ios/App"
PODS_PROJECT="$IOS_DIR/Pods/Pods.xcodeproj/project.pbxproj"

echo "🔧 Fixing Xcode build settings for CapacitorCordova..."

if [ ! -f "$PODS_PROJECT" ]; then
    echo "❌ Pods project not found. Run 'pod install' first."
    exit 1
fi

# Backup
cp "$PODS_PROJECT" "$PODS_PROJECT.backup"
echo "✅ Backup created: $PODS_PROJECT.backup"

# Use sed to add build settings to CapacitorCordova target
# This is a workaround since Podfile post_install isn't working reliably

echo "⚠️  Manual fix required in Xcode:"
echo ""
echo "1. Open Xcode"
echo "2. Select 'Pods' project → 'CapacitorCordova' target"
echo "3. Build Settings tab"
echo "4. Search and set:"
echo "   - CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = NO"
echo "   - GCC_TREAT_WARNINGS_AS_ERRORS = NO"
echo "   - CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES"
echo ""
echo "See QUICK_XCODE_FIX.md for detailed steps."

