# Template Seeds QA Guide

## 📋 Overview

This document provides comprehensive testing procedures for all 5 restaurant templates with demo seed data.

**Templates to Test:**
1. 🌮 Taqueria - Mexican restaurant
2. 🍞 Panadería - Bakery
3. ☕ Coffee - Coffee shop
4. 🍕 Pizza - Pizzeria
5. 🛒 Grocery - Grocery store

---

## 🎯 Testing Objectives

For each template, verify:
- ✅ Menu sections are created correctly
- ✅ Menu items are populated with accurate data
- ✅ Prices, descriptions, and categories are correct
- ✅ Template-specific branding is applied (optional future enhancement)
- ✅ All data displays correctly on order page

---

## 1️⃣ Taqueria Template

### Template Configuration

**Template ID:** `taqueria`

**Menu Structure:**
- **3 Sections**
- **8 Total Items**

### Expected Sections & Items

#### Section 1: Tacos (FOOD)
| Item Name | Description | Price | Category |
|-----------|-------------|-------|----------|
| Carne Asada Taco | Grilled beef with onions and cilantro | $3.99 | tacos |
| Al Pastor Taco | Marinated pork with pineapple | $3.99 | tacos |
| Carnitas Taco | Slow-cooked pork | $3.99 | tacos |
| Birria Tacos | Crispy tacos with consommé dip | $16.49 | tacos |

#### Section 2: Burritos (FOOD)
| Item Name | Description | Price | Category |
|-----------|-------------|-------|----------|
| Beef Burrito | Large burrito with beef, rice, beans, and cheese | $8.99 | burritos |
| Chicken Burrito | Large burrito with chicken, rice, beans, and cheese | $8.99 | burritos |

#### Section 3: Beverages (BEVERAGE)
| Item Name | Description | Price | Category |
|-----------|-------------|-------|----------|
| Horchata | Traditional rice drink with cinnamon | $2.99 | beverages |
| Jamaica | Hibiscus tea | $2.99 | beverages |

### Test Procedure

#### Step 1: Create Tenant with Taqueria Template

**Via API:**
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Taqueria",
    "slug": "test-taqueria-'$(date +%s)'",
    "contactEmail": "test@taqueria.com",
    "seedDemo": true,
    "templateId": "taqueria"
  }' | jq '.'
```

**Via Super Admin UI:**
1. Go to https://alessacloud.com/super-admin
2. Click "Onboard New Tenant"
3. Fill in:
   - **Name:** Test Taqueria
   - **Slug:** test-taqueria
   - **Email:** test@taqueria.com
   - **Template:** Taqueria ✓ Seed Demo
4. Submit

#### Step 2: Verify Menu Sections

**Via Database:**
```sql
SELECT
  ms.name,
  ms.type,
  ms.description,
  ms.position,
  COUNT(mi.id) as item_count
FROM menu_section ms
LEFT JOIN menu_item mi ON ms.id = mi.menu_section_id
WHERE ms.tenant_id = (SELECT id FROM tenant WHERE slug = 'test-taqueria')
GROUP BY ms.id
ORDER BY ms.position;
```

**Expected Output:**
```
name      | type     | description                  | position | item_count
----------|----------|------------------------------|----------|------------
Tacos     | FOOD     | Authentic Mexican tacos      | 0        | 4
Burritos  | FOOD     | Large burritos with...       | 1        | 2
Beverages | BEVERAGE | Refreshing drinks            | 2        | 2
```

#### Step 3: Verify Menu Items

**Via Database:**
```sql
SELECT
  ms.name as section,
  mi.name,
  mi.description,
  mi.price,
  mi.category,
  mi.available
FROM menu_item mi
JOIN menu_section ms ON mi.menu_section_id = ms.id
WHERE mi.tenant_id = (SELECT id FROM tenant WHERE slug = 'test-taqueria')
ORDER BY ms.position, mi.name;
```

**Expected:** 8 items total matching table above

#### Step 4: Visual Verification

1. **Visit Order Page:**
   - Go to `https://test-taqueria.alessacloud.com/order`

2. **Check Display:**
   - [ ] 3 sections visible: Tacos, Burritos, Beverages
   - [ ] All 8 items display correctly
   - [ ] Prices formatted correctly ($3.99, $8.99, etc.)
   - [ ] Descriptions are readable
   - [ ] Items marked as available
   - [ ] No missing images (placeholder images OK)

3. **Test Functionality:**
   - [ ] Can add items to cart
   - [ ] Prices calculate correctly
   - [ ] Can complete checkout flow

### Screenshots to Capture

1. **Super Admin - Onboarding Form** (Template selection)
2. **Super Admin - Tenant List** (Created tenant)
3. **Order Page - Full Menu** (All sections visible)
4. **Order Page - Tacos Section** (Close-up of taco items)
5. **Order Page - Cart with Items** (Items added to cart)

---

## 2️⃣ Panadería Template

### Template Configuration

**Template ID:** `panaderia`

**Menu Structure:**
- **1 Section**
- **4 Total Items**

### Expected Sections & Items

#### Section 1: Panadería (BAKERY)
| Item Name | Description | Price | Category |
|-----------|-------------|-------|----------|
| Conchas | Traditional Mexican sweet bread | $2.50 | bakery |
| Pan Dulce | Assorted sweet breads | $3.00 | bakery |
| Churros | Crispy fried dough with cinnamon sugar | $4.50 | bakery |
| Tres Leches Cake | Traditional three milk cake | $5.99 | bakery |

### Test Procedure

#### Step 1: Create Tenant

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Panadería",
    "slug": "test-panaderia-'$(date +%s)'",
    "contactEmail": "test@panaderia.com",
    "seedDemo": true,
    "templateId": "panaderia"
  }' | jq '.'
```

#### Step 2: Verify Database

```sql
-- Check section
SELECT name, type, description
FROM menu_section
WHERE tenant_id = (SELECT id FROM tenant WHERE slug LIKE 'test-panaderia%');

-- Check items (should be 4)
SELECT COUNT(*)
FROM menu_item
WHERE tenant_id = (SELECT id FROM tenant WHERE slug LIKE 'test-panaderia%');
```

**Expected:**
- 1 section: "Panadería" (BAKERY)
- 4 items: Conchas, Pan Dulce, Churros, Tres Leches Cake

#### Step 3: Visual Verification

- [ ] Visit order page
- [ ] 1 bakery section visible
- [ ] All 4 items display
- [ ] Prices: $2.50, $3.00, $4.50, $5.99
- [ ] Can add to cart and checkout

### Screenshots to Capture

1. **Order Page - Bakery Section**
2. **Order Page - Item Details**

---

## 3️⃣ Coffee Template

### Template Configuration

**Template ID:** `coffee`

**Menu Structure:**
- **2 Sections**
- **7 Total Items**

### Expected Sections & Items

#### Section 1: Coffee (BEVERAGE)
| Item Name | Description | Price | Category |
|-----------|-------------|-------|----------|
| Espresso | Single shot of espresso | $2.50 | coffee |
| Americano | Espresso with hot water | $3.00 | coffee |
| Cappuccino | Espresso with steamed milk and foam | $4.50 | coffee |
| Latte | Espresso with steamed milk | $4.75 | coffee |

#### Section 2: Pastries (BAKERY)
| Item Name | Description | Price | Category |
|-----------|-------------|-------|----------|
| Croissant | Buttery flaky pastry | $3.50 | pastries |
| Muffin | Fresh baked muffin | $3.00 | pastries |
| Scone | Traditional scone | $3.25 | pastries |

### Test Procedure

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Coffee Shop",
    "slug": "test-coffee-'$(date +%s)'",
    "seedDemo": true,
    "templateId": "coffee"
  }' | jq '.'
```

### Verification Checklist

- [ ] 2 sections: Coffee (BEVERAGE), Pastries (BAKERY)
- [ ] 4 coffee items
- [ ] 3 pastry items
- [ ] All prices correct
- [ ] Visual display works

### Screenshots to Capture

1. **Order Page - Coffee Section**
2. **Order Page - Pastries Section**
3. **Order Page - Full Menu**

---

## 4️⃣ Pizza Template

### Template Configuration

**Template ID:** `pizza`

**Menu Structure:**
- **2 Sections**
- **6 Total Items**

### Expected Sections & Items

#### Section 1: Pizza (FOOD)
| Item Name | Description | Price | Category |
|-----------|-------------|-------|----------|
| Margherita Pizza | Tomato, mozzarella, basil | $12.99 | pizza |
| Pepperoni Pizza | Pepperoni and mozzarella | $14.99 | pizza |
| Supreme Pizza | Pepperoni, sausage, peppers, onions | $16.99 | pizza |

#### Section 2: Sides (FOOD)
| Item Name | Description | Price | Category |
|-----------|-------------|-------|----------|
| Garlic Bread | Fresh baked with garlic butter | $4.99 | sides |
| Wings | Buffalo wings with your choice of sauce | $9.99 | sides |
| Caesar Salad | Fresh romaine with caesar dressing | $7.99 | sides |

### Test Procedure

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Pizzeria",
    "slug": "test-pizza-'$(date +%s)'",
    "seedDemo": true,
    "templateId": "pizza"
  }' | jq '.'
```

### Verification Checklist

- [ ] 2 sections: Pizza (FOOD), Sides (FOOD)
- [ ] 3 pizza items
- [ ] 3 side items
- [ ] Prices range from $4.99 to $16.99
- [ ] Visual display works

### Screenshots to Capture

1. **Order Page - Pizza Section**
2. **Order Page - Sides Section**
3. **Order Page - Cart with Pizza + Sides**

---

## 5️⃣ Grocery Template

### Template Configuration

**Template ID:** `grocery`

**Menu Structure:**
- **2 Sections**
- **6 Total Items**

### Expected Sections & Items

#### Section 1: Produce (GROCERY)
| Item Name | Description | Price | Category |
|-----------|-------------|-------|----------|
| Fresh Bananas | Organic bananas per lb | $1.99 | produce |
| Organic Tomatoes | Fresh organic tomatoes per lb | $3.99 | produce |
| Mixed Greens | Fresh salad mix | $4.99 | produce |

#### Section 2: Packaged Goods (GROCERY)
| Item Name | Description | Price | Category |
|-----------|-------------|-------|----------|
| Organic Pasta | 1 lb package | $3.99 | packaged |
| Olive Oil | Extra virgin olive oil 500ml | $8.99 | packaged |
| Canned Beans | Organic black beans | $2.99 | packaged |

### Test Procedure

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/super/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Grocery",
    "slug": "test-grocery-'$(date +%s)'",
    "seedDemo": true,
    "templateId": "grocery"
  }' | jq '.'
```

### Verification Checklist

- [ ] 2 sections: Produce (GROCERY), Packaged Goods (GROCERY)
- [ ] 3 produce items
- [ ] 3 packaged items
- [ ] Prices range from $1.99 to $8.99
- [ ] Visual display works

### Screenshots to Capture

1. **Order Page - Produce Section**
2. **Order Page - Packaged Goods Section**
3. **Order Page - Cart with Grocery Items**

---

## 🔄 Automated Verification Script

I've created an automated test script for all templates:

**Run:**
```bash
./scripts/test-template-seeds.sh
```

**What it tests:**
1. Creates tenant for each template
2. Verifies section count
3. Verifies item count
4. Checks item details (names, prices, categories)
5. Validates section types
6. Generates summary report

---

## 📊 Template Comparison Table

| Template | Sections | Items | Section Types | Price Range |
|----------|----------|-------|---------------|-------------|
| Taqueria | 3 | 8 | FOOD, BEVERAGE | $2.99 - $16.49 |
| Panadería | 1 | 4 | BAKERY | $2.50 - $5.99 |
| Coffee | 2 | 7 | BEVERAGE, BAKERY | $2.50 - $4.75 |
| Pizza | 2 | 6 | FOOD | $4.99 - $16.99 |
| Grocery | 2 | 6 | GROCERY | $1.99 - $8.99 |
| **Total** | **10** | **31** | **4 types** | **$1.99 - $16.99** |

---

## 📸 Screenshot Checklist

### For Each Template

**Required Screenshots:**
1. [ ] Super Admin - Onboarding form with template selected
2. [ ] Super Admin - Tenant list showing created tenant
3. [ ] Order Page - Full menu view
4. [ ] Order Page - Each section close-up
5. [ ] Order Page - Cart with items added
6. [ ] Order Page - Checkout screen (optional)

**Screenshot Naming Convention:**
```
template_<name>_<step>.png

Examples:
template_taqueria_onboarding.png
template_taqueria_menu_full.png
template_taqueria_section_tacos.png
template_taqueria_cart.png
```

**Recommended Tool:**
- macOS: Cmd+Shift+4 (select area)
- Windows: Win+Shift+S
- Browser DevTools: Cmd+Shift+P → "Screenshot"

---

## ✅ Final QA Checklist

### Template Functionality
- [ ] All 5 templates create tenants successfully
- [ ] Correct number of sections for each template
- [ ] Correct number of items for each template
- [ ] All prices are accurate
- [ ] All descriptions are complete
- [ ] Section types are correct (FOOD, BEVERAGE, BAKERY, GROCERY)
- [ ] Categories are properly assigned

### Data Integrity
- [ ] No duplicate items within templates
- [ ] All items have prices > 0
- [ ] All items are marked as available
- [ ] All sections have descriptions
- [ ] Position numbers are sequential (0, 1, 2...)

### Visual Display
- [ ] Items display correctly on order page
- [ ] Sections are properly organized
- [ ] Prices format correctly ($X.XX)
- [ ] Add to cart works for all items
- [ ] Checkout flow works

### Cleanup
- [ ] Test tenants can be deleted successfully
- [ ] Cascade delete removes all menu data
- [ ] No orphaned records in database

---

## 🐛 Common Issues & Solutions

### Issue: Section count mismatch

**Check:**
```sql
SELECT COUNT(*) FROM menu_section
WHERE tenant_id = (SELECT id FROM tenant WHERE slug = 'test-tenant');
```

**Solution:** Verify `TEMPLATE_SECTIONS` in [route.ts](../app/api/super/tenants/route.ts)

### Issue: Item count mismatch

**Check:**
```sql
SELECT ms.name, COUNT(mi.id)
FROM menu_section ms
LEFT JOIN menu_item mi ON ms.id = mi.menu_section_id
WHERE ms.tenant_id = (SELECT id FROM tenant WHERE slug = 'test-tenant')
GROUP BY ms.id;
```

**Solution:** Verify items array in template definition

### Issue: Items not displaying on order page

**Check:**
1. Tenant slug in URL matches database
2. Items marked as `available: true`
3. Menu sections have correct `tenantId`
4. Browser cache cleared

---

## 📝 Test Results Template

```
Date: _______________
Tester: _______________

Taqueria Template:
  [ ] 3 sections created
  [ ] 8 items created
  [ ] Prices correct
  [ ] Visual display OK
  [ ] Screenshots captured

Panadería Template:
  [ ] 1 section created
  [ ] 4 items created
  [ ] Prices correct
  [ ] Visual display OK
  [ ] Screenshots captured

Coffee Template:
  [ ] 2 sections created
  [ ] 7 items created
  [ ] Prices correct
  [ ] Visual display OK
  [ ] Screenshots captured

Pizza Template:
  [ ] 2 sections created
  [ ] 6 items created
  [ ] Prices correct
  [ ] Visual display OK
  [ ] Screenshots captured

Grocery Template:
  [ ] 2 sections created
  [ ] 6 items created
  [ ] Prices correct
  [ ] Visual display OK
  [ ] Screenshots captured

Overall Result: [ ] PASS  [ ] FAIL

Notes:
________________________________________________________________
________________________________________________________________
```

---

**Last Updated:** 2025-01-08
**QA Status:** ✅ Ready for testing
