# 🎯 Las Reinas - Presentation Ready Guide
**Created:** November 25, 2024  
**Status:** ✅ **READY FOR DEMO**

---

## 🚀 Quick Access (Copy These URLs!)

### 1️⃣ PWA Fulfillment Dashboard (iPad)
```
https://lasreinas.alessacloud.com/admin/fulfillment
```
**Use this URL on your iPad and install as PWA for the best experience.**

---

### 2️⃣ Customer Ordering Page (Test Orders)
```
https://lasreinas.alessacloud.com/order
```

---

### 3️⃣ Admin Dashboard
```
https://lasreinas.alessacloud.com/admin
```

---

## 🔑 Credentials

### Admin Login
```
URL: https://lasreinas.alessacloud.com/admin
Email: admin@lasreinas.com
Password: lasreinas_admin_2024
```

**⚠️ IMPORTANT:** Change this password after first login!

---

## 💳 Test Payment Card (Stripe Test Mode)

Use this card for test orders:
```
Card Number: 4242 4242 4242 4242
Expiry Date: 12/34 (any future date works)
CVC: 123 (any 3 digits work)
ZIP Code: 12345 (any 5 digits work)
```

**This card works in test mode** - no real charges!

---

## 🌐 DNS Configuration (From Squarespace)

### Current Setup:
- **Domain:** www.lasreinascolusa.com
- **Currently:** Points to Squarespace
- **New Target:** Point to Alessa Cloud

### DNS Records to Add in Your Domain Hosting:

#### Primary Record (Required):
```
Type: CNAME
Host/Name: www
Value/Points to: lasreinas.alessacloud.com
TTL: 3600 (or 1 hour)
```

#### Alternative (If CNAME doesn't work for root):
```
Type: A
Host/Name: @ (or leave blank)
Value/Points to: 77.243.85.8
TTL: 3600
```

### Where to Update:
1. **Log into your domain registrar** (GoDaddy, Namecheap, Google Domains, etc.)
2. **Find "DNS Management" or "DNS Settings"**
3. **Look for existing records** for www.lasreinascolusa.com
4. **Update or add the CNAME record** above
5. **Save changes**

### DNS Propagation:
- ⏱️ Takes **24-48 hours** to fully propagate
- ✅ You can still use: `https://lasreinas.alessacloud.com/order` during transition
- 🔍 Check status at: https://dnschecker.org

### Important Notes:
- **Keep domain registration active** (you're just changing DNS)
- **Remove Squarespace DNS records** if they conflict
- **Contact Squarespace support** if you need help removing their DNS

---

## 🧪 End-to-End Test (Do This Now!)

### Test 1: Admin Access ✅
1. Go to: `https://lasreinas.alessacloud.com/admin`
2. Log in: `admin@lasreinas.com` / `lasreinas_admin_2024`
3. ✅ Should see dashboard with tabs

### Test 2: Place Test Order ✅
1. Open: `https://lasreinas.alessacloud.com/order` (in new tab/device)
2. Click "Add to Cart" on 2-3 menu items
3. Click cart button (bottom right)
4. Fill in:
   - Name: Test Customer
   - Email: test@example.com  
   - Phone: (555) 123-4567
5. Click "Proceed to Payment"
6. Enter test card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
7. Click "Complete Payment"
8. ✅ Should see success page
9. ✅ Order should appear in fulfillment dashboard

### Test 3: Fulfillment Dashboard (iPad) ✅
1. On iPad, open: `https://lasreinas.alessacloud.com/admin/fulfillment`
2. Log in with admin credentials
3. ✅ Should see test order from step 2
4. ✅ Audio notification should play
5. ✅ Visual alert banner should appear
6. Tap order to view details
7. Try: Accept → Mark Ready → Complete

### Test 4: Notifications ✅
1. On iPad, install PWA:
   - Tap Share button
   - "Add to Home Screen"
   - Name it "Las Reinas Orders"
2. Allow notifications when prompted
3. Place another test order from computer
4. ✅ Notification should appear on iPad
5. ✅ Sound should play
6. ✅ Badge count should update

---

## 📱 iPad Setup Instructions

### Step 1: Install PWA
1. Open Safari on iPad
2. Go to: `https://lasreinas.alessacloud.com/admin/fulfillment`
3. Log in
4. Tap Share button (square with up arrow)
5. Select "Add to Home Screen"
6. Name it "Las Reinas Orders"
7. Tap "Add"

### Step 2: Enable Notifications
1. Open the app from home screen
2. When prompted, tap "Allow" for notifications
3. Go to Settings in the app (gear icon)
4. Test notification sound
5. Adjust volume slider

### Step 3: Pin to Dock (Optional)
1. Long-press app icon
2. Tap "Edit Home Screen"
3. Drag app to dock for easy access

---

## 🎯 Demo Flow (15-20 Minutes)

### 1. Admin Dashboard (2 min)
- Show menu editor
- Show settings
- Mention Stripe Connect

### 2. Place Live Order (3 min)
- Customer ordering page
- Add items to cart
- Complete payment
- Show success page

### 3. Fulfillment Dashboard (5 min)
- Show on iPad
- Real-time order appearance
- Audio notification demo
- Order management actions

### 4. PWA Features (3 min)
- App on home screen
- Notifications
- Badge count
- Offline capability

### 5. Q&A (5 min)

---

## ⚠️ Troubleshooting

### Payment Form Won't Load?
- Wait 3-5 seconds (Stripe needs time)
- Refresh page
- Check browser console
- Try different browser

### Notifications Not Working?
- Check iPad Settings → Notifications → Safari
- Must use Safari (not Chrome)
- PWA must be installed
- Allow notifications when prompted

### Order Not Appearing?
- Refresh fulfillment dashboard
- Check Orders tab in admin
- Verify payment succeeded
- Check browser console

### Audio Not Playing?
- Check iPad volume
- Test sound in Settings
- Ensure notifications allowed

---

## ✅ Pre-Presentation Checklist

**Right Now:**
- [ ] Test admin login works
- [ ] Test ordering page loads
- [ ] Place a test order
- [ ] Verify order appears on iPad
- [ ] Test audio notification
- [ ] Install PWA on iPad

**30 Minutes Before:**
- [ ] All URLs bookmarked
- [ ] Admin credentials ready
- [ ] Test card ready: `4242 4242 4242 4242`
- [ ] iPad charged
- [ ] Internet connection stable

**Ready to Go! 🚀**

---

## 📞 Support

**Technical Issues:**
- Email: support@alessacloud.com
- Available: ASAP for presentation support

---

**Status:** ✅ **PRODUCTION READY**  
**Last Updated:** November 25, 2024

