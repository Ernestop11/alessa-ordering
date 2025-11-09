# 🔒 Prisma Isolation Review - Alessa Ordering

**Date**: November 8, 2025
**Status**: ✅ PROPERLY ISOLATED from Azteka-DSD

---

## ✅ Current Isolation Status

### Database Separation
```
✅ ISOLATED - Each app has its own PostgreSQL database:

┌──────────────────┬────────────────────┬─────────┬──────────────────┐
│ App              │ Database           │ Port    │ User             │
├──────────────────┼────────────────────┼─────────┼──────────────────┤
│ alessa-ordering  │ alessa_ordering    │ 3000    │ alessa_ordering_user │
│ azteka-dsd       │ azteka_dsd         │ 3001    │ azteka_user      │
└──────────────────┴────────────────────┴─────────┴──────────────────┘
```

### Prisma Client Separation
```
✅ ISOLATED - Each app has its own @prisma/client:

alessa-ordering: /var/www/alessa-ordering/node_modules/@prisma/client
azteka-dsd:      /srv/azteka-dsd/node_modules/@prisma/client
```

### Environment Variables
```
✅ ISOLATED - Separate .env files:

alessa-ordering: /var/www/alessa-ordering/.env
azteka-dsd:      /srv/azteka-dsd/.env
```

---

## 📋 Alessa-Ordering Configuration

### 1. Database Connection (Local .env)
```bash
DATABASE_URL="postgresql://alessa_ordering_user:alessa_secure_2024@localhost:5432/alessa_ordering?schema=public"
```

**Components**:
- **Database**: `alessa_ordering` (unique, isolated)
- **User**: `alessa_ordering_user` (dedicated user)
- **Password**: `alessa_secure_2024`
- **Schema**: `public`

### 2. Prisma Schema Location
```
/Users/ernestoponce/alessa-ordering/prisma/schema.prisma
```

**Key Configuration**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // Points to alessa_ordering DB
}

generator client {
  provider = "prisma-client-js"
}
```

### 3. Prisma Client Usage
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
```

**Isolation Points**:
- ✅ Uses `env("DATABASE_URL")` - reads from local .env
- ✅ Prisma Client generated in local `node_modules/`
- ✅ No hardcoded database references
- ✅ Global singleton pattern prevents multiple instances

---

## 🚫 What We AVOID (Cross-App Contamination)

### ❌ Shared Database
```bash
# WRONG - Don't do this:
DATABASE_URL="postgresql://postgres@localhost:5432/shared_db"
```

### ❌ Shared Prisma Client
```bash
# WRONG - Don't do this:
import prisma from '../../../azteka-dsd/lib/prisma'
```

### ❌ Shared .env File
```bash
# WRONG - Don't do this:
ln -s /srv/azteka-dsd/.env /var/www/alessa-ordering/.env
```

---

## 🔍 Verification Checklist

### ✅ Database Isolation
```bash
# Check databases exist separately
sudo -u postgres psql -c "\l" | grep -E "(alessa_ordering|azteka_dsd)"

# Expected output:
# alessa_ordering  | alessa_ordering_user | UTF8 ...
# azteka_dsd       | azteka_user          | UTF8 ...
```

### ✅ Prisma Client Isolation
```bash
# Check Prisma clients are separate
ls /var/www/alessa-ordering/node_modules/@prisma/client
ls /srv/azteka-dsd/node_modules/@prisma/client

# Should show different directories
```

### ✅ Schema Isolation
```bash
# Check schemas point to different databases
grep "DATABASE_URL" /var/www/alessa-ordering/.env
grep "DATABASE_URL" /srv/azteka-dsd/.env

# Should show different database names
```

### ✅ PM2 Process Isolation
```bash
pm2 list

# Expected: Separate processes
# alessa-ordering (port 3000, /var/www/alessa-ordering)
# azteka-dsd      (port 3001, /srv/azteka-dsd)
```

---

## 📊 Current VPS Database Layout

```
PostgreSQL (port 5432)
├── alessa_ordering
│   ├── Owner: alessa_ordering_user
│   ├── Used by: alessa-ordering app (port 3000)
│   └── Tables: Tenant, MenuItem, Order, Customer, etc.
│
└── azteka_dsd
    ├── Owner: azteka_user
    ├── Used by: azteka-dsd app (port 3001)
    └── Tables: [Azteka-specific tables]
```

---

## 🛡️ Safety Rules for Future Apps

### Rule 1: One Database Per App
```bash
# For new app "myapp":
sudo -u postgres psql -c "CREATE DATABASE myapp_db;"
sudo -u postgres psql -c "CREATE USER myapp_user WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE myapp_db TO myapp_user;"
```

### Rule 2: Dedicated .env File
```bash
# /srv/myapp/.env
DATABASE_URL="postgresql://myapp_user:secure_password@localhost:5432/myapp_db?schema=public"
```

### Rule 3: Local Prisma Client
```bash
cd /srv/myapp
npm install @prisma/client prisma
npx prisma generate
```

### Rule 4: Unique Port
```bash
# ecosystem.config.js or package.json
PORT=4100  # Different from 3000 (alessa), 3001 (azteka)
```

---

## 🧪 Testing Isolation

### Test 1: Database Write to Alessa
```bash
# Should only affect alessa_ordering database
curl -X POST https://lapoblanitamexicanfood.com/api/admin/menu-sections \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Section"}'

# Verify in alessa_ordering only:
sudo -u postgres psql -d alessa_ordering -c "SELECT * FROM \"MenuSection\" WHERE name='Test Section';"

# Verify NOT in azteka_dsd:
sudo -u postgres psql -d azteka_dsd -c "\dt"  # Should not show MenuSection table
```

### Test 2: Database Write to Azteka
```bash
# Should only affect azteka_dsd database
# (use azteka-dsd API endpoint)

# Verify isolation - no cross-contamination
```

### Test 3: Restart One App Without Affecting Other
```bash
# Restart alessa-ordering
pm2 restart alessa-ordering

# Check azteka-dsd still running
pm2 list | grep azteka-dsd  # Should show "online"
```

---

## 🚨 Warning Signs of Cross-Contamination

### ⚠️ Sign 1: Shared Tables
```bash
# If you see this in BOTH databases:
sudo -u postgres psql -d alessa_ordering -c "\dt"
sudo -u postgres psql -d azteka_dsd -c "\dt"

# Tables should be DIFFERENT, not identical
```

### ⚠️ Sign 2: Same DATABASE_URL
```bash
# Check both .env files
cat /var/www/alessa-ordering/.env | grep DATABASE_URL
cat /srv/azteka-dsd/.env | grep DATABASE_URL

# Should show DIFFERENT database names
```

### ⚠️ Sign 3: PM2 Process Conflicts
```bash
pm2 list

# If you see errors or restarts when modifying one app,
# check for shared dependencies or ports
```

---

## ✅ Current Production Status

**alessa-ordering**:
- ✅ Database: `alessa_ordering` (isolated)
- ✅ User: `alessa_ordering_user` (dedicated)
- ✅ Port: 3000 (unique)
- ✅ Directory: `/var/www/alessa-ordering/` (isolated)
- ✅ Prisma Client: Local installation
- ✅ PM2 Process: `alessa-ordering` (namespace: alessa)

**azteka-dsd**:
- ✅ Database: `azteka_dsd` (isolated)
- ✅ User: `azteka_user` (dedicated)
- ✅ Port: 3001 (unique)
- ✅ Directory: `/srv/azteka-dsd/` (isolated)
- ✅ Prisma Client: Local installation
- ✅ PM2 Process: `azteka-api` (namespace: default)

**No Cross-Contamination**: ✅ Verified

---

## 📞 Quick Reference

### Alessa-Ordering Commands (Safe)
```bash
# Navigate to app
cd /var/www/alessa-ordering

# Prisma commands (only affects alessa_ordering DB)
npx prisma migrate dev --name my_migration
npx prisma generate
npx prisma studio

# Restart app
pm2 restart alessa-ordering

# View logs
pm2 logs alessa-ordering
```

### Database Access (Alessa Only)
```bash
sudo -u postgres psql -d alessa_ordering

# Inside psql:
\dt                    # List tables
SELECT * FROM "Tenant";  # Query data
\q                     # Quit
```

---

## 🎯 Summary

**Isolation Status**: 🟢 FULLY ISOLATED

- ✅ Separate PostgreSQL databases
- ✅ Separate database users
- ✅ Separate Prisma clients
- ✅ Separate .env files
- ✅ Separate PM2 processes
- ✅ Separate ports
- ✅ Separate directories

**Safe to Work On**: Both apps can be developed, deployed, and maintained independently without affecting each other.

**Next Steps for Admin UI Issue**: The Prisma setup is correct. The admin panel update issue is likely related to Next.js caching, not Prisma isolation.
