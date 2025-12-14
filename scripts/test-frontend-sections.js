// Using native fetch (Node 18+)

const BASE_URL = process.env.TEST_URL || 'https://lasreinas.alessacloud.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

async function testFrontendSections() {
  console.log('🧪 Testing Frontend Sections Functionality\n');
  console.log(`Testing against: ${BASE_URL}\n`);

  const results = {
    apiRoutes: [],
    frontendRendering: [],
    errors: [],
  };

  // Test 1: Check if API routes exist and are accessible
  console.log('--- Test 1: API Routes ---');
  
  try {
    // Test GET /api/admin/frontend-ui-sections
    console.log('Testing GET /api/admin/frontend-ui-sections...');
    const getRes = await fetch(`${BASE_URL}/api/admin/frontend-ui-sections`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (getRes.ok) {
      const data = await getRes.json();
      console.log(`✅ GET route works. Found ${Array.isArray(data) ? data.length : 0} sections.`);
      results.apiRoutes.push({ route: 'GET /api/admin/frontend-ui-sections', status: 'PASS' });
      
      // Check if default sections are initialized
      if (Array.isArray(data) && data.length > 0) {
        console.log(`   Default sections initialized: ${data.map(s => s.name).join(', ')}`);
      }
    } else {
      console.log(`❌ GET route failed: ${getRes.status} ${getRes.statusText}`);
      results.apiRoutes.push({ route: 'GET /api/admin/frontend-ui-sections', status: 'FAIL', error: `${getRes.status} ${getRes.statusText}` });
    }
  } catch (error) {
    console.log(`❌ GET route error: ${error.message}`);
    results.errors.push({ test: 'GET /api/admin/frontend-ui-sections', error: error.message });
  }

  // Test 2: Check frontend order page loads
  console.log('\n--- Test 2: Frontend Page Load ---');
  
  try {
    console.log('Testing GET /order...');
    const orderRes = await fetch(`${BASE_URL}/order`, {
      headers: {
        'Cache-Control': 'no-cache',
        'User-Agent': 'FrontendSectionsTest/1.0',
      },
    });
    
    if (orderRes.ok) {
      const html = await orderRes.text();
      // Check for key elements that indicate sections are rendering
      const hasHero = html.includes('Hero') || html.includes('hero');
      const hasSections = html.includes('section-') || html.includes('Menu Sections');
      const hasFeatured = html.includes('Featured') || html.includes('Chef Recommends');
      
      console.log(`✅ Order page loads successfully`);
      console.log(`   Hero section found: ${hasHero ? '✅' : '⚠️'}`);
      console.log(`   Menu sections found: ${hasSections ? '✅' : '⚠️'}`);
      console.log(`   Featured carousel found: ${hasFeatured ? '✅' : '⚠️'}`);
      
      results.frontendRendering.push({ 
        test: 'Order page load', 
        status: 'PASS',
        details: { hasHero, hasSections, hasFeatured }
      });
    } else {
      console.log(`❌ Order page failed: ${orderRes.status} ${orderRes.statusText}`);
      results.frontendRendering.push({ test: 'Order page load', status: 'FAIL', error: `${orderRes.status} ${orderRes.statusText}` });
    }
  } catch (error) {
    console.log(`❌ Order page error: ${error.message}`);
    results.errors.push({ test: 'GET /order', error: error.message });
  }

  // Test 3: Check cache headers
  console.log('\n--- Test 3: Cache Headers ---');
  
  try {
    const cacheRes = await fetch(`${BASE_URL}/api/admin/frontend-ui-sections`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    const cacheControl = cacheRes.headers.get('Cache-Control');
    const pragma = cacheRes.headers.get('Pragma');
    const expires = cacheRes.headers.get('Expires');
    
    console.log(`Cache-Control: ${cacheControl || 'N/A'}`);
    console.log(`Pragma: ${pragma || 'N/A'}`);
    console.log(`Expires: ${expires || 'N/A'}`);
    
    const hasNoStore = cacheControl?.includes('no-store');
    if (hasNoStore) {
      console.log('✅ Cache headers properly set');
      results.apiRoutes.push({ route: 'Cache headers', status: 'PASS' });
    } else {
      console.log('⚠️ Cache headers may need adjustment');
      results.apiRoutes.push({ route: 'Cache headers', status: 'WARN' });
    }
  } catch (error) {
    console.log(`❌ Cache header check error: ${error.message}`);
  }

  // Summary
  console.log('\n--- Test Summary ---');
  const totalTests = results.apiRoutes.length + results.frontendRendering.length;
  const passedTests = results.apiRoutes.filter(r => r.status === 'PASS').length + 
                     results.frontendRendering.filter(r => r.status === 'PASS').length;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  
  if (results.errors.length > 0) {
    console.log(`\nErrors encountered: ${results.errors.length}`);
    results.errors.forEach(err => {
      console.log(`  - ${err.test}: ${err.error}`);
    });
  }

  if (passedTests === totalTests && results.errors.length === 0) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed or had warnings. Review output above.');
    process.exit(1);
  }
}

testFrontendSections().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

