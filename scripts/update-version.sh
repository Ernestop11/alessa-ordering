#!/bin/bash
# Update version and build number for TestFlight
# Usage: ./scripts/update-version.sh [version] [build]
# Example: ./scripts/update-version.sh 1.0.1 2

set -e

PROJECT_FILE="ios/App/App.xcodeproj/project.pbxproj"

if [ ! -f "$PROJECT_FILE" ]; then
    echo "❌ Xcode project not found: $PROJECT_FILE"
    exit 1
fi

# Get current version and build
CURRENT_VERSION=$(grep "MARKETING_VERSION = " "$PROJECT_FILE" | head -1 | sed 's/.*MARKETING_VERSION = //' | tr -d ';')
CURRENT_BUILD=$(grep "CURRENT_PROJECT_VERSION = " "$PROJECT_FILE" | head -1 | sed 's/.*CURRENT_PROJECT_VERSION = //' | tr -d ';')

echo "📱 Current Version: $CURRENT_VERSION"
echo "🔢 Current Build: $CURRENT_BUILD"
echo ""

# Get new version (default: increment patch)
if [ -z "$1" ]; then
    # Auto-increment patch version
    IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
    MAJOR=${VERSION_PARTS[0]}
    MINOR=${VERSION_PARTS[1]}
    PATCH=${VERSION_PARTS[2]:-0}
    NEW_PATCH=$((PATCH + 1))
    NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"
    echo "📝 Auto-incrementing version to: $NEW_VERSION"
else
    NEW_VERSION="$1"
    echo "📝 Setting version to: $NEW_VERSION"
fi

# Get new build (default: increment)
if [ -z "$2" ]; then
    NEW_BUILD=$((CURRENT_BUILD + 1))
    echo "🔢 Auto-incrementing build to: $NEW_BUILD"
else
    NEW_BUILD="$2"
    echo "🔢 Setting build to: $NEW_BUILD"
fi

echo ""

# Update version
sed -i '' "s/MARKETING_VERSION = $CURRENT_VERSION;/MARKETING_VERSION = $NEW_VERSION;/g" "$PROJECT_FILE"
echo "✅ Updated version: $CURRENT_VERSION → $NEW_VERSION"

# Update build
sed -i '' "s/CURRENT_PROJECT_VERSION = $CURRENT_BUILD;/CURRENT_PROJECT_VERSION = $NEW_BUILD;/g" "$PROJECT_FILE"
echo "✅ Updated build: $CURRENT_BUILD → $NEW_BUILD"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Updated:"
echo "   Version: $NEW_VERSION"
echo "   Build: $NEW_BUILD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Ready to archive in Xcode!"

