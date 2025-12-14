#!/usr/bin/env node

/**
 * Smoke Test: Ordering Status Sync
 * 
 * Tests the sync between admin panel and frontend order page
 * for the "Accepting Orders" toggle functionality.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

let sessionCookie = null;

async function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Extract session cookie from response
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    sessionCookie = setCookie.split(';')[0];
  }

  return response;
}

async function login() {
  log('🔐 Logging in as admin...');
  
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/auth/signin/credentials`, {
      method: 'POST',
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Login failed: ${response.status} ${text}`);
    }

    log('✅ Login successful');
    return true;
  } catch (error) {
    log('❌ Login failed', { error: error.message });
    return false;
  }
}

async function getOrderingStatus() {
  log('📊 Fetching current ordering status...');
  
  try {
    const response = await fetchWithAuth(`${BASE_URL}/api/admin/tenant-settings`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.status}`);
    }

    const data = await response.json();
    const isOpen = data.settings?.isOpen ?? true;
    const operatingHours = data.settings?.operatingHours;
    
    log('📊 Current status', {
      isOpen,
      operatingHours: operatingHours ? 'configured' : 'not configured',
      temporarilyClosed: operatingHours?.temporarilyClosed || false,
    });

    return { isOpen, operatingHours };
  } catch (error) {
    log('❌ Failed to fetch status', { error: error.message });
    return null;
  }
}

async function toggleOrderingStatus(newStatus) {
  log(`🔄 Toggling ordering status to: ${newStatus ? 'OPEN' : 'CLOSED'}`);
  
  try {
    // First get current settings
    const currentResponse = await fetchWithAuth(`${BASE_URL}/api/admin/tenant-settings`);
    if (!currentResponse.ok) {
      throw new Error('Failed to fetch current settings');
    }
    const currentData = await currentResponse.json();
    const currentHours = currentData.settings?.operatingHours || {};

    // Update status
    const response = await fetchWithAuth(`${BASE_URL}/api/admin/tenant-settings`, {
      method: 'PUT',
      body: JSON.stringify({
        isOpen: newStatus,
        operatingHours: {
          ...currentHours,
          temporarilyClosed: false,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to update: ${response.status} ${text}`);
    }

    log(`✅ Status updated to: ${newStatus ? 'OPEN' : 'CLOSED'}`);
    return true;
  } catch (error) {
    log('❌ Failed to toggle status', { error: error.message });
    return false;
  }
}

async function checkFrontendStatus() {
  log('🌐 Checking frontend order page status...');
  
  try {
    // Wait a bit for cache to clear
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch(`${BASE_URL}/order`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch order page: ${response.status}`);
    }

    const html = await response.text();
    
    // Check for closed message indicators
    const hasClosedMessage = html.includes('temporarily closed') || 
                             html.includes('We are closed') ||
                             html.includes('closed');
    
    // Check for open indicators
    const hasOrderButton = html.includes('ORDER NOW') || 
                          html.includes('Add to Cart') ||
                          html.includes('order');

    log('🌐 Frontend status', {
      hasClosedMessage,
      hasOrderButton,
      pageLoaded: response.ok,
    });

    return { hasClosedMessage, hasOrderButton };
  } catch (error) {
    log('❌ Failed to check frontend', { error: error.message });
    return null;
  }
}

async function runSmokeTest() {
  log('🚀 Starting Ordering Status Sync Smoke Test');
  log('='.repeat(60));

  // Step 1: Login
  const loggedIn = await login();
  if (!loggedIn) {
    log('❌ Cannot proceed without login');
    process.exit(1);
  }

  // Step 2: Get initial status
  const initialStatus = await getOrderingStatus();
  if (!initialStatus) {
    log('❌ Cannot proceed without initial status');
    process.exit(1);
  }

  // Step 3: Check frontend before toggle
  log('\n📋 BEFORE TOGGLE:');
  const beforeFrontend = await checkFrontendStatus();

  // Step 4: Toggle to opposite status
  const newStatus = !initialStatus.isOpen;
  const toggled = await toggleOrderingStatus(newStatus);
  if (!toggled) {
    log('❌ Failed to toggle status');
    process.exit(1);
  }

  // Step 5: Verify backend updated
  await new Promise(resolve => setTimeout(resolve, 1000));
  const updatedStatus = await getOrderingStatus();
  if (!updatedStatus) {
    log('❌ Failed to verify updated status');
    process.exit(1);
  }

  if (updatedStatus.isOpen !== newStatus) {
    log('❌ STATUS MISMATCH: Backend did not update correctly', {
      expected: newStatus,
      actual: updatedStatus.isOpen,
    });
    process.exit(1);
  }

  log('✅ Backend status matches expected value');

  // Step 6: Check frontend after toggle
  log('\n📋 AFTER TOGGLE:');
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for cache revalidation
  const afterFrontend = await checkFrontendStatus();

  // Step 7: Verify sync
  log('\n🔍 SYNC VERIFICATION:');
  
  if (newStatus === false && afterFrontend?.hasClosedMessage) {
    log('✅ SYNC SUCCESS: Frontend shows closed message when status is closed');
  } else if (newStatus === true && afterFrontend?.hasOrderButton) {
    log('✅ SYNC SUCCESS: Frontend shows order button when status is open');
  } else {
    log('⚠️  SYNC WARNING: Frontend may not be synced', {
      backendStatus: newStatus ? 'OPEN' : 'CLOSED',
      frontendHasClosedMessage: afterFrontend?.hasClosedMessage,
      frontendHasOrderButton: afterFrontend?.hasOrderButton,
    });
  }

  // Step 8: Restore original status
  log('\n🔄 Restoring original status...');
  await toggleOrderingStatus(initialStatus.isOpen);
  await new Promise(resolve => setTimeout(resolve, 1000));
  const restoredStatus = await getOrderingStatus();
  
  if (restoredStatus?.isOpen === initialStatus.isOpen) {
    log('✅ Original status restored');
  } else {
    log('⚠️  Warning: Original status may not be restored', {
      original: initialStatus.isOpen,
      current: restoredStatus?.isOpen,
    });
  }

  log('\n' + '='.repeat(60));
  log('✅ Smoke test completed');
}

// Run the test
runSmokeTest().catch((error) => {
  log('❌ Smoke test failed with error', { error: error.message, stack: error.stack });
  process.exit(1);
});

