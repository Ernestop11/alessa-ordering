# Capacitor iOS Setup Guide

## ✅ What's Been Done

1. **Capacitor Installed** - Core, CLI, and iOS platform
2. **Bluetooth Plugin** - `@capacitor-community/bluetooth-le` installed
3. **Configuration** - `capacitor.config.ts` created
4. **Code Updated**:
   - `lib/printer-service.ts` - Now supports Capacitor Bluetooth
   - `components/fulfillment/PrinterSetup.tsx` - Detects native app vs web
   - `package.json` - Added Capacitor scripts
5. **iOS Project** - Created in `ios/` directory
6. **PWA Icons** - Using Alessa Cloud branding

## 📱 Next Steps

### 1. Fix Xcode (if needed)
If you see Xcode plugin errors, run:
```bash
xcodebuild -runFirstLaunch
```

### 2. Install CocoaPods (for iOS dependencies)
```bash
sudo gem install cocoapods
cd ios/App
pod install
```

### 3. Configure App Icons in Xcode

1. Open the project:
   ```bash
   npm run cap:ios
   ```
   Or manually: Open `ios/App/App.xcworkspace` in Xcode

2. In Xcode:
   - Select `App` in the project navigator
   - Go to the `App` target
   - Click on `AppIcon` in `Assets.xcassets`
   - Drag your icon files:
     - Copy `public/icons/alessa-cloud-icon-512.png` 
     - Resize to required sizes or use Xcode's "Generate" feature
     - Or use an online tool to generate all iOS icon sizes from your 512x512 icon

3. Required iOS icon sizes:
   - 20pt @ 1x, 2x, 3x (20x20, 40x40, 60x60)
   - 29pt @ 1x, 2x, 3x (29x29, 58x58, 87x87)
   - 40pt @ 1x, 2x, 3x (40x40, 80x80, 120x120)
   - 60pt @ 2x, 3x (120x120, 180x180)
   - 76pt @ 1x, 2x (76x76, 152x152)
   - 83.5pt @ 2x (167x167)
   - 1024x1024 (App Store)

### 4. Add Bluetooth Permissions

In Xcode:
1. Select `App` target
2. Go to `Info` tab
3. Add to `Custom iOS Target Properties`:
   - Key: `NSBluetoothAlwaysUsageDescription`
   - Type: `String`
   - Value: `This app needs Bluetooth access to connect to receipt printers.`
   - Key: `NSBluetoothPeripheralUsageDescription` (for iOS 12 and earlier)
   - Type: `String`
   - Value: `This app needs Bluetooth access to connect to receipt printers.`

### 5. Configure Signing

1. In Xcode, select the `App` target
2. Go to `Signing & Capabilities`
3. Select your Apple Developer team
4. Xcode will automatically create a provisioning profile

### 6. Set Server URL (Development)

For development, update `capacitor.config.ts`:
```typescript
server: {
  url: 'http://localhost:3001', // Your dev server
  cleartext: true, // Allow HTTP in development
}
```

For production, point to your production URL or remove the `url` to use the built-in web assets.

### 7. Build and Run

1. Build the Next.js app:
   ```bash
   npm run build
   ```

2. Sync with Capacitor:
   ```bash
   npm run cap:sync
   ```

3. Open in Xcode:
   ```bash
   npm run cap:ios
   ```

4. In Xcode:
   - Select your iPad/iPhone as the target device
   - Click the Play button to build and run

## 🔧 Development Workflow

1. **Make code changes** in your Next.js app
2. **Build**: `npm run build`
3. **Sync**: `npm run cap:sync` (or `npm run build:ios` does both)
4. **Test**: Run from Xcode or use `npm run cap:ios` to open Xcode

## 📝 Important Notes

- **Bluetooth on iOS**: The app will now detect when running in the native iOS app and use Capacitor's Bluetooth plugin
- **PWA Still Works**: The web version still works as a PWA, just without Bluetooth on iOS
- **Network Printing**: Still available as an alternative on all platforms
- **Icons**: Currently using platform-level Alessa Cloud branding. Tenant-specific icons can be added later

## 🐛 Troubleshooting

### CocoaPods Issues
```bash
cd ios/App
pod deintegrate
pod install
```

### Xcode Build Errors
- Make sure you have the latest Xcode
- Run `xcodebuild -runFirstLaunch`
- Clean build folder in Xcode (Cmd+Shift+K)

### Bluetooth Not Working
- Check that permissions are added in Info.plist
- Verify the device is paired with the printer in iOS Settings first
- Check that you're running on a physical device (Bluetooth doesn't work in simulator)

## 🎯 Testing Bluetooth Printing

1. Build and install the app on your iPad
2. Go to Fulfillment Dashboard → Settings → Printer Setup
3. Select "Bluetooth Printer"
4. Click "Scan for Printers"
5. Select your Star TSP100
6. Click "Test Print"
7. Enable auto-print in tenant settings

## 📦 Distribution

For TestFlight/App Store:
1. Archive the app in Xcode (Product → Archive)
2. Upload to App Store Connect
3. Submit for review

For internal testing:
- Use TestFlight
- Or install directly via Xcode to connected devices





















