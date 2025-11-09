# Super Admin Dashboard - CRUD Tests

## 📋 Test Overview

This document provides comprehensive tests for all Super Admin CRUD operations.

**Endpoints to Test:**
1. `GET /api/super/tenants` - List all tenants
2. `POST /api/super/tenants` - Create new tenant
3. `PATCH /api/super/tenants` - Update existing tenant
4. `DELETE /api/super/tenants?id=xxx` - Delete tenant
5. `GET /api/super/metrics` - Get dashboard metrics

---

## 🔐 Authentication

All requests require super admin authentication. You need to be logged in as a super admin.

**Super Admin Credentials:**
```
Email: ernesto@alessacloud.com
Password: superadmin123
```

**Login First:**
```bash
# Get session cookie
curl -c cookies.txt -X POST http://localhost:3000/api/auth/signin/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ernesto@alessacloud.com",
    "password": "superadmin123"
  }'
```

---

## 1️⃣ Test GET /api/super/tenants

### Expected Response
```json
[
  {
    "id": "tenant-uuid",
    "name": "La Poblanita",
    "slug": "lapoblanita",
    "contactEmail": "contact@lapoblanita.com",
    "contactPhone": "+15555551234",
    "addressLine1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94102",
    "primaryColor": "#dc2626",
    "secondaryColor": "#f59e0b",
    "logoUrl": "/uploads/logo.png",
    "heroImageUrl": "/uploads/hero.jpg",
    "stripeAccountId": "acct_xxx",
    "platformPercentFee": 0.029,
    "platformFlatFee": 0.3,
    "defaultTaxRate": 0.0825,
    "deliveryBaseFee": 4.99,
    "autoPrintOrders": false,
    "isOpen": true,
    "createdAt": "2025-01-08T...",
    "updatedAt": "2025-01-08T..."
  }
]
```

### cURL Test
```bash
curl -b cookies.txt http://localhost:3000/api/super/tenants
```

### Expected Status: **200 OK**

### Validation Checklist
- [ ] Returns array of tenants
- [ ] All expected fields present
- [ ] Includes settings and integrations data
- [ ] Sorted by createdAt DESC
- [ ] Returns 401 if not super admin

---

## 2️⃣ Test POST /api/super/tenants (Create Tenant)

### Test Case 1: Create Basic Tenant

**Request:**
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Restaurant",
    "slug": "test-restaurant",
    "contactEmail": "test@restaurant.com",
    "contactPhone": "+15555559999",
    "addressLine1": "456 Test St",
    "city": "Los Angeles",
    "state": "CA",
    "postalCode": "90001",
    "primaryColor": "#3b82f6",
    "secondaryColor": "#8b5cf6",
    "tagline": "Best food in town",
    "platformPercentFee": 0.029,
    "platformFlatFee": 0.3,
    "defaultTaxRate": 0.095,
    "deliveryBaseFee": 5.99
  }'
```

**Expected Response:**
```json
{
  "id": "new-tenant-uuid",
  "name": "Test Restaurant",
  "slug": "test-restaurant",
  "stripeAccountId": null,
  "autoPrintOrders": false
}
```

**Expected Status:** **200 OK**

### Test Case 2: Create with Demo Seed (Taqueria Template)

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Taqueria",
    "slug": "demo-taqueria",
    "contactEmail": "demo@taqueria.com",
    "seedDemo": true,
    "templateId": "taqueria"
  }'
```

**Expected:**
- Creates tenant
- Seeds menu with 3 sections: Tacos, Burritos, Beverages
- Creates multiple menu items (Carne Asada Taco, Al Pastor Taco, etc.)

### Test Case 3: Create with Different Templates

**Available Templates:**
- `taqueria` - Tacos, burritos, beverages
- `panaderia` - Bakery items
- `coffee` - Coffee and pastries
- `pizza` - Pizza and sides
- `grocery` - Produce and packaged goods

```bash
# Create coffee shop
curl -b cookies.txt -X POST http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Coffee Shop",
    "slug": "demo-coffee",
    "seedDemo": true,
    "templateId": "coffee"
  }'
```

### Test Case 4: Duplicate Slug (Should Fail)

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another Restaurant",
    "slug": "lapoblanita"
  }'
```

**Expected Status:** **409 Conflict**
**Expected Response:**
```json
{
  "error": "Slug already in use."
}
```

### Test Case 5: Missing Required Fields

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Status:** **400 Bad Request**
**Expected Response:**
```json
{
  "error": "Name (and slug) required."
}
```

### Validation Checklist
- [ ] Creates tenant with all fields
- [ ] Auto-generates slug from name if not provided
- [ ] Seeds demo menu when `seedDemo: true`
- [ ] Different templates create different menu structures
- [ ] Returns 409 for duplicate slug
- [ ] Returns 400 for missing required fields
- [ ] Creates settings and integrations records

---

## 3️⃣ Test PATCH /api/super/tenants (Update Tenant)

### Test Case 1: Update Basic Info

**First, get a tenant ID:**
```bash
curl -b cookies.txt http://localhost:3000/api/super/tenants | jq '.[0].id'
```

**Update tenant:**
```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TENANT_ID_HERE",
    "name": "Updated Restaurant Name",
    "contactEmail": "updated@restaurant.com",
    "contactPhone": "+15555550000",
    "primaryColor": "#10b981",
    "secondaryColor": "#06b6d4"
  }'
```

**Expected Status:** **200 OK**

### Test Case 2: Update Slug

```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TENANT_ID_HERE",
    "slug": "new-slug-name"
  }'
```

**Expected:**
- Slug is sanitized (lowercase, hyphens)
- Returns 409 if new slug already in use

### Test Case 3: Update Settings

```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TENANT_ID_HERE",
    "isOpen": false,
    "deliveryRadiusMi": 10,
    "minimumOrderValue": 15,
    "tagline": "New tagline here"
  }'
```

### Test Case 4: Update Integrations

```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TENANT_ID_HERE",
    "platformPercentFee": 0.035,
    "platformFlatFee": 0.5,
    "defaultTaxRate": 0.1,
    "autoPrintOrders": true,
    "fulfillmentNotificationsEnabled": false
  }'
```

### Test Case 5: Invalid Tenant ID

```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "id": "invalid-id-123",
    "name": "Test"
  }'
```

**Expected Status:** **404 Not Found**

### Validation Checklist
- [ ] Updates tenant data successfully
- [ ] Updates settings via upsert
- [ ] Updates integrations via upsert
- [ ] Slug validation works
- [ ] Returns 404 for invalid tenant ID
- [ ] Returns 409 for duplicate slug
- [ ] Only updates fields provided (partial update)

---

## 4️⃣ Test DELETE /api/super/tenants (Delete Tenant)

### Test Case 1: Delete Tenant (Cascade Delete)

**First, create a test tenant:**
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Temp Restaurant",
    "slug": "temp-restaurant",
    "seedDemo": true,
    "templateId": "taqueria"
  }' | jq '.id'
```

**Delete it:**
```bash
curl -b cookies.txt -X DELETE "http://localhost:3000/api/super/tenants?id=TENANT_ID_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Tenant deleted successfully"
}
```

**Expected Status:** **200 OK**

### Test Case 2: Verify Cascade Delete

**After deletion, check that related data is deleted:**

```sql
-- Run in database
SELECT COUNT(*) FROM menu_section WHERE tenant_id = 'deleted_tenant_id'; -- Should be 0
SELECT COUNT(*) FROM menu_item WHERE tenant_id = 'deleted_tenant_id';    -- Should be 0
SELECT COUNT(*) FROM "Order" WHERE tenant_id = 'deleted_tenant_id';      -- Should be 0
SELECT COUNT(*) FROM tenant_settings WHERE tenant_id = 'deleted_tenant_id'; -- Should be 0
SELECT COUNT(*) FROM tenant_integration WHERE tenant_id = 'deleted_tenant_id'; -- Should be 0
```

### Test Case 3: Delete Non-Existent Tenant

```bash
curl -b cookies.txt -X DELETE "http://localhost:3000/api/super/tenants?id=invalid-id-123"
```

**Expected Status:** **404 Not Found**
**Expected Response:**
```json
{
  "error": "Tenant not found"
}
```

### Test Case 4: Delete Without ID

```bash
curl -b cookies.txt -X DELETE "http://localhost:3000/api/super/tenants"
```

**Expected Status:** **400 Bad Request**
**Expected Response:**
```json
{
  "error": "id is required"
}
```

### Validation Checklist
- [ ] Deletes tenant successfully
- [ ] Cascades to menu sections
- [ ] Cascades to menu items
- [ ] Cascades to orders
- [ ] Cascades to settings
- [ ] Cascades to integrations
- [ ] Returns 404 for invalid ID
- [ ] Returns 400 when ID missing

---

## 5️⃣ Test GET /api/super/metrics (Dashboard Metrics)

### Request

```bash
curl -b cookies.txt http://localhost:3000/api/super/metrics
```

### Expected Response

```json
{
  "totalOrders": 150,
  "totalTenants": 4,
  "sevenDayVolume": [
    {
      "tenantId": "tenant-1-id",
      "tenantName": "La Poblanita",
      "tenantSlug": "lapoblanita",
      "orders": 25,
      "gross": 750.50
    }
  ],
  "allTimeVolume": [
    {
      "tenantId": "tenant-1-id",
      "tenantName": "La Poblanita",
      "tenantSlug": "lapoblanita",
      "orders": 150,
      "gross": 4500.00
    }
  ],
  "tenantActivity": [
    {
      "tenantId": "tenant-1-id",
      "tenantName": "La Poblanita",
      "tenantSlug": "lapoblanita",
      "lastOrderAt": "2025-01-08T10:30:00.000Z",
      "lastOrderAmount": 45.99
    }
  ],
  "estimatedStripeVolume": 15000.00
}
```

### Expected Status: **200 OK**

### Validation Checklist
- [ ] Returns correct total orders count
- [ ] Returns correct total tenants count
- [ ] 7-day volume includes only recent orders
- [ ] All-time volume includes all orders
- [ ] Tenant activity shows last order info
- [ ] Estimated Stripe volume is sum of all orders
- [ ] Returns 401 if not super admin

---

## 🧪 Full Integration Test Flow

### Complete CRUD Cycle

```bash
# 1. Get all tenants
echo "1. GET all tenants"
curl -b cookies.txt http://localhost:3000/api/super/tenants | jq '.'

# 2. Create new tenant with demo seed
echo "2. CREATE new tenant"
TENANT_ID=$(curl -b cookies.txt -X POST http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Integration Test Restaurant",
    "slug": "integration-test",
    "contactEmail": "test@integration.com",
    "seedDemo": true,
    "templateId": "pizza"
  }' | jq -r '.id')

echo "Created tenant ID: $TENANT_ID"

# 3. Update the tenant
echo "3. UPDATE tenant"
curl -b cookies.txt -X PATCH http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$TENANT_ID\",
    \"name\": \"Updated Integration Test\",
    \"isOpen\": false,
    \"platformPercentFee\": 0.04
  }" | jq '.'

# 4. Get metrics
echo "4. GET metrics"
curl -b cookies.txt http://localhost:3000/api/super/metrics | jq '.'

# 5. Delete the tenant
echo "5. DELETE tenant"
curl -b cookies.txt -X DELETE "http://localhost:3000/api/super/tenants?id=$TENANT_ID" | jq '.'

# 6. Verify deletion
echo "6. VERIFY deletion"
curl -b cookies.txt http://localhost:3000/api/super/tenants | jq ".[] | select(.id == \"$TENANT_ID\")"
# Should return nothing
```

---

## 📊 Test Results Template

```
Date: _______________
Tester: _______________

GET /api/super/tenants:
  [ ] Returns array of tenants
  [ ] All fields present
  [ ] Returns 401 for non-admin

POST /api/super/tenants:
  [ ] Creates basic tenant
  [ ] Seeds demo menu (taqueria)
  [ ] Seeds demo menu (coffee)
  [ ] Rejects duplicate slug
  [ ] Validates required fields

PATCH /api/super/tenants:
  [ ] Updates basic info
  [ ] Updates slug (with validation)
  [ ] Updates settings
  [ ] Updates integrations
  [ ] Returns 404 for invalid ID

DELETE /api/super/tenants:
  [ ] Deletes tenant
  [ ] Cascades to menu data
  [ ] Cascades to orders
  [ ] Returns 404 for invalid ID

GET /api/super/metrics:
  [ ] Returns correct counts
  [ ] 7-day volume accurate
  [ ] All-time volume accurate
  [ ] Tenant activity correct

Overall Result: [ ] PASS  [ ] FAIL

Notes:
________________________________________________________________
________________________________________________________________
```

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized

**Solution:**
```bash
# Login first and save cookies
curl -c cookies.txt -X POST http://localhost:3000/api/auth/signin/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"ernesto@alessacloud.com","password":"superadmin123"}'
```

### Issue: "Tenant not found" on PATCH

**Check:**
- Use correct tenant ID from GET request
- ID must be UUID format

### Issue: Cascade delete not working

**Check Prisma schema:**
```prisma
model MenuSection {
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}
```

All relations should have `onDelete: Cascade`

---

## 🔗 Related Documentation

- [Prisma Schema](../prisma/schema.prisma)
- [Super Admin Dashboard](../app/super-admin/page.tsx)
- [API Routes](../app/api/super/)

---

**Last Updated:** 2025-01-08
**Test Status:** ✅ Ready for testing
