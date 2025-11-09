# 🚀 Presentation Prompts - All Priorities

Ready-to-use prompt blocks for Claude to execute all presentation priorities.

---

## 1️⃣ SUPER ADMIN - TABS & ONBOARDING (HIGHEST PRIORITY)

### Add Tab Navigation to Super Admin
```
## 🎯 Super Admin: Add Tab Navigation
Add tab navigation to the super admin dashboard with these tabs:
1. Dashboard (current metrics view)
2. Tenants (tenant management)
3. Onboarding (new tenant wizard)
4. Templates (template library)

Requirements:
- Clean tab UI with active state indicators
- Smooth transitions between tabs
- Keep existing functionality
- Modern, professional design
- Remove fulfillment/cart icons (those are for restaurant owners)

File: components/super/SuperAdminDashboard.tsx
```

### Create Onboarding Wizard
```
## 🎯 Super Admin: Create Onboarding Wizard
Create a multi-step onboarding wizard for new tenants:

Step 1: Business Type Selection
- Show 5 business templates: Taqueria, Panadería, Coffee Shop, Pizza Place, Grocery Store
- Each template shows: icon, name, description, color scheme, features
- User selects one template

Step 2: Basic Information
- Business name
- Slug (auto-generated from name)
- Contact email
- Contact phone
- Address fields

Step 3: Branding
- Logo upload
- Hero image upload
- Primary color picker
- Secondary color picker
- Hero title
- Hero subtitle
- Tagline

Step 4: Settings
- Delivery radius
- Minimum order value
- Currency
- Time zone
- Stripe account ID (optional)

Step 5: Review & Create
- Summary of all settings
- Option to seed demo menu
- Create tenant button

Requirements:
- Smooth step transitions
- Progress indicator
- Validation at each step
- Modern UI with bolt.new style
- Save progress (localStorage)

File: components/super/SuperAdminDashboard.tsx
Add new component: components/super/OnboardingWizard.tsx
```

### Add Template Selection
```
## 🎯 Super Admin: Add Template Selection
Create a template selection component with 5 business types:

1. Taqueria (🌮)
   - Colors: Red (#dc2626) + Amber (#f59e0b)
   - Features: Tacos, Burritos, Quesadillas, Beverages

2. Panadería (🥖)
   - Colors: Amber (#f59e0b) + Yellow (#fbbf24)
   - Features: Bread, Pastries, Desserts, Coffee

3. Coffee Shop (☕)
   - Colors: Brown (#92400e) + Orange (#d97706)
   - Features: Coffee, Tea, Pastries, Sandwiches

4. Pizza Place (🍕)
   - Colors: Red (#dc2626) + Red (#ef4444)
   - Features: Pizza, Wings, Salads, Beverages

5. Grocery Store (🛒)
   - Colors: Green (#059669) + Green (#10b981)
   - Features: Produce, Packaged Goods, Dairy, Meat

Requirements:
- Visual template cards with preview
- Click to select template
- Apply colors and settings automatically
- Show in onboarding wizard step 1

File: components/super/TemplateSelector.tsx
```

### Remove Restaurant Owner Features
```
## 🎯 Super Admin: Remove Restaurant Owner Features
Remove features that are for restaurant owners, not super admin:
- Remove "Fulfillment Board" link (restaurant owner feature)
- Remove any cart/order fulfillment icons
- Keep only super admin tools:
  - Tenant management
  - Onboarding
  - Templates
  - Platform metrics
  - Settings

File: components/super/SuperAdminDashboard.tsx
```

---

## 2️⃣ LANDING PAGE - 10X UI (HIGH PRIORITY)

### 10x Landing Page UI with Bolt.new Style
```
## 🎯 Landing Page: 10x UI with Bolt.new Style
Transform the landing page to bolt.new style:

Design Requirements:
- Clean, modern, minimal design
- Smooth animations and micro-interactions
- Bold typography with gradient accents
- Professional spacing and layout
- Engaging hero section with better CTA
- Feature cards with hover effects
- Smooth scroll animations
- Professional color scheme

Features to Enhance:
1. Hero Section
   - Larger, more impactful hero
   - Better CTA buttons with animations
   - Smooth scroll indicators
   - Better image rotation

2. Features Grid
   - Card hover effects
   - Icon animations
   - Better spacing
   - Gradient accents

3. CTA Section
   - More engaging design
   - Better copy
   - Animated elements

4. Footer
   - Cleaner design
   - Better organization

Requirements:
- Bolt.new style (clean, modern, minimal)
- Smooth animations
- Professional presentation
- Mobile responsive
- Fast loading

File: components/LandingPage.tsx
```

### Add Smooth Animations
```
## 🎯 Landing Page: Add Smooth Animations
Add smooth animations to landing page:
- Fade-in on scroll
- Stagger animations for feature cards
- Hover effects on buttons
- Smooth transitions
- Micro-interactions
- Loading animations

Use Framer Motion or CSS animations.
Keep performance in mind.

File: components/LandingPage.tsx
```

---

## 3️⃣ TENANT PAGE - POLISH PURCHASE FLOW (HIGH PRIORITY)

### Polish Purchase Flow
```
## 🎯 Tenant Page: Polish Purchase Flow
Improve the purchase flow on the tenant order page:

1. Cart Experience
   - Better cart UI
   - Smooth add/remove animations
   - Quantity controls
   - Item customization display
   - Price breakdown

2. Checkout Flow
   - Step-by-step checkout
   - Better form design
   - Address input
   - Payment method selection
   - Order summary
   - Confirmation screen

3. Mobile Experience
   - Better mobile cart
   - Sticky cart button
   - Mobile-optimized checkout
   - Touch-friendly controls

4. UI/UX Improvements
   - Better spacing
   - Professional typography
   - Smooth transitions
   - Loading states
   - Error handling
   - Success feedback

Requirements:
- Professional look
- Smooth user experience
- Mobile-first design
- Fast and responsive

Files:
- components/order/OrderPageClient.tsx
- components/order/Cart.tsx (if exists)
- app/order/checkout/page.tsx (if exists)
```

### Improve Checkout UI
```
## 🎯 Tenant Page: Improve Checkout UI
Create a better checkout experience:

1. Checkout Steps
   - Step 1: Cart Review
   - Step 2: Delivery/Pickup Selection
   - Step 3: Address/Contact Info
   - Step 4: Payment
   - Step 5: Confirmation

2. UI Requirements
   - Progress indicator
   - Clean form design
   - Validation feedback
   - Smooth transitions
   - Mobile responsive
   - Professional styling

3. Features
   - Save address for future
   - Delivery time selection
   - Special instructions
   - Order notes
   - Tip option

File: app/order/checkout/page.tsx
Create: components/order/CheckoutFlow.tsx
```

---

## 4️⃣ TEMPLATES - CREATE VARIATIONS (MEDIUM PRIORITY)

### Create Business Type Templates
```
## 🎯 Templates: Create Business Type Templates
Create 4-5 polished business type templates:

1. Taqueria Template
   - Colors: Red + Amber
   - Menu sections: Tacos, Burritos, Quesadillas, Beverages
   - Hero style: Mexican food imagery
   - Layout: Food-focused

2. Panadería Template
   - Colors: Amber + Yellow
   - Menu sections: Bread, Pastries, Desserts, Coffee
   - Hero style: Bakery imagery
   - Layout: Sweet treats focus

3. Coffee Shop Template
   - Colors: Brown + Orange
   - Menu sections: Coffee, Tea, Pastries, Sandwiches
   - Hero style: Coffee imagery
   - Layout: Beverage-focused

4. Pizza Place Template
   - Colors: Red + Red
   - Menu sections: Pizza, Wings, Salads, Beverages
   - Hero style: Pizza imagery
   - Layout: Pizza-focused

5. Grocery Store Template
   - Colors: Green + Green
   - Menu sections: Produce, Packaged Goods, Dairy, Meat
   - Hero style: Grocery imagery
   - Layout: Product-focused

Requirements:
- Each template has unique color scheme
- Pre-configured menu sections
- Template-specific hero images
- Template-specific layout
- Show in onboarding wizard

Files:
- lib/templates/taqueria.ts
- lib/templates/panaderia.ts
- lib/templates/coffee.ts
- lib/templates/pizza.ts
- lib/templates/grocery.ts
```

### Apply Template to Tenant
```
## 🎯 Templates: Apply Template to Tenant
When a template is selected in onboarding:
1. Apply color scheme (primary + secondary colors)
2. Create menu sections based on template
3. Set hero image from template
4. Apply template-specific settings
5. Seed demo menu items if selected

Requirements:
- Automatic application
- Template-specific defaults
- Demo data seeding
- Validation

File: app/api/super/tenants/route.ts
Update: components/super/OnboardingWizard.tsx
```

---

## 5️⃣ ADMIN DASHBOARD - FUNCTIONALITY (MEDIUM PRIORITY)

### Make Admin Dashboard Fully Functional
```
## 🎯 Admin Dashboard: Make Fully Functional
Ensure all admin dashboard tabs work correctly:

1. Orders Tab
   - List all orders
   - Filter by status
   - View order details
   - Update order status
   - Print order

2. Customers Tab
   - List all customers
   - View customer details
   - Customer order history
   - Customer contact info

3. Menu Tab
   - Add/edit/delete menu items
   - Upload images
   - Manage categories
   - Set featured items

4. Menu Sections Tab
   - Add/edit/delete sections
   - Reorder sections
   - Section settings

5. Settings Tab
   - Tenant settings
   - Branding
   - Integrations
   - Delivery settings

Requirements:
- All tabs functional
- Smooth navigation
- Professional UI
- Error handling
- Loading states

File: components/admin/AdminDashboardClient.tsx
```

### Polish Admin Dashboard UI
```
## 🎯 Admin Dashboard: Polish UI
Improve admin dashboard UI/UX:
- Better spacing and typography
- Smooth transitions
- Professional color scheme
- Better form design
- Improved data tables
- Better mobile experience
- Loading states
- Error messages
- Success feedback

File: components/admin/AdminDashboardClient.tsx
```

---

## 6️⃣ DOORDASH INTEGRATION (LOW PRIORITY - CAN MENTION AS COMING SOON)

### Research DoorDash Whitelabel API
```
## 🎯 DoorDash: Research Whitelabel API
Research DoorDash whitelabel API for delivery integration:

1. API Documentation
   - Find official documentation
   - Understand authentication
   - Understand endpoints
   - Understand pricing

2. Integration Requirements
   - API keys needed
   - Webhook setup
   - Delivery tracking
   - Order management

3. Implementation Plan
   - Create integration plan
   - Design database schema
   - Plan API routes
   - Plan UI components

4. Create Documentation
   - Integration guide
   - API reference
   - Setup instructions

Note: This can be mentioned as "coming soon" in presentation.

Create: docs/DOORDASH_INTEGRATION.md
```

### Plan DoorDash Integration
```
## 🎯 DoorDash: Plan Integration
Create a detailed plan for DoorDash integration:

1. Database Schema
   - Delivery table
   - DoorDash order tracking
   - Delivery status

2. API Routes
   - POST /api/delivery/doordash/create
   - GET /api/delivery/doordash/status/:id
   - POST /api/delivery/doordash/webhook

3. UI Components
   - Delivery selection in checkout
   - Delivery tracking page
   - Admin delivery management

4. Features
   - Order creation in DoorDash
   - Delivery tracking
   - Status updates
   - Webhook handling

Create: docs/DOORDASH_PLAN.md
```

---

## 🎯 QUICK EXECUTION PROMPTS

### Execute All Priorities
```
## 🚀 Execute All Presentation Priorities
Execute all presentation priorities in order:

1. Super Admin - Add tabs and onboarding wizard
2. Landing Page - 10x UI with bolt.new style
3. Tenant Page - Polish purchase flow
4. Templates - Create 4-5 business type templates
5. Admin Dashboard - Make fully functional
6. DoorDash - Research and plan (can mention as coming soon)

Start with priority 1 and work through each one.
Show progress after each completion.
```

### Quick Status Check
```
## ⚡ Quick Status Check
Check status of all presentation priorities:
- Super Admin tabs: [status]
- Onboarding wizard: [status]
- Landing page 10x: [status]
- Purchase flow polish: [status]
- Templates: [status]
- Admin dashboard: [status]
- DoorDash research: [status]

Show what's done and what's remaining.
```

### Build and Test
```
## 🧪 Build and Test
Build the application and test all new features:
1. Run npm run build
2. Check for errors
3. Test Super Admin tabs
4. Test onboarding wizard
5. Test landing page
6. Test purchase flow
7. Test templates
8. Test admin dashboard

Report any issues found.
```

---

## 📋 EXECUTION ORDER

**Recommended execution order:**

1. ✅ Super Admin - Tabs & Onboarding (2-3 hours)
2. ✅ Landing Page - 10x UI (1-2 hours)
3. ✅ Tenant Page - Polish Purchase Flow (1-2 hours)
4. ✅ Templates - Create Variations (1-2 hours)
5. ✅ Admin Dashboard - Functionality (1 hour)
6. ⚠️ DoorDash - Research (can mention as coming soon)

**Total Estimated Time:** 6-10 hours

---

## 💡 TIPS

1. **Copy the entire block** - Include the `##` header
2. **Execute one at a time** - Don't combine multiple prompts
3. **Check progress** - Use "Quick Status Check" between tasks
4. **Test frequently** - Use "Build and Test" after major changes
5. **Customize as needed** - Add specific requirements

---

**Ready to execute! Start with Priority 1: Super Admin Tabs & Onboarding**

