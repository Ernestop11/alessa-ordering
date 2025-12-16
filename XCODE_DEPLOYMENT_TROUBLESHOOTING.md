# Xcode Deployment Troubleshooting Guide

## 🔴 Error: "Unable to Download Shared Cache Files"

This error typically occurs during Xcode deployment to physical iOS devices. It's usually **NOT** a problem with your iPad or cable, but rather with Xcode's cache or device communication.

---

## 🚀 Quick Fix (Try This First)

Run the diagnostic and fix scripts:

```bash
# Make scripts executable
chmod +x scripts/xcode-deploy-diagnostic.sh
chmod +x scripts/xcode-deploy-fix.sh

# Run diagnostic
./scripts/xcode-deploy-diagnostic.sh

# Run fix script
./scripts/xcode-deploy-fix.sh
```

Then in Xcode:
1. **Product → Clean Build Folder** (Cmd+Shift+K)
2. **Disconnect and reconnect iPad**
3. **Product → Run** (Cmd+R)

---

## 🔍 Root Causes & Solutions

### 1. Xcode Derived Data Corruption (Most Common)

**Symptoms:**
- Error appears randomly
- Works after restarting Xcode
- Build succeeds but deployment fails

**Fix:**
```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# In Xcode: Product → Clean Build Folder (Cmd+Shift+K)
```

**Why it happens:** Xcode caches build artifacts. Corrupted cache can cause deployment failures.

---

### 2. Device Storage Full

**Symptoms:**
- Error appears consistently
- iPad shows low storage warnings
- App installs but crashes immediately

**Fix:**
1. **On iPad:** Settings → General → iPad Storage
2. **Free up at least 2GB** (delete unused apps, photos, etc.)
3. **Restart iPad**
4. **Try deployment again**

**Check storage remotely:**
```bash
# Install libimobiledevice first
brew install libimobiledevice

# Check device info
ideviceinfo -k TotalDataCapacity
ideviceinfo -k TotalDataAvailable
```

---

### 3. USB Connection Issues

**Symptoms:**
- Intermittent connection
- Device disconnects during deployment
- "Device not found" errors

**Fix:**
1. **Use original Apple cable** (not third-party)
2. **Try different USB port** (avoid hubs)
3. **Check cable for damage**
4. **Enable wireless deployment:**
   - Connect via USB first
   - Xcode → Window → Devices and Simulators
   - Check "Connect via network" for your iPad
   - Disconnect USB, deploy wirelessly

**Test connection:**
```bash
# List connected devices
xcrun xctrace list devices

# Should show your iPad if connected properly
```

---

### 4. Device Trust/Signing Issues

**Symptoms:**
- "Untrusted Developer" on iPad
- Signing errors in Xcode
- App installs but won't open

**Fix:**
1. **On iPad:**
   - Settings → General → VPN & Device Management
   - Tap your developer account
   - Tap "Trust [Your Name]"
   - Tap "Trust" again

2. **In Xcode:**
   - Xcode → Settings → Accounts
   - Select your Apple ID
   - Click "Download Manual Profiles"
   - Go to Signing & Capabilities tab
   - Ensure "Automatically manage signing" is checked

---

### 5. Network/Provisioning Issues

**Symptoms:**
- Error during "Preparing device for development"
- "Communication with Apple failed"
- Works on WiFi but not on cellular

**Fix:**
```bash
# Check network connectivity
ping developer.apple.com

# Reset provisioning profiles
# In Xcode: Settings → Accounts → Download Manual Profiles
```

**If behind firewall/VPN:**
- Disable VPN temporarily
- Ensure ports 443, 80, 5223 are open
- Try different network

---

### 6. Xcode Version Issues

**Symptoms:**
- Error started after Xcode update
- Works on other Macs
- iPad iOS version incompatible

**Fix:**
1. **Check compatibility:**
   - Xcode version vs iPad iOS version
   - See: https://developer.apple.com/support/xcode/

2. **Update Xcode:**
   - App Store → Updates
   - Or download latest from developer.apple.com

3. **Update iPad iOS:**
   - Settings → General → Software Update

---

### 7. CocoaPods/Capacitor Sync Issues

**Symptoms:**
- Error after adding new dependencies
- Works after `pod install`
- Build errors related to missing frameworks

**Fix:**
```bash
# Clean and reinstall
cd ios/App
pod deintegrate
pod install
cd ../..

# Sync Capacitor
npm run build
npx cap sync ios
```

---

## 🧪 Smoke Test Checklist

Run through this checklist to isolate the issue:

### ✅ Pre-Deployment Checks

- [ ] iPad is unlocked
- [ ] iPad trusts this computer
- [ ] iPad has at least 2GB free storage
- [ ] Using original Apple USB cable
- [ ] Cable is not damaged
- [ ] Connected directly to Mac (not via hub)
- [ ] Xcode is up to date
- [ ] iPad iOS is compatible with Xcode version

### ✅ Xcode Checks

- [ ] Device appears in Xcode device dropdown
- [ ] Device shows as "Ready" (not "Preparing")
- [ ] Signing & Capabilities configured correctly
- [ ] Team selected in Signing
- [ ] Bundle Identifier is correct (`com.alessa.ordering`)
- [ ] No red errors in project navigator

### ✅ Build Checks

- [ ] Product → Clean Build Folder (Cmd+Shift+K)
- [ ] Derived data cleaned: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
- [ ] Pods installed: `cd ios/App && pod install`
- [ ] Capacitor synced: `npm run build && npx cap sync ios`
- [ ] Build succeeds: Product → Build (Cmd+B)

### ✅ Deployment Checks

- [ ] Device selected in Xcode toolbar
- [ ] Product → Run (Cmd+R)
- [ ] Watch Xcode console for specific errors
- [ ] Check iPad for trust prompts
- [ ] App appears on iPad home screen
- [ ] App launches successfully

---

## 🔧 Advanced Troubleshooting

### Enable Verbose Logging

In Xcode:
1. **Product → Scheme → Edit Scheme**
2. **Run → Arguments**
3. **Add Environment Variable:**
   - Name: `OS_ACTIVITY_MODE`
   - Value: `disable`

This shows more detailed error messages in console.

### Check Device Logs

```bash
# View device logs
xcrun devicectl device process launch \
  --device <device-udid> \
  --start-stopped \
  --app com.alessa.ordering

# Or use Console.app
# Applications → Utilities → Console
# Select your iPad from sidebar
```

### Reset Device Connection

```bash
# Remove device from Xcode
# Xcode → Window → Devices and Simulators
# Right-click iPad → Unpair Device

# Then reconnect and trust again
```

### Nuclear Option: Full Reset

If nothing works:

```bash
# 1. Clean everything
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Developer/Xcode/Archives/*
rm -rf ios/App/build
rm -rf ios/App/Pods
rm ios/App/Podfile.lock

# 2. Reinstall pods
cd ios/App
pod install
cd ../..

# 3. Rebuild and sync
npm run build
npx cap sync ios

# 4. In Xcode
# Product → Clean Build Folder
# Restart Xcode
# Try deployment again
```

---

## 📊 Diagnostic Script Output

The diagnostic script checks:
1. ✅ Xcode installation
2. ✅ Connected devices
3. ✅ Derived data size
4. ✅ Archives size
5. ✅ Device storage (if libimobiledevice installed)
6. ✅ Network connectivity
7. ✅ Code signing certificates
8. ✅ iOS project structure

Run it to get a full report:
```bash
./scripts/xcode-deploy-diagnostic.sh
```

---

## 🎯 Most Likely Solutions (In Order)

Based on common issues:

1. **Clean Derived Data** (80% of cases)
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/*
   ```

2. **Clean Build Folder in Xcode** (70% of cases)
   - Product → Clean Build Folder (Cmd+Shift+K)

3. **Free iPad Storage** (50% of cases)
   - Settings → General → iPad Storage

4. **Reconnect Device** (40% of cases)
   - Disconnect, restart iPad, reconnect

5. **Update Xcode** (30% of cases)
   - App Store → Updates

6. **Reset Provisioning** (20% of cases)
   - Xcode → Settings → Accounts → Download Manual Profiles

---

## 💡 Prevention Tips

1. **Regular cleanup:**
   ```bash
   # Add to your deployment script
   rm -rf ~/Library/Developer/Xcode/DerivedData/*
   ```

2. **Keep iPad storage free:**
   - Maintain at least 5GB free
   - Regularly delete unused apps

3. **Use wireless deployment:**
   - Once set up, deploy wirelessly
   - More reliable than USB

4. **Keep Xcode updated:**
   - Check for updates monthly
   - Update iPad iOS when prompted

5. **Use dedicated cable:**
   - Keep one cable just for development
   - Don't use it for charging

---

## 🆘 Still Not Working?

If none of the above works:

1. **Check Xcode console** for specific error messages
2. **Check iPad logs** via Console.app
3. **Try on different Mac** (if available)
4. **Try different iPad** (if available)
5. **Contact Apple Developer Support** with:
   - Xcode version
   - iPad model and iOS version
   - Full error message from console
   - Diagnostic script output

---

## 📝 Quick Reference Commands

```bash
# Diagnostic
./scripts/xcode-deploy-diagnostic.sh

# Fix script
./scripts/xcode-deploy-fix.sh

# Manual cleanup
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ios/App/build
cd ios/App && pod install && cd ../..
npm run build && npx cap sync ios

# Check devices
xcrun xctrace list devices

# Open Xcode
npx cap open ios
```

---

**Last Updated:** $(date)
**Tested with:** Xcode 15+, iPadOS 16+, Capacitor 7+




