# 🌐 URLs to View VPS Version with Floating Buttons

## 🎯 Main URLs to Check the VPS Version

### 1. La Poblanita Order Page (Recommended):
```
https://lapoblanitamexicanfood.com/order
```
**This should show the VPS version with floating buttons on the left side**

### 2. Root Domain with Tenant Parameter:
```
https://alessacloud.com/order?tenant=lapoblanita
```

### 3. Root Domain (Default Tenant):
```
https://alessacloud.com
```
Then navigate to `/order` (should default to lapoblanita)

---

## 👀 What to Look For in the VPS Version

### ✅ Floating Action Buttons (Left Side of Screen):
- 🎉 **Catering** button (top of stack)
- ⭐ **Rewards** button (middle)
- ♿ **Accessibility** button (bottom)
- All buttons are **vertically stacked** on the **left side** of the page
- Beautiful gradient styling on each button

### ✅ Other Features:
- Clean header with logo
- Menu upsell bundles section
- Bakery items have special amber/yellow styling
- Smooth scrolling and transitions

---

## 🔍 Quick Visual Check

When you visit the URL, look for:
1. **Left side of screen** - Should see 3 buttons stacked vertically:
   - Catering (🎉)
   - Rewards (⭐) 
   - Accessibility (♿)

2. **NOT in header** - These buttons are NOT at the top with the logo

3. **Mobile view** - On mobile, buttons should appear on right side above cart

---

## ⚠️ Note

If the site is down or showing errors, the PM2 process might need to be restarted:
```bash
ssh root@77.243.85.8 "pm2 restart alessa-ordering"
```

---

## 📝 Comparison

| Feature | VPS Version | Your Local Version |
|---------|-------------|-------------------|
| **Button Layout** | Floating (left side) | Header (top) |
| **Button Alignment** | ✅ All together (vertical stack) | ⚠️ Rewards separate |

The VPS version has the buttons **all lined up together** - that's the key difference!
