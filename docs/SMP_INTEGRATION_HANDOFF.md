# Switch Menu Pro (SMP) Integration Handoff

## Overview

This document provides the complete API contract and integration details for syncing Alessa Ordering data to Switch Menu Pro for TV/digital signage displays.

**Tenant ID for Las Reinas:** `79bd3027-5520-480b-8979-2e37b21e58d0`
**Tenant Slug:** `lasreinas`

---

## Authentication

All sync endpoints require API key authentication:

```http
X-API-Key: {ALESSACLOUD_API_KEY}
```

The API key is shared between Alessa Cloud and SMP systems.

---

## Sync Endpoints

### 0. Tenant Resolution (Start Here!)

**Endpoint:** `GET /api/sync/smp/resolve-tenant?smpTenantId={smpTenantId}`

Resolves SMP tenant IDs to Alessa UUIDs. Call this first to get the correct tenant ID.

```bash
curl -X GET "https://alessacloud.com/api/sync/smp/resolve-tenant?smpTenantId=lasreinas-tenant-001" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "resolved": true,
  "smpTenantId": "lasreinas-tenant-001",
  "alessaTenantId": "79bd3027-5520-480b-8979-2e37b21e58d0",
  "slug": "lasreinas",
  "name": "Las Reinas Colusa",
  "branding": {
    "primaryColor": "#dc2626",
    "secondaryColor": "#f59e0b",
    "logoUrl": "https://..."
  },
  "smpSubscriptionActive": true,
  "endpoints": {
    "products": "/api/sync/ordering/79bd3027-5520-480b-8979-2e37b21e58d0/products",
    "categories": "/api/sync/ordering/79bd3027-5520-480b-8979-2e37b21e58d0/categories",
    "ordersReady": "/api/sync/smp/orders-ready?tenantId=79bd3027-5520-480b-8979-2e37b21e58d0",
    "promos": "/api/sync/smp/promos?tenantId=79bd3027-5520-480b-8979-2e37b21e58d0"
  }
}
```

**Supported Aliases:**
- `lasreinas-tenant-001` → `lasreinas` → `79bd3027-5520-480b-8979-2e37b21e58d0`
- `lasreinas` → `79bd3027-5520-480b-8979-2e37b21e58d0`
- Direct UUID also works

---

### 1. Products/Menu Sync

**Endpoint:** `GET /api/sync/ordering/{tenantId}/products`

Returns all menu items for a tenant with full details.

```bash
curl -X GET "https://alessacloud.com/api/sync/ordering/79bd3027-5520-480b-8979-2e37b21e58d0/products" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Carne Asada Burrito",
      "description": "Grilled steak burrito with...",
      "price": 12.99,
      "category": "burritos",
      "available": true,
      "isFeatured": true,
      "image": "https://...",
      "gallery": ["https://...", "https://..."],
      "tags": ["popular", "spicy"],
      "menuSectionId": "section-uuid",
      "menuSectionName": "Burritos",
      "customizationAddons": [
        { "id": "addon1", "label": "Extra Meat", "price": 2.50 }
      ],
      "customizationRemovals": ["No Onions", "No Cilantro"],
      "timeSpecificEnabled": true,
      "timeSpecificDays": [2], // Tuesday
      "timeSpecificStartTime": "11:00",
      "timeSpecificEndTime": "15:00",
      "timeSpecificPrice": 8.99,
      "timeSpecificLabel": "Taco Tuesday Special"
    }
  ],
  "timestamp": "2025-12-19T12:00:00.000Z",
  "tenantId": "79bd3027-5520-480b-8979-2e37b21e58d0"
}
```

### 2. Categories/Sections Sync

**Endpoint:** `GET /api/sync/ordering/{tenantId}/categories`

Returns all menu sections for organizing items.

```bash
curl -X GET "https://alessacloud.com/api/sync/ordering/79bd3027-5520-480b-8979-2e37b21e58d0/categories" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "categories": [
    {
      "id": "section-uuid",
      "name": "Burritos",
      "description": "Fresh handmade burritos",
      "type": "RESTAURANT",
      "position": 0,
      "hero": false,
      "imageUrl": "https://...",
      "itemCount": 8
    }
  ]
}
```

### 3. Orders Ready (Fulfillment Board)

**Endpoint:** `GET /api/sync/smp/orders-ready?tenantId={tenantId}`

Returns orders for pickup board display.

```bash
curl -X GET "https://alessacloud.com/api/sync/smp/orders-ready?tenantId=79bd3027-5520-480b-8979-2e37b21e58d0" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-12-19T12:00:00.000Z",
  "tenantId": "79bd3027-5520-480b-8979-2e37b21e58d0",
  "orders": [
    {
      "id": "order-uuid",
      "orderNumber": "1042",
      "displayName": "John D.",
      "status": "ready",
      "statusDisplay": "READY FOR PICKUP",
      "orderType": "pickup",
      "itemCount": 3,
      "items": [
        { "name": "Carne Asada Burrito", "quantity": 2 },
        { "name": "Horchata", "quantity": 1 }
      ],
      "estimatedReadyTime": "2025-12-19T12:15:00.000Z",
      "waitTime": "8 mins",
      "createdAt": "2025-12-19T12:00:00.000Z",
      "updatedAt": "2025-12-19T12:08:00.000Z"
    }
  ],
  "grouped": {
    "ready": [...],
    "preparing": [...],
    "completed": [...]
  },
  "summary": {
    "totalReady": 3,
    "totalPreparing": 5,
    "totalCompleted": 2
  }
}
```

### 4. Promos & Featured Items

**Endpoint:** `GET /api/sync/smp/promos?tenantId={tenantId}`

Returns promotional content, featured items, and daily specials.

```bash
curl -X GET "https://alessacloud.com/api/sync/smp/promos?tenantId=79bd3027-5520-480b-8979-2e37b21e58d0" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-12-19T12:00:00.000Z",
  "tenantId": "79bd3027-5520-480b-8979-2e37b21e58d0",
  "branding": {
    "name": "Las Reinas Colusa",
    "logo": "https://...",
    "heroImage": "https://...",
    "primaryColor": "#dc2626",
    "secondaryColor": "#f59e0b"
  },
  "promos": {
    "banners": [
      {
        "id": "section-uuid",
        "type": "promoBanner1",
        "name": "Holiday Special",
        "content": {
          "title": "Holiday Tamales",
          "subtitle": "Order now for Christmas!",
          "image": "https://...",
          "buttonText": "Order Now"
        },
        "position": 1
      }
    ],
    "featured": [
      {
        "id": "item-uuid",
        "name": "Carnitas Plate",
        "description": "Slow-cooked pork...",
        "price": 14.99,
        "image": "https://...",
        "tags": ["popular"],
        "specialLabel": null,
        "specialPrice": null
      }
    ],
    "specials": [
      {
        "id": "item-uuid",
        "name": "Taco Trio",
        "description": "Three tacos...",
        "regularPrice": 9.99,
        "specialPrice": 6.99,
        "specialLabel": "Taco Tuesday",
        "image": "https://...",
        "validUntil": "15:00"
      }
    ]
  },
  "summary": {
    "totalBanners": 2,
    "totalFeatured": 5,
    "totalActiveSpecials": 3
  }
}
```

### 5. Trigger Full Sync (Push-based)

**Endpoint:** `POST /api/sync/smp/trigger`

Triggers a full menu sync to SMP. Called automatically when menu items are updated.

```bash
curl -X POST "https://alessacloud.com/api/sync/smp/trigger" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "79bd3027-5520-480b-8979-2e37b21e58d0"}'
```

**Response:**
```json
{
  "success": true,
  "message": "SMP sync triggered",
  "productCount": 45,
  "categoryCount": 8
}
```

---

## Real-Time Sync Events

### Event Bus (Database-backed)

Alessa emits events to `EcosystemEvent` table when menu changes occur:

| Event Type | Description | Payload |
|------------|-------------|---------|
| `menu_item_added` | New menu item created | `{menuItemId, menuItemName, action}` |
| `menu_item_updated` | Menu item edited | `{menuItemId, menuItemName, action}` |
| `menu_item_deleted` | Menu item removed | `{menuItemId, menuItemName, action}` |
| `sync_completed` | Sync finished successfully | `{tenantId, productType, status}` |
| `sync_failed` | Sync failed | `{tenantId, productType, error}` |

### Polling for Events

SMP can poll for unprocessed events:

```typescript
// In lib/ecosystem/communication.ts
const events = await listenForEvents(
  ['menu_item_updated', 'menu_item_added', 'menu_item_deleted'],
  'SMP',
  tenantId
);
```

---

## Recommended Sync Strategy

### For Menu Display TVs
1. **Initial Load:** Call `/api/sync/ordering/{tenantId}/products` + `/categories`
2. **Real-time Updates:** Poll `/api/sync/smp/trigger` events or poll products every 30 seconds
3. **Display Refresh:** Re-render menu when data changes

### For Orders Ready Board
1. Poll `/api/sync/smp/orders-ready` every 10-15 seconds
2. Animate new orders appearing
3. Auto-remove completed orders after 5 minutes

### For Promo Display
1. Poll `/api/sync/smp/promos` every 60 seconds
2. Rotate through banners and featured items
3. Highlight time-based specials when active

---

## Data Models

### MenuItem
```typescript
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  isFeatured: boolean;
  image: string | null;
  gallery: string[];
  tags: string[];
  menuSectionId: string | null;
  customizationAddons: { id: string; label: string; price: number }[];
  customizationRemovals: string[];
  timeSpecificEnabled: boolean;
  timeSpecificDays: number[]; // 0-6 (Sun-Sat)
  timeSpecificStartTime: string | null;
  timeSpecificEndTime: string | null;
  timeSpecificPrice: number | null;
  timeSpecificLabel: string | null;
}
```

### MenuSection
```typescript
interface MenuSection {
  id: string;
  name: string;
  description: string | null;
  type: 'RESTAURANT' | 'CATERING';
  position: number;
  hero: boolean;
  imageUrl: string | null;
}
```

### Order (for Ready Board)
```typescript
interface OrderDisplay {
  id: string;
  orderNumber: string;
  displayName: string;
  status: 'preparing' | 'ready' | 'completed';
  statusDisplay: string;
  orderType: 'pickup' | 'delivery' | 'dine-in';
  itemCount: number;
  items: { name: string; quantity: number }[];
  estimatedReadyTime: string | null;
  waitTime: string;
}
```

---

## Webhook Configuration (Future)

When SMP is ready to receive webhooks, Alessa can push updates to:

```
POST {SMP_WEBHOOK_URL}/webhooks/alessa
```

Configure in environment:
```env
SMP_API_URL=https://smp.example.com
SMP_WEBHOOK_SECRET=shared_secret_here
```

---

## Testing

### Test Las Reinas Endpoints

```bash
# Get all products
curl "http://localhost:3000/api/sync/ordering/79bd3027-5520-480b-8979-2e37b21e58d0/products" \
  -H "X-API-Key: test-api-key"

# Get orders ready
curl "http://localhost:3000/api/sync/smp/orders-ready?tenantId=79bd3027-5520-480b-8979-2e37b21e58d0" \
  -H "X-API-Key: test-api-key"

# Get promos
curl "http://localhost:3000/api/sync/smp/promos?tenantId=79bd3027-5520-480b-8979-2e37b21e58d0" \
  -H "X-API-Key: test-api-key"
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `app/api/sync/ordering/[tenantId]/products/route.ts` | Product sync endpoint |
| `app/api/sync/ordering/[tenantId]/categories/route.ts` | Category sync endpoint |
| `app/api/sync/smp/orders-ready/route.ts` | Orders ready board data |
| `app/api/sync/smp/promos/route.ts` | Promos and featured items |
| `app/api/sync/smp/trigger/route.ts` | Trigger full sync |
| `lib/ecosystem/communication.ts` | Event bus for real-time updates |
| `lib/addons/registry.ts` | SMP addon registration |

---

## Contact

For questions about integration:
- Review `lib/ecosystem/communication.ts` for event patterns
- Check `app/api/sync/` for all available endpoints
- SMP subscription is already active for Las Reinas tenant
