#!/usr/bin/env node
/**
 * Las Reinas Print Agent
 *
 * A background service that polls the VPS for new orders and prints them
 * directly to a Munbyn WiFi thermal printer via TCP port 9100.
 *
 * This runs as a LaunchAgent - starts automatically on login and restarts on crash.
 */

import net from 'net';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import os from 'os';

// Load config
const configPath = path.join(process.cwd(), 'config.json');
let config = {
  vpsUrl: process.env.VPS_URL || 'https://lasreinascolusa.com',
  tenantSlug: process.env.TENANT_SLUG || 'lasreinas',
  agentName: process.env.AGENT_NAME || 'lasreinas-mac',
  pollInterval: parseInt(process.env.POLL_INTERVAL || '5000'),
  printerHost: process.env.PRINTER_HOST || 'auto',
  printerPort: parseInt(process.env.PRINTER_PORT || '9100'),
  secret: process.env.PRINT_AGENT_SECRET || '',
};

if (fs.existsSync(configPath)) {
  try {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...fileConfig };
  } catch (e) {
    console.error('Failed to load config.json:', e.message);
  }
}

// Validate config
if (!config.secret) {
  console.error('ERROR: PRINT_AGENT_SECRET not set!');
  console.error('Run setup.sh first or set PRINT_AGENT_SECRET environment variable.');
  process.exit(1);
}

// Track printed orders
const printedOrders = new Set();
let lastError = null;

/**
 * Get local network subnet from Mac's IP address
 */
function getLocalSubnet() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const parts = iface.address.split('.');
        return {
          subnet: parts.slice(0, 3).join('.'),
          localIP: iface.address
        };
      }
    }
  }
  return null;
}

/**
 * Check if a specific IP has port 9100 open (thermal printer)
 */
function checkPrinterPort(ip, port = 9100, timeout = 500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, ip);
  });
}

/**
 * Scan network for thermal printers (port 9100)
 */
async function discoverPrinter() {
  const network = getLocalSubnet();
  if (!network) {
    console.log('❌ Could not determine local network');
    return null;
  }

  console.log(`🔍 Scanning network ${network.subnet}.x for thermal printers...`);
  console.log(`   Your IP: ${network.localIP}`);

  // Common printer IPs to check first
  const priorityIPs = [
    `${network.subnet}.108`,
    `${network.subnet}.44`,
    `${network.subnet}.100`,
    `${network.subnet}.101`,
    `${network.subnet}.102`,
    `${network.subnet}.50`,
    `${network.subnet}.51`,
  ];

  // Check priority IPs first
  for (const ip of priorityIPs) {
    process.stdout.write(`   Checking ${ip}...`);
    const found = await checkPrinterPort(ip);
    if (found) {
      console.log(' ✅ FOUND!');
      return ip;
    }
    console.log(' no');
  }

  // Full subnet scan
  const checkedIPs = new Set([...priorityIPs, network.localIP]);
  console.log('   Scanning remaining IPs...');

  for (let i = 1; i <= 254; i++) {
    const ip = `${network.subnet}.${i}`;
    if (checkedIPs.has(ip)) continue;

    const found = await checkPrinterPort(ip);
    if (found) {
      console.log(`   ✅ Found printer at ${ip}`);
      return ip;
    }
  }

  return null;
}

/**
 * Send ESC/POS data to printer (single attempt)
 */
function sendToPrinterOnce(data) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(
      { host: config.printerHost, port: config.printerPort, timeout: 5000 },
      () => {
        socket.write(Buffer.from(data, 'binary'), (err) => {
          if (err) {
            socket.destroy();
            reject(err);
            return;
          }
          socket.end();
        });
      }
    );

    socket.on('close', () => resolve());
    socket.on('error', (error) => reject(error));
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Connection timeout'));
    });
  });
}

/**
 * Send to printer with retry logic
 */
async function sendToPrinter(data, maxRetries = 3) {
  let lastErr;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendToPrinterOnce(data);
    } catch (error) {
      lastErr = error;
      if (attempt < maxRetries) {
        console.log(`   ⚠️  Attempt ${attempt} failed, retrying in 2s...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  throw lastErr;
}

/**
 * Format ESC/POS receipt
 */
function formatReceipt(order) {
  const ESC = '\x1b';
  const GS = '\x1d';
  const lines = [];

  // Initialize
  lines.push(`${ESC}@`);
  lines.push(`${GS}(K\x02\x00\x31\x09`); // Max density
  lines.push(`${ESC}E\x01`); // Bold ON
  lines.push(`${ESC}G\x01`); // Double-strike ON
  lines.push(`${ESC}a\x01`); // Center

  // Header
  lines.push(`${GS}!\x11`); // Double size
  lines.push('');
  lines.push('*** LAS REINAS ***');
  lines.push(`${GS}!\x00`);
  lines.push('Authentic Mexican Cuisine');
  lines.push('Colusa, CA');
  lines.push('');

  // Order number
  lines.push(`${GS}!\x11`);
  lines.push(`ORDER #${order.id.slice(-6).toUpperCase()}`);
  lines.push(`${GS}!\x00`);
  lines.push('');

  // Fulfillment type
  const fulfillment = (order.fulfillmentMethod || 'pickup').toUpperCase();
  if (fulfillment === 'DELIVERY') {
    lines.push(`${GS}!\x11`);
    lines.push('** DELIVERY **');
    lines.push(`${GS}!\x00`);
  } else if (fulfillment === 'DINE_IN' || fulfillment === 'DINEIN') {
    lines.push(`${GS}!\x11`);
    lines.push('** DINE-IN **');
    lines.push(`${GS}!\x00`);
  } else {
    lines.push(`${GS}!\x01`);
    lines.push('[ PICKUP ]');
    lines.push(`${GS}!\x00`);
  }
  lines.push('');

  // Date/Time
  const orderDate = new Date(order.createdAt);
  const timeStr = orderDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const dateStr = orderDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  lines.push(`${dateStr} at ${timeStr}`);
  lines.push('');

  // Customer info
  lines.push('================================');
  lines.push(`${ESC}a\x00`); // Left align

  if (order.customerName) {
    lines.push(`${GS}!\x01`);
    lines.push(`Customer: ${order.customerName}`);
    lines.push(`${GS}!\x00`);
  }
  if (order.customerPhone) {
    lines.push(`Phone: ${order.customerPhone}`);
  }
  if (order.deliveryAddress) {
    lines.push('');
    lines.push('Delivery Address:');
    lines.push(order.deliveryAddress);
  }
  lines.push('');

  // Items header
  lines.push('================================');
  lines.push(`${ESC}a\x01`);
  lines.push(`${GS}!\x01`);
  lines.push('ORDER ITEMS');
  lines.push(`${GS}!\x00`);
  lines.push('================================');
  lines.push(`${ESC}a\x00`);
  lines.push('');

  // Items
  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      const name = item.menuItemName || item.name || 'Menu Item';
      const qty = item.quantity || 1;
      const lineTotal = (Number(item.price || 0) * qty).toFixed(2);

      lines.push(`${GS}!\x01`);
      lines.push(`${qty}x ${name}`);
      lines.push(`${GS}!\x00`);
      lines.push(`     $${lineTotal}`);

      if (item.notes) {
        lines.push(`   -> ${item.notes}`);
      }
      if (item.modifiers && item.modifiers.length > 0) {
        for (const mod of item.modifiers) {
          lines.push(`   + ${mod.name || mod}`);
        }
      }
      lines.push('');
    }
  }

  // Totals
  lines.push('================================');

  if (order.subtotalAmount) {
    lines.push(`Subtotal:          $${Number(order.subtotalAmount).toFixed(2)}`);
  }
  if (order.taxAmount && Number(order.taxAmount) > 0) {
    lines.push(`Tax:               $${Number(order.taxAmount).toFixed(2)}`);
  }
  if (order.tipAmount && Number(order.tipAmount) > 0) {
    lines.push(`Tip:               $${Number(order.tipAmount).toFixed(2)}`);
  }
  if (order.deliveryFee && Number(order.deliveryFee) > 0) {
    lines.push(`Delivery:          $${Number(order.deliveryFee).toFixed(2)}`);
  }

  lines.push('--------------------------------');
  lines.push(`${GS}!\x11`);
  lines.push(`TOTAL: $${Number(order.totalAmount || 0).toFixed(2)}`);
  lines.push(`${GS}!\x00`);
  lines.push('');

  // Notes
  if (order.notes) {
    lines.push('================================');
    lines.push(`${GS}!\x01`);
    lines.push('** SPECIAL NOTES **');
    lines.push(`${GS}!\x00`);
    lines.push('');
    lines.push(order.notes);
    lines.push('');
  }

  // Footer
  lines.push('================================');
  lines.push(`${ESC}a\x01`);
  lines.push('');
  lines.push('Thank you for choosing');
  lines.push(`${GS}!\x01`);
  lines.push('LAS REINAS!');
  lines.push(`${GS}!\x00`);
  lines.push('');
  lines.push('--------------------------------');
  lines.push(`Printed: ${new Date().toLocaleTimeString()}`);
  lines.push('');
  lines.push('');
  lines.push('');

  // Reset and cut
  lines.push(`${ESC}E\x00`);
  lines.push(`${ESC}G\x00`);
  lines.push(`${GS}V\x01`); // Partial cut

  return lines.join('\n');
}

/**
 * Make HTTP request
 */
function makeRequest(method, urlStr, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Print-Relay-Key': config.secret,
        'X-Tenant-Slug': config.tenantSlug,
        'User-Agent': `PrintAgent/${config.agentName}`,
      },
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw: data });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Fetch pending orders from VPS (auto-print for new orders)
 */
async function fetchPendingOrders() {
  const url = `${config.vpsUrl}/api/print-relay/orders?key=${config.secret}&tenant=${config.tenantSlug}`;
  return makeRequest('GET', url);
}

/**
 * Fetch manual print queue (when admin clicks Print button)
 */
async function fetchPrintQueue() {
  const url = `${config.vpsUrl}/api/print-relay/queue?key=${config.secret}&tenant=${config.tenantSlug}`;
  return makeRequest('GET', url);
}

/**
 * Remove order from manual print queue after printing
 */
async function removeFromQueue(orderId) {
  const url = `${config.vpsUrl}/api/print-relay/queue?key=${config.secret}`;
  return makeRequest('DELETE', url, { orderId });
}

/**
 * Mark order as printed on VPS
 */
async function markOrderPrinted(orderId) {
  const url = `${config.vpsUrl}/api/print-relay/orders?key=${config.secret}`;
  return makeRequest('POST', url, { orderId });
}

/**
 * Print test receipt
 */
async function testPrinter() {
  console.log('🔍 Testing printer connection...');

  const ESC = '\x1b';
  const GS = '\x1d';

  const testLines = [
    `${ESC}@`,
    `${GS}(K\x02\x00\x31\x09`,
    `${ESC}E\x01`,
    `${ESC}G\x01`,
    `${ESC}a\x01`,
    '',
    `${GS}!\x11`,
    '*** LAS REINAS ***',
    `${GS}!\x00`,
    '',
    '================================',
    '',
    `${GS}!\x01`,
    'PRINT RELAY TEST',
    `${GS}!\x00`,
    '',
    'Connection successful!',
    '',
    `Time: ${new Date().toLocaleTimeString()}`,
    `Date: ${new Date().toLocaleDateString()}`,
    '',
    '================================',
    '',
    'Ready to receive orders.',
    '',
    '',
    '',
    `${ESC}E\x00`,
    `${ESC}G\x00`,
    `${GS}V\x01`,
  ];

  try {
    await sendToPrinter(testLines.join('\n'));
    console.log('✅ Printer test successful!');
    return true;
  } catch (error) {
    console.error('❌ Printer test failed:', error.message);
    return false;
  }
}

/**
 * Main polling loop
 */
async function pollForOrders() {
  try {
    const response = await fetchPendingOrders();
    const orders = response.orders || [];

    for (const order of orders) {
      if (printedOrders.has(order.id)) {
        continue;
      }

      console.log(`\n🔔 New order: #${order.id.slice(-6).toUpperCase()}`);
      console.log(`   Customer: ${order.customerName || 'Guest'}`);
      console.log(`   Total: $${Number(order.totalAmount || 0).toFixed(2)}`);
      console.log(`   Method: ${order.fulfillmentMethod || 'pickup'}`);

      try {
        const receipt = formatReceipt(order);
        await sendToPrinter(receipt);

        await markOrderPrinted(order.id);
        printedOrders.add(order.id);

        console.log(`   ✅ Printed successfully`);
      } catch (printError) {
        console.error(`   ❌ Print failed: ${printError.message}`);
      }
    }

    // Clear last error on success
    if (lastError) {
      console.log('✅ Connection restored');
      lastError = null;
    }
  } catch (error) {
    if (error.message !== lastError) {
      console.error(`⚠️  ${error.message}`);
      lastError = error.message;
    }
  }
}

// Track orders currently being printed to prevent duplicates
const printingInProgress = new Set();

/**
 * Poll the manual print queue (for Print button in PWA)
 */
async function pollPrintQueue() {
  try {
    const response = await fetchPrintQueue();
    const orders = response.orders || [];

    for (const order of orders) {
      // Skip if already printing
      if (printingInProgress.has(order.id)) {
        continue;
      }

      // Mark as in progress
      printingInProgress.add(order.id);

      console.log(`\n🖨️  Manual print: #${order.id.slice(-6).toUpperCase()}`);
      console.log(`   Customer: ${order.customerName || 'Guest'}`);

      try {
        const receipt = formatReceipt(order);
        await sendToPrinter(receipt);
        await removeFromQueue(order.id);
        console.log(`   ✅ Printed from queue`);
      } catch (printError) {
        console.error(`   ❌ Print failed: ${printError.message}`);
      } finally {
        // Remove from in-progress after a delay
        setTimeout(() => printingInProgress.delete(order.id), 5000);
      }
    }
  } catch (error) {
    // Silent fail for queue errors
  }
}

// Main
async function main() {
  console.log('');
  console.log('===========================================');
  console.log('  Las Reinas Print Agent');
  console.log('===========================================');
  console.log(`  VPS: ${config.vpsUrl}`);
  console.log(`  Tenant: ${config.tenantSlug}`);
  console.log(`  Agent: ${config.agentName}`);
  console.log(`  Poll interval: ${config.pollInterval}ms`);
  console.log('===========================================');
  console.log('');

  // Auto-discover printer if needed
  if (config.printerHost === 'auto' || !config.printerHost) {
    const discoveredIP = await discoverPrinter();

    if (discoveredIP) {
      config.printerHost = discoveredIP;
      console.log(`✅ Printer discovered at: ${config.printerHost}`);
    } else {
      console.log('');
      console.log('❌ No thermal printer found on network!');
      console.log('');
      console.log('   Make sure:');
      console.log('   1. Munbyn printer is powered on');
      console.log('   2. Printer is connected to WiFi');
      console.log('   3. This Mac is on the same network');
      console.log('');
      console.log('   You can also set PRINTER_HOST manually in config.json');
      console.log('');
      process.exit(1);
    }
  } else {
    console.log(`📍 Using configured printer: ${config.printerHost}`);
  }

  console.log('');

  // Test printer
  const printerOk = await testPrinter();
  if (!printerOk) {
    console.log('');
    console.log('⚠️  Printer test failed, will retry when orders come in...');
  }

  // Start polling
  console.log('');
  console.log('📡 Starting order polling...');
  console.log(`   Printer: ${config.printerHost}:${config.printerPort}`);
  console.log(`   Auto-print: checking every ${config.pollInterval / 1000}s`);
  console.log(`   Manual queue: checking every 2s`);
  console.log('');

  // Initial polls
  await pollForOrders();
  await pollPrintQueue();

  // Start polling loops
  setInterval(pollForOrders, config.pollInterval);
  setInterval(pollPrintQueue, 2000); // Check manual queue every 2s for fast response

  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping print agent...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n👋 Stopping print agent (SIGTERM)...');
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
