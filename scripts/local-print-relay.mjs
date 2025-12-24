#!/usr/bin/env node
/**
 * Local Print Relay Service for Las Reinas
 *
 * This script runs on your local network (Mac, Raspberry Pi, etc.) and acts as a bridge
 * between the VPS order events and your local WiFi/network thermal printer.
 *
 * HOW IT WORKS:
 * 1. Polls the VPS API for new orders (no SSE dependency)
 * 2. When a new order is detected, generates an ESC/POS receipt
 * 3. Sends the receipt directly to your Munbyn WiFi printer via TCP port 9100
 *
 * Usage:
 *   PRINTER_HOST=10.10.100.254 node scripts/local-print-relay.mjs
 *
 * Configuration (via environment variables):
 *   PRINTER_HOST=10.10.100.254   # Your Munbyn printer's IP address
 *   PRINTER_PORT=9100            # Printer port (default: 9100)
 *   VPS_URL=https://lasreinascolusa.com  # Your VPS URL
 *   POLL_INTERVAL=5000           # How often to check for new orders (ms)
 */

import net from 'net';
import https from 'https';
import http from 'http';

// Configuration
const PRINTER_HOST = process.env.PRINTER_HOST || '10.10.100.254';
const PRINTER_PORT = parseInt(process.env.PRINTER_PORT || '9100');
const VPS_URL = process.env.VPS_URL || 'https://lasreinascolusa.com';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '5000'); // 5 seconds

// Track printed orders to avoid duplicates
const printedOrders = new Set();

console.log('');
console.log('🖨️  Las Reinas - Local Print Relay');
console.log('===================================');
console.log(`Printer: ${PRINTER_HOST}:${PRINTER_PORT}`);
console.log(`VPS: ${VPS_URL}`);
console.log(`Poll interval: ${POLL_INTERVAL}ms`);
console.log('');

/**
 * Send ESC/POS data to the network printer
 */
function sendToPrinter(data) {
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
      console.error('❌ Printer connection error:', error.message);
      reject(error);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Connection timeout'));
    });
  });
}

/**
 * Test printer connection
 */
async function testPrinterConnection() {
  console.log('🔍 Testing printer connection...');
  try {
    // Send a simple test: initialize printer + line feed
    const testData = '\x1b\x40\n*** PRINT RELAY TEST ***\n\n\n\x1d\x56\x00'; // ESC @ (init), text, cut
    await sendToPrinter(testData);
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
 * Format a simple ESC/POS receipt
 */
function formatSimpleReceipt(order) {
  const ESC = '\x1b';
  const GS = '\x1d';
  const lines = [];

  // Initialize printer
  lines.push(`${ESC}@`); // Reset

  // Center alignment for header
  lines.push(`${ESC}a1`); // Center

  // Store name (double width/height)
  lines.push(`${ESC}!0`); // Normal
  lines.push(`${GS}!11`); // Double width + height
  lines.push('LAS REINAS');
  lines.push(`${GS}!00`); // Normal size
  lines.push('');

  // Order ID
  lines.push(`Order #${order.id.slice(-6).toUpperCase()}`);
  lines.push(new Date(order.createdAt).toLocaleString());
  lines.push('');

  // Divider
  lines.push('================================');

  // Left alignment for items
  lines.push(`${ESC}a0`);

  // Items
  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      const name = item.menuItemName || 'Menu Item';
      const qty = item.quantity || 1;
      const price = `$${(Number(item.price || 0) * qty).toFixed(2)}`;
      lines.push(`${qty} x ${name}`);
      lines.push(`    ${price}`);
    }
  }

  lines.push('================================');

  // Totals
  if (order.subtotalAmount) {
    lines.push(`Subtotal: $${Number(order.subtotalAmount).toFixed(2)}`);
  }
  if (order.taxAmount) {
    lines.push(`Tax: $${Number(order.taxAmount).toFixed(2)}`);
  }
  lines.push(`${ESC}!8`); // Bold
  lines.push(`TOTAL: $${Number(order.totalAmount || 0).toFixed(2)}`);
  lines.push(`${ESC}!0`); // Normal

  lines.push('');
  lines.push('================================');

  // Customer info
  if (order.customerName) {
    lines.push(`Customer: ${order.customerName}`);
  }
  if (order.customerPhone) {
    lines.push(`Phone: ${order.customerPhone}`);
  }
  if (order.fulfillmentMethod) {
    lines.push(`Fulfillment: ${order.fulfillmentMethod.toUpperCase()}`);
  }

  // Notes
  if (order.notes) {
    lines.push('');
    lines.push('Notes:');
    lines.push(order.notes);
  }

  // Footer
  lines.push('');
  lines.push(`${ESC}a1`); // Center
  lines.push('Thank you for your order!');
  lines.push('');
  lines.push('');
  lines.push('');

  // Cut paper
  lines.push(`${GS}V0`); // Full cut

  return lines.join('\n');
}

// Main
async function main() {
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
  console.log(`   Checking ${VPS_URL} every ${POLL_INTERVAL / 1000}s`);
  console.log('   Press Ctrl+C to stop\n');

  // Initial poll
  await pollForOrders();

  // Start polling loop
  setInterval(pollForOrders, POLL_INTERVAL);

  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping print relay...');
    process.exit(0);
  });
}

main().catch(console.error);
