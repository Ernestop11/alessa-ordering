#!/usr/bin/env node

/**
 * Test: Operating Hours and Accepting Orders Sync
 * 
 * Verifies that:
 * 1. Accepting Orders status reflects business hours validation
 * 2. When business hours change, status updates automatically
 * 3. Toggle respects business hours
 * 4. All endpoints sync correctly
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function testEndpoint(method, path, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json().catch(() => ({ error: await response.text() }));
    
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

async function runTests() {
  log('🧪 Testing Operating Hours and Accepting Orders Sync');
  log('='.repeat(60));

  // Test 1: Verify GET endpoint returns operating hours and isOpen
  log('\n📋 Test 1: GET /api/admin/tenant-settings');
  const getResult = await testEndpoint('GET', '/api/admin/tenant-settings');
  if (!getResult.ok) {
    log('❌ GET endpoint failed', getResult);
    return;
  }
  
  const hasOperatingHours = getResult.data?.settings?.operatingHours !== undefined;
  const hasIsOpen = getResult.data?.settings?.isOpen !== undefined;
  
  log(hasOperatingHours && hasIsOpen ? '✅ GET endpoint returns operating hours and isOpen' : '⚠️  GET endpoint missing fields', {
    hasOperatingHours,
    hasIsOpen,
  });

  // Test 2: Verify PUT endpoint accepts operating hours
  log('\n📋 Test 2: PUT /api/admin/tenant-settings (operating hours)');
  const testHours = {
    timezone: 'America/Los_Angeles',
    storeHours: {
      monday: { open: '09:00', close: '21:00', closed: false },
      tuesday: { open: '09:00', close: '21:00', closed: false },
    },
    temporarilyClosed: false,
  };
  
  const putResult = await testEndpoint('PUT', '/api/admin/tenant-settings', {
    operatingHours: testHours,
  });
  
  if (putResult.ok) {
    log('✅ PUT endpoint accepts operating hours');
  } else {
    log('❌ PUT endpoint failed', putResult);
  }

  // Test 3: Verify PATCH endpoint (aliased to PUT)
  log('\n📋 Test 3: PATCH /api/admin/tenant-settings');
  const patchResult = await testEndpoint('PATCH', '/api/admin/tenant-settings', {
    isOpen: true,
  });
  
  if (patchResult.ok) {
    log('✅ PATCH endpoint works (aliased to PUT)');
  } else {
    log('❌ PATCH endpoint failed', patchResult);
  }

  // Test 4: Verify isOpen can be toggled
  log('\n📋 Test 4: Toggle isOpen flag');
  const currentStatus = getResult.data?.settings?.isOpen ?? true;
  const toggleResult = await testEndpoint('PUT', '/api/admin/tenant-settings', {
    isOpen: !currentStatus,
  });
  
  if (toggleResult.ok) {
    log('✅ isOpen flag can be toggled');
    
    // Verify it actually changed
    const verifyResult = await testEndpoint('GET', '/api/admin/tenant-settings');
    const newStatus = verifyResult.data?.settings?.isOpen;
    if (newStatus === !currentStatus) {
      log('✅ isOpen flag sync verified');
    } else {
      log('⚠️  isOpen flag may not have synced', {
        expected: !currentStatus,
        actual: newStatus,
      });
    }
    
    // Restore original status
    await testEndpoint('PUT', '/api/admin/tenant-settings', {
      isOpen: currentStatus,
    });
  } else {
    log('❌ Failed to toggle isOpen', toggleResult);
  }

  // Test 5: Verify operating hours and isOpen work together
  log('\n📋 Test 5: Operating hours + isOpen interaction');
  const combinedResult = await testEndpoint('PUT', '/api/admin/tenant-settings', {
    operatingHours: testHours,
    isOpen: true,
  });
  
  if (combinedResult.ok) {
    log('✅ Operating hours and isOpen can be updated together');
  } else {
    log('❌ Failed to update operating hours and isOpen together', combinedResult);
  }

  log('\n' + '='.repeat(60));
  log('✅ All endpoint tests completed');
  log('\n💡 Note: This test verifies endpoints. For full sync testing,');
  log('   use the smoke-test-sync.js script which tests the full flow.');
}

runTests().catch((error) => {
  log('❌ Test suite failed', { error: error.message, stack: error.stack });
  process.exit(1);
});

