#!/bin/bash
# Complete TestFlight deployment automation
# Usage: ./scripts/testflight-deploy.sh [version] [build]
# Example: ./scripts/testflight-deploy.sh 1.0.1 2

set -e

echo "🚀 TestFlight Deployment Automation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Check prerequisites
echo "📋 Step 1: Checking prerequisites..."
if ! ./scripts/check-testflight-prerequisites.sh; then
    echo "❌ Prerequisites check failed. Please fix errors above."
    exit 1
fi
echo ""

# Step 2: Update version/build
echo "📋 Step 2: Updating version and build numbers..."
if [ -n "$1" ] || [ -n "$2" ]; then
    ./scripts/update-version.sh "$1" "$2"
else
    ./scripts/update-version.sh
fi
echo ""

# Step 3: Build Next.js app
echo "📋 Step 3: Building Next.js app..."
npm run build
echo ""

# Step 4: Sync Capacitor
echo "📋 Step 4: Syncing Capacitor..."
npx cap sync ios
echo ""

# Step 5: Update CocoaPods
echo "📋 Step 5: Updating CocoaPods..."
cd ios/App
pod install
cd ../..
echo ""

# Step 6: Open Xcode
echo "📋 Step 6: Opening Xcode..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Preparation complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Next steps in Xcode:"
echo ""
echo "1. Select 'Any iOS Device' in device selector (top toolbar)"
echo "   ⚠️  NOT your iPad - must be 'Any iOS Device'"
echo ""
echo "2. Product → Archive"
echo "   ⏱️  This will take 5-10 minutes"
echo ""
echo "3. When Organizer opens:"
echo "   - Click 'Distribute App'"
echo "   - Select 'App Store Connect'"
echo "   - Click 'Next' → 'Upload'"
echo "   - Follow prompts"
echo ""
echo "4. Wait for upload (10-20 minutes)"
echo ""
echo "5. Go to App Store Connect → TestFlight"
echo "   - Wait for processing (10-30 minutes)"
echo "   - Add yourself as internal tester"
echo ""
echo "📖 Full guide: TESTFLIGHT_DEPLOYMENT_GUIDE.md"
echo ""
echo "Opening Xcode now..."
sleep 2
npm run cap:ios

