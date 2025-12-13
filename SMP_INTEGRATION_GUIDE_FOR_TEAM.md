# Alessa Ordering → Switch Menu Pro (SMP) Integration Guide

## 🔄 How The Sync System Works

Alessa Ordering automatically syncs menu data to Switch Menu Pro when:
1. Admin creates/updates/deletes a menu item
2. Tenant subscribes to SwitchMenu Pro product
3. Manual sync is triggered

## 📡 Current Sync Infrastructure

### VPS Setup
Both systems run on the same VPS: `77.243.85.8`

- **Alessa Ordering**: Port 4000 (`PM2 app: alessa-ordering`)
- **Switch Menu Pro**: Port 3003 (`PM2 app: switchmenu-api`)

### Database
**Shared PostgreSQL database** on the same VPS
- Host: `localhost`
- Database: `alessa_ordering`
- User: `alessa_ordering_user`

## 🔧 Required Environment Variables

### On Alessa Ordering Side (Already Set)
```bash
# Alessa Ordering .env
ALESSACLOUD_API_KEY=your-secure-api-key
SMP_API_URL=http://localhost:3003/api/sync/menu
SMP_API_KEY=your-smp-api-key
NEXTAUTH_URL=https://alessacloud.com
```

### On SMP Side (Need to Set)
```bash
# SMP .env
SMP_API_KEY=your-smp-api-key  # Must match Alessa's SMP_API_KEY
BASE_ASSET_URL=https://alessacloud.com  # For image URLs
```

## 📊 Data Format Sent to SMP

```json
{
  "tenantId": "uuid",
  "tenantSlug": "lasreinas",
  "tenant": {
    "id": "uuid",
    "slug": "lasreinas",
    "name": "Las Reinas Colusa",
    "primaryColor": "#dc2626",
    "secondaryColor": "#fbbf24",
    "logoUrl": "/uploads/logo.png",  // ⚠️ RELATIVE PATH
    "heroImageUrl": "/uploads/hero.jpg"  // ⚠️ RELATIVE PATH
  },
  "categories": [
    {
      "id": "uuid",
      "name": "Popular Items",
      "description": "Customer favorites",
      "type": "RESTAURANT",
      "position": 0,
      "hero": false,
      "itemCount": 12
    }
  ],
  "products": [
    {
      "id": "uuid",
      "name": "Quesabirria Tacos",
      "description": "Tender beef tacos with consomé",
      "price": 12.99,
      "category": "entrees",
      "image": "/uploads/quesabirria.jpg",  // ⚠️ RELATIVE PATH
      "gallery": [
        "/uploads/gallery-1.jpg",  // ⚠️ RELATIVE PATH
        "/uploads/gallery-2.jpg"
      ],
      "available": true,
      "menuSectionId": "uuid",
      "isFeatured": true,
      "tags": ["popular", "signature"],
      "customizationRemovals": ["onions", "cilantro"],
      "customizationAddons": [
        {
          "id": "extra-cheese",
          "label": "Extra Cheese",
          "price": 2.00
        }
      ],
      "createdAt": "2025-12-13T00:00:00Z",
      "updatedAt": "2025-12-13T00:00:00Z"
    }
  ]
}
```

## ⚠️ CRITICAL: Image URL Problem

### The Issue
Alessa Ordering sends **relative URLs** like `/uploads/image.png`, but Raspberry Pi displays need **full URLs** like `https://alessacloud.com/uploads/image.png`.

### The Solution (For SMP Team)

You need to implement URL resolution in your SMP sync endpoint:

```javascript
// In SMP: app/api/sync/menu/route.js or similar

function resolveImageUrl(relativePath) {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) {
    return relativePath; // Already full URL
  }
  const baseUrl = process.env.BASE_ASSET_URL || 'https://alessacloud.com';
  return `${baseUrl}${relativePath}`;
}

app.post('/api/sync/menu', async (req, res) => {
  // Validate API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.SMP_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { tenantId, tenantSlug, tenant, categories, products } = req.body;
  
  // CONVERT RELATIVE URLS TO FULL URLS
  const resolvedTenant = {
    ...tenant,
    logoUrl: resolveImageUrl(tenant.logoUrl),
    heroImageUrl: resolveImageUrl(tenant.heroImageUrl),
  };

  const resolvedProducts = products.map(product => ({
    ...product,
    image: resolveImageUrl(product.image),
    gallery: product.gallery?.map(resolveImageUrl) || [],
  }));

  // Save to your database
  await updateMenuInDatabase(tenantId, {
    tenant: resolvedTenant,
    categories,
    products: resolvedProducts,
  });

  res.json({ success: true, message: 'Menu synced successfully' });
});
```

## 🎯 Implementation Checklist for SMP Team

### 1. Create Sync Endpoint
- [ ] Create `POST /api/sync/menu` endpoint
- [ ] Add API key validation using `X-API-Key` header
- [ ] Accept JSON body with tenant, categories, products

### 2. URL Resolution
- [ ] Add `BASE_ASSET_URL` to SMP `.env`
- [ ] Implement `resolveImageUrl()` helper function
- [ ] Convert all relative URLs to absolute URLs

### 3. Database Schema
Your SMP database should store:
```sql
-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  slug VARCHAR UNIQUE,
  name VARCHAR,
  primary_color VARCHAR,
  secondary_color VARCHAR,
  logo_url VARCHAR,  -- Store FULL URL: https://alessacloud.com/uploads/...
  hero_image_url VARCHAR,  -- Store FULL URL
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR,
  description TEXT,
  type VARCHAR,
  position INTEGER,
  hero BOOLEAN,
  item_count INTEGER
);

-- Products table
CREATE TABLE menu_products (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  category_id UUID REFERENCES menu_categories(id),
  name VARCHAR,
  description TEXT,
  price DECIMAL(10,2),
  image_url VARCHAR,  -- Store FULL URL
  gallery JSONB,  -- Array of FULL URLs
  available BOOLEAN,
  is_featured BOOLEAN,
  tags JSONB,
  customization_removals JSONB,
  customization_addons JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 4. Testing
```bash
# Test sync from Alessa Ordering
curl -X POST http://localhost:4000/api/sync/smp/trigger \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"tenantId": "lasreinas-tenant-id"}'

# Check SMP received data
curl http://localhost:3003/api/menus/lasreinas
```

### 5. Handle Sync Events
```javascript
// When menu data is received and saved
await saveToDatabase({
  tenantId,
  tenant: resolvedTenant,
  products: resolvedProducts,
  categories,
  syncedAt: new Date(),
});

// Optionally: Trigger Raspberry Pi refresh
await notifyRaspberryPiDevices(tenantId, 'menu_updated');
```

## 🔍 Debugging

### Check if sync is working
```bash
# On VPS
ssh root@77.243.85.8

# Check Alessa Ordering logs
pm2 logs alessa-ordering --lines 100 | grep SMP

# Check SMP logs
pm2 logs switchmenu-api --lines 100 | grep sync
```

### Test image URLs manually
```bash
# Test if image is accessible
curl -I https://alessacloud.com/uploads/logo.png

# Should return 200 OK
```

### Common Issues

**Images not showing on Raspberry Pi:**
- ✅ SMP is receiving relative URLs like `/uploads/image.png`
- ❌ SMP needs to convert to `https://alessacloud.com/uploads/image.png`
- Fix: Implement URL resolution (see above)

**Sync not triggering:**
- Check tenant has active SMP subscription
- Check `SMP_API_URL` and `SMP_API_KEY` are set
- Check PM2 logs for errors

**Sync endpoint not found:**
- Verify SMP is running on port 3003
- Verify endpoint exists: `curl http://localhost:3003/api/sync/menu`

## 🚀 Auto-Sync Behavior

Once configured, sync happens automatically when:
1. **Admin creates menu item** → Syncs to SMP within seconds
2. **Admin updates price** → Syncs to SMP within seconds
3. **Admin uploads new image** → Syncs to SMP within seconds
4. **Admin deletes item** → Syncs to SMP within seconds

This is the same auto-refresh system we just implemented in Alessa Ordering!

## 📋 Code Examples for SMP Team

### Minimal Express.js Endpoint
```javascript
const express = require('express');
const app = express();

app.post('/api/sync/menu', express.json(), async (req, res) => {
  // 1. Validate
  if (req.headers['x-api-key'] !== process.env.SMP_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Resolve URLs
  const baseUrl = process.env.BASE_ASSET_URL || 'https://alessacloud.com';
  const { tenant, products, categories } = req.body;
  
  tenant.logoUrl = tenant.logoUrl ? `${baseUrl}${tenant.logoUrl}` : null;
  tenant.heroImageUrl = tenant.heroImageUrl ? `${baseUrl}${tenant.heroImageUrl}` : null;
  
  products.forEach(p => {
    p.image = p.image ? `${baseUrl}${p.image}` : null;
    p.gallery = p.gallery?.map(url => `${baseUrl}${url}`) || [];
  });

  // 3. Save to database
  await db.upsertMenu({ tenant, products, categories });

  // 4. Notify displays
  await notifyDisplays(tenant.id);

  res.json({ success: true });
});
```

## 🔗 Quick Links

- **Alessa Ordering Admin**: https://lasreinas.alessacloud.com/admin
- **SMP API** (local): http://localhost:3003
- **Shared DB**: `postgresql://alessa_ordering_user@localhost/alessa_ordering`
- **Image CDN**: https://alessacloud.com/uploads/

---

**Status**: System is ready on Alessa side. SMP needs to implement the sync endpoint with URL resolution.
