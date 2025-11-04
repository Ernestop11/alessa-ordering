# QA Checklist (Smoke Tests)

Run this checklist before shipping a new tenant or pushing to production.

## 1. Customer Experience
- [ ] `/order?tenant=<slug>` loads with tenant branding (hero text, colors, footer info).
- [ ] Adding items to cart updates subtotal and total with tax/fees.
- [ ] Delivery flow (if enabled) shows DoorDash quote and minimum order message.
- [ ] Checkout posts successfully and returns 201 (API `/api/orders`).
- [ ] Customer login flow ( `/customer/login`) sends mock token and `/customer/orders` renders order history after verification.

## 2. Admin Dashboard
- [ ] Admin login works (default credentials in documentation).
- [ ] “Customers” tab lists recent diners and opens mock notification.
- [ ] “Integration Logs” tab shows Apple Pay / DoorDash entries after generating them.
- [ ] Menu sections/editor reflect the tenant’s menu, allow CRUD.
- [ ] “Settings” saves branding, contact, and fee/tax values.

## 3. Backend
- [ ] `npx prisma migrate` (or `db push`) runs without errors.
- [ ] Seed script (`npm run db:seed`) succeeds for all tenant entries.
- [ ] Integration logs persist `source` + `payload` for test actions.
- [ ] Scripts (`scripts/deploy.sh`, `scripts/notify_admin.py`) run without runtime errors.

## 4. Deployment
- [ ] `.env` contains `DATABASE_URL`, `ROOT_DOMAIN`, `DEFAULT_TENANT_SLUG`, Apple Pay/DoorDash credentials.
- [ ] `npm run build` succeeds.
- [ ] PM2 reloads app (`pm2 reload ecosystem.config.js`).
- [ ] Reverse proxy / SSL config matches `ROOT_DOMAIN`.

