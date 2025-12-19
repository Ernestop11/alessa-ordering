# Build and Deployment Rules

> **Single Source of Truth: Git → VPS**

## Core Principles

1. **Git is the canonical source** - All code changes go through git
2. **VPS builds production** - Never run production builds locally
3. **Local is for development only** - Use `npm run dev` locally, never `npm run build`
4. **iOS is the exception** - Xcode builds require macOS (cannot run on VPS)

---

## Workflow

### Web App Changes (Next.js)

```bash
# 1. Develop locally
npm run dev

# 2. Commit and push
git add .
git commit -m "feat: description"
git push origin main

# 3. Deploy on VPS
ssh root@77.243.85.8
cd /var/www/alessa-ordering
git pull origin main
npm install  # if dependencies changed
npm run build
pm2 restart alessa-ordering
```

### iOS App Changes (Capacitor/Xcode)

```bash
# 1. Make changes locally (iOS code is in ios/App/)
# 2. Commit and push to git
git add ios/
git commit -m "fix: iOS printer plugin update"
git push origin main

# 3. Build in Xcode (LOCAL ONLY - requires macOS)
# Open ios/App/App.xcworkspace
# Product → Clean Build Folder
# Product → Archive
# Distribute to TestFlight/App Store
```

### Database Migrations

```bash
# 1. Update schema locally
# Edit prisma/schema.prisma

# 2. Commit and push
git add prisma/
git commit -m "db: add new field"
git push origin main

# 3. Run migration on VPS
ssh root@77.243.85.8
cd /var/www/alessa-ordering
git pull origin main
npx prisma db push  # or npx prisma migrate deploy
```

---

## Directory Structure

```
alessa-ordering/
├── app/                 # Next.js app (builds on VPS)
├── components/          # React components (builds on VPS)
├── lib/                 # Utilities (builds on VPS)
├── prisma/              # Database schema (migrations on VPS)
├── ios/                 # iOS native code (builds on LOCAL Mac)
│   └── App/
│       └── App/
│           ├── StarPrinterPlugin.swift
│           └── StarPrinterPlugin.m
└── docs/                # Documentation
```

---

## Environment Rules

| Environment | Purpose | Build Command | Location |
|-------------|---------|---------------|----------|
| Local Mac | Development | `npm run dev` | localhost:3000 |
| VPS | Production | `npm run build` | 77.243.85.8 |
| Xcode | iOS Archive | Product → Archive | Local Mac only |

---

## Backup Strategy

1. **Git commits** = version history (can rollback anytime)
2. **Git tags** = release markers for stable versions
3. **VPS snapshots** = infrastructure backup (monthly)

### Creating a Release Tag

```bash
git tag -a v1.0.5 -m "Release 1.0.5 - Star Printer fixes"
git push origin v1.0.5
```

### Rolling Back

```bash
# On VPS - rollback to previous version
cd /var/www/alessa-ordering
git fetch --all
git checkout v1.0.4  # or specific commit hash
npm install
npm run build
pm2 restart alessa-ordering
```

---

## What NOT to Do

- ❌ Run `npm run build` locally for production
- ❌ Deploy code that isn't committed to git
- ❌ Make direct changes on VPS without committing
- ❌ Keep local-only changes that aren't in git
- ❌ Try to build iOS on VPS (impossible - requires macOS)

---

## Quick Reference Commands

### Deploy Web Changes
```bash
git push origin main && ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git pull && npm run build && pm2 restart alessa-ordering"
```

### Check VPS Status
```bash
ssh root@77.243.85.8 "pm2 list && cd /var/www/alessa-ordering && git log -1 --oneline"
```

### Sync VPS with Latest
```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git fetch && git reset --hard origin/main && npm install && npm run build && pm2 restart alessa-ordering"
```

---

## iOS Build Checklist

Before archiving in Xcode:

1. [ ] All iOS changes committed to git
2. [ ] `git push origin main` completed
3. [ ] Xcode: Product → Clean Build Folder
4. [ ] Xcode: Product → Archive
5. [ ] Test on device via TestFlight before App Store release

---

*Last updated: December 2025*
