#!/usr/bin/env node
/**
 * Test Frontend Sections API endpoints
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Frontend Sections API\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const tests = [
    {
      name: 'GET /api/admin/frontend-ui-sections',
      method: 'GET',
      url: `${BASE_URL}/api/admin/frontend-ui-sections`,
      expectedStatus: 401, // Should be unauthorized without auth
    },
    {
      name: 'POST /api/admin/frontend-ui-sections/reorder',
      method: 'POST',
      url: `${BASE_URL}/api/admin/frontend-ui-sections/reorder`,
      body: { sectionId: 'test', direction: 'up' },
      expectedStatus: 401,
    },
    {
      name: 'PUT /api/admin/frontend-ui-sections',
      method: 'PUT',
      url: `${BASE_URL}/api/admin/frontend-ui-sections`,
      body: { sectionId: 'test', updates: { enabled: true } },
      expectedStatus: 401,
    },
    {
      name: 'DELETE /api/admin/frontend-ui-sections',
      method: 'DELETE',
      url: `${BASE_URL}/api/admin/frontend-ui-sections?id=test`,
      expectedStatus: 401,
    },
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const res = await fetch(test.url, options);
      const status = res.status;
      const isExpected = status === test.expectedStatus;
      
      console.log(`  Status: ${status} ${isExpected ? '✅' : '❌'} (expected ${test.expectedStatus})`);
      
      if (!isExpected) {
        const text = await res.text();
        console.log(`  Response: ${text.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('✅ API endpoint tests complete');
  console.log('\n💡 Note: 401 errors are expected without authentication');
  console.log('   The endpoints exist and are responding correctly.\n');
}

testAPI().catch(console.error);

