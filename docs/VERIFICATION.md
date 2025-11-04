# Verification Checklist

Use this runbook to validate the ordering experience after syncing the latest changes.

> Quick start: `npm run verify:full` seeds demo data, runs lint/type checks, and reminds you of the manual QA below.

1. **Install & Compile**
   - `npm install`
   - `npx tsc --noEmit --skipLibCheck`
     - _Current note_: placeholder admin files (`components/admin/CustomerList.tsx`, `components/admin/MenuSectionsManager.tsx`) still contain unfinished markup and will trip the compiler until they are cleaned up.

2. **Lint**
   - `npm run lint`
     - _Current note_: the same placeholder admin files surface parsing errors. Once those components are finished or removed, linting should pass with the new root config (`.eslintrc.js`).

3. **Seed & Database**
   - `npm run db:seed` to pull in the updated membership, upsell, and accessibility defaults.

4. **Manual QA**
   - `npm run dev` and visit `/order`.
     - Confirm layout toggles respond across mobile and desktop breakpoints.
     - Toggle accessibility controls, reload, and verify preferences persist (and are written for logged-in customers).
     - Add items to cart, ensure dynamic upsells populate from admin settings, and check the loyalty points banner updates with the subtotal.
     - Place a demo order and confirm loyalty points accrue in the database (`Customer.loyaltyPoints`).
   - Open `/admin/settings` and verify membership tiers, upsell bundles, and accessibility defaults can be edited and saved.

Keep this checklist in sync as additional validations are automated.
