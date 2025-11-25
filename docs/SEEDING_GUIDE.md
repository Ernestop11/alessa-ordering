# Tenant Seeding Guide

## Quick Start

### Seed All Three Restaurants
```bash
./scripts/seed-all-tenants.sh
```

### Seed Individual Restaurant
```bash
node scripts/seed-tenant.mjs \
  --slug=lasreinas \
  --input=scripts/seed-data/lasreinas.json \
  --domain=lasreinas.alessa.com \
  --force
```

## What You Need to Do

### 1. Extract Data from Websites

For each website, extract:

**From lasreinascolusa.com:**
- [ ] Restaurant name (exact)
- [ ] Logo image URL
- [ ] Hero images
- [ ] Contact email, phone, address
- [ ] Menu items with prices
- [ ] Brand colors (primary/secondary)
- [ ] Social media handles
- [ ] Operating hours

**From taqueriarosita.com:**
- [ ] Same as above

**From villacoronacatering.com:**
- [ ] Same as above (catering-specific: packages, minimum orders)

### 2. Update Seed Files

Edit these files with actual data:
- `scripts/seed-data/lasreinas.json`
- `scripts/seed-data/taqueriarosita.json`
- `scripts/seed-data/villacoronacatering.json`

### 3. Run Seeding

```bash
# Seed all at once
./scripts/seed-all-tenants.sh

# Or individually
node scripts/seed-tenant.mjs --slug=lasreinas --input=scripts/seed-data/lasreinas.json --domain=lasreinas.alessa.com --force
node scripts/seed-tenant.mjs --slug=taqueriarosita --input=scripts/seed-data/taqueriarosita.json --domain=taqueriarosita.alessa.com --force
node scripts/seed-tenant.mjs --slug=villacorona --input=scripts/seed-data/villacoronacatering.json --domain=villacorona.alessa.com --force
```

### 4. Review in Super Admin

1. Go to `/super-admin`
2. Check all three tenants appear
3. Preview each storefront
4. Update status to `READY_FOR_APPROVAL` when ready

## Subdomains Created

- `lasreinas.alessa.com` → Las Reinas Colusa
- `taqueriarosita.alessa.com` → Taqueria Rosita  
- `villacorona.alessa.com` → Villa Corona Catering

## Next Steps After Seeding

1. **Review & Polish**
   - Update menu items with real data
   - Add actual logo/hero images
   - Verify contact information

2. **Client Approval**
   - Share preview URLs
   - Collect feedback
   - Make adjustments

3. **Onboard to SaaS**
   - Connect Stripe (tenant admin dashboard)
   - Connect DoorDash (tenant admin dashboard)
   - Configure printer (tenant admin dashboard)

4. **Go Live**
   - Change status to `LIVE` in super admin
   - Tenant is live!

## DoorDash Production Keys

**Yes, you need production credentials for launch.**

See `docs/DOORDASH_PRODUCTION.md` for details.

Current credentials are **sandbox** - you'll need to:
1. Request production credentials from DoorDash
2. Update environment variables
3. Set `DOORDASH_SANDBOX=false` for production

