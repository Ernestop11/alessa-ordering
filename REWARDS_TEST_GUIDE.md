# 🎁 Rewards Program Test Guide

## Quick Start - Create Test Member

### Step 1: Create Test Rewards Member
Visit this URL in your browser (replace with your domain):
```
POST https://lasreinas.alessacloud.com/api/rewards/test-member
```

Or use curl:
```bash
curl -X POST https://lasreinas.alessacloud.com/api/rewards/test-member
```

This will:
- ✅ Create a test customer with 750 loyalty points (Gold tier)
- ✅ Create 3 sample orders with menu items
- ✅ Log you in automatically as the test member
- ✅ Set a customer session cookie

### Step 2: Test Rewards UI
1. **Visit the order page**: `https://lasreinas.alessacloud.com/order`
2. **Click the Rewards button** (🎁 with animated pulse)
3. **Verify you see**:
   - ⭐ Animated star icon header
   - Your name: "Test Rewards Member"
   - Points: 750 (Gold tier)
   - Progress bar to next tier
   - Previous Orders section with 3 orders
   - One-Click Re-Order buttons
   - Milestone Rewards section

### Step 3: Test Join Modal (as Guest)
1. **Log out** (or clear cookies)
2. **Click Rewards button**
3. **Click "Join Rewards Program"**
4. **Fill in the modal**:
   - Name: Your Name
   - Email: your@email.com
   - Phone: (555) 123-4567
5. **Click "Join Now & Start Earning!"**
6. **Verify**: Page reloads and you're logged in

### Step 4: Test One-Click Re-Order
1. **Open Rewards panel** (click 🎁 button)
2. **Scroll to "Previous Orders"**
3. **Click "⚡ One-Click Re-Order"** on any order
4. **Verify**:
   - Items added to cart
   - Cart opens automatically
   - Notification shows success

### Step 5: Test Cart Toggle
1. **Add items to cart**
2. **Open cart**
3. **Check "Become a Member" toggle**
4. **Complete checkout**
5. **Verify**: Customer is enrolled in rewards program

## Test Member Details

**Email**: `test-member@example.com`  
**Phone**: `+15551234567`  
**Points**: 750 (Gold tier)  
**Orders**: 3 sample orders with menu items

## API Endpoints

### Create Test Member
```
POST /api/rewards/test-member
```

### Check Test Member Status
```
GET /api/rewards/test-member
```

### Enroll in Rewards
```
POST /api/rewards/enroll
Body: { name, email, phone }
```

### Get Customer Rewards Data
```
GET /api/rewards/customer
```

## Expected UI Features

### Rewards Button
- 🎁 Animated gift icon
- Pulse animation for non-members
- Amber/yellow gradient background
- Hover effects

### Membership Panel
- ⭐ Animated star header (no photos until rewards unlocked)
- Points display with tier badge
- Progress bar to next tier
- Member perks list
- Milestone rewards (locked/unlocked states)
- Previous orders with one-click re-order
- Join button (for guests)

### Join Modal
- Beautiful gradient background
- Animated gift icon
- Form fields: Name, Email, Phone
- Success handling with auto-login

## Troubleshooting

### Test Member Not Created
- Check database connection
- Verify tenant exists
- Check server logs

### Rewards Panel Not Showing
- Verify membership program is enabled in admin
- Check browser console for errors
- Ensure customer session cookie is set

### Re-Order Not Working
- Verify menu items still exist
- Check cart state
- Verify customer session

