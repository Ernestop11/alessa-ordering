# URL Flashing Fix for Safari

## Issue
URLs were flashing in Safari browser, causing a poor user experience.

## Root Causes Identified

### 1. **Frequent router.replace() calls** (PRIMARY ISSUE)
- **Location**: `components/order/OrderPageClient.tsx` lines 371-388
- **Problem**: URL was being updated on every state change (`activeLayout`, `activeSectionId`, `tenantSlug`)
- **Impact**: Safari shows URL changes more prominently than Chrome, causing visible flashing
- **Fix**: 
  - Added debouncing (300ms delay) to prevent rapid URL updates
  - Only update URL if it actually changed
  - Properly remove query params when they're not needed

### 2. **router.refresh() on visibility/focus events**
- **Location**: `components/order/OrderPageClient.tsx` lines 1059-1091
- **Problem**: `router.refresh()` was being called when page became visible or got focus
- **Impact**: Caused full page refreshes that Safari displays as URL flashing
- **Fix**: 
  - Removed `router.refresh()` calls from visibility/focus handlers
  - Only refresh gallery data, not the entire page
  - Maintains data freshness without causing URL flashing

## Changes Made

### 1. Debounced URL Updates
```typescript
// Before: Immediate URL update on every state change
router.replace(newUrl, { scroll: false });

// After: Debounced update with change detection
const timeoutId = setTimeout(updateUrl, 300);
// Only update if URL actually changed
if (newUrl !== window.location.pathname + window.location.search) {
  router.replace(newUrl, { scroll: false });
}
```

### 2. Removed router.refresh() from Event Handlers
```typescript
// Before: Full page refresh on visibility/focus
router.refresh();
refreshGallery();

// After: Only refresh gallery data
refreshGallery();
// No router.refresh() to prevent URL flashing
```

## Testing

### Diagnostic Script
A diagnostic script is available at `scripts/diagnose-url-flashing.js` to help identify URL flashing issues:

```javascript
// Run in browser console on order page
// Copy and paste the script to monitor URL changes
```

### Manual Testing
1. Open Safari browser
2. Navigate to order page
3. Scroll through menu sections
4. Switch between grid/list view
5. Tab away and back to the page
6. **Expected**: No URL flashing should occur

## Browser-Specific Behavior

### Safari
- More sensitive to URL changes
- Shows URL bar updates more prominently
- Requires debouncing and careful URL management

### Chrome
- Less sensitive to URL changes
- Handles rapid updates better
- Still benefits from these optimizations

## Performance Impact

- **Positive**: Reduced unnecessary router operations
- **Positive**: Better user experience in Safari
- **Neutral**: Gallery refresh still happens (needed for data freshness)
- **Minimal**: 300ms debounce delay is imperceptible to users

## Related Issues

- Previous fixes for Chrome flashing (IntersectionObserver optimization)
- Previous fixes for Safari scrolling (behavior: 'auto')
- Cache busting optimizations

## Future Improvements

1. Consider using `useTransition` for URL updates in React 18+
2. Implement URL state management with a reducer
3. Add analytics to track URL change frequency
4. Consider removing query params entirely if not needed for SEO

