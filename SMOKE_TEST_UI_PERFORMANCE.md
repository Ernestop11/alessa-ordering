# UI Performance Smoke Test Guide

## 🎯 Purpose
This guide helps identify and fix Chrome flashing and Safari scrolling issues.

## 🧪 Smoke Test Steps

### 1. Clear All Caches

**Option A: Use the HTML Tool**
1. Open `scripts/clear-browser-cache.html` in your browser
2. Click "Clear Everything"
3. Wait for page to reload

**Option B: Manual Clear**

**Chrome:**
- Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Select "All time"
- Check: Cached images and files, Cookies, Site data
- Click "Clear data"

**Safari:**
- Press `Cmd+Option+E` to empty caches
- Or: Develop → Empty Caches
- Safari → Preferences → Privacy → Manage Website Data → Remove All

### 2. Hard Refresh

**Chrome/Edge:**
- `Ctrl+F5` or `Ctrl+Shift+R` (Windows)
- `Cmd+Shift+R` (Mac)

**Safari:**
- `Cmd+Option+R`

**Firefox:**
- `Ctrl+F5` or `Ctrl+Shift+R`

### 3. Run Automated Test

```bash
node scripts/smoke-test-ui-performance.js
```

This will check:
- ✅ Cache headers
- ✅ Response times
- ✅ Page structure
- ✅ Performance recommendations

### 4. Manual Browser Testing

#### Chrome Flashing Test:
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Navigate to `/order`
5. Scroll through the page
6. Stop recording
7. **Check for:**
   - Excessive re-renders (red bars)
   - Long tasks (>50ms)
   - Layout shifts (CLS)
   - Paint flashing

**Expected:** Smooth scrolling, no flashing, minimal re-renders

#### Safari Scrolling Test:
1. Open `/order` page
2. Scroll through menu sections
3. Click category navigation buttons
4. **Check for:**
   - Smooth scrolling (no jank)
   - Instant response to clicks
   - No scroll lag
   - Category nav scrolls correctly

**Expected:** Instant, smooth scrolling without lag

### 5. Console Checks

Open browser console and check for:

**Chrome:**
```javascript
// Check for hydration warnings
// Should see NO warnings about:
// - "Text content does not match server-rendered HTML"
// - "Hydration failed"
// - "Warning: Prop className did not match"

// Check render count
let renderCount = 0;
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'measure' && entry.name.includes('render')) {
      renderCount++;
    }
  }
});
```

**Safari:**
```javascript
// Check scroll performance
let scrollEvents = 0;
window.addEventListener('scroll', () => scrollEvents++);
// After scrolling, check scrollEvents - should be reasonable (< 100 for full page scroll)
```

## 🔧 Fixes Applied

### Chrome Flashing Fixes:
1. ✅ Throttled IntersectionObserver (150ms)
2. ✅ Wrapped callbacks in requestAnimationFrame
3. ✅ Debounced router.refresh (1s delay, 5s min interval)
4. ✅ Prevented unnecessary activeSectionId updates
5. ✅ Used requestAnimationFrame for DOM updates

### Safari Scrolling Fixes:
1. ✅ Instant scroll (`auto`) instead of smooth
2. ✅ requestAnimationFrame for scroll operations
3. ✅ Check if button visible before scrolling
4. ✅ Optimized category nav auto-scroll

## 📊 Performance Metrics

### Target Metrics:
- **First Contentful Paint (FCP):** < 1.8s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Cumulative Layout Shift (CLS):** < 0.1
- **Time to Interactive (TTI):** < 3.8s
- **Total Blocking Time (TBT):** < 200ms

### Check in Chrome DevTools:
1. Lighthouse → Performance
2. Run audit
3. Check scores (should be > 90)

## 🐛 Common Issues & Solutions

### Issue: Chrome still flashing
**Solution:**
1. Clear cache completely
2. Disable extensions
3. Check for hydration mismatches in console
4. Verify IntersectionObserver is throttled

### Issue: Safari scrolling still janky
**Solution:**
1. Verify instant scroll is used (check behavior: 'auto')
2. Check for smooth scroll conflicts
3. Disable smooth scrolling in system preferences
4. Test in private browsing mode

### Issue: Both browsers have issues
**Solution:**
1. Check network tab for slow requests
2. Verify cache headers are set correctly
3. Check for JavaScript errors
4. Test with browser extensions disabled

## ✅ Success Criteria

**Chrome:**
- ✅ No visual flashing on page load
- ✅ Smooth scrolling without stutter
- ✅ Category nav updates smoothly
- ✅ No console errors or warnings

**Safari:**
- ✅ Instant scroll response
- ✅ No scroll lag or jank
- ✅ Category nav scrolls correctly
- ✅ Smooth section transitions

## 📝 Test Checklist

- [ ] Cleared all browser caches
- [ ] Hard refreshed page
- [ ] Ran automated smoke test
- [ ] Tested Chrome scrolling (no flashing)
- [ ] Tested Safari scrolling (smooth)
- [ ] Checked browser console (no errors)
- [ ] Verified category nav works
- [ ] Tested on mobile devices
- [ ] Checked Lighthouse scores

## 🚀 Next Steps

If issues persist:
1. Check browser console for specific errors
2. Run Lighthouse audit
3. Check Network tab for slow requests
4. Test in incognito/private mode
5. Disable browser extensions
6. Check for conflicting CSS animations

