# Kiosk Mode Quick Start - Native App (TestFlight)

## What the Native App Provides

When using the **Alessa Ordering** app from TestFlight:

1. **Screen Always On** - Screen never sleeps (built into AppDelegate.swift)
2. **Bluetooth Printing** - Direct printing to thermal receipt printers
3. **Auto-loads Fulfillment** - Opens directly to order management
4. **30-day Sessions** - Stay logged in for a month
5. **Session Keep-alive** - Auto-refreshes every 5 minutes

---

## iPad Setup (5 Minutes)

### Step 1: Install from TestFlight
1. Open **TestFlight** app on iPad
2. Find and install **Alessa Ordering**
3. Open the app and log in

### Step 2: Verify Native Mode
After login, look for these indicators in the Fulfillment dashboard:
- Green **"Native"** badge (shows native features active)
- Purple **"Kiosk On"** button (screen always-on active)

### Step 3: Enable Guided Access (Recommended)
This prevents users from exiting the app or accessing other iPad features:

1. **Settings > Accessibility > Guided Access > On**
2. Set a passcode (remember it!)
3. Open Alessa Ordering app
4. **Triple-click** Home button (or top button on newer iPads)
5. Tap **Start**

Now the iPad is locked to the Alessa app.

### Step 4: Connect Power
- Keep iPad connected to power outlet for 24/7 operation
- The screen will never sleep as long as the app is open

---

## Bluetooth Printer Setup

1. In Fulfillment dashboard, tap **Settings** tab
2. Tap **Configure Printer**
3. Select **Bluetooth** type
4. Tap **Scan for Devices**
5. Select your receipt printer from the list
6. Test print to verify

Supported printers: Star, Epson, Brother (ESC/POS compatible)

---

## Testing the Setup

1. **From another device**: Place a test order on lasreinas.alessacloud.com
2. **Watch the iPad**: Should see/hear new order alert
3. **Tap to acknowledge**: Test the workflow
4. **Print a receipt**: Verify Bluetooth printing works

---

## Exit Guided Access

To exit kiosk mode and access other apps:

1. **Triple-click** Home/Top button
2. Enter your Guided Access passcode
3. Tap **End**

---

## Troubleshooting

### Screen Goes Dark
- This should NOT happen with the native app
- Check: Is Auto-Lock set to Never? (Settings > Display & Brightness)
- Verify the green "Native" badge shows in the app

### No Order Alerts
- Tap anywhere on screen to "unlock" audio (iOS requirement)
- Check the volume is up on the iPad
- Verify the connection shows "Live" (green badge)

### Bluetooth Printer Not Found
- Make sure printer is on and in pairing mode
- Try: Settings > Bluetooth > Forget the printer > Re-pair
- Restart the Alessa app and try scanning again

### App Disconnects from Orders
- Check WiFi connection
- The app auto-reconnects, wait 10-30 seconds
- If persistent, close and reopen the app

---

## Technical Details

The native app includes:
- `isIdleTimerDisabled = true` in AppDelegate.swift (prevents sleep)
- Wake Lock re-acquisition when app becomes active
- Capacitor WebView with full native bridge
- Bluetooth LE support for receipt printers
- Auto-load URL: lasreinas.alessacloud.com/admin/fulfillment

---

**Ready to use!** The iPad is now a dedicated order management kiosk.
