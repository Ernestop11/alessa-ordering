# Order Failure Root Cause Analysis

## Incident: Christina Quihuis Order - Dec 30, 2025 @ 5:48 PM

**Customer:** Christina Quihuis
**Amount Paid:** $12.44 (2x QUESABIRRIA @ $4.79 each)
**Stripe Payment:** ✅ SUCCEEDED (`pi_3SkEWhBmqcNiYSKM1WPPnGLM`)
**Order Created:** ❌ FAILED SILENTLY
**Customer Impact:** Paid but received no order confirmation, no notification to kitchen

---

## Root Cause Analysis

### Primary Bug: Cart Item ID Mismatch

**Location:** `components/Cart.tsx` lines 284, 406

**The Bug:**
```javascript
// BEFORE (BUG)
const normalizedItems = items.map((item) => ({
  menuItemId: item.id,  // ❌ Uses cart's unique ID, not database ID
  quantity: item.quantity,
  price: roundCurrency(item.price),
}));
```

**What Happened:**
1. User adds "QUESABIRRIA" to cart
2. Cart creates unique ID: `27838278-dd62-43a5-9e9d-59b27cc4c46c-1767145702750` (UUID + timestamp)
3. This ID is sent to payment intent API
4. Payment succeeds in Stripe
5. Order creation tries to find MenuItem with ID `27838278-dd62-43a5-9e9d-59b27cc4c46c-1767145702750`
6. MenuItem doesn't exist (actual ID is `27838278-dd62-43a5-9e9d-59b27cc4c46c`)
7. Order-service SILENTLY SKIPS the item (line 246: `if (!item?.menuItemId) continue;`)
8. Order created with 0 items - but no error thrown!

---

## All Identified Issues

### 1. Inconsistent Cart Item ID Handling

| Code Location | ID Format | menuItemId | Status |
|---------------|-----------|------------|--------|
| CustomizationModal (line 828) | `${id}-${Date.now()}` | ✅ Set correctly | GOOD |
| Quick Add (line 952) | `item.id` | ❌ Not set | BUG |
| Carousel Add (line 993) | `item.id` | ❌ Not set | BUG |
| Highlight Add (line 972) | `${card.id}-${Date.now()}` | ❌ Not set | BUG |

### 2. Silent Failure in Order Service

**Location:** `lib/order-service.ts` lines 246, 275

```javascript
// Line 246 - Silently skips items without menuItemId
if (!item?.menuItemId) continue;

// Line 275 - Silently skips invalid items
if (!isValidItem) continue;
```

**Problem:** Orders can be created with ZERO items and no error is thrown.

### 3. No Item Validation Before Payment

The checkout flow creates a PaymentIntent and charges the customer **before** validating that order items exist in the database. If items are invalid, payment still succeeds but order fails.

### 4. Cart State Persistence Issues (Potential)

Zustand cart doesn't persist to localStorage by default. If:
- User refreshes mid-checkout
- Browser closes unexpectedly
- Mobile app goes to background

Cart items may be lost, causing "cart won't appear" issues reported by customers.

### 5. No Webhook Fallback Working

The webhook should have caught this, but:
- Webhook receives same invalid payload from PaymentSession
- Same validation fails
- Order still not created

---

## Customer Reports: "Cart Wouldn't Appear"

Based on customer complaints, additional investigation needed for:

1. **Hydration mismatch** - Server renders empty cart, client has items
2. **Portal mounting issues** - Cart drawer not rendering to DOM
3. **Z-index conflicts** - Cart hidden behind other elements
4. **JavaScript errors** - Silent failures preventing cart render

---

## Industry Best Practices (Research)

### From Stripe Documentation:
- Use **idempotency keys** for all payment operations
- Handle network errors with **exponential backoff**
- Implement **webhook idempotency** - process events only once
- Validate order BEFORE creating PaymentIntent

### From E-commerce Validation Guides:
- **Pre-checkout validation** - Verify all items exist and are available
- **Stock validation** - Confirm items in stock before payment
- **Real-time error messaging** - Tell user exactly what's wrong
- **Cart persistence** - Use localStorage/sessionStorage for cart

### From Zustand Best Practices:
- Use **persist middleware** for cart state
- Implement **hydration guards** to prevent SSR mismatch
- Use **skipHydration** for async storage
- Check `persist.hasHydrated()` before rendering

---

## Immediate Fixes Required

### Fix 1: Ensure All Cart Additions Set menuItemId ✅ (DONE)
```javascript
// Cart.tsx - Fixed
menuItemId: item.menuItemId || item.id.replace(/-\d{13}$/, ''),
```

### Fix 2: Add menuItemId to All addToCart Calls
```javascript
// OrderPageClient.tsx - Quick Add (line 951)
addToCart({
  id: `${item.id}-${Date.now()}`,
  menuItemId: item.id,  // ADD THIS
  name: item.name,
  ...
});
```

### Fix 3: Validate Items BEFORE Payment Intent
```javascript
// api/payments/intent/route.ts
// Add validation step before Stripe call
const validatedItems = await validateCartItems(items, tenantId);
if (validatedItems.invalid.length > 0) {
  return NextResponse.json({
    error: 'Some items are no longer available',
    invalidItems: validatedItems.invalid
  }, { status: 400 });
}
```

### Fix 4: Throw Error on Empty Order
```javascript
// lib/order-service.ts
// After item creation loop
const createdItems = await prisma.orderItem.count({ where: { orderId: order.id }});
if (createdItems === 0) {
  await prisma.order.delete({ where: { id: order.id }});
  throw new Error('Order creation failed: No valid items');
}
```

### Fix 5: Add Cart Persistence
```javascript
// lib/store/cart.ts
import { persist } from 'zustand/middleware';

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      // ... existing store
    }),
    {
      name: 'cart-storage',
      skipHydration: true, // Prevent SSR mismatch
    }
  )
);
```

### Fix 6: Add Order Monitoring/Alerts
- Log all order creation attempts with full payload
- Alert on orders with 0 items
- Alert on pending PaymentSessions > 5 minutes
- Daily reconciliation: Stripe payments vs Orders

---

## Testing Requirements

### Unit Tests
1. Cart item ID extraction from various formats
2. Order service with invalid menuItemIds
3. Order service with empty items array
4. Payment intent validation

### Integration Tests
1. Full checkout flow - happy path
2. Checkout with invalid item
3. Checkout with out-of-stock item
4. Concurrent checkout (race condition)
5. Network failure during order creation
6. Cart persistence across page refresh

### Monitoring
1. Real-time order creation success rate
2. PaymentSession completion rate
3. Time between payment and order creation
4. Cart abandonment rate

---

## Implementation Priority

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| P0 | Fix Cart.tsx menuItemId | ✅ Done | Critical |
| P0 | Fix all addToCart calls | 30 min | Critical |
| P0 | Throw error on empty order | 15 min | Critical |
| P1 | Pre-payment item validation | 1 hour | High |
| P1 | Cart persistence | 30 min | High |
| P2 | Order monitoring/alerts | 2 hours | Medium |
| P2 | Comprehensive test suite | 4 hours | Medium |

---

## References

- [Stripe Idempotency Best Practices](https://stripe.com/blog/idempotency)
- [Stripe Error Handling](https://docs.stripe.com/error-handling)
- [Zustand Persist Middleware](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)
- [E-commerce Cart Validation Testing](https://testvox.com/e-commerce-cart-and-checkout-functionality/)
