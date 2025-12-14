// Diagnostic script to identify URL flashing causes
// Run this in the browser console on the order page

console.log('🔍 URL Flashing Diagnostic Tool');
console.log('================================\n');

// Track URL changes
let urlChangeCount = 0;
let lastUrl = window.location.href;

const urlObserver = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    urlChangeCount++;
    console.log(`⚠️ URL Changed (#${urlChangeCount}):`);
    console.log(`   From: ${lastUrl}`);
    console.log(`   To:   ${currentUrl}`);
    console.log(`   Stack:`, new Error().stack);
    lastUrl = currentUrl;
  }
});

// Monitor URL changes
urlObserver.observe(document, { 
  subtree: true, 
  childList: true,
  attributes: true,
  attributeFilter: ['href']
});

// Track router operations
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  console.log('📍 history.pushState called:', args[2]);
  console.trace();
  return originalPushState.apply(history, args);
};

history.replaceState = function(...args) {
  console.log('🔄 history.replaceState called:', args[2]);
  console.trace();
  return originalReplaceState.apply(history, args);
};

// Track visibility changes
let visibilityChangeCount = 0;
document.addEventListener('visibilitychange', () => {
  visibilityChangeCount++;
  console.log(`👁️ Visibility change (#${visibilityChangeCount}):`, document.visibilityState);
});

// Track focus events
let focusCount = 0;
window.addEventListener('focus', () => {
  focusCount++;
  console.log(`🎯 Window focus (#${focusCount})`);
});

// Track router.refresh calls (if we can detect them)
let refreshCount = 0;
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('_next/data')) {
    refreshCount++;
    console.log(`🔄 Router refresh detected (#${refreshCount}):`, args[0]);
  }
  return originalFetch.apply(window, args);
};

console.log('✅ Monitoring started. Interact with the page to see what causes URL changes.');
console.log('\nSummary will be shown after 30 seconds...\n');

setTimeout(() => {
  console.log('\n📊 Summary (30 seconds):');
  console.log(`   URL changes: ${urlChangeCount}`);
  console.log(`   Visibility changes: ${visibilityChangeCount}`);
  console.log(`   Focus events: ${focusCount}`);
  console.log(`   Router refreshes: ${refreshCount}`);
  console.log('\n💡 To stop monitoring, refresh the page.');
}, 30000);

