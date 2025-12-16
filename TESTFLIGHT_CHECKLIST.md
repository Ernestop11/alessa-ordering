# ✅ TestFlight Deployment Checklist

## Pre-Deployment (Automated)

Run this command to prepare everything:

```bash
./scripts/testflight-deploy.sh
```

This automatically:
- [x] Checks all prerequisites
- [x] Updates version/build numbers
- [x] Builds Next.js app
- [x] Syncs Capacitor
- [x] Updates CocoaPods
- [x] Opens Xcode

---

## In Xcode (Manual Steps)

### Step 1: Select Device
- [ ] Click device selector in top toolbar
- [ ] Select **"Any iOS Device"** or **"Generic iOS Device"**
- [ ] ⚠️ **NOT your iPad** - must be generic device

### Step 2: Clean Build (Recommended)
- [ ] **Product → Clean Build Folder** (⇧⌘K)
- [ ] Wait for cleanup to complete

### Step 3: Archive
- [ ] **Product → Archive**
- [ ] Wait for build (5-10 minutes)
- [ ] Organizer window opens automatically

### Step 4: Validate (Optional but Recommended)
- [ ] In Organizer, select your archive
- [ ] Click **"Validate App"**
- [ ] Wait for validation
- [ ] Fix any errors if found
- [ ] Click **"Done"**

### Step 5: Distribute
- [ ] Click **"Distribute App"**
- [ ] Select **"App Store Connect"**
- [ ] Click **"Next"**
- [ ] Select **"Upload"**
- [ ] Click **"Next"**
- [ ] Review options:
  - [ ] ✅ Include bitcode (if available)
  - [ ] ✅ Upload symbols (for crash reports)
- [ ] Click **"Upload"**
- [ ] Wait for upload (10-20 minutes)
- [ ] Click **"Done"** when complete

---

## In App Store Connect (Web)

### Step 6: Access TestFlight
- [ ] Go to: https://appstoreconnect.apple.com
- [ ] Log in with Apple ID
- [ ] Click **"My Apps"**
- [ ] Select **"Alessa Ordering"** (or create if first time)

### Step 7: Wait for Processing
- [ ] Go to **"TestFlight"** tab
- [ ] Find your build under **"iOS Builds"**
- [ ] Wait for **"Processing"** to complete (10-30 minutes)
- [ ] Status changes to green checkmark ✅

### Step 8: Add Testers
- [ ] Go to **"Internal Testing"** section
- [ ] Click **"+"** to add testers
- [ ] Enter your Apple ID email
- [ ] Click **"Add"**
- [ ] Click **"Start Testing"**

---

## On iPad (Installation)

### Step 9: Install TestFlight
- [ ] Open **App Store** on iPad
- [ ] Search for **"TestFlight"**
- [ ] Install **TestFlight** app (free, by Apple)

### Step 10: Accept Invitation
- [ ] Check email for TestFlight invitation
- [ ] Tap **"View in TestFlight"** or open TestFlight app
- [ ] Tap **"Accept"**
- [ ] Tap **"Install"** next to Alessa Ordering

### Step 11: Test App
- [ ] Find **"Alessa Ordering"** on home screen
- [ ] Tap to open
- [ ] Verify app loads correctly
- [ ] Test login
- [ ] Test Bluetooth (if needed)
- [ ] Set up kiosk mode (see `IPAD_KIOSK_SETUP.md`)

---

## Post-Deployment

### Step 12: Verify Everything Works
- [ ] App opens as native app (not browser)
- [ ] Login persists (30-day session)
- [ ] Screen stays on (kiosk mode)
- [ ] Bluetooth scanning works
- [ ] Orders trigger alerts
- [ ] UI updates correctly

---

## Quick Reference

### Current Configuration
- **Version**: 1.0
- **Build**: 1
- **Bundle ID**: com.alessa.ordering
- **Server URL**: https://lasreinas.alessacloud.com

### Commands
```bash
# Full deployment prep
./scripts/testflight-deploy.sh

# Check prerequisites only
./scripts/check-testflight-prerequisites.sh

# Update version only
./scripts/update-version.sh 1.0.1 2
```

### Important Links
- **App Store Connect**: https://appstoreconnect.apple.com
- **Apple Developer**: https://developer.apple.com
- **TestFlight Docs**: https://developer.apple.com/testflight

---

## Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| Archive button grayed out | Select "Any iOS Device" |
| Signing errors | Xcode → Settings → Accounts → Add Apple ID |
| Upload fails | Check internet, verify Bundle ID |
| Processing stuck | Wait 30+ min, check Activity tab |
| App won't install | Check iOS version, re-accept invitation |

---

## Next Update Workflow

For future updates:

1. **Make code changes**
2. **Run**: `./scripts/testflight-deploy.sh` (auto-increments build)
3. **Archive in Xcode**
4. **Upload to TestFlight**
5. **Testers get automatic update notification**

No need to re-invite testers! 🎉

---

**Ready to deploy?** Run: `./scripts/testflight-deploy.sh` 🚀

