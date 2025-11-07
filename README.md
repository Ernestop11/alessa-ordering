# alessa-ordering

## Architecture Overview

- **Next.js 14 App Router** powers the multi-tenant storefront (`/order`), customer portal, admin dashboard, and super-admin provisioning flows. The active tenant is inferred per request by `middleware.ts` and `requireTenant` in `lib/tenant.ts`.
- **Prisma + PostgreSQL** persist tenants, menus, customers, orders, and integration flags (`prisma/schema.prisma`). `npm run db:seed` bootstraps three demo restaurants whose assets live under `public/tenant/<slug>`.
- **Stripe Connect + platform fees** flow through `/api/admin/stripe/connect/*`, `/api/admin/stripe/onboard`, `/api/payments/intent`, and `/api/payments/webhook`. Implementation notes and test scripts live in `docs/STRIPE_CONNECT_SETUP.md` and `STRIPE_KEY_ISSUE.md`.
- **Operational REST APIs** under `app/api/**` back the admin dashboards (`components/admin/*`), fulfillment views (`components/fulfillment/*`), and customer experiences (`components/order/*`, `components/Cart*.tsx`). Logs land in the `IntegrationLog` table for auditing.

## Project Structure

- `app/` – App Router routes for storefront, customer auth, admin, super-admin, and every REST endpoint (`app/api/**`).
- `components/` – Shared UI plus scope-specific widgets (cart + checkout, tenant theming, admin settings, fulfillment boards).
- `lib/` – Service layer (Prisma client, tenant helpers, Stripe client, order/tax/printer utilities, Zustand stores).
- `prisma/` – Database schema + seeding logic; run `npm run db:setup` for a clean local Postgres.
- `public/tenant/<slug>/` – Brand assets resolved per tenant (logos, hero images, gallery art).
- `scripts/` – Deployment helpers (`scripts/deploy.sh` → Hostinger/PM2), database/setup automation, verification tooling.
- `docs/` – Ops guides (database isolation, tenant DNS, Stripe plans/testing, QA checklist) used by support and provisioning teams.

## Outstanding TODOs

1. Wire production email/SMS providers for the customer OTP flow (the API now queues messages and only exposes codes in dev).
2. Replace the mocked integrations (`/api/delivery`, `/api/admin/notify`) with real DoorDash Drive quotes and notification providers.
3. Harden deployment by configuring production environment variables, enabling HTTPS-only cookies, and aligning the docs/VERIFICATION.md notes with the current admin implementation.

## Routes & Integrations Snapshot

- **Storefront & Customer**
  - `/order` renders the branded menu (`components/order/OrderPageClient.tsx`).
  - `/customer/login` + `/customer/orders` handle OTP login and history; codes are delivered via email/SMS with a dev-only fallback.
- **Admin Experiences**
  - `/admin` dashboard tabs (orders, customers, menu, settings) with a live fulfillment board at `/admin/fulfillment`.
  - `/admin/settings` manages tenant branding, fees, Stripe Connect, and Clover auto-print toggles.
- **Super Admin**
  - `/super-admin` manages tenants, manual Stripe/Clover credentials, and operational switches (open/closed, notifications, print-on-new-order).
  - `/super-admin/fulfillment` mirrors the fulfillment board across tenants.
- **APIs**
  - Core data endpoints live under `/api/menu`, `/api/orders`, `/api/customer/preferences`, and `/api/admin/*`.
  - Platform-level control flows through `/api/super/tenants`, `/api/super/metrics`, and fulfillment SSE streams for both admin scopes.
- **Pending Integrations**
  - Delivery quotes, notifications, and Apple Pay validation are stubbed with TODOs.
  - Customer OTP delivery currently logs/queues messages; replace with a production provider.
  - Apple Pay + third-party delivery pricing need production credentials before go-live.

## Development Notes

- Set `CUSTOMER_LOGIN_DEBUG_TOKEN=true` (defaulted in `.env.example`) when working locally to see OTP codes in API responses and console output. Leave this unset in staging/production so codes are only delivered via email or SMS.
- Admin dashboard lives at `/admin` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`), while the tenant-wide control center lives at `/super-admin` (`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`). Use `/admin/login` or `/super-admin` to authenticate.
- Orders move through the lifecycle `pending → confirmed → preparing → ready → completed`. Stripe webhooks mark payments as `confirmed`; operators should advance orders through the remaining states from the dashboard or fulfillment board.
- Run the smoke suite with `npm run test:smoke`. It compiles TypeScript helpers and executes assertions that cover checkout payload normalization and customer login masking.
- See `docs/STRIPE_TESTING.md` for Stripe test-mode card scenarios, webhook setup, and Apple Pay simulation notes.
- Update tenant branding by swapping the files under `public/tenant/<slug>/` (for example, replace `public/tenant/lapoblanita/logo.png` with the latest logo). Prisma seeds reference those paths automatically.
- The admin settings view lets you upload a logo, hero background, and hero gallery images (stored under `/uploads`). Menu items now support a primary image plus gallery carousel via the Menu editor.

## Super Admin Operations

1. Sign into `/super-admin` with the super admin credentials from your environment configuration.
2. Review the tenant list: status badges surface whether a restaurant is open, connected to Stripe, auto-printing, or has notifications disabled.
3. When creating a new tenant, supply the base profile and optionally seed demo content. After creation, edit the tenant to connect Stripe (account onboarding link in the admin dashboard) and configure Clover/notification settings as needed.
4. Use the “Performance Highlights” card to monitor volume across tenants and spot inactive locations.

## Hosting & Deployment

- Local dev assumes `DATABASE_URL` points at the isolated Postgres described in `docs/DATABASE_SETUP.md`; production deployments should mirror that topology (no MongoDB dependencies remain).
- `scripts/deploy.sh` rsyncs the workspace to `/var/www/alessa-ordering`, installs production deps, builds the app, and reloads PM2 (`ecosystem.config.js` runs `npm start` from the app directory with `NODE_ENV=production`).
- Tenants resolve under `ROOT_DOMAIN` (default `alessacloud.com`) or `?tenant=` query overrides in dev. Update DNS so `slug.<root>` points to the Hostinger/VPS IP and ensure reverse proxies forward the `Host` header for middleware-based routing.
- Stripe secrets (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_ONBOARD_*_URL`) plus admin credentials must be injected on the server before running `pm2 start`.
