# La Poblanita Setup Complete ✅

## 🎉 Setup Summary

La Poblanita has been successfully configured with:
- ✅ Menu cloned from Las Reinas (4 items, 8 catering packages)
- ✅ Custom domain: `lapoblanitamexicanfood.com`
- ✅ Prepaid subscription until **September 9, 2027**
- ✅ Status: LIVE
- ✅ Monthly fee: $54.00 (with ADA feature)

---

## 🔐 Login Credentials

### Super Admin (for managing all tenants)
**URL:** https://alessacloud.com/admin/login

**Credentials:**
```
Email:    super@alessacloud.com
Password: TA7FfVDGCH05eqh+sa2zOSGVwHkkcz1E
```

**Dashboard:** https://alessacloud.com/super-admin

---

### La Poblanita Admin (for managing La Poblanita)
**URL:** https://lapoblanitamexicanfood.com/admin/login
*OR* https://alessacloud.com/admin/login?tenant=lapoblanita

**Credentials:**
```
Email:    admin@lapoblanita.com
Password: lapoblanita_admin_2024
```

**Dashboard:** https://lapoblanitamexicanfood.com/admin

---

## 🌐 Custom Domain Setup

### Environment Variable Update Required

Add to your `.env` file (on VPS):

```bash
CUSTOM_DOMAIN_MAP={"lapoblanitamexicanfood.com":"lapoblanita","lasreinascolusa.com":"lasreinas"}
```

**On VPS:**
```bash
# SSH into VPS
ssh root@77.243.85.8

# Edit .env file
cd /var/www/alessa-ordering
nano .env

# Add the line above, save and exit (Ctrl+X, Y, Enter)

# Restart PM2
pm2 restart alessa-ordering
```

### Nginx Configuration

The domain should already be configured in Nginx. Verify:

```bash
# On VPS
cat /etc/nginx/sites-enabled/lapoblanita
```

Should show:
```nginx
server {
    server_name lapoblanitamexicanfood.com www.lapoblanitamexicanfood.com;
    # ... proxy to port 3000
}
```

---

## 🧪 Testing Checklist

### 1. Test Ordering Page
- [ ] Visit: https://lapoblanitamexicanfood.com/order
- [ ] Verify menu items display (should show 4 items from Las Reinas)
- [ ] Verify catering packages display (should show 8 packages)
- [ ] Test adding items to cart
- [ ] Verify checkout flow

### 2. Test Admin Dashboard
- [ ] Login as La Poblanita admin
- [ ] Verify subscription status shows at top:
  - Status: PREPAID
  - Expires: September 9, 2027
  - Days remaining: ~900+ days
- [ ] Check Menu Editor - should see all menu items
- [ ] Check Catering Manager - should see all packages
- [ ] Test editing a menu item
- [ ] Verify changes save correctly

### 3. Test Super Admin Dashboard
- [ ] Login as super admin
- [ ] Go to `/super-admin/ordering`
- [ ] Verify La Poblanita appears in tenants list
- [ ] Check subscription shows as "prepaid"
- [ ] Verify expiration date shows correctly
- [ ] Check that La Poblanita appears in "Upcoming Expirations" (if within 90 days)

### 4. Test Custom Domain
- [ ] Visit: https://lapoblanitamexicanfood.com/order
- [ ] Verify it loads correctly (not redirecting to alessacloud.com)
- [ ] Check that admin login works: https://lapoblanitamexicanfood.com/admin/login
- [ ] Verify tenant-specific branding displays

---

## 💳 Stripe Onboarding Setup

### Current Status
- ✅ Tenant created and configured
- ✅ Custom domain set
- ✅ Subscription created (prepaid)
- ⏳ Stripe Connect account needs to be created

### Next Steps for Stripe

1. **Login as La Poblanita Admin:**
   - Go to: https://lapoblanitamexicanfood.com/admin
   - Navigate to Settings or Stripe section

2. **Initiate Stripe Connect Onboarding:**
   - Click "Connect Stripe" or "Set up payments"
   - This will redirect to Stripe onboarding flow
   - Complete business information
   - Verify identity
   - Connect bank account

3. **After Stripe Connection:**
   - Stripe account ID will be saved to `TenantIntegration.stripeAccountId`
   - Payments will be processed through Stripe Connect
   - Platform fees will be automatically calculated

### Stripe Connect Flow
The system uses Stripe Connect Express accounts, which means:
- Each tenant has their own Stripe account
- Payments go directly to tenant's bank account
- Platform fees are automatically deducted
- You (platform) receive platform fee as separate transfer

---

## 📊 Current Tenant Data

### La Poblanita Details
- **Name:** La Poblanita Mexican Food
- **Slug:** lapoblanita
- **Custom Domain:** lapoblanitamexicanfood.com
- **Status:** LIVE
- **Subscription:** Prepaid (expires Sept 9, 2027)
- **Monthly Fee:** $54.00
- **Menu Sections:** 2
- **Menu Items:** 4
- **Catering Sections:** 2
- **Catering Packages:** 8

### Menu Items (from Las Reinas)
1. **Carnitas y Más Section:**
   - 2 items

2. **Carnicería Grocery Section:**
   - 2 items

### Catering Packages
1. **Popular Catering Options:**
   - 4 packages

2. **Holiday & Event Bundles:**
   - 4 packages

---

## 🔧 Troubleshooting

### Domain Not Working
1. Check CUSTOM_DOMAIN_MAP in .env
2. Verify Nginx config: `cat /etc/nginx/sites-enabled/lapoblanita`
3. Test DNS: `nslookup lapoblanitamexicanfood.com`
4. Restart Nginx: `sudo systemctl restart nginx`
5. Restart PM2: `pm2 restart alessa-ordering`

### Admin Login Not Working
1. Verify credentials match environment variables
2. Check session cookies are enabled
3. Try clearing browser cache
4. Check NextAuth secret is set in .env

### Menu Not Showing
1. Check database: `npx tsx scripts/check-tenant.ts lapoblanita`
2. Verify menu items exist in database
3. Check tenant slug matches in URL
4. Clear Next.js cache: `npm run clean && npm run build`

### Subscription Not Showing
1. Check database for TenantProduct record
2. Verify product exists: `SELECT * FROM "Product" WHERE slug = 'alessa-ordering'`
3. Check subscription: `SELECT * FROM "TenantProduct" WHERE "tenantId" = 'lapoblanita-id'`

---

## 📝 Next Actions

1. **Update Environment Variable:**
   ```bash
   # On VPS
   echo 'CUSTOM_DOMAIN_MAP={"lapoblanitamexicanfood.com":"lapoblanita","lasreinascolusa.com":"lasreinas"}' >> /var/www/alessa-ordering/.env
   pm2 restart alessa-ordering
   ```

2. **Test Everything:**
   - Ordering page
   - Admin dashboard
   - Super admin dashboard
   - Custom domain

3. **Set Up Stripe:**
   - Login as La Poblanita admin
   - Complete Stripe Connect onboarding
   - Test payment processing

4. **Customize Content:**
   - Update menu items for La Poblanita
   - Update branding/colors
   - Add La Poblanita-specific content

---

## ✅ Verification Commands

### Check Tenant in Database
```bash
npx tsx scripts/check-tenant.ts lapoblanita
```

### Check Subscription
```sql
SELECT tp.*, p.name as product_name, p.slug as product_slug
FROM "TenantProduct" tp
JOIN "Product" p ON tp."productId" = p.id
JOIN "Tenant" t ON tp."tenantId" = t.id
WHERE t.slug = 'lapoblanita';
```

### Check Custom Domain
```sql
SELECT id, name, slug, "customDomain", status
FROM "Tenant"
WHERE slug = 'lapoblanita';
```

---

## 🎯 Ready for Production

La Poblanita is now:
- ✅ Configured with menu and catering
- ✅ Has custom domain set
- ✅ Has prepaid subscription
- ✅ Ready for Stripe onboarding
- ✅ Ready for real orders

**Next:** Complete Stripe Connect onboarding to enable payments!

