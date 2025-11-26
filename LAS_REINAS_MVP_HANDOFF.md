# Las Reinas MVP - Handoff Document

## 🎯 MVP Status: Ready for Production

This document contains all the information needed for Las Reinas to launch their online ordering system.

---

## 📍 Access URLs

### Customer Ordering Page
- **Preview URL:** https://lasreinas.alessacloud.com/order
- **Production URL (after DNS update):** https://www.lasreinascolusa.com/order

### Admin Dashboard
- **URL:** https://lasreinas.alessacloud.com/admin
- **Login Credentials:**
  - Email: `admin@lasreinas.com`
  - Password: `lasreinas_admin_2024`

### Fulfillment PWA (iPad)
- **URL:** https://lasreinas.alessacloud.com/admin/fulfillment
- **Instructions:** See "Install Fulfillment PWA on iPad" section below

---

## ✅ MVP Features Completed

### 1. Menu Management ✅
- **Menu Editor:** Full CRUD operations for menu items
- **Image Upload:** Upload and manage menu item images
- **Sections Management:** Organize menu items into sections
- **Pricing:** Set prices and mark items as available/unavailable
- **Featured Items:** Highlight popular items

### 2. Catering Management ✅
- **Catering Packages:** Create and manage catering packages
- **Gallery Images:** Upload images for catering modal
- **Customization Options:** Add removals and addons for packages
- **Frontend Integration:** Packages sync automatically to customer-facing page
- **Inquiry System:** Customers can submit catering inquiries

### 3. Order Processing ✅
- **Stripe Payments:** Secure payment processing via Stripe Connect
- **Order Flow:** Add to cart → Customer info → Payment → Confirmation
- **Apple Pay / Google Pay:** Supported via Stripe
- **Card Payments:** Full card input with validation
- **Order Confirmation:** Success page with order details

### 4. Fulfillment Dashboard ✅
- **Real-time Orders:** Live order feed with WebSocket updates
- **PWA Support:** Install on iPad for app-like experience
- **Notifications:** Browser notifications for new orders
- **Audio Alerts:** Customizable sounds for new orders
- **App Badges:** Visual badge count on home screen
- **Order Management:** Accept, mark ready, complete, cancel orders
- **Catering Inquiries:** View and manage catering requests

### 5. Email Notifications ✅
- **New Order Emails:** Automatic email to admin when orders are placed
- **Order Details:** Includes customer info, items, and total
- **Dashboard Link:** Direct link to fulfillment dashboard

---

## 🚀 Setup Instructions for Las Reinas

### Step 1: Connect Stripe Account

**IMPORTANT:** This must be done before accepting real orders!

1. **Log in to Admin Dashboard:**
   - Go to: https://lasreinas.alessacloud.com/admin
   - Email: `admin@lasreinas.com`
   - Password: `lasreinas_admin_2024`

2. **Navigate to Settings:**
   - Click the "Settings" tab in the left sidebar

3. **Find Stripe Payment Processing:**
   - Scroll to the "Integrations" section
   - Look for "Stripe Payment Processing" card

4. **Connect Your Stripe Account:**
   - Click the "Connect with Stripe" button
   - You'll be redirected to Stripe's onboarding page
   - Complete the form with your business information:
     - Business name, address, tax ID (EIN)
     - Bank account details for payouts
     - Business type and industry

5. **Complete Onboarding:**
   - Stripe may require identity verification (driver's license, passport, etc.)
   - Review may take 1-2 business days
   - You'll receive email updates from Stripe

6. **Verify Connection:**
   - Return to Admin Settings
   - You should see "✓ Connected" status
   - Once connected, all payments will route to your Stripe account

**Note:** Until Stripe is connected, the system will use test mode. After connecting, payments will be processed to your bank account.

---

### Step 2: Update DNS for Custom Domain

**Goal:** Make the ordering page available at www.lasreinascolusa.com

1. **Log in to Domain Registrar:**
   - Go to your domain registrar (where you manage lasreinascolusa.com)
   - This might be GoDaddy, Namecheap, Google Domains, etc.

2. **Add/Update CNAME Record:**
   - Find DNS management / DNS settings
   - Add or update the following record:
   
   ```
   Type: CNAME
   Name: www
   Value: lasreinas.alessacloud.com
   TTL: 3600 (or 1 hour)
   ```

3. **Wait for DNS Propagation:**
   - DNS changes can take 24-48 hours to fully propagate
   - You can check status at: https://dnschecker.org
   - Search for: `www.lasreinascolusa.com`
   - Should show: `lasreinas.alessacloud.com`

4. **Test the Domain:**
   - Once DNS propagates, test at: https://www.lasreinascolusa.com/order
   - It should show the Las Reinas ordering page

**Note:** The root domain (lasreinascolusa.com without www) may require a different DNS record. Contact your domain registrar if you want both www and non-www versions to work.

---

### Step 3: Set Up Email Notifications (Optional but Recommended)

**What this does:** Sends you an email every time a new order comes in.

1. **Choose an Email Provider:**
   - **Gmail (Recommended):** Easy to set up
   - **Other providers:** Outlook, SendGrid, etc.

2. **For Gmail:**
   - Go to: https://myaccount.google.com/apppasswords
   - Generate an "App Password" for "Mail"
   - Copy the 16-character password

3. **Contact Support:**
   - Email: support@alessacloud.com
   - Provide:
     - Email address to receive notifications (e.g., `orders@lasreinascolusa.com`)
     - App password (if using Gmail)
     - SMTP settings (if using other provider)

4. **Test:**
   - After setup, place a test order
   - You should receive an email notification within seconds

**Note:** Email notifications are optional. Orders will still appear in the Fulfillment Dashboard without email setup.

---

### Step 4: Install Fulfillment PWA on iPad

**What this does:** Makes the fulfillment dashboard work like a native app on your iPad.

1. **Open Safari on iPad:**
   - Navigate to: https://lasreinas.alessacloud.com/admin/fulfillment
   - Log in with admin credentials

2. **Add to Home Screen:**
   - Tap the Share button (square with up arrow)
   - Scroll down and tap "Add to Home Screen"
   - Edit the name if desired (e.g., "Las Reinas Orders")
   - Tap "Add"

3. **Pin to Dock (Optional):**
   - Long-press the app icon
   - Select "Edit Home Screen"
   - Drag the app icon to your dock for easy access

4. **Enable Notifications:**
   - Open the app from your home screen
   - When prompted, allow notifications
   - Notifications will alert you to new orders even when the app is closed

5. **Configure Sound Alerts:**
   - In the fulfillment dashboard, click "Settings" (gear icon)
   - Choose a notification sound
   - Adjust volume slider
   - Test the sound to make sure it works

**Features Available:**
- ✅ Real-time order updates
- ✅ Browser notifications
- ✅ Audio alerts
- ✅ App badge with order count
- ✅ Works offline (cached orders)
- ✅ Full-screen experience

---

## 📱 Daily Workflow

### Morning Setup (5 minutes)
1. Open Fulfillment Dashboard on iPad
2. Check for any pending orders from overnight
3. Enable notifications if not already enabled
4. Set notification volume

### During Service Hours
- **New Orders:** 
  - Notification appears on iPad
  - Sound alert plays
  - Order appears in dashboard automatically
  - Tap order to view details

- **Order Management:**
  - Tap "Accept" when you start preparing
  - Tap "Mark Ready" when order is ready
  - Tap "Complete" when customer picks up
  - Tap "Cancel" if order is cancelled

- **Catering Inquiries:**
  - Click "Catering Inquiries" tab
  - View customer contact info and event details
  - Update status as you contact them
  - Add internal notes

### End of Day
- Review completed orders
- Check email notifications archive
- Close fulfillment dashboard

---

## 🔧 Admin Dashboard Features

### Menu Editor (Menu Items Tab)
- **Add Items:** Click "Add New Item" button
- **Edit Items:** Click edit icon on any item
- **Upload Images:** Add image URL or upload file
- **Set Prices:** Enter price in dollars (e.g., `12.99`)
- **Availability:** Toggle available/unavailable
- **Tags:** Add tags like "popular", "spicy", "vegetarian"

### Catering Manager (Catering Tab)
- **Gallery Images:** Upload images that rotate in catering modal
- **Add Packages:** Click "Add New Package"
- **Customization:** Add removals and addon options
- **Categories:** Mark as "popular" or "holiday"
- **View Inquiries:** Switch to Fulfillment Dashboard → Catering Inquiries tab

### Settings Tab
- **Restaurant Info:** Update name, contact info, address
- **Branding:** Colors, logo, hero image
- **Stripe:** Connect your Stripe account
- **Delivery:** Set delivery radius and fees
- **Tax:** Configure tax rates

---

## 💳 Payment Processing

### How Payments Work
1. Customer places order on frontend
2. Enters payment information via Stripe
3. Payment is processed by Stripe
4. Funds are deposited to your connected Stripe account
5. Stripe sends funds to your bank account (daily payouts)

### Stripe Fees
- **Standard Rate:** 2.9% + $0.30 per transaction
- **Platform Fee (Alessa):** 2.9% + $0.30 (included in transaction)
- **Net to You:** Payment amount minus Stripe fees

### Payout Schedule
- Stripe deposits funds to your bank account daily
- First payout may take 2-7 days (Stripe's initial hold)
- After that, daily payouts are automatic

### Refunds
- Access Stripe Dashboard: https://dashboard.stripe.com
- Find the payment
- Click "Refund" button
- Refunds appear in Fulfillment Dashboard automatically

---

## 🆘 Troubleshooting

### Orders Not Appearing
- **Check:** Is the fulfillment dashboard open?
- **Refresh:** Pull down to refresh the page
- **Check Status:** Look at the "Orders" tab, not "Catering Inquiries"

### Notifications Not Working
- **iPad Settings:** Settings → Notifications → Safari → Allow Notifications
- **Browser:** Must use Safari (Chrome doesn't support PWA notifications well)
- **Home Screen:** App must be installed to home screen for best results

### Payments Not Processing
- **Check Stripe:** Go to Settings → Stripe section
- **Status:** Should show "✓ Connected" and "Payments Active"
- **Contact Stripe:** If onboarding incomplete, check email from Stripe

### Images Not Loading
- **Menu Items:** Check image URLs in Menu Editor
- **Format:** Use `/tenant/lasreinas/images/menu-items/filename.jpg` or full URL
- **Size:** Recommended: 800x600px or larger

### Catering Packages Not Showing
- **Admin:** Make sure packages are saved in Catering Manager
- **Frontend:** Check that "catering" feature flag is enabled (contact support)
- **Gallery:** Upload at least one gallery image

---

## 📞 Support Contacts

### Technical Support
- **Email:** support@alessacloud.com
- **Response Time:** Within 24 hours
- **For:** Technical issues, bugs, feature requests

### Stripe Support
- **Dashboard:** https://dashboard.stripe.com/support
- **Email:** support@stripe.com
- **For:** Payment processing questions, refunds, account issues

### Domain/DNS Support
- **Contact:** Your domain registrar support
- **For:** DNS configuration issues

---

## 🔐 Security Notes

### Password Security
- **Change Password:** Change admin password after first login
- **Strong Password:** Use at least 12 characters with numbers and symbols
- **Don't Share:** Never share admin credentials

### Stripe Security
- **Two-Factor Auth:** Enable in Stripe Dashboard
- **API Keys:** Never share Stripe API keys
- **Webhooks:** Only Alessa servers can access webhooks

### Data Privacy
- **Customer Data:** Stored securely in database
- **Payment Info:** Never stored, only processed by Stripe
- **GDPR:** Customer data can be deleted upon request

---

## 📊 Analytics & Reporting

### Order Analytics (Coming Soon)
- Daily order volume
- Revenue reports
- Popular items
- Customer retention

### Stripe Dashboard
- **Access:** https://dashboard.stripe.com
- **View:** All payments, refunds, payouts
- **Export:** Download CSV reports
- **Analytics:** Revenue charts and trends

---

## 🎓 Training Resources

### Video Tutorials (Coming Soon)
- Menu Editor walkthrough
- Catering Manager tutorial
- Fulfillment Dashboard basics
- Stripe Connect setup

### Documentation
- **Menu Editor Guide:** Coming soon
- **Fulfillment Guide:** Coming soon
- **Stripe Guide:** See Stripe's documentation

---

## ✅ Pre-Launch Checklist

- [ ] Stripe account connected and approved
- [ ] DNS updated for custom domain
- [ ] Test order placed successfully
- [ ] Email notifications working
- [ ] Fulfillment PWA installed on iPad
- [ ] Notifications enabled on iPad
- [ ] All menu items added and priced
- [ ] Images uploaded for menu items
- [ ] Catering packages created (if offering catering)
- [ ] Gallery images uploaded for catering
- [ ] Admin password changed
- [ ] Team trained on fulfillment dashboard

---

## 🚀 Launch Day Checklist

- [ ] Domain is live (www.lasreinascolusa.com works)
- [ ] Test order on production domain
- [ ] Payment processing test (use Stripe test card)
- [ ] Notifications working on iPad
- [ ] Team has iPad with PWA installed
- [ ] Contact info updated in settings
- [ ] Delivery radius set correctly
- [ ] Opening hours (if applicable)

---

## 📝 Notes

- **Test Mode:** System uses Stripe test mode until account is connected
- **Backup:** All data is backed up daily
- **Updates:** System updates automatically
- **Support:** Always available via email

---

**Last Updated:** November 25, 2024
**Version:** 1.0.0
**Status:** ✅ Production Ready

