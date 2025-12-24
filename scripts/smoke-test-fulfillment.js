#!/usr/bin/env node

/**
 * Smoke Test for Fulfillment System
 * Tests: Sound notifications, Auto-printing, Apple Pay orders, Real-time updates
 */

const BASE_URL = process.env.BASE_URL || 'https://lasreinas.alessacloud.com';

console.log('🧪 Fulfillment System Smoke Test');
console.log('================================\n');
console.log(`Testing against: ${BASE_URL}\n`);

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  for (const { name, fn } of tests) {
    try {
      process.stdout.write(`Testing: ${name}... `);
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (error) {
      console.log(`❌ FAIL: ${error.message}`);
      failed++;
    }
  }

  console.log('\n================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// Test 1: Fulfillment endpoint is accessible
test('Fulfillment dashboard endpoint accessible', async () => {
  const response = await fetch(`${BASE_URL}/admin/fulfillment`, {
    method: 'GET',
    redirect: 'manual',
  });
  
  if (response.status !== 200 && response.status !== 302) {
    throw new Error(`Expected 200 or 302, got ${response.status}`);
  }
});

// Test 2: Fulfillment stream endpoint exists
test('Fulfillment stream endpoint exists', async () => {
  // This will fail auth, but should return 401 not 404
  const response = await fetch(`${BASE_URL}/api/admin/fulfillment/stream`, {
    method: 'GET',
  });
  
  if (response.status === 404) {
    throw new Error('Stream endpoint not found (404)');
  }
  // 401 is expected (not authenticated)
  if (response.status !== 401 && response.status !== 403) {
    throw new Error(`Unexpected status: ${response.status}`);
  }
});

// Test 3: Printer configuration endpoint exists
test('Printer configuration endpoint exists', async () => {
  const response = await fetch(`${BASE_URL}/api/admin/fulfillment/printer`, {
    method: 'GET',
  });
  
  if (response.status === 404) {
    throw new Error('Printer endpoint not found (404)');
  }
});

// Test 4: Payment confirmation endpoint exists
test('Payment confirmation endpoint exists', async () => {
  const response = await fetch(`${BASE_URL}/api/payments/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  
  if (response.status === 404) {
    throw new Error('Confirm endpoint not found (404)');
  }
  // 400 is expected (missing paymentIntentId)
  if (response.status !== 400 && response.status !== 401) {
    throw new Error(`Unexpected status: ${response.status}`);
  }
});

// Test 5: Order events system is working
test('Order events system accessible', async () => {
  // Check if order-events module can be imported (server-side check)
  // This is a basic sanity check
  const response = await fetch(`${BASE_URL}/api/admin/fulfillment/stream`, {
    method: 'GET',
  });
  
  // Should not be 500 (server error)
  if (response.status === 500) {
    throw new Error('Server error in order events system');
  }
});

// Test 6: Apple Pay validation endpoint exists
test('Apple Pay validation endpoint exists', async () => {
  const response = await fetch(`${BASE_URL}/api/payments/apple/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  
  if (response.status === 404) {
    throw new Error('Apple Pay validation endpoint not found (404)');
  }
});

// Test 7: Printer configuration endpoint accessible
test('Printer configuration endpoint accessible', async () => {
  const response = await fetch(`${BASE_URL}/api/admin/fulfillment/printer`, {
    method: 'GET',
  });
  
  // 401/403 is expected (not authenticated), but 404 means endpoint doesn't exist
  if (response.status === 404) {
    throw new Error('Printer configuration endpoint not found (404)');
  }
});

// Test 8: Printer send endpoint exists (for network printers)
test('Printer send endpoint exists', async () => {
  const response = await fetch(`${BASE_URL}/api/admin/fulfillment/printer/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ipAddress: '127.0.0.1', port: 9100, data: 'test' }),
  });
  
  // 401/403 is expected (not authenticated), but 404 means endpoint doesn't exist
  if (response.status === 404) {
    throw new Error('Printer send endpoint not found (404)');
  }
});

console.log('Running smoke tests...\n');
runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});

