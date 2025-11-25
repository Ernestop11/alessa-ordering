# 🎯 Las Reinas Tenant UI Access Guide

This guide will help you access the Las Reinas tenant UI with all its features:
- ✅ **Catering Tab** (now added to admin dashboard)
- ✅ **Menu Seeded** (from database seed)
- ✅ **Fulfillment Dashboard** (real-time order management)

---

## 📍 Quick Access URLs

### 1. Customer Ordering Page (Public)
**URL**: `http://localhost:3001/order?tenant=lasreinas`  
**Or**: `http://lasreinas.alessacloud.com/order` (if subdomain configured)

This shows the public-facing menu where customers can place orders.

**What you'll see:**
- Las Reinas branded ordering page
- Menu sections: "Carnitas y Más" and "Carnicería Grocery"
- Menu items:
  - Carnitas Plate ($15.99)
  - Birria Tacos ($16.49)
  - Carne Asada (1 lb) ($11.99)
  - Homemade Salsa Roja (16oz) ($6.50)

---

### 2. Admin Dashboard (Login Required)

**Login URL**: `http://localhost:3001/admin/login?tenant=lasreinas`

**Important**: You'll need admin credentials. The tenant-specific login might need to be set up. For now, you can use:
- Super admin credentials (if configured)
- Or create a tenant admin user in the database

#### Admin Dashboard Tabs:

1. **Orders** - View and manage customer orders
2. **Customers** - View customer list
3. **Sections** - Manage menu sections
4. **Menu Items** - Edit menu items
5. **Catering** ✨ - **NEW!** Manage catering options and bundles
6. **Customize** - Branding and customization
7. **Settings** - Restaurant settings

Plus a link to:
- **Fulfillment Board** - Real-time order fulfillment dashboard

---

### 3. Fulfillment Dashboard

**URL**: `http://localhost:3001/admin/fulfillment?tenant=lasreinas`

This is the real-time order fulfillment board where you can:
- See incoming orders in real-time (SSE stream)
- Update order status (pending → preparing → ready → completed)
- View order details and items
- Get audio/visual notifications for new orders

---

## 🔧 Setup Steps

### Step 1: Ensure Database is Seeded

The Las Reinas tenant should already be seeded. To verify or re-seed:

```bash
# Check if Las Reinas tenant exists
npx prisma studio
# Or check via SQL:
# SELECT * FROM "Tenant" WHERE slug = 'lasreinas';

# If not seeded, run:
npm run seed
# Or if you have a specific seed script:
# npm run seed:lasreinas
```

### Step 2: Start the Development Server

```bash
npm run dev
# Server will start on http://localhost:3001
```

### Step 3: Access the UI

#### Option A: Customer Ordering Page
1. Open: `http://localhost:3001/order?tenant=lasreinas`
2. You should see the Las Reinas menu with seeded items

#### Option B: Admin Dashboard (requires login)
1. Open: `http://localhost:3001/admin/login?tenant=lasreinas`
2. Log in with admin credentials
3. Navigate to the **Catering** tab to manage catering options
4. Navigate to **Menu Items** to see all seeded menu items
5. Click **Fulfillment Board** link to access the fulfillment dashboard

---

## 📋 What's Seeded for Las Reinas

### Tenant Configuration
- **Name**: Las Reinas Taqueria y Carniceria
- **Slug**: `lasreinas`
- **Primary Color**: #047857 (green)
- **Secondary Color**: #fbbf24 (yellow/gold)
- **Contact**: hola@lasreinas.com

### Menu Sections & Items

**Section 1: Carnitas y Más** (RESTAURANT type)
- Carnitas Plate - $15.99
- Birria Tacos - $16.49

**Section 2: Carnicería Grocery** (GROCERY type)
- Carne Asada (1 lb) - $11.99
- Homemade Salsa Roja (16oz) - $6.50

### Settings
- Membership program enabled
- Upsell bundles configured (Butcher Cut Add-on, Salsa Flight)
- Delivery radius: 8 miles
- Minimum order: $25

---

## 🎨 New Feature: Catering Tab

The Catering Manager is now accessible from the admin dashboard:

**Features:**
- ✅ Create catering options
- ✅ Set prices and serving info
- ✅ Add removals and addons
- ✅ Mark as featured or holiday bundles
- ✅ Manage all catering packages in one place

**To access:**
1. Log into admin dashboard
2. Click the **"Catering"** tab in the navigation
3. Click **"Add Catering Option"** to create new packages

---

## 🔍 Troubleshooting

### "Tenant not found" error
- Make sure the database is seeded: `npm run seed`
- Check that tenant slug is correct: `lasreinas`

### Can't access admin dashboard
- Check if you have admin credentials set up
- Try super admin login first to verify access
- Check that `?tenant=lasreinas` query param is in the URL

### Menu items not showing
- Verify database seeding completed successfully
- Check that menu items exist: `SELECT * FROM "MenuItem" WHERE "tenantId" = (SELECT id FROM "Tenant" WHERE slug = 'lasreinas');`

### Catering tab not visible
- Make sure you've pulled the latest code changes
- The CateringManager component should be imported in AdminDashboardClient
- Check browser console for any errors

---

## 📝 Notes

- The Las Reinas tenant uses the slug `lasreinas` (all lowercase, no spaces)
- To access tenant-specific pages, always include `?tenant=lasreinas` query param (unless using subdomain routing)
- The fulfillment dashboard uses Server-Sent Events (SSE) for real-time updates
- Catering options are stored in `TenantSettings.upsellBundles.catering` field

---

## 🚀 Quick Test Checklist

- [ ] Database seeded with Las Reinas tenant
- [ ] Dev server running on port 3001
- [ ] Can access customer ordering page: `/order?tenant=lasreinas`
- [ ] Can log into admin dashboard
- [ ] **Catering tab** is visible in admin navigation
- [ ] Can add/edit catering options
- [ ] Can access fulfillment dashboard
- [ ] Menu items show in admin "Menu Items" tab
- [ ] Fulfillment dashboard shows real-time updates

---

**Last Updated**: Today  
**Status**: ✅ All features available and ready to use!

