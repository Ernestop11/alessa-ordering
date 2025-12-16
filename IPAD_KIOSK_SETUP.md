# iPad Kiosk Mode Setup Guide

## 🎯 Quick Setup for MVP Testing

This guide will help you set up your iPad in kiosk mode so the app stays logged in and the screen stays on for testing orders.

---

## ✅ Step 1: Configure iPad Settings

### 1.1 Disable Auto-Lock (Screen Always On)

1. Open **Settings** on your iPad
2. Go to **Display & Brightness**
3. Tap **Auto-Lock**
4. Select **Never**

This prevents the iPad from automatically locking the screen.

### 1.2 Set Brightness (Optional)

1. In **Display & Brightness**
2. Adjust brightness to a comfortable level (recommended: 70-80% for kiosk use)
3. Turn off **Auto-Brightness** to prevent dimming

---

## 🔒 Step 2: Enable Guided Access (Kiosk Mode)

Guided Access locks your iPad to a single app and prevents users from exiting.

### 2.1 Enable Guided Access

1. Open **Settings**
2. Go to **Accessibility**
3. Tap **Guided Access**
4. Toggle **Guided Access** to **On**

### 2.2 Set Passcode

1. In Guided Access settings, tap **Passcode Settings**
2. Tap **Set Guided Access Passcode**
3. Enter a 4-6 digit passcode (remember this!)
4. Re-enter to confirm

**Important:** This passcode is needed to exit Guided Access mode.

### 2.3 Configure Guided Access Options

1. In Guided Access settings, tap **Time Limits** (optional)
   - You can set a time limit if needed, or leave disabled
2. Enable **Accessibility Shortcut** (recommended)
   - This allows triple-click to access Guided Access controls

---

## 📱 Step 3: Start Guided Access Session

### 3.1 Open Your App

1. Open the **Alessa Ordering** app on your iPad
2. Log in to your admin account
3. Navigate to the page you want to test (e.g., Fulfillment Dashboard)

### 3.2 Activate Guided Access

1. **Triple-click** the Home button (or Top button on newer iPads)
2. Tap **Start** in the bottom right
3. Optionally, you can:
   - Draw circles around areas to disable (like navigation buttons)
   - Tap **Options** to disable:
     - **Sleep/Wake Button** (prevents accidental sleep)
     - **Volume Buttons** (optional)
     - **Motion** (optional)
4. Tap **Start** again to confirm

Your iPad is now locked to the app! The screen will stay on, and users cannot exit.

---

## 🔓 Step 4: Exit Guided Access (When Needed)

To exit Guided Access mode:

1. **Triple-click** the Home/Top button
2. Enter your **Guided Access passcode**
3. Tap **End** in the top left

---

## 🔐 Step 5: Persistent Login Configuration

The app is now configured with:

- ✅ **30-day session duration** - Login persists for 30 days
- ✅ **Screen wake lock** - Native iOS prevents screen sleep
- ✅ **Session refresh** - Automatically refreshes every 5 minutes

### Verify Login Persistence

1. Log in to the app
2. Close the app completely (swipe up from bottom, swipe app away)
3. Reopen the app
4. You should still be logged in

---

## 🧪 Step 6: Test Order Flow

Now you're ready to test:

1. **Create test orders** from another device/browser
2. **Watch for alerts** on the iPad
3. **Test printer functionality** (if configured)
4. **Verify UI responsiveness** and alarms

### Test Checklist

- [ ] App stays logged in after closing/reopening
- [ ] Screen doesn't dim or lock
- [ ] Cannot exit app (Guided Access working)
- [ ] New orders trigger alerts/notifications
- [ ] UI updates correctly when orders arrive
- [ ] Printer integration works (if configured)

---

## ⚙️ Advanced Configuration

### Adjust Session Duration

If you need longer/shorter sessions, edit `lib/auth/options.ts`:

```typescript
session: {
  maxAge: 30 * 24 * 60 * 60, // Change this value (in seconds)
},
```

### Disable Screen Wake Lock

If you need to allow screen sleep (not recommended for kiosk):

Edit `ios/App/App/AppDelegate.swift` and remove or comment out:
```swift
UIApplication.shared.isIdleTimerDisabled = true
```

---

## 🐛 Troubleshooting

### Screen Still Dims/Locks

1. **Check Auto-Lock setting:**
   - Settings > Display & Brightness > Auto-Lock > Never
2. **Verify Guided Access is active:**
   - Triple-click should show Guided Access controls
3. **Check iPad battery:**
   - Low battery may override settings

### App Logs Out

1. **Check session duration:**
   - Should be 30 days by default
2. **Verify cookies are enabled:**
   - Settings > Safari > Block All Cookies (should be OFF)
3. **Check app storage:**
   - Low storage may clear sessions

### Can't Exit Guided Access

1. **Use passcode:**
   - Triple-click > Enter passcode > End
2. **If passcode forgotten:**
   - Restart iPad (hold power + home/top button)
   - Guided Access will be disabled after restart

### App Crashes or Freezes

1. **Check iPad storage:**
   - Free up space if < 2GB available
2. **Restart iPad:**
   - Hold power + home/top button until Apple logo appears
3. **Reinstall app:**
   - Delete app > Reinstall from Xcode

---

## 📋 Quick Reference

### Enable Kiosk Mode
1. Settings > Display & Brightness > Auto-Lock > **Never**
2. Settings > Accessibility > Guided Access > **On**
3. Open app > Triple-click > **Start**

### Exit Kiosk Mode
1. Triple-click > Enter passcode > **End**

### Check Status
- **Screen on:** Auto-Lock set to Never
- **App locked:** Guided Access active (triple-click shows controls)
- **Logged in:** Session persists after app close/reopen

---

## 🎯 For MVP Testing Today

**Recommended Setup:**
1. ✅ Auto-Lock: Never
2. ✅ Guided Access: Enabled with passcode
3. ✅ App: Logged in to Fulfillment Dashboard
4. ✅ Brightness: 70-80%
5. ✅ Volume: On (for order alerts)

**Test Flow:**
1. Create test order from another device
2. Watch iPad for order alert
3. Verify UI updates correctly
4. Test printer (if configured)
5. Process order through fulfillment flow

---

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all settings are configured correctly
3. Try restarting the iPad
4. Reinstall the app if needed

**Ready to test!** Your iPad is now configured for kiosk mode. 🚀

