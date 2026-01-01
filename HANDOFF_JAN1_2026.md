# Alessa Ordering System - MVP Handoff Document
## January 1, 2026 - Version 1.2.0

**Emergency Contact**: This document serves as a complete system reference for Las Reinas Colusa and future maintenance.

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Reference](#api-reference)
5. [Environment Variables](#environment-variables)
6. [Integrations](#integrations)
7. [Feature Inventory](#feature-inventory)
8. [Emergency Procedures](#emergency-procedures)
9. [Deployment Guide](#deployment-guide)

---

## System Overview

### What is Alessa Ordering?
A multi-tenant restaurant ordering and management platform built with:
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe Connect (platform model)
- **Delivery**: DoorDash Drive, Uber Direct, Self-Delivery
- **Email**: Resend for transactional emails
- **Hosting**: VPS at 77.243.85.8 (lasreinascolusa.com)

### Primary Tenant
- **Business**: Las Reinas Colusa (Mexican Restaurant)
- **Domain**: lasreinascolusa.com
- **Slug**: `lasreinas`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ALESSA ORDERING SYSTEM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Customer  │  │    Admin    │  │ Super Admin │             │
│  │   Frontend  │  │  Dashboard  │  │   Console   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Next.js App Router                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│   │
│  │  │ app/order/* │ │ app/admin/* │ │ app/super-admin/*  ││   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘│   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     API Routes                           │   │
│  │  /api/orders  /api/menu  /api/payments  /api/delivery   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Integrations Layer                          │   │
│  │  ┌───────┐ ┌──────────┐ ┌───────┐ ┌────────┐ ┌───────┐  │   │
│  │  │Stripe │ │ DoorDash │ │ Uber  │ │ Resend │ │Avalara│  │   │
│  │  └───────┘ └──────────┘ └───────┘ └────────┘ └───────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   PostgreSQL                             │   │
│  │                (Prisma ORM)                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure
```
alessa-ordering/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # All backend API endpoints
│   │   ├── orders/        # Order management
│   │   ├── menu/          # Menu operations
│   │   ├── payments/      # Stripe payments
│   │   ├── delivery/      # DoorDash, Uber, Self-delivery
│   │   ├── admin/         # Admin-only endpoints
│   │   ├── super/         # Super admin endpoints
│   │   ├── rewards/       # Loyalty program
│   │   ├── group-orders/  # Group order functionality
│   │   ├── customer/      # Customer management
│   │   └── sync/          # Ecosystem sync
│   ├── order/             # Customer ordering pages
│   ├── checkout/          # Payment flow
│   ├── admin/             # Admin dashboard
│   └── super-admin/       # Platform management
├── components/            # React components
│   ├── order/             # Ordering UI components
│   ├── admin/             # Admin dashboard components
│   └── ui/                # Shared UI components
├── lib/                   # Utilities and services
│   ├── prisma.ts          # Database client
│   ├── stripe.ts          # Stripe configuration
│   ├── email-service.ts   # Email templates
│   └── doordash/          # DoorDash integration
├── prisma/
│   └── schema.prisma      # Database schema
├── public/                # Static assets
└── handoff-package/       # Print relay scripts
```

---

## Database Schema

### Core Models (45+ tables)

#### Tenant Management
| Model | Purpose |
|-------|---------|
| `Tenant` | Restaurant/business accounts |
| `TenantSettings` | Branding, hours, rewards config |
| `TenantIntegration` | Stripe, delivery, printer settings |
| `TenantTemplate` | Visual theme templates |
| `TenantBlock` | Template building blocks |

#### Menu & Products
| Model | Purpose |
|-------|---------|
| `MenuItem` | Regular menu items |
| `MenuSection` | Menu categories (Tacos, Burritos) |
| `CateringPackage` | Catering/event packages |
| `CateringSection` | Catering categories |
| `GroceryItem` | Grocery/retail items |
| `GroceryBundle` | Product bundles |

#### Orders & Payments
| Model | Purpose |
|-------|---------|
| `Order` | Customer orders |
| `OrderItem` | Individual items in orders |
| `PaymentSession` | Stripe payment tracking |
| `GroupOrder` | Team/group ordering sessions |
| `GroupOrderInvitation` | Group order invites |

#### Customers & Rewards
| Model | Purpose |
|-------|---------|
| `Customer` | Customer accounts |
| `CustomerSession` | Login sessions |
| `CustomerContact` | Saved contacts for group orders |

#### Delivery
| Model | Purpose |
|-------|---------|
| `Driver` | Self-delivery drivers |
| `DriverLocation` | Real-time driver GPS |
| `SelfDelivery` | Self-delivery orders |

#### Tax & Accounting
| Model | Purpose |
|-------|---------|
| `TaxRemittance` | Tax collection periods |
| `TaxCheck` | Tax payment checks |
| `TaxAchPayment` | ACH tax payments |
| `Accountant` | CPA portal users |
| `AccountantTenantAccess` | CPA access permissions |

#### MLM/Associate Program
| Model | Purpose |
|-------|---------|
| `Associate` | Sales representatives |
| `Commission` | Commission tracking |
| `TenantReferral` | Referral relationships |
| `Achievement` | Badges and rewards |
| `Sale` | Sales records |

#### CRM & Pipeline
| Model | Purpose |
|-------|---------|
| `Lead` | Sales leads |
| `CRMActivity` | Follow-up activities |
| `CRMNote` | Tenant notes |
| `Product` | Platform products |
| `TenantProduct` | Product subscriptions |

---

## API Reference

### Customer-Facing APIs

#### Menu & Ordering
```
GET  /api/menu                    # Get full menu
GET  /api/menu/sections           # Get menu sections
POST /api/orders                  # Create order
GET  /api/orders/[id]             # Get order details
GET  /api/orders/[id]/status      # Real-time order status
```

#### Payments
```
POST /api/payments/intent         # Create payment intent
POST /api/payments/confirm        # Confirm payment
POST /api/payments/webhook        # Stripe webhook handler
GET  /api/customers/payment-methods  # Saved cards
```

#### Group Orders
```
POST /api/group-orders/create     # Start group order
GET  /api/group-orders/[code]     # Get group order
POST /api/group-orders/[code]/join         # Join as participant
GET  /api/group-orders/[code]/summary      # Organizer dashboard
POST /api/group-orders/sponsor-checkout    # Sponsor pays for all
GET  /api/group-orders/[code]/invitations  # Invitation status
```

#### Delivery
```
POST /api/delivery/doordash/quote   # Get DoorDash quote
POST /api/delivery/doordash/create  # Create DoorDash delivery
POST /api/delivery/uber/quote       # Get Uber quote
POST /api/delivery/uber/create      # Create Uber delivery
POST /api/delivery/self/create      # Create self-delivery
POST /api/delivery/smart/quote      # Compare all providers
POST /api/delivery/smart/create     # Auto-select best provider
```

#### Rewards
```
POST /api/rewards/enroll          # Enroll in rewards
POST /api/rewards/login           # Rewards login
GET  /api/rewards/points          # Check points balance
POST /api/rewards/redeem          # Redeem reward
```

### Admin APIs

#### Dashboard
```
GET  /api/admin/dashboard/stats   # Dashboard metrics
GET  /api/admin/orders            # Order list
POST /api/admin/orders/[id]/status  # Update order status
POST /api/admin/orders/[id]/acknowledge  # Acknowledge order
```

#### Menu Management
```
GET  /api/admin/menu/items        # List items
POST /api/admin/menu/items        # Create item
PUT  /api/admin/menu/items/[id]   # Update item
DELETE /api/admin/menu/items/[id] # Delete item
POST /api/admin/menu/items/[id]/availability  # Toggle available
```

#### Fulfillment
```
GET  /api/admin/fulfillment/board   # Fulfillment board
POST /api/admin/fulfillment/acknowledge  # Accept order
POST /api/admin/fulfillment/ready   # Mark ready
POST /api/admin/fulfillment/printer/send  # Print order
```

#### Settings
```
GET  /api/admin/settings          # Get all settings
POST /api/admin/settings          # Update settings
POST /api/admin/stripe/onboard    # Start Stripe Connect
GET  /api/admin/stripe/status     # Stripe account status
POST /api/admin/delivery/smart-dispatch  # Configure delivery
```

### Super Admin APIs
```
GET  /api/super/tenants           # List all tenants
POST /api/super/tenants           # Create tenant
PUT  /api/super/tenants/[id]      # Update tenant
POST /api/super/tenants/[id]/status  # Change tenant status
GET  /api/super/metrics           # Platform metrics
POST /api/super/tenants/subscribe # Subscribe tenant to product
```

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/alessa_ordering"

# Authentication
NEXTAUTH_URL="https://lasreinascolusa.com"
NEXTAUTH_SECRET="[generated-secret]"

# Domain
ROOT_DOMAIN="alessacloud.com"
NEXT_PUBLIC_APP_URL="https://lasreinascolusa.com"

# Stripe (REQUIRED for payments)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Resend)
RESEND_API_KEY="re_..."
```

### Optional Variables

```bash
# DoorDash Drive (per-tenant or global)
DOORDASH_DEVELOPER_ID="..."
DOORDASH_KEY_ID="..."
DOORDASH_SIGNING_SECRET="..."
DOORDASH_SANDBOX="false"

# Uber Direct
UBER_CLIENT_ID="..."
UBER_CLIENT_SECRET="..."

# Tax Provider
TAXJAR_API_KEY="..."

# Print Relay
PRINT_RELAY_API_KEY="[tenant-specific]"

# Platform API Key
ALESSACLOUD_API_KEY="..."

# Printer
PRINTER_TCP_TIMEOUT="5000"
```

---

## Integrations

### 1. Stripe Connect
**Purpose**: Payment processing with platform fees
**Status**: LIVE for Las Reinas

**Flow**:
1. Tenant onboards via `/admin/settings` → Connect Stripe
2. Stripe creates connected account
3. Orders process through platform account with automatic fee split
4. Payouts go directly to tenant's bank

**Files**:
- `lib/stripe.ts` - Configuration
- `app/api/payments/intent/route.ts` - Payment intents
- `app/api/admin/stripe/onboard/route.ts` - Onboarding

### 2. DoorDash Drive
**Purpose**: Third-party delivery fulfillment
**Status**: Ready for connection

**Authentication**: JWT with HS256
- Requires: Developer ID, Key ID, Signing Secret
- JWT valid for 30 minutes
- Header: `dd-ver: DD-JWT-V1`

**Files**:
- `lib/doordash/jwt.ts` - JWT generation
- `app/api/delivery/doordash/quote/route.ts` - Get quote
- `app/api/delivery/doordash/create/route.ts` - Create delivery
- `components/admin/DoorDashSetupModal.tsx` - Credential setup UI

**Admin Setup**:
1. Go to Admin → Delivery Setup
2. Click "Connect with DoorDash Drive"
3. Enter credentials from DoorDash Developer Portal
4. Credentials stored in `TenantIntegration.paymentConfig.doordash`

### 3. Uber Direct
**Purpose**: Third-party delivery fulfillment
**Status**: OAuth ready

**Flow**: OAuth 2.0 authorization
**Files**:
- `app/api/delivery/uber/oauth/route.ts` - OAuth start
- `app/api/delivery/uber/callback/route.ts` - OAuth callback

### 4. Self-Delivery
**Purpose**: In-house delivery with driver tracking
**Status**: Implemented

**Features**:
- Driver management with PIN login
- Real-time GPS tracking
- Delivery status updates
- Customer tracking link

### 5. Resend Email
**Purpose**: Transactional emails
**Status**: LIVE

**Email Types**:
- Order confirmation
- Order ready notification
- Group order invitations
- Participant confirmations
- Organizer summaries
- Rewards enrollment

**Files**:
- `lib/email-service.ts` - All email functions

### 6. Print Relay
**Purpose**: Receipt printing to thermal printers
**Status**: LIVE for Las Reinas

**Architecture**:
- Local script polls VPS for new orders
- Sends ESC/POS commands to network printer
- Supports Star TSP100, Epson TM-series

**Files**:
- `handoff-package/local-print-relay.mjs` - Local script
- `app/api/print-relay/queue/route.ts` - Queue management
- `app/api/print-relay/orders/route.ts` - Order retrieval

---

## Feature Inventory

### Customer Features

#### Ordering
- [x] Menu browsing with sections
- [x] Item customization (add-ons, removals)
- [x] Cart management
- [x] Guest checkout
- [x] Account checkout (saved info)
- [x] Multiple fulfillment methods (pickup/delivery)

#### Payments
- [x] Stripe card payments
- [x] Apple Pay / Google Pay
- [x] Saved payment methods
- [x] Tipping (preset percentages + custom)
- [x] Order confirmation emails

#### Group Orders
- [x] Create group order with shareable link
- [x] Multiple participants
- [x] Individual payments
- [x] "I'm Buying" sponsor mode
- [x] Organizer dashboard
- [x] Contact management
- [x] Email invitations

#### Rewards Program
- [x] Phone-based enrollment
- [x] Points accumulation ($1 = 1 point)
- [x] Reward redemption
- [x] Membership tiers
- [x] Points history

#### Delivery
- [x] DoorDash Drive integration (pending connection)
- [x] Uber Direct integration (pending connection)
- [x] Self-delivery with tracking
- [x] Smart Dispatch (auto-select cheapest/fastest)
- [x] Delivery until connected in admin (disabled by default)

### Admin Features

#### Dashboard
- [x] Real-time order feed
- [x] Revenue metrics
- [x] Order acknowledgment
- [x] Status updates

#### Menu Management
- [x] Create/edit/delete items
- [x] Section organization
- [x] Availability toggle
- [x] Image upload
- [x] Price management
- [x] Add-ons configuration
- [x] Time-specific specials (Taco Tuesday)

#### Fulfillment Board
- [x] Live order queue
- [x] Acknowledge orders
- [x] Mark ready for pickup
- [x] Print receipts
- [x] Auto-print option

#### Delivery Management
- [x] DoorDash setup modal
- [x] Uber OAuth connection
- [x] Self-delivery driver management
- [x] Smart Dispatch configuration
- [x] Delivery status tracking

#### Settings
- [x] Business info (address, hours)
- [x] Stripe Connect onboarding
- [x] Tax configuration
- [x] Branding (colors, logo)
- [x] Rewards program setup
- [x] Email domain verification

### Super Admin Features

#### Tenant Management
- [x] Create new tenants
- [x] Tenant status workflow (Pending → Live)
- [x] Feature flags
- [x] Subscription management

#### Products & Billing
- [x] Product catalog
- [x] Pricing tiers
- [x] Subscription management
- [x] Usage tracking

#### CRM
- [x] Lead pipeline
- [x] Activity tracking
- [x] Notes and follow-ups

#### MLM/Associates
- [x] Associate management
- [x] Commission tracking
- [x] Referral codes
- [x] Rank progression
- [x] Leaderboards

---

## Emergency Procedures

### 1. Database Backup

**Manual Backup**:
```bash
ssh root@77.243.85.8 "pg_dump -U alessa_ordering_user alessa_ordering > /var/backups/alessa_$(date +%Y%m%d_%H%M%S).sql"
```

**Restore from Backup**:
```bash
ssh root@77.243.85.8 "psql -U alessa_ordering_user alessa_ordering < /var/backups/alessa_YYYYMMDD_HHMMSS.sql"
```

### 2. Application Recovery

**Check Status**:
```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && pm2 status"
```

**Restart Application**:
```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && pm2 restart all"
```

**View Logs**:
```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && pm2 logs"
```

### 3. Database Issues

**Check Connection**:
```bash
ssh root@77.243.85.8 "pg_isready -h localhost -p 5432"
```

**Restart PostgreSQL**:
```bash
ssh root@77.243.85.8 "sudo systemctl restart postgresql"
```

### 4. Stripe Issues

**Check Webhook Status**:
- Go to Stripe Dashboard → Developers → Webhooks
- Verify endpoint is receiving events
- Check for failed deliveries

**Re-register Webhook**:
```bash
stripe listen --forward-to https://lasreinascolusa.com/api/payments/webhook
```

### 5. Print Relay Not Working

**Check Local Script**:
```bash
# On local machine (Las Reinas computer)
ps aux | grep print-relay
```

**Restart Print Relay**:
```bash
node handoff-package/local-print-relay.mjs
```

**Check Queue**:
```bash
curl -H "X-API-Key: $PRINT_RELAY_API_KEY" https://lasreinascolusa.com/api/print-relay/queue
```

### 6. Rollback Deployment

**Rollback to Previous Commit**:
```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git reset --hard HEAD~1 && npm run build && pm2 restart all"
```

**Rollback to Specific Tag**:
```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git checkout v1.2.0-mvp-jan1 && npm run build && pm2 restart all"
```

---

## Deployment Guide

### Local Development

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Start dev server
npm run dev
```

### Production Deployment

```bash
# On VPS
cd /var/www/alessa-ordering

# Pull latest
git pull origin main

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Apply migrations (if any)
npx prisma db push

# Build
npm run build

# Restart
pm2 restart all
```

### Key Files Locations

| File | Purpose |
|------|---------|
| `/var/www/alessa-ordering/.env` | Production environment variables |
| `/var/www/alessa-ordering/prisma/schema.prisma` | Database schema |
| `~/.pm2/logs/` | Application logs |
| `/var/backups/` | Database backups |

---

## Support Resources

### Documentation
- Prisma: https://www.prisma.io/docs
- Next.js: https://nextjs.org/docs
- Stripe Connect: https://stripe.com/docs/connect
- DoorDash Drive: https://developer.doordash.com/en-US/api/drive
- Uber Direct: https://developer.uber.com/docs/deliveries

### Repository
- GitHub: https://github.com/[your-repo]/alessa-ordering
- Current Branch: `main`
- Release Tag: `v1.2.0-mvp-jan1`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0.0 | Nov 2025 | Initial Las Reinas launch |
| v1.1.0 | Dec 2025 | Group orders, rewards enhancements |
| v1.2.0-mvp-jan1 | Jan 1, 2026 | DoorDash integration, delivery controls, handoff package |

---

*Document generated: January 1, 2026*
*System Version: 1.2.0-mvp-jan1*
*Primary Tenant: Las Reinas Colusa*
