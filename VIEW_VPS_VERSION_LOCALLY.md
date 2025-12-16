# 🖥️ View VPS Version Locally

## Quick Way to See VPS Version

The VPS version has been saved. You can view it locally:

### Option 1: Restore VPS Version Temporarily

```bash
# Backup your current version
cp components/order/OrderPageClient.tsx components/order/OrderPageClient-CURRENT.tsx

# Restore VPS version
cp components/order/OrderPageClient-VPS-BACKUP.tsx components/order/OrderPageClient.tsx

# Start dev server
npm run dev

# Visit: http://localhost:3000/order?tenant=lapoblanita
```

### Option 2: View in Browser DevTools

You can also just open the VPS file and see the code structure:
```bash
code components/order/OrderPageClient-VPS-BACKUP.tsx
```

## What You'll See

The VPS version has:
- ✅ **Floating buttons on LEFT side**: Catering, Rewards, ADA all stacked vertically
- ✅ Menu upsell bundles working
- ✅ Bakery styling (amber colors)

## Restore Your Version Later

```bash
# When done viewing, restore your version:
cp components/order/OrderPageClient-CURRENT.tsx components/order/OrderPageClient.tsx
```

























