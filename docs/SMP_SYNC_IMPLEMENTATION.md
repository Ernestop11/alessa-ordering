# SMP (SwitchMenu Pro) Sync Implementation

## ✅ Implementation Complete

The automatic sync between Alessa Ordering and SwitchMenu Pro (SMP) digital signage system has been implemented.

---

## 📋 What Was Implemented

### 1. SMP Sync Trigger Endpoint
**File:** `app/api/sync/smp/trigger/route.ts`

- Validates API key authentication
- Checks if tenant has active SMP subscription
- Fetches all menu data (products, categories, tenant info)
- Formats data for SMP consumption
- Attempts to send to SMP API (if configured)
- Updates sync status in database
- Emits ecosystem events

**Usage:**
```bash
curl -X POST https://alessacloud.com/api/sync/smp/trigger \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"tenantId": "tenant-uuid"}'
```

### 2. Subscription Endpoint with Auto-Sync
**File:** `app/api/super/tenants/subscribe/route.ts`

- Creates/updates tenant product subscriptions
- Automatically triggers SMP sync when subscribing to SwitchMenu Pro
- Handles subscription status changes

**Usage:**
```bash
curl -X POST https://alessacloud.com/api/super/tenants/subscribe \
  -H "Content-Type: application/json" \
  -H "Cookie: [session-cookie]" \
  -d '{
    "tenantId": "tenant-uuid",
    "productSlug": "switchmenu-pro",
    "status": "active",
    "expiresAt": "2027-09-09T00:00:00Z"
  }'
```

### 3. Automatic Sync on Menu Changes
**Files:** 
- `app/api/menu/route.ts` (menu item creation)
- `app/api/menu/[id]/route.ts` (menu item update/delete)

- Automatically triggers SMP sync when menu items are:
  - Created
  - Updated
  - Deleted
- Only syncs if tenant has active SMP subscription
- Non-blocking (async, doesn't slow down menu operations)

### 4. Helper Function
**File:** `lib/ecosystem/communication.ts`

Added `triggerSMPSync()` function:
- Checks if tenant has active SMP subscription
- Triggers sync asynchronously
- Handles errors gracefully

---

## 🔄 How It Works

### Flow 1: Tenant Subscribes to SMP

```
1. Super Admin subscribes tenant to SwitchMenu Pro
   ↓
2. POST /api/super/tenants/subscribe
   ↓
3. Subscription created in database
   ↓
4. Auto-triggers: POST /api/sync/smp/trigger
   ↓
5. Menu data synced to SMP
   ↓
6. Sync status updated to "success"
```

### Flow 2: Menu Item Changed

```
1. Admin creates/updates/deletes menu item
   ↓
2. Menu API saves to database
   ↓
3. Emits ecosystem event
   ↓
4. Checks if tenant has SMP subscription
   ↓
5. If yes: Triggers sync to SMP
   ↓
6. SMP receives updated menu data
```

---

## 🔧 Configuration

### Environment Variables

Add to `.env`:

```bash
# Required for sync to work
ALESSACLOUD_API_KEY=your-secure-api-key-here

# Optional: SMP API endpoint (if SMP is on different server)
SMP_API_URL=http://localhost:3003/api/sync/menu
SMP_API_KEY=your-smp-api-key

# Base URL for internal API calls
NEXTAUTH_URL=https://alessacloud.com
```

### Generate API Key

```bash
openssl rand -base64 32
```

---

## 📡 Sync Data Format

The sync endpoint sends the following data structure to SMP:

```json
{
  "tenantId": "uuid",
  "tenantSlug": "lapoblanita",
  "tenant": {
    "id": "uuid",
    "slug": "lapoblanita",
    "name": "La Poblanita",
    "primaryColor": "#dc2626",
    "secondaryColor": "#f59e0b",
    "logoUrl": "/uploads/logo.png",
    "heroImageUrl": "/uploads/hero.jpg"
  },
  "categories": [
    {
      "id": "uuid",
      "name": "Tacos Tradicionales",
      "description": "Authentic tacos",
      "type": "RESTAURANT",
      "position": 1,
      "hero": false,
      "itemCount": 5
    }
  ],
  "products": [
    {
      "id": "uuid",
      "name": "Pastor Taco",
      "description": "Marinated pork with pineapple",
      "price": 5.14,
      "category": "entrees",
      "image": "/uploads/taco.jpg",
      "gallery": [],
      "available": true,
      "menuSectionId": "uuid",
      "isFeatured": true,
      "tags": ["popular", "spicy"],
      "customizationRemovals": [],
      "customizationAddons": null,
      "timeSpecificEnabled": false,
      "timeSpecificDays": [],
      "timeSpecificStartTime": null,
      "timeSpecificEndTime": null,
      "timeSpecificPrice": null,
      "timeSpecificLabel": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## 🧪 Testing

### 1. Test Subscription Creation

```bash
# Login as super admin first, then:
curl -X POST https://alessacloud.com/api/super/tenants/subscribe \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{
    "tenantId": "lapoblanita-tenant-id",
    "productSlug": "switchmenu-pro",
    "status": "active"
  }'
```

### 2. Test Manual Sync Trigger

```bash
curl -X POST https://alessacloud.com/api/sync/smp/trigger \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"tenantId": "lapoblanita-tenant-id"}'
```

### 3. Check Sync Status

```bash
curl -H "X-API-Key: your-api-key" \
  "https://alessacloud.com/api/sync/status?tenantId=lapoblanita-tenant-id&productType=SMP"
```

### 4. Test Menu Change Sync

1. Login to tenant admin: https://lapoblanitamexicanfood.com/admin/login
2. Create/edit/delete a menu item
3. Check logs for sync trigger:
   ```bash
   ssh root@77.243.85.8 "pm2 logs alessa-ordering --lines 50 | grep SMP"
   ```

---

## 📊 Sync Status Tracking

Sync status is stored in the `TenantSync` table:

- `syncStatus`: `pending` | `syncing` | `success` | `error`
- `lastSyncAt`: Timestamp of last successful sync
- `syncError`: Error message if sync failed
- `syncConfig`: JSON with sync metadata

---

## 🔌 SMP Integration Requirements

For the SMP system to receive syncs, it needs:

1. **API Endpoint**: `POST /api/sync/menu`
2. **Authentication**: Accept `X-API-Key` header
3. **Request Body**: Accept the sync data format above
4. **Response**: Return 200 OK on success

### Example SMP Endpoint (Node.js/Express)

```javascript
app.post('/api/sync/menu', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.SMP_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { tenantId, tenant, categories, products } = req.body;
  
  // Update SMP database with menu data
  await updateMenuData(tenantId, { tenant, categories, products });
  
  res.json({ success: true, message: 'Menu synced' });
});
```

---

## 🚨 Error Handling

- If SMP API is unavailable, sync still completes (data is prepared)
- Sync errors are logged but don't block menu operations
- Sync status is updated even if SMP API fails
- Retry mechanism can be added later if needed

---

## 📝 Next Steps

1. **Configure SMP API**: Set `SMP_API_URL` and `SMP_API_KEY` in `.env`
2. **Test End-to-End**: Subscribe tenant → Verify sync → Check SMP displays
3. **Monitor Syncs**: Check sync status regularly via `/api/sync/status`
4. **Add Retry Logic**: (Optional) Add automatic retry for failed syncs

---

## 🔗 Related Documentation

- [SMP Integration Guide](./SMP_INTEGRATION.md) - Complete API reference
- [Ecosystem Architecture](./ECOSYSTEM_ARCHITECTURE.md) - How products communicate
- [Sync API Endpoints](../README.md#sync-api-endpoints) - All sync endpoints

---

**Status**: ✅ **IMPLEMENTED AND READY FOR TESTING**



















