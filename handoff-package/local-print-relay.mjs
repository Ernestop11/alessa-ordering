#!/usr/bin/env node
/**
 * Local Print Relay Service for Las Reinas
 *
 * This script runs on your local network (Mac, Raspberry Pi, etc.) and acts as a bridge
 * between the VPS order events and your local WiFi/network thermal printer.
 *
 * HOW IT WORKS:
 * 1. AUTO-DISCOVERS the printer on any network (scans for port 9100)
 * 2. Polls the VPS API for new orders (no SSE dependency)
 * 3. When a new order is detected, generates an ESC/POS receipt
 * 4. Sends the receipt directly to your Munbyn WiFi printer via TCP port 9100
 *
 * Usage:
 *   node scripts/local-print-relay.mjs           # Auto-discover printer
 *   PRINTER_HOST=192.168.1.108 node scripts/local-print-relay.mjs  # Manual IP
 *
 * Configuration (via environment variables):
 *   PRINTER_HOST=auto            # Set to 'auto' or omit to auto-discover (default)
 *   PRINTER_PORT=9100            # Printer port (default: 9100)
 *   VPS_URL=https://lasreinascolusa.com  # Your VPS URL
 *   POLL_INTERVAL=5000           # How often to check for new orders (ms)
 */

import net from 'net';
import https from 'https';
import http from 'http';
import os from 'os';

// Configuration
let PRINTER_HOST = process.env.PRINTER_HOST || 'auto';
const PRINTER_PORT = parseInt(process.env.PRINTER_PORT || '9100');
const VPS_URL = process.env.VPS_URL || 'https://lasreinascolusa.com';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '5000'); // 5 seconds
const PRINT_RELAY_API_KEY = process.env.PRINT_RELAY_API_KEY || '';
const TENANT_SLUG = process.env.TENANT_SLUG || 'lasreinas';

// Track printed orders to avoid duplicates
const printedOrders = new Set();

/**
 * Get local network subnet from Mac's IP address
 */
function getLocalSubnet() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip loopback and non-IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        // Get subnet (e.g., 192.168.1 from 192.168.1.103)
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
  console.log('');

  // Common printer IPs to check first (faster discovery)
  const priorityIPs = [
    `${network.subnet}.108`,  // Last known IP
    `${network.subnet}.44`,   // Restaurant static IP
    `${network.subnet}.100`,  // Common DHCP start
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

  // Full subnet scan (skip already checked and local IP)
  const checkedIPs = new Set([...priorityIPs, network.localIP]);
  const scanPromises = [];

  console.log('   Scanning remaining IPs...');

  for (let i = 1; i <= 254; i++) {
    const ip = `${network.subnet}.${i}`;
    if (checkedIPs.has(ip)) continue;

    scanPromises.push(
      checkPrinterPort(ip).then(found => found ? ip : null)
    );
  }

  // Run scans in batches of 50 for speed
  const batchSize = 50;
  for (let i = 0; i < scanPromises.length; i += batchSize) {
    const batch = scanPromises.slice(i, i + batchSize);
    const results = await Promise.all(batch);
    const found = results.find(ip => ip !== null);
    if (found) {
      console.log(`   ✅ Found printer at ${found}`);
      return found;
    }
  }

  return null;
}

console.log('');
console.log('🖨️  Las Reinas - Local Print Relay');
console.log('===================================');
console.log(`VPS: ${VPS_URL}`);
console.log(`Poll interval: ${POLL_INTERVAL}ms`);
console.log(`Queue API: ${PRINT_RELAY_API_KEY ? 'Enabled' : 'Disabled (set PRINT_RELAY_API_KEY)'}`);
console.log('');

/**
 * Send ESC/POS data to the network printer (single attempt)
 */
function sendToPrinterOnce(data) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(
      { host: PRINTER_HOST, port: PRINTER_PORT, timeout: 5000 },
      () => {
        console.log(`📤 Connected to printer at ${PRINTER_HOST}:${PRINTER_PORT}`);
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

    socket.on('close', () => {
      console.log('✅ Print job sent successfully');
      resolve();
    });

    socket.on('error', (error) => {
      reject(error);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Connection timeout'));
    });
  });
}

/**
 * Send ESC/POS data to the network printer with retry logic
 * Retries up to 3 times with 2 second delay between attempts
 * This handles WiFi sleep mode and temporary disconnections
 */
async function sendToPrinter(data, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendToPrinterOnce(data);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        console.log(`   ⚠️  Attempt ${attempt} failed, retrying in 2s... (${error.message})`);
        await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds before retry
      }
    }
  }

  console.error(`❌ Printer connection failed after ${maxRetries} attempts: ${lastError.message}`);
  throw lastError;
}

/**
 * Test printer connection with a nicely formatted test receipt
 */
async function testPrinterConnection() {
  console.log('🔍 Testing printer connection...');
  try {
    const ESC = '\x1b';
    const GS = '\x1d';

    // Build a proper test receipt
    const testLines = [
      `${ESC}@`, // Reset
      `${GS}(K\x02\x00\x31\x09`, // Max density
      `${ESC}E\x01`, // Bold ON
      `${ESC}G\x01`, // Double-strike ON
      `${ESC}a\x01`, // Center
      '',
      `${GS}!\x11`, // Double width+height
      '*** LAS REINAS ***',
      `${GS}!\x00`,
      '',
      '================================',
      '',
      `${GS}!\x01`, // Double height
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
      `${ESC}E\x00`, // Bold OFF
      `${ESC}G\x00`, // Double-strike OFF
      `${GS}V\x01`, // Partial cut
    ];

    await sendToPrinter(testLines.join('\n'));
    console.log('✅ Printer connection test successful!');
    return true;
  } catch (error) {
    console.error('❌ Printer connection test failed:', error.message);
    console.log('Please check:');
    console.log(`  1. Printer is powered on`);
    console.log(`  2. Printer is connected to network at ${PRINTER_HOST}`);
    console.log(`  3. Printer is listening on port ${PRINTER_PORT}`);
    return false;
  }
}

/**
 * Fetch orders from VPS API
 */
function fetchOrders() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${VPS_URL}/api/admin/fulfillment/orders`);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LocalPrintRelay/1.0',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else if (res.statusCode === 401) {
          reject(new Error('Unauthorized - API requires authentication'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

/**
 * Poll for new orders and print them
 */
async function pollForOrders() {
  try {
    const response = await fetchOrders();
    const orders = response.orders || response || [];

    // Filter for new confirmed/pending orders that haven't been printed
    const newOrders = orders.filter(order => {
      const isNew = !printedOrders.has(order.id);
      const isPrintable = ['pending', 'confirmed'].includes(order.status?.toLowerCase());
      return isNew && isPrintable;
    });

    for (const order of newOrders) {
      console.log(`\n🔔 New order detected: ${order.id.slice(-6).toUpperCase()}`);
      console.log(`   Customer: ${order.customerName || order.customer?.name || 'Guest'}`);
      console.log(`   Total: $${Number(order.totalAmount || 0).toFixed(2)}`);
      console.log(`   Status: ${order.status}`);

      try {
        const receipt = formatSimpleReceipt(order);
        await sendToPrinter(receipt);
        printedOrders.add(order.id);
        console.log(`   ✅ Printed successfully`);
      } catch (printError) {
        console.error(`   ❌ Print failed: ${printError.message}`);
      }
    }
  } catch (error) {
    // Only log errors occasionally to avoid spam
    if (error.message !== lastError) {
      console.error(`⚠️  ${error.message}`);
      lastError = error.message;
    }
  }
}

let lastError = null;

/**
 * Format an ESC/POS receipt with BOLD, DARK text for thermal printers
 * Uses emphasized mode and double-strike for maximum darkness
 */
function formatSimpleReceipt(order) {
  const ESC = '\x1b';
  const GS = '\x1d';
  const lines = [];

  // Initialize printer
  lines.push(`${ESC}@`); // Reset printer

  // Set print density to maximum (darker print)
  // GS ( K - Adjust print density
  lines.push(`${GS}(K\x02\x00\x31\x09`); // Max density

  // Enable emphasized mode (bold) for entire receipt
  lines.push(`${ESC}E\x01`); // Emphasized ON
  lines.push(`${ESC}G\x01`); // Double-strike ON (darker)

  // Center alignment for header
  lines.push(`${ESC}a\x01`); // Center align

  // ═══════════════════════════════════════
  // RESTAURANT HEADER - Large and Bold
  // ═══════════════════════════════════════
  lines.push(`${GS}!\x11`); // Double width + height
  lines.push('');
  lines.push('*** LAS REINAS ***');
  lines.push(`${GS}!\x00`); // Normal size
  lines.push('Authentic Mexican Cuisine');
  lines.push('Colusa, CA');
  lines.push('');

  // ═══════════════════════════════════════
  // ORDER NUMBER - VERY LARGE
  // ═══════════════════════════════════════
  lines.push(`${GS}!\x11`); // Double width + height
  lines.push(`ORDER #${order.id.slice(-6).toUpperCase()}`);
  lines.push(`${GS}!\x00`); // Normal size
  lines.push('');

  // Fulfillment type badge
  const fulfillment = (order.fulfillmentMethod || 'pickup').toUpperCase();
  if (fulfillment === 'DELIVERY') {
    lines.push(`${GS}!\x11`); // Large
    lines.push('** DELIVERY **');
    lines.push(`${GS}!\x00`);
  } else if (fulfillment === 'DINE_IN' || fulfillment === 'DINEIN') {
    lines.push(`${GS}!\x11`); // Large
    lines.push('** DINE-IN **');
    lines.push(`${GS}!\x00`);
  } else {
    lines.push(`${GS}!\x01`); // Double height
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

  // ═══════════════════════════════════════
  // CUSTOMER INFO
  // ═══════════════════════════════════════
  lines.push('================================');
  lines.push(`${ESC}a\x00`); // Left align

  if (order.customerName) {
    lines.push(`${GS}!\x01`); // Double height for name
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

  // ═══════════════════════════════════════
  // ORDER ITEMS - Bold and Clear
  // ═══════════════════════════════════════
  lines.push('================================');
  lines.push(`${ESC}a\x01`); // Center
  lines.push(`${GS}!\x01`); // Double height
  lines.push('ORDER ITEMS');
  lines.push(`${GS}!\x00`);
  lines.push('================================');
  lines.push(`${ESC}a\x00`); // Left align
  lines.push('');

  // Items with clear formatting
  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      const name = item.menuItemName || item.name || 'Menu Item';
      const qty = item.quantity || 1;
      const unitPrice = Number(item.price || 0);
      const lineTotal = (unitPrice * qty).toFixed(2);

      // Quantity and name - BOLD and larger
      lines.push(`${GS}!\x01`); // Double height
      lines.push(`${qty}x ${name}`);
      lines.push(`${GS}!\x00`); // Normal

      // Price on same line, right side
      lines.push(`     $${lineTotal}`);

      // Item modifiers/notes if any
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

  // ═══════════════════════════════════════
  // TOTALS - Large and Clear
  // ═══════════════════════════════════════
  lines.push('================================');

  // Subtotal
  if (order.subtotalAmount) {
    lines.push(`Subtotal:          $${Number(order.subtotalAmount).toFixed(2)}`);
  }

  // Tax
  if (order.taxAmount && Number(order.taxAmount) > 0) {
    lines.push(`Tax:               $${Number(order.taxAmount).toFixed(2)}`);
  }

  // Tip
  if (order.tipAmount && Number(order.tipAmount) > 0) {
    lines.push(`Tip:               $${Number(order.tipAmount).toFixed(2)}`);
  }

  // Delivery fee
  if (order.deliveryFee && Number(order.deliveryFee) > 0) {
    lines.push(`Delivery:          $${Number(order.deliveryFee).toFixed(2)}`);
  }

  lines.push('--------------------------------');

  // TOTAL - Very large and bold
  lines.push(`${GS}!\x11`); // Double width + height
  const total = Number(order.totalAmount || 0).toFixed(2);
  lines.push(`TOTAL: $${total}`);
  lines.push(`${GS}!\x00`);
  lines.push('');

  // ═══════════════════════════════════════
  // SPECIAL NOTES
  // ═══════════════════════════════════════
  if (order.notes) {
    lines.push('================================');
    lines.push(`${GS}!\x01`); // Double height
    lines.push('** SPECIAL NOTES **');
    lines.push(`${GS}!\x00`);
    lines.push('');
    lines.push(order.notes);
    lines.push('');
  }

  // ═══════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════
  lines.push('================================');
  lines.push(`${ESC}a\x01`); // Center
  lines.push('');
  lines.push('Thank you for choosing');
  lines.push(`${GS}!\x01`); // Double height
  lines.push('LAS REINAS!');
  lines.push(`${GS}!\x00`);
  lines.push('');
  lines.push('--------------------------------');
  lines.push(`Printed: ${new Date().toLocaleTimeString()}`);
  lines.push('');
  lines.push('');
  lines.push('');

  // Disable emphasized mode
  lines.push(`${ESC}E\x00`); // Emphasized OFF
  lines.push(`${ESC}G\x00`); // Double-strike OFF

  // Cut paper (partial cut for easier tearing)
  lines.push(`${GS}V\x01`); // Partial cut

  return lines.join('\n');
}

/**
 * Fetch orders from print queue (for manual print button)
 */
function fetchPrintQueue() {
  if (!PRINT_RELAY_API_KEY) {
    return Promise.resolve({ orders: [] });
  }

  return new Promise((resolve, reject) => {
    const url = new URL(`${VPS_URL}/api/print-relay/queue?key=${PRINT_RELAY_API_KEY}&tenant=${TENANT_SLUG}`);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LocalPrintRelay/1.0',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          resolve({ orders: [] }); // Silently fail
        }
      });
    });

    req.on('error', () => resolve({ orders: [] }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ orders: [] });
    });
    req.end();
  });
}

/**
 * Remove order from print queue after printing
 */
function removeFromQueue(orderId) {
  if (!PRINT_RELAY_API_KEY) return Promise.resolve();

  return new Promise((resolve) => {
    const url = new URL(`${VPS_URL}/api/print-relay/queue?key=${PRINT_RELAY_API_KEY}`);
    const client = url.protocol === 'https:' ? https : http;

    const body = JSON.stringify({ orderId });

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve());
    });

    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

// Track orders currently being printed to prevent duplicates
const printingInProgress = new Set();

/**
 * Poll the print queue for manual print requests
 */
async function pollPrintQueue() {
  try {
    const response = await fetchPrintQueue();
    const orders = response.orders || [];

    for (const order of orders) {
      // Skip if already printing this order
      if (printingInProgress.has(order.id)) {
        continue;
      }

      // Mark as in progress BEFORE printing
      printingInProgress.add(order.id);

      console.log(`\n🖨️  Print queue: ${order.id.slice(-6).toUpperCase()}`);
      console.log(`   Customer: ${order.customerName || order.customer?.name || 'Guest'}`);

      try {
        const receipt = formatSimpleReceipt(order);
        await sendToPrinter(receipt);
        await removeFromQueue(order.id);
        console.log(`   ✅ Printed from queue`);
      } catch (printError) {
        console.error(`   ❌ Print failed: ${printError.message}`);
      } finally {
        // Remove from in-progress after a delay to be safe
        setTimeout(() => printingInProgress.delete(order.id), 5000);
      }
    }
  } catch (error) {
    // Silent fail for queue errors
  }
}

// Main
async function main() {
  // Auto-discover printer if not specified
  if (PRINTER_HOST === 'auto' || !PRINTER_HOST) {
    console.log('🔍 Auto-discovering printer on network...');
    console.log('');

    const discoveredIP = await discoverPrinter();

    if (discoveredIP) {
      PRINTER_HOST = discoveredIP;
      console.log('');
      console.log(`✅ Printer discovered at: ${PRINTER_HOST}`);
    } else {
      console.log('');
      console.log('❌ No thermal printer found on network!');
      console.log('');
      console.log('   Make sure:');
      console.log('   1. Printer is powered on');
      console.log('   2. Printer is connected to the same WiFi as this computer');
      console.log('   3. Printer has DHCP enabled (or correct static IP for this network)');
      console.log('');
      console.log('   You can also specify the IP manually:');
      console.log('   PRINTER_HOST=192.168.1.100 node scripts/local-print-relay.mjs');
      console.log('');
      process.exit(1);
    }
  } else {
    console.log(`📍 Using specified printer: ${PRINTER_HOST}`);
  }

  console.log('');
  console.log('🔍 Testing printer connection...');

  // Test printer connection first
  const printerOk = await testPrinterConnection();

  if (!printerOk) {
    console.log('\n⚠️  Printer test failed!');
    console.log('   Please check:');
    console.log(`   1. Printer is powered on and connected to WiFi`);
    console.log(`   2. Printer IP is correct: ${PRINTER_HOST}`);
    console.log(`   3. You're on the same network as the printer`);
    console.log('');
    console.log('   Continuing anyway - will retry when orders come in...\n');
  }

  // Start polling for orders
  console.log('📡 Starting order polling...');
  console.log(`   Printer: ${PRINTER_HOST}:${PRINTER_PORT}`);
  console.log(`   Checking ${VPS_URL} every ${POLL_INTERVAL / 1000}s`);
  if (PRINT_RELAY_API_KEY) {
    console.log('   Print queue polling enabled (manual print button)');
  }
  console.log('   Press Ctrl+C to stop\n');

  // Initial poll
  await pollForOrders();
  await pollPrintQueue();

  // Start polling loops
  setInterval(pollForOrders, POLL_INTERVAL);
  setInterval(pollPrintQueue, 2000); // Check queue every 2 seconds for fast response

  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping print relay...');
    process.exit(0);
  });
}

main().catch(console.error);
