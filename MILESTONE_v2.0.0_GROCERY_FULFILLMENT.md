# Milestone v2.0.0 - Grocery & Fulfillment System Complete

**Date:** December 16, 2025
**Commit:** `504fee0` - feat: Support GroceryItem in checkout flow
**VPS Status:** Online, Node 20.19.5, App v14.0.3
**Backup Branch:** `milestone/v2.0.0-grocery-fulfillment`

---

## Overview

This milestone marks a fully functional multi-tenant ordering platform with:
- Complete checkout flow for food, grocery, and bakery items
- Color-coded fulfillment dashboard for item categorization
- Native iOS app support with Capacitor
- Professional refund system
- Real-time order updates via SSE

---

## Working Features

### 1. Multi-Item Type Ordering System

**Food Items (MenuItem table)**
- Traditional restaurant menu items
- Section-based organization (RESTAURANT, BEVERAGE, etc.)
- Full CRUD in admin menu editor

**Grocery Items (GroceryItem table)**
- Separate inventory management
- Available via `/grocery` page
- Green color-coding in fulfillment (🛒)

**Bakery Items (GroceryItem table with bakery sections)**
- Panaderia/bakery products
- Available via `/bakery` page
- Amber color-coding in fulfillment (🥐)

### 2. Checkout Flow

```
Cart → Payment Intent → Order Creation → Fulfillment
```

**Key Files:**
- `components/CartDrawer.tsx` - Cart with itemType tracking
- `lib/payments/normalize-order-payload.ts` - Validates itemType (food/grocery/bakery)
- `app/api/payments/intent/route.ts` - Creates Stripe payment intent
- `lib/order-service.ts` - Validates items against MenuItem OR GroceryItem based on itemType
- `lib/order-serializer.ts` - Serializes orders with denormalized item names

**Database Schema Changes:**
```prisma
model OrderItem {
  id           String    @id @default(uuid())
  menuItemId   String    // Can reference MenuItem.id OR GroceryItem.id
  tenantId     String
  orderId      String
  quantity     Int
  price        Float
  notes        String?
  itemType     String?   // 'food', 'grocery', or 'bakery'
  menuItemName String?   // Denormalized name for display
  menuItem     MenuItem? @relation(...) // OPTIONAL - removed FK constraint
  tenant       Tenant    @relation(...)
  order        Order     @relation(...)
}
```

**Critical DB Change:** The `OrderItem_menuItemId_fkey` foreign key constraint was DROPPED to allow `menuItemId` to reference either `MenuItem.id` or `GroceryItem.id`.

### 3. Fulfillment Dashboard

**Location:** `/admin/fulfillment`

**Features:**
- Real-time order updates via SSE (`/api/admin/fulfillment/stream`)
- Order status workflow: pending → preparing → ready → completed
- Color-coded item sections:
  - Food: Gray quantity badges
  - Grocery: Green background, green badges (🛒)
  - Bakery: Amber background, amber badges (🥐)
- Modifier parsing (NO X, EXTRA X displayed as tags)
- Order-level special instructions
- Print functionality

**Key Files:**
- `components/fulfillment/FulfillmentDashboard.tsx`
- `components/fulfillment/OrderCard.tsx` - Card with modal popup
- `components/fulfillment/types.ts` - TypeScript interfaces
- `app/api/admin/fulfillment/orders/route.ts`
- `app/api/admin/fulfillment/stream/route.ts`

### 4. Native iOS App (Capacitor)

**Status:** Working with kiosk mode indicator

**Features:**
- Bluetooth printing support (Star Micronics, Epson)
- Native app detection in UI
- Kiosk mode for in-store tablets
- Push notification ready

**Key Files:**
- `capacitor.config.ts`
- `ios/App/` - Xcode project
- `components/KioskMode.tsx`
- `lib/client-printer.ts`

### 5. Refund System

**Location:** `/admin/orders`

**Features:**
- Full and partial refunds
- Refund reason selection
- Stripe integration
- Audit logging

### 6. Tenant-Specific Features

**Las Reinas (lasreinas.ordernosh.com)**
- Taqueria + Grocery add-on
- Red/gold branding
- Available products tested:
  - Food: BREAKFAST TACOS PLATE, CHILAQUILES, etc.
  - Grocery: Churrumaiz, Diezmillo, Rancherito, Adobada

---

## API Endpoints

### Orders
- `POST /api/payments/intent` - Create payment intent
- `POST /api/orders` - Create order (via webhook or direct)
- `GET /api/admin/fulfillment/orders` - Get tenant orders
- `GET /api/admin/fulfillment/stream` - SSE for real-time updates
- `PATCH /api/admin/fulfillment/orders/[id]` - Update order status

### Stripe
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `POST /api/admin/stripe/refund` - Process refund

### Grocery
- `GET /api/grocery/items` - Get grocery items for tenant
- `GET /api/grocery/sections` - Get grocery sections

---

## Environment Variables (VPS)

```bash
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://ordernosh.com
```

---

## Deployment Commands

```bash
# Local development
npm run dev

# Build
npm run build

# VPS deployment
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git pull origin main && npm run build && pm2 restart alessa-ordering"

# Check VPS status
ssh root@77.243.85.8 "pm2 status && pm2 logs alessa-ordering --lines 50"

# Database operations
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && npx prisma db push"
```

---

## Test Order Created

**Order ID:** `test-mixed-order-003`
**Customer:** Test Mixed Order - Food & Grocery
**Items:**
| Item | Type | Price |
|------|------|-------|
| BREAKFAST TACOS PLATE | food | $12.11 |
| CHILAQUILES | food | $13.00 |
| Churrumaiz | grocery | $3.99 |
| Diezmillo | grocery | $7.98 |

**Total:** $40.41 (including tax)

---

## Known Configurations

### Removed FK Constraint
The `OrderItem_menuItemId_fkey` constraint was manually dropped:
```sql
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_menuItemId_fkey";
```

This allows `menuItemId` to reference either `MenuItem` or `GroceryItem` tables.

### Prisma Schema Note
The `menuItem` relation in OrderItem is marked as optional (`MenuItem?`), but Prisma doesn't automatically drop existing FK constraints. Manual SQL was required.

---

## Recovery Instructions

If something breaks:

1. **Restore from backup branch:**
   ```bash
   git checkout milestone/v2.0.0-grocery-fulfillment
   ```

2. **Restore database (if needed):**
   ```bash
   # On VPS
   sudo -u postgres pg_dump alessa_ordering > backup.sql
   # Restore
   sudo -u postgres psql alessa_ordering < backup.sql
   ```

3. **Re-drop FK constraint (if restored from backup):**
   ```sql
   ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_menuItemId_fkey";
   ```

---

## Next Steps (Backlog)

- [ ] Panaderia/bakery add-on for additional tenants
- [ ] Inventory management for grocery items
- [ ] Order splitting by item type for multi-station fulfillment
- [ ] Kitchen display system (KDS) integration
- [ ] Delivery partner integration (DoorDash, Uber Eats)

---

## Contributors

- Claude Code (AI Assistant)
- Ernesto Ponce

---

*This milestone represents a stable, production-ready state of the ordering platform.*
