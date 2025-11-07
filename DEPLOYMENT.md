# Deployment Configuration

## Database Setup

### Primary: PostgreSQL (Production + Local)

1. Follow `docs/DATABASE_SETUP.md` (or `scripts/setup-postgres-isolated.sh`) to provision a dedicated Postgres role/database (e.g., `alessa_ordering_user` + `alessa_ordering`).
2. Export the resulting `DATABASE_URL`, including `?schema=public`, into the environment (`.env`, Hostinger secrets, or `/etc/environment`).
3. From the project root run:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```
4. Confirm Prisma can reach the database with `npx prisma studio` or `npm run dev`.

### Optional: MongoDB (Legacy Support)

Older forks used MongoDB. If you still need it for transitional environments, keep the previous instructions handy:

1. Use MongoDB Atlas or self-hosted MongoDB 7.0.
2. Mirror the user/network hardening steps listed in `docs/DATABASE_SETUP.md`.
3. Update `DATABASE_URL` to the Mongo connection string and re-run Prisma migrations/seeds.

## Hostinger Deployment

1. In your Hostinger control panel:
   - Set up a new Node.js hosting
   - Configure your domain
   - Set up SSL certificate

2. Environment variables to set in Hostinger:
```
DATABASE_URL=postgresql://alessa_ordering_user:strongpass@localhost:5432/alessa_ordering?schema=public
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
NODE_ENV=production
```

3. Deploy command:
```bash
npm run build && npm start
```

## Printer & Receipt Automation

- Enable auto-printing from the admin dashboard (`Settings → Payments`). Choose **Bluetooth bridge** to target generic receipt printers or **Clover** for POS-native tickets.
- When using a Bluetooth bridge, provide either a direct HTTPS endpoint (`https://printer.local/print`) or a JSON payload with credentials:
  ```json
  {"endpoint":"https://printer.local/print","apiKey":"shared-secret","profile":"escpos-80mm"}
  ```
- Optional environment variables:
  - `BLUETOOTH_PRINTER_ENDPOINT` – global fallback endpoint when tenant configuration is blank.
  - `BLUETOOTH_PRINTER_API_KEY` / `PRINTER_SERVICE_API_KEY` – bearer tokens automatically attached to bridge requests.
- Each print job is logged to the `IntegrationLog` table with source `printer`. Review these logs to diagnose connectivity failures.

## Tax Automation

- Set the **Tax provider** under `Settings → Taxes`. The built-in engine uses the tenant default tax rate; external services compute real-time rates per order.
- For TaxJar:
  1. Generate a live API token in the TaxJar dashboard.
  2. Add it to the tenant configuration JSON (`{"apiKey":"taxjar_live_...","shippingTaxable":true}`) or set the global `TAXJAR_API_KEY` environment variable.
  3. Optional keys:
     - `nexusAddresses`: array of nexus locations (`[{ "country": "US", "state": "CA", "zip": "90001" }]`)
     - `defaultProductTaxCode`: fallback product code.
     - `shippingTaxable` / `surchargeTaxable`: booleans controlling whether delivery fees and platform surcharges are taxed.
- Orders automatically recalculate tax server-side during Stripe webhook completion. The `/api/tax/quote` endpoint powers live quotes on the checkout page and falls back to the configured default rate on failure.

## Backup Strategy

### For MongoDB Atlas:
- Automatic backups are included
- Set up additional backup alerts in Atlas

### For Self-hosted MongoDB:
1. Create backup script (/root/backup-mongo.sh):
```bash
#!/bin/bash
DATE=$(date +"%Y%m%d")
BACKUP_DIR="/var/backups/mongodb"
mkdir -p $BACKUP_DIR
mongodump --uri="mongodb://adminUser:password@localhost:27017/alessa-ordering" --out="$BACKUP_DIR/$DATE"
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

2. Set up cron job:
```bash
0 0 * * * /root/backup-mongo.sh
```

## Monitoring

1. Set up basic monitoring:
```bash
# Install monitoring tools
npm install --save-dev @next/bundle-analyzer
```

2. Add to your package.json:
```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

## CI/CD Setup (Optional)

1. Create Github Actions workflow:
```yaml
name: Deploy to Hostinger
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Hostinger
        uses: easingthemes/ssh-deploy@v2
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          TARGET: /path/to/your/app
```

## Progressive Web App (PWA)

- App icons live under `public/icons/` (`alessa-cloud-icon-192.png`, `alessa-cloud-icon-512.png`). Replace these placeholders with branded assets (192×192 and 512×512 PNG) for production.
- The PWA manifest is generated from `app/manifest.ts`. Adjust `theme_color`, `background_color`, and description as needed per tenant or deployment.
- `app/layout.tsx` references the manifest and icons. For full offline support, add a service worker (e.g., via `next-pwa`) once caching requirements are defined.

## Predeployment Checklist

- Run `npx prisma generate && npx prisma db push` to apply schema updates.
- Seed launch tenants when needed: `npm run db:seed`.
- Confirm admin tabs (Orders, Customers, Menu Sections, Menu, Settings) render correctly per tenant slug.
- Review integration logs via the Postgres `IntegrationLog` table when testing Apple Pay or delivery quotes.
- Update environment variables for Apple Pay and DoorDash Drive credentials before going live.

### Quick Deploy


```bash
./scripts/deploy.sh /var/www/alessa-ordering
```

The script syncs the workspace (excluding node_modules/.next), installs production dependencies, builds the Next.js app, and reloads the PM2 process defined in `ecosystem.config.js`.
