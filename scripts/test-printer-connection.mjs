#!/usr/bin/env node
/**
 * Test Network Printer Connection
 * 
 * Usage:
 *   node scripts/test-printer-connection.mjs
 */

import net from 'net';

const PRINTER_IP = '10.10.100.254';
const PRINTER_PORT = 9100;
const TIMEOUT = 5000;

async function testConnection() {
  console.log(`🔍 Testing printer connection to ${PRINTER_IP}:${PRINTER_PORT}...\n`);

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let connected = false;

    socket.setTimeout(TIMEOUT);

    socket.on('connect', () => {
      connected = true;
      console.log('✅ Successfully connected to printer!');
      console.log(`   IP: ${PRINTER_IP}`);
      console.log(`   Port: ${PRINTER_PORT}\n`);
      
      // Send a simple test command (ESC/POS reset)
      const testData = Buffer.from('\x1B@', 'binary');
      socket.write(testData);
      console.log('📤 Sent test command (ESC/POS reset)\n');
      
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      console.error('❌ Connection timeout');
      console.error(`   Could not connect to ${PRINTER_IP}:${PRINTER_PORT} within ${TIMEOUT}ms\n`);
      socket.destroy();
      resolve(false);
    });

    socket.on('error', (err) => {
      console.error('❌ Connection error:', err.message);
      console.error(`   Make sure the printer is:\n`);
      console.error(`   1. Powered on`);
      console.error(`   2. Connected to the same network`);
      console.error(`   3. IP address is correct: ${PRINTER_IP}\n`);
      resolve(false);
    });

    socket.connect(PRINTER_PORT, PRINTER_IP);
  });
}

testConnection().then((success) => {
  if (success) {
    console.log('✅ Printer connection test passed!');
    console.log('   Ready to print test orders.\n');
    process.exit(0);
  } else {
    console.log('❌ Printer connection test failed!');
    console.log('   Please check printer settings and network connection.\n');
    process.exit(1);
  }
});

