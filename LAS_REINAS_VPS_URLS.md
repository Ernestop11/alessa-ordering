# 🌐 Las Reinas VPS URLs - Testing Guide

## ✅ **FIXED AND WORKING!**

The VPS is now properly configured and running at **port 4000** with the full Las Reinas menu (67 items across 10 sections).

---

## 🎯 Production URLs (VPS)

### ✅ Customer Ordering Page

**Main URL (Subdomain - Recommended)**
```
https://lasreinas.alessacloud.com/order
```

**Alternative (Query Parameter)**
```
https://alessacloud.com/order?tenant=lasreinas
```

---

### 🔐 Admin Dashboard

```
https://alessacloud.com/admin/login?tenant=lasreinas
```

After login, you'll see:
- Orders tab
- Customers tab
- Menu editor
- **Catering tab** (if feature flag enabled)
- Settings

---

### 📊 Fulfillment Dashboard

```
https://alessacloud.com/admin/fulfillment?tenant=lasreinas
```

---

## 📋 What's on VPS (Verified)

✅ **67 menu items** across **10 sections**:
1. **Desayuno (Breakfast)** - 5 items
2. **Platillos/Plates** - 18 items
3. **Burritos** - 8 items
4. **A La Carta** - 14 items
5. **Tacos** - 5 items
6. **Nachos y Quesadillas** - 4 items
7. **Tortas** - 1 item
8. **Meat by the Pound** - 6 items
9. **Sides** - 2 items
10. **Drinks** - 4 items

✅ **Catering feature flag** enabled

✅ **All images** mapped correctly

---

## 🧪 Quick Test Checklist

1. **Open the customer page:**
   ```
   https://alessacloud.com/order?tenant=lasreinas
   ```

2. **Verify you see:**
   - [ ] All 10 menu sections
   - [ ] All 67 menu items
   - [ ] 🎉 Catering button in top navigation
   - [ ] Images loading for menu items

3. **Test catering:**
   - [ ] Click the "Catering" button
   - [ ] Catering panel opens
   - [ ] Can select meat by the pound options

4. **Check admin:**
   - [ ] Login to admin dashboard
   - [ ] See "Catering" tab in navigation
   - [ ] Can access catering manager

---

## 🔄 If Menu is Missing Locally

**The VPS has the full menu!** If your local database only shows 4 items, that's because we accidentally overwrote it. 

**To restore locally from VPS:**
```bash
# Export from VPS (we'll create this script)
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && node scripts/export-vps-menu.js"
```

---

## 📝 VPS Details

- **IP**: 77.243.85.8
- **Port**: 4000
- **Domain**: alessacloud.com
- **Path**: /var/www/alessa-ordering
- **PM2**: alessa-ordering

---

## 🚀 Current Status

✅ **VPS is LIVE** with full Las Reinas menu
✅ **All 67 items** present
✅ **Catering feature** enabled
✅ **Images** mapped correctly

**Test URL:**
```
https://alessacloud.com/order?tenant=lasreinas
```

