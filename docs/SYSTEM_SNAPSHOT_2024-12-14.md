# Alessa Ordering Platform - System Snapshot
## Date: December 14, 2024 (MVP Milestone)

---

## Current Git State

| Property | Value |
|----------|-------|
| **Commit Hash** | `0618cf1` |
| **Commit Message** | fix: Use safeSections (state) instead of sections (props) for enrichedSections |
| **Branch** | `main` |
| **Repository** | https://github.com/Ernestop11/alessa-ordering |

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.0.3 | React framework with App Router |
| **React** | 18.2.0 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 3.x | Styling |
| **Framer Motion** | - | Animations |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 14.0.3 | REST API endpoints |
| **Prisma ORM** | 5.22.0 | Database access |
| **NextAuth.js** | - | Authentication |

### Database
| Technology | Version | Purpose |
|------------|---------|---------|
| **PostgreSQL** | 15.14 | Primary database |

### Payments
| Technology | Version | Purpose |
|------------|---------|---------|
| **Stripe** | 20.0.0 | Payment processing |

---

## VPS Infrastructure

### Server Details
| Property | Value |
|----------|-------|
| **IP Address** | 77.243.85.8 |
| **IPv6** | 2a02:4780:10:b8c0::1 |
| **OS** | Debian GNU/Linux 12 (bookworm) |
| **Kernel** | 6.1.0-40-cloud-amd64 |
| **Architecture** | x86_64 |

### Resources
| Resource | Total | Used | Available |
|----------|-------|------|-----------|
| **Disk** | 99 GB | 60 GB (64%) | 35 GB |
| **RAM** | 7.8 GB | 1.6 GB | 6.2 GB |

### Runtime Versions
| Software | Version |
|----------|---------|
| **Node.js** | 20.19.5 |
| **npm** | 10.8.2 |
| **PM2** | 6.0.13 |
| **Nginx** | 1.22.1 |

---

## Domains & Routing

### Active Domains
| Domain | Type | Tenant |
|--------|------|--------|
| `lasreinas.alessacloud.com` | HTTPS | Las Reinas |
| `alessacloud.com` | HTTPS | Platform |

### Nginx Configuration
- All traffic proxied to `localhost:4000`
- SSL/TLS enabled (Let's Encrypt)
- HTTP to HTTPS redirect

### PM2 Process
| Property | Value |
|----------|-------|
| **Process Name** | alessa-ordering |
| **Namespace** | alessa |
| **Mode** | cluster |
| **Port** | 4000 |

---

## Codebase Statistics

| Metric | Count |
|--------|-------|
| **Database Models** | 41 |
| **API Routes** | 135 |
| **React Components** | 98 |
| **Main Frontend Component** | 4,402 lines (OrderPageClient.tsx) |

### Database Models (41)
```
MenuItem, CateringPackage, CateringSection, GroceryItem, GroceryBundle,
Order, CateringInquiry, PaymentSession, TaxRemittance, OrderItem,
Tenant, TenantSettings, TenantIntegration, MenuSection, FrontendSection,
Customer, IntegrationLog, CustomerSession, Associate, TenantReferral,
Commission, Achievement, Sale, ProductReferral, TrainingProgress,
Contest, ContestParticipant, Announcement, AnnouncementRead, Meeting,
MeetingAttendee, TeamMessage, Leaderboard, LeaderboardEntry, TenantSync,
EcosystemEvent, Lead, Product, TenantProduct, CRMActivity, CRMNote
```

---

## Real-Time Sync System (STABLE)

### Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Admin Panel   │────▶│   PostgreSQL    │◀────│   Frontend      │
│   (Updates)     │     │   (Source of    │     │   (Polls APIs)  │
│                 │     │    Truth)       │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Active Polling Endpoints

| Feature | Endpoint | Interval | State Variable |
|---------|----------|----------|----------------|
| Restaurant Status | `/api/restaurant-status` | 10 sec | `restaurantIsOpen` |
| Featured Carousel | `/api/featured-items` | 5 sec | `currentFeaturedItems` |
| Menu Availability | `/api/menu-availability` | 15 sec | `currentSections` |
| Catering Packages | `/api/catering-packages` | 30 sec | `cateringPackages` |

### Critical Fix (DO NOT MODIFY)
**File:** `components/order/OrderPageClient.tsx`
**Lines 880-929:**
```typescript
const enrichedSections = useMemo(() => {
  return safeSections.map(...)  // Uses STATE, not props
}, [safeSections]);             // Depends on STATE
```

**Why this matters:**
- `safeSections` derives from `currentSections` state
- Polling updates `currentSections` via `setCurrentSections`
- `enrichedSections` recalculates → adds `displayImage` property
- Breaking this causes: "Cannot read properties of undefined (reading 'displayImage')"

---

## Key Files Reference

### Frontend (Order Page)
```
components/order/
├── OrderPageClient.tsx      # Main frontend (4,402 lines) - DO NOT MODIFY polling logic
├── OrderPageWrapper.tsx     # Server/client wrapper
├── MenuItemCard.tsx         # Individual menu item display
├── MenuSectionGrid.tsx      # Grid layout for sections
└── RewardsModal.tsx         # Rewards/loyalty UI
```

### Admin Panel
```
components/admin/
├── MenuEditorPage.tsx       # Main menu editor
├── AdminDashboardHome.tsx   # Admin dashboard
└── ...
```

### API Routes (Polling - DO NOT MODIFY)
```
app/api/
├── restaurant-status/route.ts   # Open/closed status
├── featured-items/route.ts      # Featured carousel items
├── menu-availability/route.ts   # Item availability & prices
├── catering-packages/route.ts   # Catering packages
└── menu/[id]/route.ts           # Menu item CRUD
```

### Configuration
```
├── prisma/schema.prisma         # Database schema (41 models)
├── lib/prisma.ts                # Prisma client
├── lib/hours-validator.ts       # Operating hours logic
├── lib/tenant.ts                # Multi-tenant utilities
└── middleware.ts                # Tenant routing middleware
```

---

## Multi-Tenant Architecture

### How It Works
1. Middleware detects tenant from subdomain (e.g., `lasreinas.alessacloud.com`)
2. `requireTenant()` function validates and returns tenant data
3. All database queries filter by `tenantId`
4. Each tenant has isolated: menu items, orders, settings, customers

### Current Tenants
| Slug | Domain |
|------|--------|
| lasreinas | lasreinas.alessacloud.com |

---

## Deployment Process

### Standard Deploy
```bash
# Local
git add -A && git commit -m "message" && git push origin main

# VPS
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git pull origin main && npm run build"
ssh root@77.243.85.8 "pm2 restart alessa-ordering"
```

### File Locations on VPS
| Path | Purpose |
|------|---------|
| `/var/www/alessa-ordering` | Application code |
| `/etc/nginx/sites-enabled/` | Nginx configs |
| `/root/.pm2/logs/` | PM2 logs |

---

## What's Working (MVP Features)

### Customer-Facing
- [x] Menu display with categories
- [x] Featured carousel (real-time updates)
- [x] Item availability (sold out badges)
- [x] Shopping cart
- [x] Checkout with Stripe
- [x] Operating hours enforcement
- [x] Catering packages display
- [x] Mobile-responsive design

### Admin Panel
- [x] Menu item CRUD
- [x] Price editing
- [x] Availability toggle
- [x] Featured items selection
- [x] Operating hours settings
- [x] Catering package management
- [x] Frontend sections editor

### Real-Time Sync
- [x] Admin changes reflect on frontend within seconds
- [x] No page refresh required
- [x] Polling-based architecture (stable)

---

## Known Limitations

1. **Polling vs WebSockets**: Using polling (5-30 sec intervals) instead of real-time WebSockets
2. **Single VPS**: No load balancing or redundancy
3. **No CDN**: Static assets served directly from VPS

---

## Critical Warnings

### DO NOT MODIFY without careful testing:
1. `components/order/OrderPageClient.tsx` - Polling logic (lines 880-1106)
2. `app/api/menu-availability/route.ts` - Availability endpoint
3. `app/api/featured-items/route.ts` - Featured items endpoint
4. `app/api/restaurant-status/route.ts` - Status endpoint

### The "safeSections" Pattern
Always use `safeSections` (state) instead of `sections` (props) when:
- Creating derived data with `useMemo`
- The derived data needs to update from polling

---

## Contact & Resources

| Resource | Location |
|----------|----------|
| **GitHub** | https://github.com/Ernestop11/alessa-ordering |
| **Live Site** | https://lasreinas.alessacloud.com |
| **VPS SSH** | `ssh root@77.243.85.8` |
| **Docs** | `/docs/` folder in repo |

---

*This snapshot represents the closest the platform has been to MVP with stable admin-to-frontend real-time sync.*
