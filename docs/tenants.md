# Tenant Onboarding Guide

This document explains how to provision a new restaurant tenant in the Alessa Cloud SaaS template.

## 1. Decide on Provisioning Mode

**Manual seeding (current)**
- Best for early-stage deployments with only a few tenants.
- You run `npm run db:seed` or craft custom seed data using Prisma to insert a `Tenant`, `TenantSettings`, `TenantIntegration`, and `MenuSection`/`MenuItem` records.
- DNS/subdomains are configured manually (e.g., `lapoblanita.alessacloud.com`).

**Automated provisioning (future)**
- Build an admin onboarding form that writes directly to Prisma and kicks off seed data for menu sections/items.
- Could integrate payments/plan selection (Stripe Connect Express onboarding).

## 2. Required Data Per Tenant

| Field | Description |
|-------|-------------|
| `name`, `slug` | Display name and slug (used in URLs). |
| `primaryColor`, `secondaryColor` | Colors for theme. |
| `heroTitle`, `heroSubtitle` | Copy for order page hero. |
| `logoUrl`, `heroImageUrl` | Branding assets rendered in UI. |
| Contact info | `contactEmail`, `contactPhone`, address fields. |
| `TenantSettings` | Tagline, social links, delivery radius, minimum order, time zone. |
| `TenantIntegration` | Apple Pay merchant ID, DoorDash details, platform fee %, Stripe Connect account ID. |
| Menu sections & items | Seed at least one section per business unit (e.g., restaurant, bakery). |

## 3. Manual Creation Steps

1. **Add tenant record**
   ```bash
   npx prisma studio
   ```
   Create a row in the `Tenant` table.

2. **Populate settings/integrations**
   - In Prisma Studio, open `TenantSettings` & `TenantIntegration`, create rows referencing the new tenant ID.

3. **Create menu sections/items**
   - Still in Prisma Studio, seed `MenuSection` + `MenuItem` rows.
   - Example sections: `Taqueria`, `Panadería`, `Mercado`.

4. **Seed via script** (optional)
   - Alternatively, copy the structure from `prisma/seed.js` and add a new entry to the `tenants` array.
   - Run: `npm run db:seed`

5. **Point DNS**
   - Configure `slug.alessacloud.com` to point to your Hostinger/VPS.
   - Update `ROOT_DOMAIN` env var if needed.

6. **Verify**
   - `npm run dev` locally or visit staging site with `?tenant=<slug>`.
   - Ensure admin dashboard shows the tenant data.

## 4. Future Automation Ideas

- Build an admin-only onboarding form that writes to Prisma and seeds default menu.
- Integrate Stripe billing for plan selection.
- Send welcome email to tenant admin with credentials.
- Provision preview menus from templates.

