# Build Errors Troubleshooting Guide

## 🔍 Common Build Errors & Fixes

If you're seeing 15 error messages in Xcode, here are the most common causes and fixes:

---

## 1. Product Name with Spaces Issue

**Error**: Build fails because product name "Alessa Ordering" contains a space.

**Fix**: We need to use a different approach for the product name.

### Quick Fix:
1. In Xcode, select the **App** target
2. Go to **Build Settings** tab
3. Search for **"Product Name"**
4. Change from `Alessa Ordering` to `AlessaOrdering` (no space)
5. The display name in Info.plist will still show "Alessa Ordering" to users

---

## 2. Swift Compilation Errors

**Error**: Swift files fail to compile.

**Fix**:
1. **Product → Clean Build Folder** (⇧⌘K)
2. Close Xcode
3. Delete DerivedData:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/*
   ```
4. Reopen Xcode and try again

---

## 3. CocoaPods Issues

**Error**: Pods not found or framework errors.

**Fix**:
```bash
cd ios/App
pod deintegrate
pod install
cd ../..
```

Then rebuild in Xcode.

---

## 4. Code Signing Errors

**Error**: Code signing fails or certificates not found.

**Fix**:
1. In Xcode: **Settings → Accounts**
2. Select your Apple ID
3. Click **"Download Manual Profiles"**
4. Go to **Signing & Capabilities** tab
5. Select your **Team**
6. Ensure **"Automatically manage signing"** is checked

---

## 5. Info.plist Errors

**Error**: Info.plist validation fails.

**Fix**:
1. Open `ios/App/App/Info.plist` in Xcode
2. Check for any red error indicators
3. Verify all required keys are present
4. Check XML syntax is valid

---

## 6. Capacitor Sync Issues

**Error**: Capacitor files missing or outdated.

**Fix**:
```bash
npm run build
npx cap sync ios
```

---

## 7. Build Settings Conflicts

**Error**: Conflicting build settings.

**Fix**:
1. In Xcode: **Product → Clean Build Folder** (⇧⌘K)
2. Check **Build Settings** for any red warnings
3. Reset to defaults if needed

---

## 🔧 Quick Diagnostic

Run this to check for common issues:

```bash
./scripts/check-build-errors.sh
```

---

## 📋 Step-by-Step Fix Process

1. **Clean Everything**:
   ```bash
   cd ios/App
   rm -rf Pods Podfile.lock
   pod install
   cd ../..
   rm -rf ~/Library/Developer/Xcode/DerivedData/*
   ```

2. **Rebuild**:
   ```bash
   npm run build:ios
   ```

3. **In Xcode**:
   - **Product → Clean Build Folder** (⇧⌘K)
   - **Product → Build** (⌘B)
   - Check **Issue Navigator** (⌘5) for errors

4. **If Still Failing**:
   - Share the specific error messages
   - Check Xcode's **Report Navigator** (⌘9) for detailed logs

---

## 🆘 Need Specific Help?

Please share:
1. The exact error messages (copy from Xcode)
2. Which step fails (Build? Archive?)
3. Screenshot of Issue Navigator (⌘5)

This will help identify the exact issue!

---

## ✅ Most Likely Fix

If you have 15 errors, it's probably the **Product Name with spaces**. Try this:

1. In Xcode: **App target → Build Settings**
2. Search: `Product Name`
3. Change: `Alessa Ordering` → `AlessaOrdering`
4. Rebuild

The app will still display as "Alessa Ordering" to users (from Info.plist), but the build system will use "AlessaOrdering".

