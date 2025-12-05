# SMP (Digital Signage) Integration Guide

## Overview

This document describes how to integrate the SMP (Digital Signage) project with Alessa Cloud Ordering system. The integration enables bidirectional sync between the ordering menu and the digital signage displays.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   SMP Project   │ ◄─────► │  Alessa Cloud    │ ◄─────► │  Ordering Menu  │
│  (Digital Menu) │  Sync   │   API Gateway    │  Events │   (Database)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## API Endpoints

### Base URL
- **Production:** `https://alessacloud.com/api`
- **Local Dev:** `http://localhost:3001/api`

### Authentication
All endpoints require an API key in the `X-API-Key` header:
```bash
X-API-Key: your-secure-api-key-here
```

### Endpoints

#### 1. Get Tenant by Slug
```http
GET /api/sync/tenants/:slug
```

**Response:**
```json
{
  "id": "tenant-uuid",
  "slug": "lasreinas",
  "name": "Las Reinas",
  "primaryColor": "#dc2626",
  "secondaryColor": "#f59e0b",
  "status": "LIVE",
  "contactEmail": "contact@lasreinas.com",
  "contactPhone": "+1234567890",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### 2. Get Tenant Services
```http
GET /api/sync/tenants/services/:tenantId
```

**Response:**
```json
{
  "tenantId": "tenant-uuid",
  "tenantSlug": "lasreinas",
  "services": {
    "ordering": true,
    "digitalMenu": true,
    "catering": true,
    "smp": true
  }
}
```

#### 3. Get Ordering Products (Menu Items)
```http
GET /api/sync/ordering/:tenantId/products
```

**Response:**
```json
[
  {
    "id": "item-uuid",
    "name": "Taco Plate",
    "description": "Delicious tacos",
    "price": 12.99,
    "category": "entrees",
    "image": "https://...",
    "gallery": [],
    "available": true,
    "menuSectionId": "section-uuid",
    "timeSpecificEnabled": false,
    "timeSpecificDays": [],
    "timeSpecificStartTime": null,
    "timeSpecificEndTime": null,
    "timeSpecificPrice": null,
    "timeSpecificLabel": null,
    "isFeatured": true,
    "tags": ["popular", "spicy"],
    "customizationRemovals": [],
    "customizationAddons": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### 4. Update Product (Bidirectional Sync)
```http
POST /api/sync/ordering/:tenantId/products
```

**Request Body:**
```json
{
  "id": "item-uuid",
  "name": "Updated Taco Plate",
  "description": "Updated description",
  "price": 13.99,
  "available": true
}
```

#### 5. Get Ordering Categories (Menu Sections)
```http
GET /api/sync/ordering/:tenantId/categories
```

**Response:**
```json
[
  {
    "id": "section-uuid",
    "name": "Entrees",
    "description": "Main dishes",
    "type": "RESTAURANT",
    "position": 1,
    "hero": false,
    "itemCount": 15
  }
]
```

#### 6. Get Sync Status
```http
GET /api/sync/status?tenantId=:tenantId&productType=SMP
```

**Response:**
```json
[
  {
    "id": "sync-uuid",
    "tenantId": "tenant-uuid",
    "productType": "SMP",
    "lastSyncAt": "2024-01-01T00:00:00Z",
    "syncStatus": "success",
    "syncError": null,
    "syncConfig": {}
  }
]
```

#### 7. Update Sync Status
```http
POST /api/sync/status
```

**Request Body:**
```json
{
  "tenantId": "tenant-uuid",
  "productType": "SMP",
  "syncStatus": "success",
  "syncError": null,
  "syncConfig": {}
}
```

## Ecosystem Events

Alessa Cloud emits events when menu items change. SMP can listen to these events for real-time updates.

### Event Types
- `menu_item_added` - New menu item created
- `menu_item_updated` - Menu item updated
- `menu_item_deleted` - Menu item deleted
- `sync_completed` - Sync operation completed
- `sync_failed` - Sync operation failed

### Listen for Events
```http
GET /api/ecosystem/events?eventType=menu_item_updated&source=ORDERING&target=SMP&tenantId=:tenantId
```

**Response:**
```json
[
  {
    "id": "event-uuid",
    "tenantId": "tenant-uuid",
    "eventType": "menu_item_updated",
    "source": "ORDERING",
    "target": "SMP",
    "payload": {
      "menuItemId": "item-uuid",
      "menuItemName": "Taco Plate",
      "action": "updated"
    },
    "processed": false,
    "processedAt": null,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

## Setup Instructions

### 1. Generate API Key

In Alessa Cloud project, generate a secure API key:
```bash
openssl rand -base64 32
```

Add to `.env`:
```bash
ALESSACLOUD_API_KEY=your-generated-key-here
ALESSACLOUD_BASE_URL=https://alessacloud.com/api
```

### 2. SMP Project Configuration

In SMP project's `server_prisma/.env`:
```bash
ALESSACLOUD_API_KEY=your-generated-key-here
ALESSACLOUD_BASE_URL=https://alessacloud.com/api
```

### 3. Database Migration

Run Prisma migration in Alessa Cloud:
```bash
cd /path/to/alessa-ordering
npx prisma migrate dev --name add_ecosystem_sync
```

Or use `prisma db push` if migrations are disabled:
```bash
npx prisma db push
```

### 4. Sync Las Reinas Tenant

After setup, sync the Las Reinas tenant:
```bash
curl -X POST https://alessacloud.com/api/sync/status \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "lasreinas-tenant-id",
    "productType": "SMP",
    "syncStatus": "pending"
  }'
```

## Usage Example

### Sync Products from Alessa to SMP

```typescript
import AlessaCloudClient from '@/lib/sync/alessa-cloud-client';

const client = new AlessaCloudClient();

// Get tenant info
const tenant = await client.getTenantBySlug('lasreinas');

// Get products
const products = await client.getProducts(tenant.id);

// Get categories
const categories = await client.getCategories(tenant.id);

// Update product from SMP
await client.updateProduct(tenant.id, productId, {
  name: 'Updated Name',
  price: 15.99,
});
```

## Bidirectional Sync Flow

1. **Menu Item Created in Ordering:**
   - Ordering system creates menu item
   - Emits `menu_item_added` event
   - SMP listens and syncs new item

2. **Menu Item Updated in SMP:**
   - SMP updates item via API
   - Ordering system updates database
   - Emits `menu_item_updated` event
   - Other products can react

3. **Menu Item Deleted:**
   - Ordering system deletes item
   - Emits `menu_item_deleted` event
   - SMP removes from display

## Testing

### Test API Endpoints
```bash
# Get tenant
curl -H "X-API-Key: your-key" \
  https://alessacloud.com/api/sync/tenants/lasreinas

# Get products
curl -H "X-API-Key: your-key" \
  https://alessacloud.com/api/sync/ordering/{tenant-id}/products

# Get categories
curl -H "X-API-Key: your-key" \
  https://alessacloud.com/api/sync/ordering/{tenant-id}/categories
```

## Troubleshooting

### API Key Issues
- Verify `ALESSACLOUD_API_KEY` is set in both projects
- Check API key matches exactly (no extra spaces)
- Ensure key is in `X-API-Key` header

### Sync Status
- Check sync status: `GET /api/sync/status`
- Review sync errors in `syncError` field
- Verify tenant ID is correct

### Event Processing
- Events are queued in `EcosystemEvent` table
- Check `processed` field to see if event was handled
- Review event payload for details

## Next Steps

1. ✅ API endpoints created
2. ✅ Ecosystem event system implemented
3. ✅ Bidirectional sync enabled
4. ⏳ SMP project integration (in SMP project)
5. ⏳ Real-time event listeners (in SMP project)
6. ⏳ Multi-screen sync (in SMP project)

