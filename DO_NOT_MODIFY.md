# ⛔ DO NOT MODIFY - ALESSA ORDERING CRITICAL CONFIGURATION

**IMPORTANT**: This application has a **DEDICATED, ISOLATED SETUP**. Do NOT make changes without explicit permission.

---

## 🚨 CRITICAL: Port Allocation

### ⛔ **PORT 4000 IS RESERVED FOR ALESSA-ORDERING**

```
┌─────────────────────────────────────────────────────────┐
│  PORT 4000 - ALESSA ORDERING (DEDICATED)                │
│  DO NOT USE THIS PORT FOR ANY OTHER APPLICATION         │
└─────────────────────────────────────────────────────────┘
```

**Current VPS Port Allocation**:
```
Port 3000: azteka-api (Vite preview server)
Port 4000: alessa-ordering (Next.js) ← THIS APP
Port 5432: PostgreSQL
```

### ❌ DO NOT:
- Change PORT in `ecosystem.config.js`
- Run any other service on port 4000
- Modify Nginx configs pointing to port 4000
- Stop or restart this PM2 process without permission
- Change the PM2 process name from `alessa-ordering`

---

## 🚨 CRITICAL: Database Isolation

### ⛔ **DATABASE: alessa_ordering (ISOLATED)**

```
┌─────────────────────────────────────────────────────────┐
│  Database:  alessa_ordering                              │
│  User:      alessa_ordering_user                         │
│  Password:  alessa_secure_2024                           │
│  DO NOT SHARE OR CROSS-CONTAMINATE WITH OTHER APPS       │
└─────────────────────────────────────────────────────────┘
```

**Database Layout**:
```
PostgreSQL (localhost:5432)
├── alessa_ordering    ← THIS APP (ISOLATED)
│   └── Owner: alessa_ordering_user
│
└── azteka_dsd         ← OTHER APP (DO NOT TOUCH)
    └── Owner: azteka_user
```

### ❌ DO NOT:
- Connect to `alessa_ordering` database from other apps
- Modify `DATABASE_URL` in `.env`
- Run migrations from other applications
- Share Prisma client with other apps
- Modify `/var/www/alessa-ordering/.env` on VPS

---

## 🚨 CRITICAL: Nginx Configuration

### ⛔ **NGINX CONFIGS ARE LOCKED**

**Files on VPS** (DO NOT MODIFY):
```
/etc/nginx/sites-enabled/lapoblanita
/etc/nginx/sites-enabled/alessacloud.com
/etc/nginx/sites-available/lapoblanita
/etc/nginx/sites-available/alessacloud.com
```

**Current Configuration**:
```nginx
# lapoblanitamexicanfood.com → Port 4000
location / {
    proxy_pass http://127.0.0.1:4000;  # DO NOT CHANGE
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# alessacloud.com → Port 4000
location / {
    proxy_pass http://127.0.0.1:4000;  # DO NOT CHANGE
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### ❌ DO NOT:
- Change `proxy_pass` port from 4000
- Modify SSL certificates
- Change server_name directives
- Add redirects without permission
- Reload Nginx without testing first

---

## 🚨 CRITICAL: PM2 Process Management

### ⛔ **PM2 PROCESS: alessa-ordering (NAMESPACE: alessa)**

**Current Status**:
```bash
Name:       alessa-ordering
Namespace:  alessa
Port:       4000
CWD:        /var/www/alessa-ordering
Script:     node_modules/next/dist/bin/next
Args:       start
Status:     online (0 restarts)
```

### ❌ DO NOT:
- Run `pm2 delete alessa-ordering`
- Run `pm2 stop alessa-ordering` (unless debugging)
- Change the ecosystem.config.js without permission
- Deploy without testing locally first
- Modify environment variables in PM2

### ✅ SAFE COMMANDS:
```bash
# View status only
pm2 status | grep alessa-ordering

# View logs only
pm2 logs alessa-ordering --lines 50

# Restart (if absolutely necessary)
pm2 restart alessa-ordering
```

---

## 🚨 CRITICAL: File System Isolation

### ⛔ **DIRECTORIES ARE ISOLATED**

**VPS Directory Structure**:
```
/var/www/alessa-ordering/          ← THIS APP (DO NOT TOUCH)
├── .env                            ← PRIVATE CONFIG
├── node_modules/@prisma/client    ← ISOLATED PRISMA
├── public/uploads/                ← UPLOADED IMAGES
└── ecosystem.config.js            ← PM2 CONFIG

/srv/azteka-dsd/                   ← OTHER APP (SEPARATE)
├── .env                            ← DIFFERENT CONFIG
└── node_modules/@prisma/client    ← DIFFERENT PRISMA
```

### ❌ DO NOT:
- Share node_modules between apps
- Symlink files from azteka-dsd
- Modify `/var/www/alessa-ordering/.env` directly
- Delete or move `/var/www/alessa-ordering/public/uploads/`
- Change file permissions on VPS

---

## 🚨 CRITICAL: Cache Configuration

### ⛔ **NEXT.JS CACHING IS DISABLED**

**Current Configuration in `app/order/page.tsx`**:
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
```

### ❌ DO NOT:
- Remove these cache directives
- Change to `export const dynamic = 'auto'`
- Add `revalidate > 0`
- Remove `fetchCache = 'force-no-store'`
- Add static generation

**WHY**: Admin panel updates must appear immediately on frontend. Caching breaks this.

---

## 🚨 CRITICAL: Deployment Process

### ⛔ **FOLLOW THIS EXACT PROCESS**

**Safe Deployment Steps**:
```bash
# 1. LOCAL: Test changes
npm run build
npm run start  # Test on http://localhost:3000

# 2. COMMIT: Save to git
git add .
git commit -m "your message"
git push origin main

# 3. VPS: Pull and deploy
ssh root@77.243.85.8
cd /var/www/alessa-ordering
git pull origin main
npm install
npm run build
pm2 restart alessa-ordering

# 4. VERIFY: Check status
pm2 status | grep alessa-ordering
pm2 logs alessa-ordering --lines 20
curl -I https://lapoblanitamexicanfood.com/order
```

### ❌ DO NOT:
- Deploy without testing locally
- Skip `npm run build`
- Use `pm2 delete` instead of `pm2 restart`
- Deploy during peak hours without warning
- Modify VPS files directly via SSH (always use git pull)

---

## 🚨 CRITICAL: Environment Variables

### ⛔ **ENV FILE IS SACRED**

**Local `.env`** (development):
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/alessa_ordering_dev?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[secret]"
```

**VPS `/var/www/alessa-ordering/.env`** (production):
```bash
DATABASE_URL="postgresql://alessa_ordering_user:alessa_secure_2024@localhost:5432/alessa_ordering?schema=public"
NEXTAUTH_URL="https://alessacloud.com"
NEXTAUTH_SECRET="[secret]"
NODE_ENV="production"
```

### ❌ DO NOT:
- Change DATABASE_URL to point to azteka_dsd
- Modify NEXTAUTH_URL
- Share .env files between apps
- Commit .env to git
- Use development .env in production

---

## 🚨 CRITICAL: Prisma Schema

### ⛔ **SCHEMA POINTS TO ISOLATED DATABASE**

**File**: `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // Points to alessa_ordering
}

generator client {
  provider = "prisma-client-js"
}
```

### ❌ DO NOT:
- Run `prisma migrate` without backing up database first
- Use `--skip-generate`
- Modify datasource URL directly
- Run migrations from azteka-dsd directory
- Delete `node_modules/@prisma/client` manually

### ✅ SAFE PRISMA COMMANDS:
```bash
# Local development
npx prisma migrate dev --name my_migration
npx prisma generate
npx prisma studio

# Production (VPS)
cd /var/www/alessa-ordering
npx prisma migrate deploy  # Apply migrations only
npx prisma generate        # Regenerate client
```

---

## 🚨 CRITICAL: Testing Checklist

### ⛔ **VERIFY THESE AFTER ANY CHANGE**

```bash
# 1. Check PM2 process is online
pm2 status | grep alessa-ordering
# Expected: online, 0 restarts

# 2. Check port 4000 is listening
lsof -i :4000
# Expected: PM2 process

# 3. Check database connection
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && npx prisma db pull"
# Expected: Success

# 4. Check Nginx is proxying correctly
curl -I https://lapoblanitamexicanfood.com/order
# Expected: HTTP/2 200

# 5. Check no errors in logs
pm2 logs alessa-ordering --lines 20
# Expected: No errors

# 6. Check uploads are accessible
curl -I https://lapoblanitamexicanfood.com/uploads/[filename]
# Expected: HTTP/2 200
```

---

## 🚨 ROLLBACK PROCEDURE

### ⛔ **IF SOMETHING BREAKS**

```bash
# 1. SSH to VPS
ssh root@77.243.85.8

# 2. Navigate to app directory
cd /var/www/alessa-ordering

# 3. Check git log
git log --oneline -n 5

# 4. Rollback to last working commit
git reset --hard [commit-hash]

# 5. Rebuild
npm install
npm run build

# 6. Restart PM2
pm2 restart alessa-ordering

# 7. Verify
pm2 logs alessa-ordering --lines 20
curl -I https://lapoblanitamexicanfood.com/order
```

---

## 🚨 EMERGENCY CONTACTS

**If you absolutely must make changes**:

1. **READ THIS FILE FIRST** ← You are here
2. **CHECK** [PRISMA_ISOLATION_REVIEW.md](./PRISMA_ISOLATION_REVIEW.md)
3. **CHECK** [PORT_ALLOCATION.md](./PORT_ALLOCATION.md) (if exists)
4. **TEST LOCALLY** before touching VPS
5. **BACKUP DATABASE** before migrations
6. **ASK FOR PERMISSION** from the project owner

---

## ⚠️ WARNING SIGNS

**These indicate you're about to break something**:

- ❌ Seeing "EADDRINUSE" for port 4000
- ❌ Seeing "Tenant not found" errors
- ❌ Seeing "Prisma Client" connection errors
- ❌ PM2 showing constant restarts
- ❌ Nginx returning 502 Bad Gateway
- ❌ Database returning "does not exist"

**If you see these**: STOP, ROLLBACK, ASK FOR HELP

---

## ✅ WHAT YOU CAN SAFELY MODIFY

**Frontend/UI Changes**:
- ✅ React components in `/components`
- ✅ Styles in `/app` (as long as you keep cache directives)
- ✅ Public assets in `/public` (except `/public/uploads`)

**Backend Logic**:
- ✅ API routes in `/app/api`
- ✅ Server actions
- ✅ Utility functions in `/lib`

**Database**:
- ✅ Add new Prisma migrations (after testing)
- ✅ Add new database seeds

**Always**:
1. Test locally first
2. Commit to git
3. Deploy via `git pull` on VPS
4. Run `npm run build`
5. Restart PM2
6. Verify with curl

---

## 📋 SUMMARY

```
⛔ DO NOT TOUCH:
   - Port 4000
   - Database: alessa_ordering
   - Nginx configs (lapoblanita, alessacloud.com)
   - ecosystem.config.js PORT setting
   - Cache directives in app/order/page.tsx
   - /var/www/alessa-ordering/.env
   - PM2 process name: alessa-ordering

✅ SAFE TO MODIFY (with testing):
   - React components
   - API routes
   - Styles
   - Database schema (via Prisma migrations)
   - Public assets (except /uploads)

🚨 ALWAYS:
   - Test locally
   - Commit to git
   - Deploy via git pull
   - Run npm run build
   - Restart PM2
   - Verify with tests
```

---

**Last Updated**: November 8, 2025
**Status**: ✅ PRODUCTION - STABLE - DO NOT BREAK
**Owner**: Ernesto Ponce
**Critical System**: Multi-tenant restaurant ordering platform

---

## 🔒 THIS IS A PRODUCTION SYSTEM

Thousands of customers depend on this platform for ordering food. Breaking changes cause:
- ❌ Lost revenue
- ❌ Unhappy customers
- ❌ Damaged reputation
- ❌ Emergency late-night debugging

**When in doubt, DON'T. Ask first.**

---

**END OF CRITICAL CONFIGURATION DOCUMENT**
