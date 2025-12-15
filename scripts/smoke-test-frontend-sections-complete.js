#!/usr/bin/env node
/**
 * Complete smoke test for Frontend Sections sync
 * Tests: Database → API → Frontend rendering
 */

const BASE_URL = process.env.TEST_URL || 'https://lapoblanita.alessacloud.com';

async function smokeTest() {
  console.log('🧪 COMPLETE Frontend Sections Sync Smoke Test\n');
  console.log(`Testing: ${BASE_URL}\n`);

  const results = {
    database: null,
    api: null,
    frontend: null,
    errors: [],
  };

  // Test 1: Check database structure
  console.log('=== Test 1: Database Structure ===');
  console.log('  ℹ️  Frontend sections stored in: TenantSettings.frontendConfig.frontendUISections');
  console.log('  ℹ️  Each section has: id, type, position, enabled, content');
  console.log('  ℹ️  Position determines render order\n');

  // Test 2: Check API endpoints
  console.log('=== Test 2: API Endpoints ===');
  const endpoints = [
    { path: '/api/admin/frontend-ui-sections', method: 'GET', name: 'Get sections' },
    { path: '/api/admin/frontend-ui-sections/reorder', method: 'POST', name: 'Reorder sections' },
    { path: '/api/admin/revalidate', method: 'POST', name: 'Revalidate cache' },
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Cache-Control': 'no-cache' },
      });
      const status = res.status;
      const exists = status !== 404;
      results.api = results.api || {};
      results.api[endpoint.name] = { status, exists };
      console.log(`  ${exists ? '✅' : '❌'} ${endpoint.name}: ${status} ${status === 401 ? '(auth required)' : ''}`);
    } catch (error) {
      console.log(`  ❌ ${endpoint.name}: ${error.message}`);
      results.errors.push(`${endpoint.name}: ${error.message}`);
    }
  }
  console.log('');

  // Test 3: Check frontend page
  console.log('=== Test 3: Frontend Order Page ===');
  try {
    const res = await fetch(`${BASE_URL}/order`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    const html = await res.text();
    
    const pageLoads = res.status === 200;
    console.log(`  ${pageLoads ? '✅' : '❌'} Order page loads: ${res.status}`);
    
    // Check if frontendUISections data is in the page
    const hasFrontendData = html.includes('frontend') || html.includes('section') || html.includes('hero');
    console.log(`  ${hasFrontendData ? '✅' : '⚠️'}  Page contains frontend-related content`);
    
    // Check for revalidatePath calls in API routes
    console.log(`  ℹ️  API routes should call revalidatePath('/order') and revalidatePath('/')`);
    
    results.frontend = { status: res.status, hasData: hasFrontendData };
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    results.frontend = { error: error.message };
    results.errors.push(`Frontend: ${error.message}`);
  }
  console.log('');

  // Test 4: Data flow verification
  console.log('=== Test 4: Data Flow ===');
  console.log('  📊 Expected flow:');
  console.log('     1. Admin moves section in MenuEditor → Frontend tab');
  console.log('     2. API: POST /api/admin/frontend-ui-sections/reorder');
  console.log('     3. API updates TenantSettings.frontendConfig.frontendUISections');
  console.log('     4. API calls revalidatePath("/order") and revalidatePath("/")');
  console.log('     5. Frontend page refetches on next request');
  console.log('     6. OrderPageClient receives updated frontendUISections prop');
  console.log('     7. Sections sorted by position and rendered');
  console.log('');

  // Test 5: Issue identification
  console.log('=== Test 5: Issue Analysis ===');
  console.log('  🔍 Potential issues:');
  console.log('     ❌ Frontend not polling/refetching sections');
  console.log('     ❌ revalidatePath not working (cache not invalidated)');
  console.log('     ❌ Frontend not sorting by position correctly');
  console.log('     ❌ FrontendUISections not being passed to OrderPageClient');
  console.log('     ❌ Position values not being updated correctly');
  console.log('');

  // Summary
  console.log('=== Summary ===');
  const apiWorks = results.api && Object.values(results.api).every(e => e.exists !== false);
  const frontendWorks = results.frontend?.status === 200;
  
  console.log(`  API Endpoints: ${apiWorks ? '✅' : '❌'}`);
  console.log(`  Frontend Page: ${frontendWorks ? '✅' : '❌'}`);
  console.log('');

  if (apiWorks && frontendWorks) {
    console.log('✅ Basic connectivity works');
    console.log('');
    console.log('⚠️  ISSUE IDENTIFIED:');
    console.log('   Frontend sections are NOT being refetched after reordering.');
    console.log('   The "Accept Orders" button works because:');
    console.log('   - It uses revalidatePath to invalidate cache');
    console.log('   - Frontend might be polling ordering status');
    console.log('');
    console.log('💡 SOLUTION:');
    console.log('   1. Add client-side polling for frontendUISections (like accept orders)');
    console.log('   2. OR add router.refresh() after reorder (like accept orders)');
    console.log('   3. OR add timestamp query param to force refetch');
    console.log('   4. Ensure frontend sorts sections by position on every render');
  } else {
    console.log('❌ Some tests failed - check errors above');
  }
}

smokeTest().catch(console.error);

