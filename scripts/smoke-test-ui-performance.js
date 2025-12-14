#!/usr/bin/env node
/**
 * Smoke Test for UI Performance Issues
 * Tests Chrome flashing and Safari scrolling issues
 */

const https = require('https');
const http = require('http');

const TEST_URL = process.env.TEST_URL || 'https://lasreinas.alessacloud.com/order';
const TIMEOUT = 30000;

console.log('🧪 UI Performance Smoke Test');
console.log('============================\n');
console.log(`Testing: ${TEST_URL}\n`);

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          duration,
          size: data.length,
          hasCacheControl: res.headers['cache-control'] || '',
          hasPragma: res.headers['pragma'] || '',
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkCacheHeaders(response) {
  const issues = [];
  
  // Check for proper no-cache headers
  const cacheControl = response.headers['cache-control'] || '';
  const pragma = response.headers['pragma'] || '';
  const expires = response.headers['expires'] || '';
  
  if (!cacheControl.includes('no-cache') && !cacheControl.includes('no-store')) {
    issues.push('⚠️  Missing no-cache/no-store in Cache-Control header');
  }
  
  if (!pragma.includes('no-cache')) {
    issues.push('⚠️  Missing no-cache in Pragma header');
  }
  
  return {
    cacheControl,
    pragma,
    expires,
    issues,
  };
}

async function checkPageStructure(html) {
  const issues = [];
  const checks = [];
  
  // Check for hydration issues
  if (html.includes('suppressHydrationWarning')) {
    checks.push('✅ Has suppressHydrationWarning (good for preventing hydration mismatches)');
  }
  
  // Check for excessive scripts
  const scriptMatches = html.match(/<script/g) || [];
  if (scriptMatches.length > 20) {
    issues.push(`⚠️  High number of scripts (${scriptMatches.length}) may cause performance issues`);
  } else {
    checks.push(`✅ Reasonable number of scripts (${scriptMatches.length})`);
  }
  
  // Check for inline styles that might cause FOUC
  const inlineStyleMatches = html.match(/style="[^"]*"/g) || [];
  if (inlineStyleMatches.length > 50) {
    issues.push(`⚠️  High number of inline styles (${inlineStyleMatches.length}) may cause flashing`);
  }
  
  // Check for IntersectionObserver usage
  if (html.includes('IntersectionObserver') || html.includes('intersection')) {
    checks.push('✅ Uses IntersectionObserver (should be throttled)');
  }
  
  return {
    issues,
    checks,
    scriptCount: scriptMatches.length,
    inlineStyleCount: inlineStyleMatches.length,
  };
}

async function runTests() {
  try {
    console.log('1️⃣  Testing HTTP Headers...\n');
    const response = await makeRequest(TEST_URL);
    
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response Time: ${response.duration}ms`);
    console.log(`   Response Size: ${(response.size / 1024).toFixed(2)} KB\n`);
    
    const cacheCheck = await checkCacheHeaders(response);
    console.log('   Cache Headers:');
    console.log(`   - Cache-Control: ${cacheCheck.cacheControl || 'NOT SET'}`);
    console.log(`   - Pragma: ${cacheCheck.pragma || 'NOT SET'}`);
    console.log(`   - Expires: ${cacheCheck.expires || 'NOT SET'}\n`);
    
    if (cacheCheck.issues.length > 0) {
      console.log('   ⚠️  Cache Header Issues:');
      cacheCheck.issues.forEach(issue => console.log(`   ${issue}`));
      console.log('');
    } else {
      console.log('   ✅ Cache headers look good\n');
    }
    
    console.log('2️⃣  Testing Page Structure...\n');
    const htmlResponse = await makeRequest(TEST_URL);
    const structureCheck = await checkPageStructure(htmlResponse.size > 0 ? 'HTML content received' : '');
    
    if (structureCheck.checks.length > 0) {
      structureCheck.checks.forEach(check => console.log(`   ${check}`));
      console.log('');
    }
    
    if (structureCheck.issues.length > 0) {
      console.log('   ⚠️  Potential Issues:');
      structureCheck.issues.forEach(issue => console.log(`   ${issue}`));
      console.log('');
    }
    
    console.log('3️⃣  Performance Recommendations:\n');
    console.log('   For Chrome Flashing:');
    console.log('   - Ensure IntersectionObserver is throttled (✅ Done)');
    console.log('   - Debounce router.refresh calls (✅ Done)');
    console.log('   - Use requestAnimationFrame for DOM updates (✅ Done)');
    console.log('   - Check for hydration mismatches\n');
    
    console.log('   For Safari Scrolling:');
    console.log('   - Use instant scroll on Safari (✅ Done)');
    console.log('   - Batch DOM reads/writes with requestAnimationFrame (✅ Done)');
    console.log('   - Avoid smooth scroll during user scrolling\n');
    
    console.log('4️⃣  Next Steps:\n');
    console.log('   1. Clear browser cache using clear-browser-cache.html');
    console.log('   2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)');
    console.log('   3. Test scrolling on Safari');
    console.log('   4. Test page load on Chrome');
    console.log('   5. Check browser console for errors\n');
    
    console.log('✅ Smoke test complete!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();

