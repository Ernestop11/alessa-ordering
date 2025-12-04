# Stripe Connect Branding Setup Guide

## ✅ Account Reset Complete!

A new Stripe Connect account has been created: `acct_1Sa9yBB5ZBZfAAYP`

**New Onboarding Link:**
```
https://connect.stripe.com/setup/e/acct_1Sa9yBB5ZBZfAAYP/EvjUfAKqNjyR
```

---

## 🎨 Setting Up Alessa Ordering Branding

To customize the Stripe Connect onboarding page with "Alessa Ordering" branding:

### Step 1: Configure Connect Settings in Stripe Dashboard

1. **Go to Stripe Dashboard:**
   - Visit: https://dashboard.stripe.com/settings/connect
   - **IMPORTANT**: Make sure you're in **LIVE mode** (toggle off "Test mode" at the top)

2. **Configure Platform Details:**
   - **Platform name**: "Alessa Ordering" (or "Alessa Cloud")
   - **Support email**: Your support email (e.g., support@alessacloud.com)
   - **Support phone**: Your support phone (optional)
   - **Support URL**: Your help/support page URL

3. **Upload Branding Assets:**
   - **Logo**: Upload your Alessa Ordering logo
     - Recommended size: 200x200px
     - Format: PNG or SVG
     - Should be square or close to square
   - **Icon**: Small icon for mobile (optional)
     - Recommended size: 64x64px
   - **Brand color**: Your primary brand color (hex code)
     - This will be used for buttons and accents

4. **Set Terms & Policies:**
   - **Terms of Service URL**: Link to your terms page
   - **Privacy Policy URL**: Link to your privacy policy page

5. **Click "Save"** at the bottom

### Step 2: Verify Branding

After saving, all new Connect onboarding links will show:
- Your logo instead of Stripe's default
- "Alessa Ordering" (or your platform name) instead of "MVI SOLUTIONS"
- Your brand colors
- Your support information

**Note**: Branding changes apply to **all future** onboarding links. Existing links won't update, but new ones will use the new branding.

---

## 🔍 Verifying Account Mode

To check if your new account is in LIVE mode:

```bash
npm run check:account-mode lasreinas
```

You should see:
```
Livemode: ✅ LIVE
```

If it still shows TEST mode, there might be an issue with your Stripe keys.

---

## 📋 Complete Setup Checklist

### ✅ Already Done:
- [x] Reset old test account
- [x] Created new Connect account
- [x] Generated new onboarding link

### ⏳ Next Steps:
- [ ] Set up branding in Stripe Dashboard (see above)
- [ ] Verify account is in LIVE mode
- [ ] Complete onboarding with real business information
- [ ] Test with a real payment

---

## 🚨 Important Notes

1. **Account Mode is Set at Creation**: Once a Connect account is created, its mode (test/live) cannot be changed. You must create a new account (which we just did).

2. **Branding is Platform-Wide**: All Connect accounts will use the same branding set in Stripe Dashboard → Settings → Connect.

3. **Live Keys = Live Accounts**: When you use live keys (`sk_live_...`), all new Connect accounts will be in live mode.

4. **Test Accounts are Safe**: Test accounts can't process real payments, so they're safe to leave or delete.

---

## 🧪 Testing the New Account

After completing onboarding:

1. **Check account status:**
   ```bash
   npm run check:account-mode lasreinas
   ```

2. **Run full Stripe test:**
   ```bash
   npm run test:stripe
   ```

3. **Verify in Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/connect/accounts
   - Make sure you're in **LIVE mode**
   - Find account: `acct_1Sa9yBB5ZBZfAAYP`
   - Should show "Charges enabled" and "Payouts enabled"

---

## 📞 Quick Commands

```bash
# Check account mode
npm run check:account-mode lasreinas

# Generate new onboarding link
npm run generate:onboarding lasreinas

# Reset account (if needed)
npm run reset:stripe-account lasreinas

# Test Stripe configuration
npm run test:stripe
```

---

**Next Steps:**
1. ✅ New account created - check if it's in LIVE mode
2. ⏳ Set up branding in Stripe Dashboard
3. ⏳ Complete onboarding with the new link
4. ⏳ Verify everything works


