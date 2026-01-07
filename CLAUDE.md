# Alessa Ordering - Claude Code Instructions

## CRITICAL: VPS-ONLY BUILD RULE

**NEVER run these commands locally:**
- `npm run build`
- `npm run dev`
- `npm run start`
- `npx prisma db push`
- `npx prisma migrate`
- `npx next dev`

**ALL builds and database commands happen on VPS only:**
```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && npm run build"
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && npx prisma db push"
ssh root@77.243.85.8 "pm2 restart alessa-ordering --update-env"
```

**Local machine is ONLY for:**
- Editing code
- Git operations
- Type checking (`npx tsc --noEmit`)
- Linting (`npx eslint`)
- Running scripts with `npx tsx`

## Deployment Workflow

1. Edit code locally
2. `git add . && git commit -m "message"`
3. `git push origin main`
4. SSH to VPS: `ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git pull && npm run build && pm2 restart alessa-ordering --update-env"`

## Multi-Tenant Architecture

This is a **multi-tenant SaaS platform**. Each tenant (restaurant) is isolated by:
- Database: `tenantId` column on all records
- Middleware: Resolves tenant from subdomain/custom domain
- Theme: `lib/tenant-theme-map.ts` with per-tenant branding

### Adding a New Tenant

1. Add to `lib/tenant-theme-map.ts`:
```typescript
newtenant: {
  slug: 'newtenant',
  name: 'New Restaurant',
  primaryColor: '#...',
  secondaryColor: '#...',
  themeColor: '#...',
  hasCustomIcons: false, // Set true if /tenant/newtenant/icons exists
  assets: {
    hero: '/tenant/newtenant/hero.jpg',
    membership: '/tenant/newtenant/membership.jpg',
    logo: '/tenant/newtenant/logo.png',
  },
},
```

2. Create tenant in database via admin panel or API

3. Add assets to `/public/tenant/newtenant/`

**DO NOT:**
- Hard-code tenant slugs in logic
- Add to arrays like `['lasreinas', 'lapoblanita']`
- Use one tenant's assets as fallback for others

## Key Files

- `middleware.ts` - Tenant resolution
- `lib/tenant-theme-map.ts` - Static theme config
- `lib/order-service.ts` - Order creation with notifications
- `lib/notifications/fulfillment.ts` - Email templates
- `lib/printer-dispatcher.ts` - Receipt printing

## Current Tenants

| Slug | Name | Domain |
|------|------|--------|
| lasreinas | Las Reinas Taqueria | lasreinascolusa.com |
| lapoblanita | La Poblanita Mexican Food | lapoblanita.alessacloud.com |
| villacorona | Villa Corona | villacorona.alessacloud.com |
| elhornito | El Hornito Bakery | (sub-tenant of lapoblanita) |
| taqueriarosita | Taqueria Rosita | taqueriarosita.alessacloud.com |

## VPS Details

- IP: 77.243.85.8
- User: root
- App path: /var/www/alessa-ordering
- Process manager: PM2 (process name: alessa-ordering)
- Database: PostgreSQL (local)
