# Xcode Quick Steps - Bluetooth Printing Setup

## ✅ What We Just Did

1. ✅ Built Next.js app (`npm run build`)
2. ✅ Synced Capacitor (`npm run cap:sync`)
3. ✅ Opened Xcode (`npm run cap:ios`)

---

## 🎯 Next Steps in Xcode

### Step 1: Configure Signing (IMPORTANT!)

1. **In Xcode, click on "App" project** (left sidebar, blue icon at top)

2. **Select "App" target** (under TARGETS section, not PROJECT)

3. **Go to "Signing & Capabilities" tab**

4. **Configure:**
   - ✅ Check **"Automatically manage signing"**
   - **Team:** Select your Apple Developer account
   - **Bundle Identifier:** `com.alessa.ordering` (should be auto-filled)

---

### Step 2: Connect iPad

1. **Connect iPad to Mac via USB**

2. **Unlock iPad** (enter passcode)

3. **Trust computer** (if first time, tap "Trust" on iPad)

4. **In Xcode:** Select your iPad from device dropdown (top bar, next to Play button)
   - Should see: "iPad" or your iPad name

---

### Step 3: Build & Run

1. **Click Run button** (▶️) in Xcode top bar
   - Or press `Cmd + R`

2. **Wait for build** (first time: 3-5 minutes)
   - Xcode will build, install, and launch app

3. **On iPad:** If you see "Untrusted Developer":
   - Go to: **Settings → General → VPN & Device Management**
   - Tap your developer account
   - Tap **"Trust [Your Name]"**
   - Tap **"Trust"** again

4. **App should now open on iPad!**

---

### Step 4: Test Bluetooth Printing

1. **Open app on iPad**
2. **Login:** Go to fulfillment dashboard
3. **Settings tab** → Configure Bluetooth printer
4. **Test print** → Click Print on an order
5. **Enable auto-print** → Toggle on in settings

---

## 🐛 Common Issues

### ⚠️ "Communication with Apple failed" / "No profiles found"
**This is the error you're seeing!** Here's how to fix it:

**Option 1: Connect iPad (Recommended)**
1. **Connect iPad to Mac via USB cable**
2. **Unlock iPad** (enter passcode)
3. **On iPad:** If you see "Trust This Computer?" → Tap **"Trust"**
4. **In Xcode:** 
   - Go to **Window → Devices and Simulators** (or press `Cmd + Shift + 2`)
   - You should see your iPad listed on the left
   - If you see it, Xcode will automatically register it
5. **Go back to Signing & Capabilities tab**
6. **Click "Try Again"** or wait a few seconds - Xcode should auto-refresh
7. The errors should disappear once the device is registered!

**Option 2: Manual Device Registration (If iPad not available)**
1. **Get iPad UDID:**
   - Connect iPad to Mac
   - Open **Finder** → Click iPad in sidebar
   - Click on iPad name/icon at top
   - UDID is shown (you can right-click to copy)
2. **Add to Apple Developer Portal:**
   - Go to: https://developer.apple.com/account/resources/devices/list
   - Click **"+"** button
   - Enter device name and UDID
   - Click **"Continue"** → **"Register"**
3. **In Xcode:** 
   - Go to **Xcode → Settings → Accounts**
   - Select your Apple ID
   - Click **"Download Manual Profiles"**
   - Go back to Signing & Capabilities and try again

**Option 3: Use Simulator (For Testing Only)**
- Note: Simulator won't work for Bluetooth printing (needs real device)
- But you can test the app UI:
  - In Xcode device dropdown, select **"iPhone 15 Pro"** or any simulator
  - Click Run - app will open in simulator
  - Bluetooth features won't work, but you can test other functionality

### "No devices found"
- Make sure iPad is connected via USB
- Unlock iPad
- Trust computer on iPad
- Check: Window → Devices and Simulators to see if iPad appears

### "Signing failed"
- Select your Team in Signing & Capabilities
- Make sure Bundle Identifier is unique
- Try: Product → Clean Build Folder (Cmd + Shift + K)
- Make sure device is registered (see above)

### "App crashes on launch"
- Check Xcode console for errors
- Try: Product → Clean Build Folder
- Rebuild: Product → Build (Cmd + B)

---

## ✅ Success Checklist

- [ ] App builds without errors
- [ ] App installs on iPad
- [ ] App opens and shows login page
- [ ] Can login to admin dashboard
- [ ] Can access Settings tab
- [ ] Can scan for Bluetooth printers
- [ ] Can save printer configuration
- [ ] Manual print works
- [ ] Auto-print works

---

**Xcode should be open now!** Follow the steps above to build and test. 🚀
