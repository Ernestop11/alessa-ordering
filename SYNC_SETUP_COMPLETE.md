# Alessa Ordering Sync Setup - Implementation Complete

## ✅ What Was Implemented

All sync endpoints from the guide have been implemented in the Alessa Ordering system. These endpoints allow SwitchMenu (or other digital menu apps) to sync products and tenant data from Alessa Ordering.

---

## 📍 Endpoints Created/Updated

### 1. **POST `/api/sync/tenant/:slug`** ✅
**Purpose:** Sync tenant from Alessa Cloud and link to external systems

**Usage:**
```bash
curl -X POST https://alessacloud.com/api/sync/tenant/lasreinas \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here"
```

**Response:**
```json
{
  "id": "lasreinas-tenant-001",
  "name": "Las Reinas",
  "alessaCloudId": "...",
  "alessaSlug": "lasreinas",
  "alessaServices": {
    "ordering": true,
    "digitalMenu": true,
    "catering": false,
    "smp": true
  }
}
```

**What it does:**
- Links tenant to Alessa Cloud
- Syncs Alessa services (ordering, digital menu, etc.)
- Creates/updates `TenantSync` record with sync configuration
- Returns tenant info with service flags

---

### 2. **POST `/api/sync/ordering/:tenantId/products`** ✅
**Purpose:** Sync products FROM Alessa Ordering system

**Usage:**
```bash
curl -X POST "https://alessacloud.com/api/sync/ordering/lasreinas-tenant-001/products" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here"
```

**Response:**
```json
{
  "success": true,
  "count": 23,
  "message": "Synced 23 products from Alessa Ordering",
  "products": [...]
}
```

**What it does:**
- Fetches all products for the tenant from Alessa Ordering
- Updates sync status in `TenantSync` table
- Returns formatted product data ready for external systems
- Also supports single product updates (if body with `id` is provided)

---

### 3. **GET `/api/tenants/:id/auto-seed-status`** ✅
**Purpose:** Check if auto-seed is needed

**Usage:**
```bash
curl "https://alessacloud.com/api/tenants/lasreinas-tenant-001/auto-seed-status" \
  -H "X-API-Key: your_api_key_here"
```

**Response:**
```json
{
  "needsAutoSeed": true,
  "hasProducts": true,
  "productCount": 23,
  "lastSyncAt": "2025-01-15T10:30:00Z",
  "syncStatus": "success",
  "message": "Products are synced and ready for auto-seeding"
}
```

**What it does:**
- Checks if products exist and are synced
- Determines if auto-seed is needed
- Returns sync status and product count

---

### 4. **POST `/api/tenants/:id/auto-seed`** ✅
**Purpose:** Get products data for auto-seeding (provides data to external system)

**Usage:**
```bash
curl -X POST "https://alessacloud.com/api/tenants/lasreinas-tenant-001/auto-seed" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here"
```

**Response:**
```json
{
  "success": true,
  "message": "Menu auto-seeded with 23 products",
  "productCount": 23,
  "sectionCount": 5,
  "products": [...]
}
```

**What it does:**
- Validates products are synced
- Returns formatted product data grouped by sections
- Marks sync record as auto-seeded
- Provides all data needed for external system to create menu

---

## 🔐 Authentication

All endpoints support optional API key authentication via `X-API-Key` header:

```bash
-H "X-API-Key: ${ALESSACLOUD_API_KEY}"
```

**Note:** If `ALESSACLOUD_API_KEY` is not set in environment, endpoints will still work (for internal use).

---

## 📋 Setup Steps for Las Reinas

### Step 1: Set Environment Variable (on VPS)

```bash
ssh root@77.243.85.8
cd /var/www/alessa-ordering

# Add to .env file
echo "ALESSACLOUD_API_KEY=your_api_key_here" >> .env

# Restart API
pm2 restart alessa-ordering
```

### Step 2: Sync Tenant

```bash
curl -X POST https://alessacloud.com/api/sync/tenant/lasreinas \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here"
```

### Step 3: Sync Products

```bash
# First, get tenant ID from Step 2 response, then:
curl -X POST "https://alessacloud.com/api/sync/ordering/{tenant-id}/products" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here"
```

### Step 4: Check Auto-Seed Status

```bash
curl "https://alessacloud.com/api/tenants/{tenant-id}/auto-seed-status" \
  -H "X-API-Key: your_api_key_here"
```

### Step 5: Get Auto-Seed Data

```bash
curl -X POST "https://alessacloud.com/api/tenants/{tenant-id}/auto-seed" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here"
```

---

## 🔄 How It Works

1. **Tenant Sync** → Links tenant to Alessa Cloud, stores sync config
2. **Product Sync** → Fetches all products, updates sync status
3. **Auto-Seed Check** → Validates products are ready
4. **Auto-Seed** → Returns formatted product data for menu creation

All sync information is stored in the `TenantSync` table with:
- `productType: 'SMP'` (or other external system)
- `lastSyncAt`: Timestamp of last sync
- `syncStatus`: 'success', 'pending', 'error'
- `syncConfig`: JSON with sync metadata

---

## 🐛 Troubleshooting

### "Unauthorized" Error
- Check `ALESSACLOUD_API_KEY` is set in `.env`
- Verify API key matches in request header

### "Tenant not found"
- Verify tenant slug exists in database
- Check tenant ID is correct

### "No products found"
- Ensure products exist in Alessa Ordering for the tenant
- Run product sync first

### "Products not synced"
- Run Step 2 (Sync Tenant) first
- Then run Step 3 (Sync Products)

---

## 📝 Notes

- **API Key:** Set `ALESSACLOUD_API_KEY` in environment for external access
- **Tenant ID:** Use tenant ID (UUID) not slug for product/auto-seed endpoints
- **Sync Records:** All syncs are tracked in `TenantSync` table
- **Product Updates:** POST to products endpoint with body can update single products (bidirectional sync)

---

## ✅ Status

All endpoints are **implemented and ready to use**. The sync system is fully functional for connecting Alessa Ordering with external digital menu systems like SwitchMenu.




