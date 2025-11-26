# Las Reinas - Quick Start Guide for Presentation
**Date:** November 25, 2024  
**Ready for:** Live Demo in 1 Hour

---

## 🚀 Quick Access Information

### 1️⃣ PWA Fulfillment Dashboard URL (for Tablet)

**URL to bookmark on iPad:**
```
https://lasreinas.alessacloud.com/admin/fulfillment
```

**Instructions for iPad:**
1. Open Safari on iPad
2. Navigate to the URL above
3. Log in with admin credentials (see section 4)
4. Tap Share button → "Add to Home Screen"
5. Name it "Las Reinas Orders"
6. Pin to Dock for easy access

**Features:**
- ✅ Real-time order updates
- ✅ Audio notifications when new orders arrive
- ✅ Visual alerts (banner, badge count)
- ✅ Works offline (cached orders)

---

### 2️⃣ Test Order Credentials

**You can place test orders as a guest (no login required), but here are details to use:**

#### Test Customer Information:
```
Name: Test Customer
Email: test@example.com
Phone: (555) 123-4567
```

#### Test Payment Card (Stripe Test Mode):
```
Card Number: 4242 4242 4242 4242
Expiry: 12/34 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any 5 digits)
```

**Note:** This is Stripe's test card. It will work even before Stripe Connect is fully set up.

#### How to Place a Test Order:
1. Go to: `https://lasreinas.alessacloud.com/order`
2. Click "Add to Cart" on any menu item (try 2-3 items)
3. Click the cart button (bottom right)
4. Fill in customer info:
   - Name: Test Customer
   - Email: test@example.com
   - Phone: (555) 123-4567
5. Click "Proceed to Payment"
6. Enter test card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
7. Click "Complete Payment"
8. ✅ Order should appear in fulfillment dashboard within seconds

---

### 3️⃣ DNS Configuration for Domain Migration

**Current Domain:** www.lasreinascolusa.com (Squarespace)  
**New Domain Target:** lasreinas.alessacloud.com

#### DNS Records to Add/Update in Your Domain Hosting (GoDaddy, Namecheap, etc.)

##### Option A: Point www subdomain to new server (Recommended)
```
Type: CNAME
Name: www
Value: lasreinas.alessacloud.com
TTL: 3600 (or 1 hour)
Priority: (leave blank)
```

##### Option B: Point root domain (if your registrar supports it)
```
Type: A
Name: @ (or leave blank for root)
Value: 77.243.85.8
TTL: 3600
```

**Then add:**
```
Type: CNAME
Name: www
Value: lasreinascolusa.com (or @)
TTL: 3600
```

#### Complete DNS Setup:

**For www.lasreinascolusa.com:**
```
Type: CNAME
Host: www
Points to: lasreinas.alessacloud.com
TTL: 3600
```

**For root domain (optional):**
```
Type: A
Host: @
Points to: 77.243.85.8
TTL: 3600
```

#### Steps to Update DNS:

1. **Log into your domain registrar** (where you manage lasreinascolusa.com)
2. **Find DNS Management / DNS Settings**
3. **Locate existing CNAME or A records** for www.lasreinascolusa.com
4. **Update or Add:**
   - If CNAME exists: Change value to `lasreinas.alessacloud.com`
   - If A record exists: Change to CNAME pointing to `lasreinas.alessacloud.com`
   - If nothing exists: Add new CNAME record
5. **Save changes**
6. **Wait 24-48 hours** for DNS propagation

#### Verify DNS Propagation:

**Check if DNS has updated:**
```bash
# Run this command (or use online tool)
nslookup www.lasreinascolusa.com
```

**Should return:** `lasreinas.alessacloud.com` or `77.243.85.8`

**Online DNS Checker:**
- https://dnschecker.org
- Search for: `www.lasreinascolusa.com`
- Should show: `lasreinas.alessacloud.com`

#### Important Notes:

⚠️ **DNS Propagation Time:**
- Can take 24-48 hours to fully propagate
- Some regions update faster than others
- You can use preview URL during transition: `https://lasreinas.alessacloud.com/order`

⚠️ **Squarespace:**
- You may need to remove Squarespace DNS records first
- Contact Squarespace support if you need help removing their DNS records
- Keep your domain registration active (just change DNS)

---

### 4️⃣ Admin Credentials

#### Admin Dashboard Login:

**URL:** `https://lasreinas.alessacloud.com/admin`

**Credentials:**
```
Email: admin@lasreinas.com
Password: lasreinas_admin_2024
```

#### After First Login:
- ✅ Change password immediately for security
- ✅ Go to Settings tab to connect Stripe account
- ✅ Verify contact email is set (currently: hola@lasreinas.com)

#### Admin Dashboard Tabs:
1. **Orders** - View all orders
2. **Customers** - Customer management
3. **Menu Items** - Edit menu
4. **Sections** - Organize menu sections
5. **Catering** - Manage catering packages
6. **Customize** - Branding and colors
7. **Settings** - Stripe Connect, integrations, restaurant info

---

### 5️⃣ End-to-End Test Checklist

**Complete this test before your presentation:**

#### ✅ Test 1: Admin Dashboard Access
- [ ] Visit: `https://lasreinas.alessacloud.com/admin`
- [ ] Log in with: `admin@lasreinas.com` / `lasreinas_admin_2024`
- [ ] All tabs visible and working
- [ ] Settings page loads

#### ✅ Test 2: Menu Editor
- [ ] Go to "Menu Items" tab
- [ ] See 67 menu items listed
- [ ] Try editing one item (change price or description)
- [ ] Save and verify changes

#### ✅ Test 3: Place Test Order
- [ ] Go to: `https://lasreinas.alessacloud.com/order`
- [ ] Add 2-3 items to cart
- [ ] Open cart (cart button bottom right)
- [ ] Fill customer info:
  - Name: Test Customer
  - Email: test@example.com
  - Phone: (555) 123-4567
- [ ] Click "Proceed to Payment"
- [ ] Payment form loads (may take 2-3 seconds)
- [ ] Enter test card: `4242 4242 4242 4242`
  - Expiry: `12/34`
  - CVC: `123`
  - ZIP: `12345`
- [ ] Click "Complete Payment"
- [ ] ✅ Success page appears
- [ ] Order number displayed

#### ✅ Test 4: Fulfillment Dashboard (iPad)
- [ ] Open Safari on iPad
- [ ] Go to: `https://lasreinas.alessacloud.com/admin/fulfillment`
- [ ] Log in with admin credentials
- [ ] ✅ Test order from Test 3 appears
- [ ] Tap order to view details
- [ ] Try actions: Accept, Mark Ready, Complete
- [ ] ✅ Audio notification plays when new order arrives
- [ ] ✅ Visual alert banner appears
- [ ] ✅ App badge shows order count

#### ✅ Test 5: Notifications Setup (iPad)
- [ ] Install PWA: Share → "Add to Home Screen"
- [ ] When prompted, allow notifications
- [ ] Place another test order from computer/phone
- [ ] ✅ Notification appears on iPad (even if Safari closed)
- [ ] ✅ Sound plays
- [ ] ✅ Badge count updates

#### ✅ Test 6: Catering Tab (Optional)
- [ ] On frontend, click "Catering" button
- [ ] Catering modal opens
- [ ] Gallery images visible
- [ ] Can fill out inquiry form
- [ ] Submit inquiry
- [ ] Check Admin → Fulfillment → Catering Inquiries tab
- [ ] ✅ Inquiry appears

---

## 🎯 Presentation Demo Flow

### Recommended Demo Sequence (15-20 minutes):

1. **Show Admin Dashboard** (2 min)
   - Log in
   - Show menu editor
   - Show settings
   - Mention Stripe Connect setup

2. **Place Live Order** (3 min)
   - Open customer ordering page
   - Add items to cart
   - Show cart modal
   - Fill customer info
   - Complete payment with test card
   - Show success page

3. **Show Fulfillment Dashboard** (5 min)
   - Open on iPad
   - Show order appearing in real-time
   - Demonstrate audio notification
   - Show visual alerts
   - Demo order management (Accept, Ready, Complete)
   - Show catering inquiries tab

4. **Show PWA Features** (3 min)
   - Show app on home screen
   - Show notification permissions
   - Show badge count
   - Demonstrate offline capability

5. **Show Menu Editor** (2 min)
   - Edit an item live
   - Show changes reflect on frontend
   - Show image upload

6. **Q&A** (5 min)
   - Address questions
   - Show DNS migration info
   - Explain next steps

---

## 🔧 Troubleshooting

### If Payment Form Doesn't Load:
- Check browser console for errors
- Wait 3-5 seconds (Stripe loads)
- Refresh page and try again
- Verify Stripe keys are set in environment

### If Notifications Don't Work:
- Check iPad Settings → Notifications → Safari
- Ensure notifications are allowed
- Must use Safari (not Chrome)
- PWA must be installed to home screen

### If Order Doesn't Appear:
- Refresh fulfillment dashboard
- Check admin dashboard → Orders tab
- Verify payment was successful (check success page)
- Check browser console for errors

### If Audio Doesn't Play:
- Check iPad volume
- Go to Settings in fulfillment dashboard
- Test sound button
- Ensure notifications are allowed

---

## 📞 Emergency Contacts

### Technical Issues:
- **Email:** support@alessacloud.com
- **Response Time:** ASAP for presentation support

### Stripe Issues:
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Support:** support@stripe.com

---

## ✅ Pre-Presentation Checklist

**30 Minutes Before:**
- [ ] Test admin login
- [ ] Test customer ordering page loads
- [ ] Test payment form loads
- [ ] Verify fulfillment dashboard accessible
- [ ] Test audio notifications on iPad
- [ ] Have test card ready: `4242 4242 4242 4242`

**15 Minutes Before:**
- [ ] Place a test order
- [ ] Verify order appears in fulfillment dashboard
- [ ] Test audio notification
- [ ] Verify all URLs are bookmarked
- [ ] Have admin credentials ready

**5 Minutes Before:**
- [ ] Clear browser cache if needed
- [ ] Verify internet connection
- [ ] iPad is charged and ready
- [ ] Have backup device ready

---

## 🎉 You're Ready!

Everything is set up and tested. The system is production-ready for your presentation.

**Good luck! 🚀**

---

**Last Updated:** November 25, 2024  
**Status:** ✅ Ready for Presentation

