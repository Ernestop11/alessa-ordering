#!/bin/bash
# Check prerequisites for TestFlight deployment
# Usage: ./scripts/check-testflight-prerequisites.sh

set -e

echo "🔍 Checking TestFlight Prerequisites..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check Xcode installation
echo "📱 Checking Xcode..."
if command -v xcodebuild &> /dev/null; then
    XCODE_VERSION=$(xcodebuild -version | head -1)
    echo -e "${GREEN}✅${NC} Xcode installed: $XCODE_VERSION"
    
    # Check if Xcode command line tools are installed
    if xcode-select -p &> /dev/null; then
        echo -e "${GREEN}✅${NC} Xcode Command Line Tools installed"
    else
        echo -e "${RED}❌${NC} Xcode Command Line Tools not installed"
        echo "   Run: xcode-select --install"
        ((ERRORS++))
    fi
else
    echo -e "${RED}❌${NC} Xcode not found"
    echo "   Install Xcode from App Store"
    ((ERRORS++))
fi
echo ""

# Check CocoaPods
echo "📦 Checking CocoaPods..."
if command -v pod &> /dev/null; then
    POD_VERSION=$(pod --version)
    echo -e "${GREEN}✅${NC} CocoaPods installed: $POD_VERSION"
else
    echo -e "${RED}❌${NC} CocoaPods not installed"
    echo "   Run: sudo gem install cocoapods"
    ((ERRORS++))
fi
echo ""

# Check Node.js and npm
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}❌${NC} Node.js not installed"
    ((ERRORS++))
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}❌${NC} npm not installed"
    ((ERRORS++))
fi
echo ""

# Check project structure
echo "📁 Checking project structure..."
if [ -d "ios/App/App.xcworkspace" ]; then
    echo -e "${GREEN}✅${NC} iOS workspace found"
else
    echo -e "${RED}❌${NC} iOS workspace not found"
    echo "   Run: npm run build:ios"
    ((ERRORS++))
fi

if [ -f "ios/App/Podfile" ]; then
    echo -e "${GREEN}✅${NC} Podfile found"
else
    echo -e "${RED}❌${NC} Podfile not found"
    ((ERRORS++))
fi
echo ""

# Check Capacitor config
echo "⚙️  Checking Capacitor configuration..."
if [ -f "capacitor.config.ts" ]; then
    echo -e "${GREEN}✅${NC} Capacitor config found"
    
    # Check if server URL is set
    if grep -q "url:" capacitor.config.ts; then
        echo -e "${GREEN}✅${NC} Server URL configured"
    else
        echo -e "${YELLOW}⚠️${NC}  Server URL not set (will use local assets)"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌${NC} Capacitor config not found"
    ((ERRORS++))
fi
echo ""

# Check Xcode project settings
echo "🔧 Checking Xcode project settings..."
cd ios/App

if [ -f "App.xcodeproj/project.pbxproj" ]; then
    # Check bundle ID
    if grep -q "PRODUCT_BUNDLE_IDENTIFIER = com.alessa.ordering" App.xcodeproj/project.pbxproj; then
        echo -e "${GREEN}✅${NC} Bundle ID correct: com.alessa.ordering"
    else
        echo -e "${YELLOW}⚠️${NC}  Bundle ID may be incorrect"
        ((WARNINGS++))
    fi
    
    # Check version
    if grep -q "MARKETING_VERSION = 1.0" App.xcodeproj/project.pbxproj; then
        VERSION=$(grep "MARKETING_VERSION = " App.xcodeproj/project.pbxproj | head -1 | sed 's/.*MARKETING_VERSION = //')
        echo -e "${GREEN}✅${NC} Version: $VERSION"
    else
        echo -e "${YELLOW}⚠️${NC}  Version not found"
        ((WARNINGS++))
    fi
    
    # Check build number
    if grep -q "CURRENT_PROJECT_VERSION = " App.xcodeproj/project.pbxproj; then
        BUILD=$(grep "CURRENT_PROJECT_VERSION = " App.xcodeproj/project.pbxproj | head -1 | sed 's/.*CURRENT_PROJECT_VERSION = //')
        echo -e "${GREEN}✅${NC} Build number: $BUILD"
    else
        echo -e "${YELLOW}⚠️${NC}  Build number not found"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌${NC} Xcode project not found"
    ((ERRORS++))
fi

cd ../..
echo ""

# Check Apple Developer account (can't verify automatically, but can check for keychain)
echo "🍎 Checking Apple Developer setup..."
if security find-identity -v -p codesigning | grep -q "Apple Development"; then
    echo -e "${GREEN}✅${NC} Code signing certificates found"
    echo "   Certificates:"
    security find-identity -v -p codesigning | grep "Apple Development" | head -3 | sed 's/^/      /'
else
    echo -e "${YELLOW}⚠️${NC}  No code signing certificates found"
    echo "   You'll need to set up signing in Xcode"
    echo "   Xcode → Settings → Accounts → Add Apple ID"
    ((WARNINGS++))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for TestFlight deployment.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found, but no critical errors.${NC}"
    echo "   You can proceed, but review warnings above."
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) found. Please fix before proceeding.${NC}"
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found.${NC}"
    exit 1
fi

