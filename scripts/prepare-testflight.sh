#!/bin/bash
# Prepare iOS app for TestFlight deployment
# Usage: ./scripts/prepare-testflight.sh

set -e

echo "🚀 Preparing app for TestFlight deployment..."

# Navigate to project root
cd "$(dirname "$0")/.."

# 1. Build Next.js app
echo "📦 Building Next.js app..."
npm run build

# 2. Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync ios

# 3. Update CocoaPods
echo "📱 Updating CocoaPods..."
cd ios/App
pod install
cd ../..

# 4. Open Xcode
echo "✅ Preparation complete!"
echo ""
echo "Next steps:"
echo "1. Open Xcode: npm run cap:ios"
echo "2. Select 'Any iOS Device' in device selector"
echo "3. Product → Archive"
echo "4. Follow TestFlight guide: TESTFLIGHT_DEPLOYMENT_GUIDE.md"
echo ""
echo "Opening Xcode..."
npm run cap:ios

