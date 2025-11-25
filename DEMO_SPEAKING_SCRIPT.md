# DEMO SPEAKING SCRIPT - LAS REINAS
**Live Presentation Script | 8-10 Minutes**
**Presenter Reads Aloud During Demo**

---

## 🎯 OPENING (30 seconds)

> "Good morning everyone. Today I'm excited to show you Alessa—a complete online ordering system built specifically for Mexican restaurants and carnicerías."
>
> "We're going to walk through the experience from two perspectives: first as Maria, the owner of Las Reinas Colusa, managing her restaurant through our admin dashboard. Then as a customer, ordering quesabirrias for lunch."
>
> "This is a live system running locally, so you'll see everything working in real-time. Let's dive in."

---

## 🍴 PART 1: CUSTOMER EXPERIENCE (3-4 minutes)

### Scene 1: Browse the Catalog (60 seconds)

**[Navigate to: http://localhost:3001?tenant=lasreinas]**

> "Here's what customers see when they visit LasReinasColusa dot com."
>
> "Notice the hero banner—85 viewport units tall, with a gradient overlay that matches Las Reinas' red and gold brand colors. This background image carousel rotates through four professional food photos, creating an appetizing first impression."
>
> "Below the 'Explore Menu' button, you see real-time stats pulled from the database: 69 menu items across 10 sections, with 7 featured specialties."

**[Scroll down to menu]**

> "The menu loads dynamically, organized into sections: Desayunos, Quesabirrias—their signature dish—Tacos, Burritos, and so on."

---

### Scene 2: Layout Customization (30 seconds)

**[Point to "Customize your view" section]**

> "Customers can switch between three layout modes:"

**[Click Grid button]**

> "Grid view—our default—shows items in a two or three-column layout, perfect for browsing."

**[Click List button]**

> "List view arranges items horizontally with images on the side."

**[Click Showcase button]**

> "And Showcase view emphasizes large, beautiful food photography. On mobile devices, we automatically default to Showcase because it works better with vertical scrolling."

**[Switch back to Grid]**

---

### Scene 3: Add to Cart with Customization (90 seconds)

**[Scroll to Quesabirrias item]**

> "Let's order their signature dish: Quesabirrias—three crispy birria tacos with melted cheese."

**[Click "Add to Cart" button]**

> "When you click Add to Cart, the customization modal opens. This is where Alessa really shines."
>
> "Customers see the full item description, a photo gallery if the restaurant uploaded multiple angles, and the base price: thirteen ninety-nine."
>
> "Below that, we have the Removals section. Say you don't want onions—"

**[Check "No Onions" checkbox]**

> "Just uncheck it. No extra charge for removals."
>
> "Then we have Add-Ons. Let's add guacamole for two dollars."

**[Check "Add Guacamole" checkbox]**

> "Watch the total update in real-time: now fifteen ninety-nine."
>
> "This customization system supports any combination of removals and add-ons. It's perfect for dietary restrictions, preferences, or upselling premium ingredients."

**[Click "Add to Cart · $15.99" button]**

> "Item added. Notice the success notification and the cart button updating with a count badge."

---

### Scene 4: Accessibility Features (30 seconds)

**[Point to ♿ Accessibility button on left side]**

> "One feature I want to highlight: built-in accessibility."

**[Click Accessibility button]**

> "Customers can toggle high contrast mode for better visibility, large text for easier reading, or reduced motion if they're sensitive to animations."
>
> "Maria, the owner, can set site-wide defaults from the admin panel—which we'll see in a moment—but customers always have control to override these settings."

**[Close accessibility panel]**

---

### Scene 5: Catering Panel (30 seconds)

**[Point to 🎉 Catering button]**

> "If catering is enabled—which it is for Las Reinas—customers see this Catering button."

**[Click Catering button]**

> "A slide-in panel appears with a gallery of catering setup photos, and eight clickable options: Taco Bar, Family Platters, Breakfast Catering, and so on."

**[Click "Taco Bar" option]**

> "Each option opens the same customization flow we saw earlier. Customers can exclude ingredients, add extras like churros or aguas frescas, and the price updates automatically."

**[Close panel]**

> "This makes catering orders just as easy as regular menu items—no phone calls, no confusion."

---

## 🖥️ PART 2: ADMIN DASHBOARD (5-6 minutes)

### Scene 6: Login & Onboarding (45 seconds)

**[Navigate to: http://localhost:3001/admin/login]**

> "Now let's switch to Maria's perspective. She logs into the admin dashboard."

**[Enter: admin@lasreinas.com / demo123]**
**[Click Login]**

> "After authentication, she lands on the main dashboard."
>
> "The first thing she sees is the onboarding checklist. This guides new restaurant owners through the essential setup steps: connecting Stripe for payments, configuring delivery with DoorDash, setting up a kitchen printer, and publishing their menu."
>
> "Las Reinas already has sixty-nine menu items imported, so that step is green. But she still needs to connect Stripe."

---

### Scene 7: Menu Manager - The Professional UI (90 seconds)

**[Click Menu Manager tab]**

> "Let me show you the Menu Manager—this is one of our most polished interfaces."
>
> "At the top, Maria sees diagnostic cards: 69 total items, 62 visible on the frontend, and 7 orphaned items that don't have a section assigned yet."
>
> "The orphaned items are flagged with a yellow warning. This real-time diagnostic helps Maria catch configuration issues before customers see them."

**[Click Orphaned filter tab]**

> "She filters to orphaned items—here are the seven. Let's fix one."

**[Select first item, open Assign Section dropdown]**

> "Select an item, choose a section from the dropdown—let's put this in Desserts—"

**[Select Desserts section]**

> "And watch: the item moves from orphaned to live. The frontend visible count increases to sixty-three. The diagnostic updates instantly."

**[Switch back to All filter]**

> "This interface also supports search, toggle visibility on and off, edit item details, upload photos, and delete items. Everything Maria needs to manage her menu is right here."

---

### Scene 8: Image Upload (45 seconds)

**[Click Edit icon on Quesabirrias item]**

> "Let's upload a professional photo for the Quesabirrias."

**[In edit modal, click Upload Image]**
**[Select file: quesabirrias.jpg]**

> "Maria drags and drops or selects a file. The upload happens instantly with a progress bar."

**[Wait for upload to complete]**

> "Preview appears. She clicks Save."

**[Click Save button]**

> "And now that image shows up on the menu card on the customer site. No developer needed—Maria does this herself in under thirty seconds."

---

### Scene 9: Operating Hours Configuration (60 seconds)

**[Click Settings tab]**
**[Scroll to Operating Hours section]**

> "Operating hours are critical for online ordering. Alessa gives Maria complete control."
>
> "She sees a seven-day grid: Monday through Sunday. Each day has open and close times, or she can mark it closed."

**[Point to Monday row]**

> "Monday: ten AM to nine PM. Friday and Saturday she stays open until ten. Sunday she closes earlier at eight PM."
>
> "But here's something unique—"

**[Toggle Winter Mode checkbox]**

> "Maria can enable Winter Mode for seasonal hours. She sets a date range—December first through March first—and defines different hours for those months. The system automatically switches based on the calendar."
>
> "Plus, she can add holiday closures."

**[Click Add Holiday button]**

> "Christmas Day, New Year's, Cinco de Mayo—whatever holidays the restaurant observes."

**[Fill: Date 12/25/2025, Name: Christmas Day]**
**[Click Add]**

> "Customers see 'Closed for Christmas Day' when they try to order. No confusing error messages."

---

### Scene 10: Accessibility Defaults (30 seconds)

**[Scroll to Accessibility Defaults section]**

> "Remember the accessibility panel customers saw? Maria configures the defaults here."
>
> "She can enable high contrast, large text, or reduced motion site-wide."

**[Check Large Text checkbox]**

> "If she checks Large Text, every customer who visits gets bigger fonts by default—perfect for an older demographic."
>
> "Customers can still override this, but it creates a more inclusive experience out of the box."

---

### Scene 11: Stripe Connect Onboarding (90 seconds)

**[Scroll to Payments section]**

> "Now the big one: payment processing."
>
> "To accept credit cards and deposit funds directly into her bank account, Maria needs to connect Stripe."

**[Point to Stripe Connect card]**

> "If she hasn't connected yet, she sees this blue card explaining the benefits: automatic daily payouts, PCI-compliant processing, standard rate of two-point-nine percent plus thirty cents per transaction."

**[Click "Connect with Stripe" button]**

> "She clicks Connect with Stripe. The button shows a loading spinner."

**[Wait for redirect to Stripe OAuth - simulated]**

> "In production, this redirects to Stripe's secure OAuth flow where she fills out her business information, bank details, and tax ID."
>
> "After completing the onboarding—let's simulate that—"

**[Manually navigate to: /admin/stripe-connect/complete]**

> "She returns to this success page."

**[Show green checkmark and success message]**

> "Green checkmark, 'Your Stripe account is connected!' It automatically redirects her back to settings in two seconds."

**[Wait for auto-redirect]**

> "And now look—"

**[Point to green Connected card]**

> "The card turns green, shows her Stripe account ID, business name, and status indicators: Payments enabled, Payouts enabled. She's ready to accept orders."
>
> "This entire flow—from clicking Connect to being production-ready—takes under five minutes."

---

### Scene 12: Catering Management (45 seconds)

**[Click Catering tab]**

> "One last thing: catering options."
>
> "Maria can add, edit, and delete catering packages from this tab."

**[Click Add Catering Option button]**

> "Let's add a new package: Enchilada Platter."

**[Fill form quickly:
- Name: Enchilada Platter
- Description: Cheese and chicken enchiladas with rice and beans
- Price: 120
- Serving info: Serves 10-15 people
- Category: Regular]**

> "She sets the price, serving size, adds removals—items customers can exclude like sour cream or onions—"

**[Add removal: Sour Cream]**

> "And add-ons for upselling."

**[Add addon: Extra Guacamole, $15]**

> "Extra guacamole for fifteen dollars, churros dessert for twenty."

**[Click Save]**

> "Save. Done. This package immediately appears on the customer-facing catering panel."

---

## 🎬 CLOSING (30 seconds)

**[Return to admin dashboard overview]**

> "So in under ten minutes, we've seen:
>
> From the customer side: a beautiful, fast, accessible ordering experience with real-time customization and catering options.
>
> From Maria's side: a professional admin dashboard where she manages her menu, uploads photos, sets operating hours, configures accessibility, and connects payment processing—all without touching code.
>
> Every feature is designed for restaurant owners who are experts at cooking, not at technology. Alessa handles the complexity so they can focus on what they do best: serving great food.
>
> That's the demo. Happy to take questions."

---

## 📝 PRESENTATION NOTES

### Timing Breakdown:
- **Opening:** 30 sec
- **Customer Experience:** 3-4 min
  - Catalog browse: 60 sec
  - Layout toggle: 30 sec
  - Add to cart: 90 sec
  - Accessibility: 30 sec
  - Catering: 30 sec
- **Admin Dashboard:** 5-6 min
  - Login/onboarding: 45 sec
  - Menu Manager: 90 sec
  - Image upload: 45 sec
  - Operating hours: 60 sec
  - Accessibility: 30 sec
  - Stripe: 90 sec
  - Catering: 45 sec
- **Closing:** 30 sec
- **Total:** 8-10 minutes

---

### Key Talking Points to Emphasize:

1. **Real-time Everything:** "Watch the count update instantly..."
2. **No Code Required:** "Maria does this herself in 30 seconds..."
3. **Designed for Restaurant Owners:** "Experts at cooking, not technology..."
4. **Accessibility Built-In:** "Inclusive experience out of the box..."
5. **Professional Polish:** "Real-time diagnostics help catch issues..."
6. **Speed:** "Under five minutes from Connect to production-ready..."

---

### Demo Environment Setup (Before Presentation):

**URLs to Bookmark:**
1. `http://localhost:3001?tenant=lasreinas` (Customer site)
2. `http://localhost:3001/admin/login` (Admin login)
3. `http://localhost:3001/admin/stripe-connect/complete` (Stripe success)

**Files to Prepare:**
- `quesabirrias.jpg` (for image upload demo)
- Screenshot of Stripe OAuth flow (if simulating)

**Database State:**
- 69 menu items seeded
- 7 orphaned items ready to fix
- Stripe NOT connected initially (show connection flow)
- Operating hours blank or default (show configuration)

**Browser Setup:**
- Clear cache
- Incognito window
- Console closed (or hidden)
- Zoom level: 100%
- Full-screen mode

---

### Fallback Plan (If Demo Breaks):

**Option 1: Video Recording**
- Pre-record demo as backup
- Play video if live system fails

**Option 2: Screenshots**
- Prepare slideshow of key screens
- Walk through static images

**Option 3: Skip & Pivot**
- "Let me show you the architecture diagram instead..."
- Focus on codebase walkthrough

---

### Q&A Preparation:

**Expected Questions:**

**Q:** "How do you handle inventory management?"
**A:** "Great question. We're tracking inventory in the database schema, but the UI is coming in phase 2. Right now, staff can manually mark items unavailable when they run out."

**Q:** "Can customers save their favorite orders?"
**A:** "Not yet—that's a membership feature we're building. Customers can create accounts, earn points, and save orders. The database schema supports it; we're finishing the UI."

**Q:** "What about email/SMS notifications?"
**A:** "The notification system is partially implemented. Admins get browser notifications when orders arrive. Email and SMS integration with SendGrid and Twilio is on the roadmap."

**Q:** "Does this work on mobile?"
**A:** "Absolutely. The entire interface is responsive. On mobile, the hero adjusts to 85vh, the menu switches to single-column, and floating buttons reposition above the cart. We've tested on iPhone, Android, and iPad."

**Q:** "How long would it take to onboard a new restaurant?"
**A:** "If they have their menu and photos ready, about an hour. Import menu data via our seeder script, upload assets, connect Stripe, configure hours, and they're live. We've documented the process in our deployment guide."

**Q:** "What's the tech stack?"
**A:** "Next.js 14 with React on the frontend, Prisma with PostgreSQL for the database, Stripe for payments, and deployed on a VPS with Nginx and PM2. Everything is server-side rendered for speed and SEO."

---

### Body Language & Delivery Tips:

- **Speak Slowly:** You know this system inside-out; the audience doesn't. Pause after key features.
- **Point with Mouse:** Hover over elements as you describe them. Visual cues help.
- **Smile:** Enthusiasm is contagious. Show pride in the work.
- **Make Eye Contact:** Don't stare at the screen. Glance at audience every 10-15 seconds.
- **Pause for Questions:** After each major section (customer/admin), ask "Any questions before we move on?"

---

### Script Variations by Audience:

**Technical Audience (Developers):**
- Emphasize architecture, real-time updates, tenant isolation
- Mention Prisma, Next.js 14, middleware, server components
- Show code snippets if time permits

**Business Audience (Investors, Clients):**
- Focus on user experience, ease of use, time savings
- Emphasize "no developer needed" repeatedly
- Show ROI: "Setup in 1 hour vs. weeks with competitors"

**Mixed Audience:**
- Balance both: show beautiful UI, then mention tech briefly
- Let them ask technical questions if interested

---

**END OF SPEAKING SCRIPT**
**Version:** 1.0
**Presenter:** [Your Name]
**Date:** November 18, 2025
**Duration:** 8-10 minutes
**Practice Runs Recommended:** 3-5 times
