# TestFlight Deployment Guide

## 🚀 Quick Start

TestFlight is the easiest way to deploy and test your iOS app on iPad. No cable needed after initial setup!

---

## ✅ Prerequisites

1. **Apple Developer Account** (paid - $99/year)
   - Sign up at: https://developer.apple.com
   - Enroll in Apple Developer Program

2. **App Store Connect Access**
   - Log in at: https://appstoreconnect.apple.com
   - Your app will be created automatically when you upload

3. **Xcode** (latest version recommended)

---

## 📱 Step 1: Prepare Your App

### 1.1 Update Version & Build Number

In Xcode:
1. Open `ios/App/App.xcworkspace`
2. Select **App** target in project navigator
3. Go to **General** tab
4. Update:
   - **Version**: `1.0.0` (or your version)
   - **Build**: `1` (increment for each upload)

### 1.2 Configure Signing

1. In Xcode, select **App** target
2. Go to **Signing & Capabilities** tab
3. Check **Automatically manage signing**
4. Select your **Team** (your Apple Developer account)
5. Xcode will automatically create provisioning profiles

**Important**: Bundle ID must be `com.alessa.ordering` (matches your Capacitor config)

---

## 🏗️ Step 2: Archive Your App

### 2.1 Clean Build

1. In Xcode: **Product → Clean Build Folder** (⇧⌘K)
2. Wait for cleanup to complete

### 2.2 Select Generic iOS Device

1. In Xcode toolbar, click device selector
2. Select **Any iOS Device (arm64)** or **Generic iOS Device**

**Important**: You cannot archive with a specific device selected.

### 2.3 Create Archive

1. **Product → Archive**
2. Wait for build to complete (may take 5-10 minutes)
3. Xcode will open **Organizer** window automatically

---

## 📤 Step 3: Upload to App Store Connect

### 3.1 Validate Archive (Optional but Recommended)

1. In **Organizer** window, select your archive
2. Click **Validate App**
3. Wait for validation (checks for common issues)
4. Fix any errors before distributing

### 3.2 Distribute App

1. In **Organizer**, select your archive
2. Click **Distribute App**
3. Select **App Store Connect**
4. Click **Next**
5. Select **Upload**
6. Click **Next**
7. Review options:
   - ✅ **Include bitcode** (if available)
   - ✅ **Upload symbols** (for crash reports)
8. Click **Upload**
9. Wait for upload (may take 10-20 minutes)

**Note**: First upload takes longer. Subsequent updates are faster.

---

## 🎯 Step 4: Configure TestFlight

### 4.1 Access App Store Connect

1. Go to: https://appstoreconnect.apple.com
2. Log in with your Apple ID
3. Click **My Apps**
4. Find **Alessa Ordering** (or create if first time)

### 4.2 Wait for Processing

After upload:
1. Go to **TestFlight** tab
2. Wait for **Processing** to complete (usually 10-30 minutes)
3. You'll see a green checkmark when ready

### 4.3 Add Internal Testers

1. In **TestFlight** tab, go to **Internal Testing**
2. Click **+** to add testers
3. Add your Apple ID email
4. Click **Add** → **Start Testing**

**Internal Testers**: Up to 100 people on your team (instant access)

### 4.4 Add External Testers (Optional)

1. Go to **External Testing**
2. Click **+** to create a new group
3. Add testers (up to 10,000)
4. Submit for Beta App Review (takes 24-48 hours)

**External Testers**: Anyone with the TestFlight link (requires Apple review)

---

## 📲 Step 5: Install on iPad

### 5.1 Install TestFlight App

1. On iPad, open **App Store**
2. Search for **TestFlight**
3. Install **TestFlight** app (free, by Apple)

### 5.2 Accept Invitation

1. Check your email for TestFlight invitation
2. Tap **View in TestFlight** or open TestFlight app
3. Tap **Accept**
4. Tap **Install** next to Alessa Ordering

### 5.3 Open App

1. Find **Alessa Ordering** on home screen
2. Tap to open
3. First launch may take a moment to load

---

## 🔄 Step 6: Update App (For Future Builds)

When you make changes:

1. **Update build number** in Xcode (General tab)
2. **Product → Archive** (new archive)
3. **Distribute App → Upload**
4. Wait for processing in App Store Connect
5. Testers get notification to update

**No need to re-invite testers** - they automatically get updates!

---

## 🐛 Troubleshooting

### Archive Fails

**Error**: "No signing certificate found"
- **Fix**: Go to Xcode → Settings → Accounts → Download Manual Profiles
- Or: Check Signing & Capabilities → Team is selected

**Error**: "Bundle identifier already exists"
- **Fix**: Change Bundle ID in Xcode, or use existing app in App Store Connect

### Upload Fails

**Error**: "Invalid bundle"
- **Fix**: Make sure you selected "Any iOS Device" before archiving
- **Fix**: Clean build folder and try again

**Error**: "Missing compliance"
- **Fix**: In App Store Connect → App Information → Answer export compliance questions

### TestFlight Processing Stuck

- **Wait**: First build can take 30+ minutes
- **Check**: App Store Connect → Activity tab for detailed status
- **Contact**: Apple Developer Support if stuck > 2 hours

### App Won't Install on iPad

- **Check**: iPad iOS version matches minimum deployment target (iOS 14.0+)
- **Check**: TestFlight invitation was accepted
- **Try**: Delete TestFlight app, reinstall, accept invitation again

---

## 📋 Checklist

Before archiving:
- [ ] Version and build number updated
- [ ] Signing configured with correct team
- [ ] Bundle ID matches: `com.alessa.ordering`
- [ ] Selected "Any iOS Device" (not specific device)
- [ ] Clean build folder completed

After upload:
- [ ] Archive uploaded successfully
- [ ] Processing completed in App Store Connect
- [ ] TestFlight invitation sent
- [ ] TestFlight app installed on iPad
- [ ] App installed and launches correctly

---

## 🎯 Quick Commands

```bash
# Open Xcode project
npm run cap:ios

# Or manually
open ios/App/App.xcworkspace

# Clean and rebuild (if needed)
cd ios/App
pod install
cd ../..
npm run build:ios
```

---

## 💡 Tips

1. **Version Numbers**: Use semantic versioning (1.0.0, 1.0.1, etc.)
2. **Build Numbers**: Increment for each upload (1, 2, 3, ...)
3. **Fast Updates**: Internal testers get updates instantly after processing
4. **Beta Review**: External testers require 24-48 hour review (first time only)
5. **Multiple Devices**: Add multiple iPads to TestFlight for testing

---

## 🆘 Need Help?

- **Apple Developer Support**: https://developer.apple.com/support
- **TestFlight Documentation**: https://developer.apple.com/testflight
- **Xcode Help**: Help → Xcode Help in Xcode menu

---

**Ready to deploy!** Follow these steps and your app will be on TestFlight in about 30-60 minutes. 🚀

