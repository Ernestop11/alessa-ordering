# 🌟 SUPER ADMIN NORTH STAR - 2-3 Hour Plan

**Goal:** Make https://alessacloud.com/super-admin fully functional for tenant onboarding
**Timeline:** 2-3 hours focused work
**Current State:** UI exists, missing Stripe flow, template selection, and polish

---

## 🎯 NORTH STAR VISION

### What Success Looks Like:
You visit https://alessacloud.com/super-admin and can:
1. Click "Add New Tenant" button
2. Fill in restaurant info (name, contact, address)
3. **Choose template** from 3-5 beautiful options
4. **Connect Stripe** (redirects to Stripe Connect onboarding)
5. Stripe redirects back with connected account
6. System creates tenant + admin user automatically
7. Shows success message with login credentials
8. New tenant can immediately login at their `/admin`

---

## 🔑 KEY ESSENTIAL POINTS (Must Have)

### 1. Stripe Connect Onboarding Flow ⚡ HIGH PRIORITY
**What:** Integrate Stripe onboarding into tenant creation
**Flow:**
```
Super Admin clicks "Add Tenant"
  ↓
Fill in form (name, email, phone, address, slug)
  ↓
Click "Connect Stripe" button
  ↓
Redirect to Stripe Connect OAuth
  ↓
Stripe redirects back to callback URL
  ↓
Save Stripe account ID to tenant
  ↓
Show "Connected ✓" status
  ↓
Continue to template selection
```

**Files to Modify:**
- `/components/super/OnboardingWizard.tsx` - Add Stripe connect button
- `/app/api/super/stripe-connect/route.ts` - Create Stripe OAuth URL
- `/app/super-admin/stripe-connect/callback/page.tsx` - Handle OAuth callback

### 2. Template Selection UI ⚡ HIGH PRIORITY
**What:** Visual template picker with 3-5 options
**Templates:**
1. **Classic Taqueria** (La Poblanita style - warm, traditional)
2. **Modern Bistro** (clean, minimal, elegant)
3. **Fast Casual** (bold, energetic, quick service)
4. **Bakery Artisan** (cozy, rustic, homey)
5. **Fine Dining** (sophisticated, luxury, upscale)

**Template Structure:**
```json
{
  "id": "classic-taqueria",
  "name": "Classic Taqueria",
  "primaryColor": "#dc2626",
  "secondaryColor": "#f59e0b",
  "accentColor": "#059669",
  "fontFamily": "Inter",
  "preview": "/templates/classic-taqueria-preview.png"
}
```

**Files to Create:**
- `/templates/classic-taqueria.json`
- `/templates/modern-bistro.json`
- `/templates/fast-casual.json`
- `/templates/bakery-artisan.json`
- `/templates/fine-dining.json`

**Files to Modify:**
- `/components/super/OnboardingWizard.tsx` - Add template selection step

### 3. Auto-Create Admin User ⚡ HIGH PRIORITY
**What:** When tenant is created, automatically create admin user
**Flow:**
```
Tenant created successfully
  ↓
Generate secure random password
  ↓
Create User record:
  - email: tenant contact email
  - password: bcrypt hash
  - role: 'admin'
  - tenantId: new tenant ID
  ↓
Show credentials to super admin
  ↓
Send welcome email to tenant (optional)
```

**Files to Modify:**
- `/app/api/super/tenants/route.ts` - Add user creation logic

### 4. 10x UI/UX Polish
**What:** Make super admin dashboard professional and intuitive

**Improvements:**
- Large "Add New Tenant" CTA button (prominent, top right)
- Tenant cards with visual status indicators
- Progress stepper in onboarding wizard (Step 1/4, Step 2/4, etc.)
- Template preview images with hover effects
- Success modal with copy-able credentials
- Loading states during Stripe OAuth
- Error handling with clear messages

---

## 📋 2-3 HOUR EXECUTION PLAN

### Hour 1: Stripe Connect Integration (60 mins)

**Task 1.1: Create Stripe Connect OAuth URL Generator** (15 mins)
```typescript
// /app/api/super/stripe-connect/onboard/route.ts
import Stripe from 'stripe';

export async function POST(req: Request) {
  const { tenantId, tenantEmail } = await req.json();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const account = await stripe.accounts.create({
    type: 'express',
    email: tenantEmail,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXTAUTH_URL}/super-admin?error=stripe_refresh`,
    return_url: `${process.env.NEXTAUTH_URL}/super-admin/stripe-callback?account_id=${account.id}&tenant_id=${tenantId}`,
    type: 'account_onboarding',
  });

  return Response.json({ url: accountLink.url, accountId: account.id });
}
```

**Task 1.2: Create Stripe Callback Handler** (15 mins)
```typescript
// /app/super-admin/stripe-callback/page.tsx
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function StripeCallbackPage({ searchParams }: any) {
  const accountId = searchParams.account_id;
  const tenantId = searchParams.tenant_id;

  if (!accountId || !tenantId) {
    redirect('/super-admin?error=missing_params');
  }

  // Save Stripe account to tenant
  await prisma.tenantIntegration.upsert({
    where: { tenantId },
    create: {
      tenantId,
      stripeAccountId: accountId,
    },
    update: {
      stripeAccountId: accountId,
    },
  });

  redirect(`/super-admin?tenant_id=${tenantId}&stripe_connected=true`);
}
```

**Task 1.3: Update OnboardingWizard with Stripe Button** (30 mins)
- Add "Connect Stripe" button after basic info
- Show loading state during OAuth
- Display connected status when returning

---

### Hour 2: Template System (60 mins)

**Task 2.1: Create Template JSON Files** (15 mins)
Create 5 template files in `/templates/` folder with colors, fonts, style

**Task 2.2: Add Template Selection to OnboardingWizard** (30 mins)
```typescript
const [selectedTemplate, setSelectedTemplate] = useState<string>('classic-taqueria');

// Template cards with previews
{templates.map(template => (
  <div
    key={template.id}
    onClick={() => setSelectedTemplate(template.id)}
    className={selectedTemplate === template.id ? 'selected' : ''}
  >
    <img src={template.preview} alt={template.name} />
    <h3>{template.name}</h3>
  </div>
))}
```

**Task 2.3: Apply Template on Tenant Creation** (15 mins)
When creating tenant, read selected template JSON and apply colors/styles

---

### Hour 3: Admin User Creation + Polish (60 mins)

**Task 3.1: Auto-Create Admin User** (20 mins)
```typescript
// In /app/api/super/tenants/route.ts
const password = generateSecurePassword();
const hashedPassword = await bcrypt.hash(password, 10);

await prisma.user.create({
  data: {
    email: contactEmail,
    password: hashedPassword,
    role: 'admin',
    tenantId: newTenant.id,
  },
});

return { tenant, credentials: { email: contactEmail, password } };
```

**Task 3.2: UI Polish** (20 mins)
- Add prominent "Add New Tenant" button
- Progress stepper in wizard
- Success modal with credentials
- Loading states

**Task 3.3: Deploy & Test on VPS** (20 mins)
- Push to GitHub
- Deploy to VPS
- Test at https://alessacloud.com/super-admin
- Verify Stripe OAuth works
- Create test tenant end-to-end

---

## ✅ SUCCESS CRITERIA

**You'll know it's done when:**
- [ ] Visit https://alessacloud.com/super-admin
- [ ] Click "Add New Tenant"
- [ ] Fill in form (name, email, slug, address)
- [ ] Click "Connect Stripe"
- [ ] Redirected to Stripe onboarding
- [ ] Stripe redirects back with "Connected ✓" status
- [ ] Select template from 5 options
- [ ] Click "Create Tenant"
- [ ] See success modal with admin login credentials
- [ ] Copy credentials and test login at tenant's `/admin` URL
- [ ] Tenant admin dashboard loads with template applied

---

## 🚀 LET'S START

**First Task:** Create Stripe Connect onboarding flow (Hour 1)

Ready to begin?
