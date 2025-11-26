# 🔗 Las Reinas - Access URLs & Credentials

## 📱 Frontend Ordering Page (Customer-Facing)

**URL**: https://lasreinas.alessacloud.com/order

This is the public ordering page where customers can:
- Browse menu items
- View catering packages
- Add items to cart
- Place orders with Apple Pay / Google Pay / Card
- Submit catering inquiries

---

## 🖥️ Admin Dashboard (Owner/Manager Access)

**URL**: https://lasreinas.alessacloud.com/admin

**Login URL**: https://lasreinas.alessacloud.com/admin/login

### Admin Credentials:
```
Email:    admin@lapoblanita.com
Password: LYa++lSuolc0Yf5U+aa2AX/1i1VIpYaX
```

**Features Available:**
- Menu Editor (edit menu items, sections, images)
- Catering Manager (edit catering packages, gallery images)
- Fulfillment Dashboard (view orders, catering inquiries)
- Settings (Stripe Connect, printer configuration)
- Order Management
- Analytics & Reports

---

## 📊 Fulfillment Dashboard (Kitchen/Tablet PWA)

**URL**: https://lasreinas.alessacloud.com/admin/fulfillment

**Same credentials as Admin Dashboard above**

**Features:**
- Live order feed
- New order alerts with LOUD alarm
- Order status management (Accept, Preparing, Ready, Complete)
- Catering inquiries management
- Printer settings (Bluetooth, Network, USB)
- Auto-print on new orders
- PWA installable on iPad/tablet

**PWA Installation:**
1. Open URL on iPad/tablet
2. Click "Install" prompt or Safari Share → Add to Home Screen
3. App will work offline and send notifications

---

## 🔐 Super Admin (Can Access Tenant Admin)

**URL**: https://lasreinas.alessacloud.com/admin/login

**Credentials:**
```
Email:    super@alessacloud.com
Password: TA7FfVDGCH05eqh+sa2zOSGVwHkkcz1E
```

**Note**: Super admins can access tenant admin when logging in on tenant subdomain!

---

## 🧪 Testing Order Flow

### 1. Place Test Order:
- Go to: https://lasreinas.alessacloud.com/order
- Add items to cart
- Checkout with test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

### 2. Check Fulfillment Dashboard:
- Go to: https://lasreinas.alessacloud.com/admin/fulfillment
- Should see new order appear
- Alarm should play automatically (after clicking page once to unlock audio)
- Alarm repeats every 2.5 seconds until order is acknowledged

### 3. Check Admin Dashboard:
- Go to: https://lasreinas.alessacloud.com/admin
- View order in order list
- Edit menu items
- Manage catering packages

---

## 📝 Important Notes

1. **Audio Unlock**: The fulfillment alarm requires one click/touch on the page to unlock audio (browser autoplay policy). After that, alarms play automatically.

2. **Stripe Connect**: If orders fail, check Settings → Stripe Connect to ensure their Stripe account is connected.

3. **Printer Setup**: Configure printer in Fulfillment Dashboard → Settings tab.

4. **Email Notifications**: Admin receives email when new orders are placed (if SMTP configured).

---

## 🚀 Quick Access Links

- **Customer Ordering**: https://lasreinas.alessacloud.com/order
- **Admin Login**: https://lasreinas.alessacloud.com/admin/login
- **Admin Dashboard**: https://lasreinas.alessacloud.com/admin
- **Fulfillment Dashboard**: https://lasreinas.alessacloud.com/admin/fulfillment

---

**Last Updated**: January 2025
**Status**: ✅ All systems deployed and ready

