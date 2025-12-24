#!/bin/bash

# Post-install script to patch CapacitorCordova headers for Xcode 16+
# This fixes "double-quoted include" errors by converting to angle-bracketed includes

set -e

CORDOVA_DIR="node_modules/@capacitor/ios/CapacitorCordova"

if [ ! -d "$CORDOVA_DIR" ]; then
  echo "⚠️  CapacitorCordova not found, skipping patch"
  exit 0
fi

echo "🔧 Patching CapacitorCordova headers for Xcode 16+ compatibility..."

# Patch .h files: #import "CDV*.h" → #import <Cordova/CDV*.h>
find "$CORDOVA_DIR" -name "*.h" -type f -exec sed -i '' \
  -e 's/#import "CDV\([^"]*\)\.h"/#import <Cordova\/CDV\1.h>/g' \
  -e 's/#import <Cordova\/CDV\([^"]*\)\.h"/#import <Cordova\/CDV\1.h>/g' \
  {} \;

# Patch .m files: #import "CDV*.h" → #import <Cordova/CDV*.h>
find "$CORDOVA_DIR" -name "*.m" -type f -exec sed -i '' \
  -e 's/#import "CDV\([^"]*\)\.h"/#import <Cordova\/CDV\1.h>/g' \
  -e 's/#import <Cordova\/CDV\([^"]*\)\.h"/#import <Cordova\/CDV\1.h>/g' \
  {} \;

echo "✅ CapacitorCordova headers patched successfully"

