# 🧪 Test Printer Setup - Quick Guide

**Date:** November 25, 2024  
**Status:** Ready for Testing

---

## 🚀 Quick Test URLs

### 1. Fulfillment Dashboard (iPad)
```
https://lasreinas.alessacloud.com/admin/fulfillment
```
**Login:** `admin@lasreinas.com` / `lasreinas_admin_2024`

### 2. Customer Ordering Page
```
https://lasreinas.alessacloud.com/order
```

### 3. Admin Dashboard
```
https://lasreinas.alessacloud.com/admin
```

---

## 📋 Test Checklist

### Step 1: Connect Printer (5 minutes)

1. **Open Fulfillment Dashboard on iPad:**
   - Go to: `https://lasreinas.alessacloud.com/admin/fulfillment`
   - Log in with admin credentials

2. **Open Settings Tab:**
   - Click "Settings" tab at the top
   - Scroll to "Printer Setup" section

3. **Scan for Bluetooth Printer:**
   - Select "Bluetooth Printer" from dropdown
   - Click "Scan for Printers"
   - Browser will show device selection dialog
   - Select your Star/Brother printer
   - Printer name should appear

4. **Test Print:**
   - Click "Test Print" button
   - Verify receipt prints
   - Click "Save Configuration" if successful

5. **Enable Auto-Print:**
   - Scroll to "Auto-Print Settings" section
   - Toggle "Automatically print new orders" to ON
   - Should save automatically

### Step 2: Place Test Order (2 minutes)

1. **Open Customer Ordering Page:**
   - Go to: `https://lasreinas.alessacloud.com/order`
   - (Can use computer or phone for this)

2. **Add Items to Cart:**
   - Add 2-3 menu items
   - Click cart button (bottom right)

3. **Fill Customer Info:**
   - Name: Test Order
   - Email: test@example.com
   - Phone: (555) 123-4567

4. **Complete Payment:**
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
   - Click "Complete Payment"

5. **Wait for Order:**
   - Order should appear in fulfillment dashboard within 2-3 seconds

### Step 3: Verify Notifications & Auto-Print (2 minutes)

1. **Check Fulfillment Dashboard (iPad):**
   - Should hear **beep sound** 🔊
   - Should see **visual alert banner** at top
   - Order should appear in "New Orders" column
   - **Printer should automatically print receipt** 📄

2. **Verify Order Details:**
   - Click on order card
   - Verify all items are correct
   - Verify customer info is correct
   - Verify total amount matches

3. **Test Manual Print (Optional):**
   - Click "Print" button on order card
   - Verify receipt prints again

---

## ✅ Expected Results

### ✅ Notification Test
- [ ] Beep sound plays when order arrives
- [ ] Visual alert banner appears
- [ ] Badge count updates on app icon
- [ ] Order appears in dashboard

### ✅ Auto-Print Test
- [ ] Receipt automatically prints when order arrives
- [ ] Receipt contains:
  - Restaurant name
  - Order number
  - Customer name
  - All items with quantities
  - Subtotal, tax, total
  - Order time

### ✅ Manual Print Test
- [ ] Can click "Print" button on order
- [ ] Receipt prints correctly
- [ ] Multiple prints work

---

## 🐛 Troubleshooting

### No Beep Sound?
1. Check iPad volume (not muted)
2. Check Settings tab → Alert Settings → Volume slider
3. Click "Test Sound" button
4. Verify notifications are enabled

### Auto-Print Not Working?
1. Check printer is connected (Settings tab)
2. Verify auto-print toggle is ON
3. Check printer is powered on
4. Try manual "Print" button first
5. Check browser console for errors (F12)

### Printer Not Found?
1. Ensure printer is powered on
2. Put printer in pairing mode
3. Use Chrome/Edge/Opera (not Safari)
4. Must be on HTTPS (not HTTP)
5. Try scanning again

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Check server logs (if accessible)
3. Try manual print first to verify printer connection
4. Verify printer model is correct in settings

---

**Ready to test! 🚀**

