# Ordering Dashboard and Tenant Clone Implementation

## Overview
This document describes the implementation of:
1. Enhanced Ordering Dashboard for Super Admin
2. Tenant cloning functionality (Las Reinas → La Poblanita)
3. Subscription expiration tracking and display

## Changes Made

### 1. Database Schema Updates

**File:** `prisma/schema.prisma`

Added `expiresAt` field to `TenantProduct` model for prepaid subscriptions:
```prisma
model TenantProduct {
  // ... existing fields ...
  expiresAt     DateTime? // For prepaid subscriptions (e.g., Sept 9, 2027)
  // ... rest of model ...
  @@index([expiresAt])  // Added index
}
```

**Migration:** Run `npx prisma db push` to apply changes.

### 2. Enhanced Ordering Dashboard

**Files Created:**
- `app/api/super/ordering/dashboard/route.ts` - API endpoint for dashboard data
- `components/super/ordering/OrderingDashboardClient.tsx` - Client component with tabs

**Features:**
- **Overview Tab:**
  - Total tenants, active subscriptions, MRR, total orders, total revenue
  - Upcoming expirations (next 90 days) with color-coded alerts
  
- **Tenants Tab:**
  - Complete list of all ordering tenants
  - Subscription status badges (active, prepaid, trial)
  - Expiration dates with days remaining
  - Quick links to storefront and admin dashboard
  - Contact information
  
- **CRM Tab:** (Placeholder for future implementation)
- **Calendar Tab:** (Placeholder for service checkups)

**Access:** `/super-admin/ordering`

### 3. Tenant Cloning Script

**File:** `scripts/clone-tenant.ts`

**Usage:**
```bash
tsx scripts/clone-tenant.ts lasreinas lapoblanita 2027-09-09
```

**What it clones:**
- Tenant basic info (name, slug, contact, address, branding)
- Settings (tagline, social links, operating hours, etc.)
- Integrations (payment, delivery, fees)
- All menu sections and items (with time-specific settings)
- All catering sections and packages
- Creates product subscription with expiration date

**Features:**
- Checks if target tenant already exists
- Preserves all menu item customizations
- Creates prepaid subscription with expiration date
- Provides summary and next steps

### 4. Owner Dashboard Subscription Display

**Files Created:**
- `components/admin/SubscriptionStatus.tsx` - Subscription status component
- `app/api/admin/subscription/route.ts` - API endpoint for tenant subscriptions

**Features:**
- Displays subscription status badge (prepaid, active, trial, etc.)
- Shows subscription start date
- Shows expiration date with days remaining
- Color-coded alerts:
  - Red: ≤30 days remaining
  - Yellow: 31-90 days remaining
  - Green: >90 days remaining
- Renewal reminders
- Expired subscription warnings

**Integration:** Added to `components/admin/AdminDashboardClient.tsx` - displays at top of all admin pages.

## Testing Steps

### 1. Check if La Poblanita exists
```bash
tsx scripts/check-tenant.ts lapoblanita
```

### 2. Clone Las Reinas to La Poblanita
```bash
tsx scripts/clone-tenant.ts lasreinas lapoblanita 2027-09-09
```

### 3. Verify clone
- Check database: `tsx scripts/check-tenant.ts lapoblanita`
- Visit storefront: `https://lapoblanita.alessacloud.com/order`
- Check admin: `/admin?tenant=lapoblanita`
- Verify subscription shows expiration date

### 4. Test Super Admin Dashboard
- Visit: `/super-admin/ordering`
- Check Overview tab shows metrics
- Check Tenants tab shows La Poblanita with expiration
- Verify expiration appears in "Upcoming Expirations" section

### 5. Test Owner Dashboard
- Login as tenant admin
- Check subscription status appears at top
- Verify expiration date and days remaining display correctly

## API Endpoints

### GET `/api/super/ordering/dashboard`
Returns complete ordering dashboard data including:
- Product info
- Metrics (tenants, subscriptions, MRR, orders, revenue)
- All tenants with subscriptions
- Upcoming expirations

### GET `/api/admin/subscription`
Returns subscription info for current tenant:
- Subscription details
- Expiration date
- Days remaining
- All product subscriptions

## Database Queries

### Check tenant exists:
```sql
SELECT id, name, slug, status 
FROM "Tenant" 
WHERE slug = 'lapoblanita';
```

### Check subscriptions:
```sql
SELECT tp.*, p.name as product_name, p.slug as product_slug
FROM "TenantProduct" tp
JOIN "Product" p ON tp."productId" = p.id
JOIN "Tenant" t ON tp."tenantId" = t.id
WHERE t.slug = 'lapoblanita';
```

## Next Steps

1. **CRM Integration:**
   - Add service checkup scheduling
   - Track last checkup date
   - Add calendar view for checkups

2. **Calendar View:**
   - Monthly calendar with expiration dates
   - Service checkup scheduling
   - Renewal reminders

3. **Enhanced Cloning:**
   - Add confirmation prompt if target exists
   - Allow partial cloning (menu only, settings only, etc.)
   - Add dry-run mode

4. **Subscription Management:**
   - Renewal workflow
   - Payment processing
   - Email notifications for expiring subscriptions

## Notes

- La Poblanita prepaid subscription expires: **September 9, 2027**
- Las Reinas subscription: $54/mo with ADA feature (under webhosting product)
- All menu items, catering packages, and settings are cloned from source
- Subscription expiration is displayed on both super admin and owner dashboards

