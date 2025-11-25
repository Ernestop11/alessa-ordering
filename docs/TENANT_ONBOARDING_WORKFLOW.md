# Tenant Onboarding Workflow

## Overview
This document outlines the complete workflow for onboarding new restaurant tenants from their existing websites to Alessa Cloud SaaS platform.

## Step 1: Data Extraction & Seed File Creation

### Option A: Use Scraping Helper (Recommended)
```bash
# Generate seed template from website
node scripts/scrape-website-data.mjs --url=https://lasreinascolusa.com --output=scripts/seed-data/lasreinas.json --slug=lasreinas
```

### Option B: Manual Creation
1. Visit the restaurant's website
2. Extract the following:
   - **Branding**: Logo URL, hero images, brand colors (use browser dev tools)
   - **Contact**: Email, phone, full address
   - **Menu**: Sections, items, descriptions, prices, images
   - **Social**: Instagram, Facebook handles/URLs
   - **Hours**: Operating hours for each day
3. Update the seed JSON file in `scripts/seed-data/`

## Step 2: Initial Seeding (Prototype/Showcase)

```bash
# Seed individual tenant
node scripts/seed-tenant.mjs \
  --slug=lasreinas \
  --input=scripts/seed-data/lasreinas.json \
  --domain=lasreinas.alessa.com \
  --force

# Or seed all at once
./scripts/seed-all-tenants.sh
```

**Result**: Tenant created with status `PENDING_REVIEW` at `{slug}.alessa.com`

## Step 3: Review & Approval Process

### In Super Admin Dashboard (`/super-admin`)

1. **Review Tenant**
   - Check tenant appears in tenant list
   - Status shows "Pending Review"
   - Click tenant to view details

2. **Preview Storefront**
   - Click "Preview storefront" link
   - Verify branding, menu, contact info
   - Test ordering flow (test mode)

3. **Update Status**
   - If ready for client review: Change status to `READY_FOR_APPROVAL`
   - Add status notes: "Ready for client walkthrough"

4. **Client Approval**
   - Share preview URL with restaurant owner
   - Collect feedback and make adjustments
   - Once approved: Change status to `APPROVED`

## Step 4: SaaS Onboarding (Post-Approval)

Once tenant is `APPROVED`, proceed with:

### 4.1 Stripe Connect Onboarding
- Tenant clicks "Connect Stripe" in their admin dashboard
- Completes Stripe Express onboarding
- Stripe account ID saved automatically

### 4.2 DoorDash Onboarding
- Tenant clicks "Connect DoorDash" in admin dashboard
- Enters their DoorDash Drive store ID
- Connection status saved

### 4.3 Printer Setup
- Tenant configures printer settings
- Tests auto-print functionality

### 4.4 DNS & Custom Domain (Optional)
- If tenant wants custom domain (e.g., `lasreinascolusa.com`):
  1. Update tenant record: `customDomain: "lasreinascolusa.com"`
  2. Configure DNS: CNAME `lasreinascolusa.com` → `lasreinas.alessa.com`
  3. Platform handles routing automatically

## Step 5: Go Live

1. **Final Checks**
   - All integrations connected (Stripe, DoorDash, Printer)
   - Menu verified and complete
   - Operating hours correct
   - Contact info accurate

2. **Change Status to LIVE**
   - In Super Admin, change status from `APPROVED` → `LIVE`
   - Tenant storefront goes live
   - Orders can be placed

3. **Handoff to Tenant**
   - Provide admin dashboard access
   - Share login credentials
   - Provide onboarding documentation

## Status Flow

```
PENDING_REVIEW → READY_FOR_APPROVAL → APPROVED → LIVE
     ↓                ↓                  ↓         ↓
  Initial seed    Client review    Integrations  Live!
```

## Quick Reference

### Seed File Locations
- `scripts/seed-data/lasreinas.json`
- `scripts/seed-data/taqueriarosita.json`
- `scripts/seed-data/villacoronacatering.json`

### Subdomains (Prototype)
- `lasreinas.alessa.com`
- `taqueriarosita.alessa.com`
- `villacorona.alessa.com`

### Super Admin Actions
- View: `/super-admin`
- Edit tenant: Click tenant → Edit form
- Change status: Use status dropdown or quick actions
- Preview: Click "Preview storefront" button

## Troubleshooting

### Seed Script Fails
- Check JSON syntax: `cat scripts/seed-data/{slug}.json | jq .`
- Verify all required fields present
- Check for duplicate slugs

### Images Not Loading
- Verify image URLs are accessible
- Check if URLs need authentication
- Script downloads images automatically to `/public/uploads/`

### Status Not Updating
- Refresh super admin page
- Check browser console for errors
- Verify database connection

