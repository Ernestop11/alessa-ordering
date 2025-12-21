/**
 * Bluetooth Serial Printer for Star TSP100III
 *
 * Uses capacitor-bluetooth-serial plugin for reliable printing
 * Hardcoded MAC address for Las Reinas TSP100-K0084
 *
 * Archive: MVP Bluetooth Printing Setup - Dec 2025
 */

import { Capacitor } from '@capacitor/core';

// Dynamically import to avoid SSR issues
let BluetoothSerial: any = null;

// Star TSP100-K0084 Bluetooth Info (from printer self-test)
const STAR_PRINTER_CONFIG = {
  name: 'TSP100-K0084',
  iosName: 'TSP100',
  macAddress: '00:11:62:2E:10:2A', // Format with colons for Capacitor
  serialNumber: '2550822111300084',
};

// ESC/POS Commands for Star TSP100III
const ESC_POS = {
  INIT: '\x1b\x40',           // Initialize printer
  CUT: '\x1b\x64\x02\x1d\x56\x00', // Feed and cut
  BOLD_ON: '\x1b\x45\x01',
  BOLD_OFF: '\x1b\x45\x00',
  CENTER: '\x1b\x61\x01',
  LEFT: '\x1b\x61\x00',
  DOUBLE_HEIGHT: '\x1b\x21\x10',
  NORMAL: '\x1b\x21\x00',
  LINE_FEED: '\x0a',
};

export interface PrintResult {
  success: boolean;
  error?: string;
  printerName?: string;
}

export interface OrderForPrint {
  id: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    menuItemName?: string;
    name?: string;
    quantity: number;
    price: number;
    notes?: string;
    itemType?: string;
  }>;
  totalAmount: number;
  subtotalAmount?: number;
  taxAmount?: number;
  tipAmount?: number;
  notes?: string;
  fulfillmentMethod?: string;
  createdAt?: string;
}

/**
 * Check if Bluetooth Serial printing is available
 */
export function isBluetoothSerialAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

/**
 * Initialize BluetoothSerial plugin (lazy load)
 */
async function getBluetoothSerial(): Promise<any> {
  if (!BluetoothSerial) {
    try {
      const module = await import('capacitor-bluetooth-serial');
      BluetoothSerial = module.BluetoothSerial;
    } catch (error) {
      console.error('[BluetoothSerial] Failed to load plugin:', error);
      throw new Error('Bluetooth Serial plugin not available');
    }
  }
  return BluetoothSerial;
}

/**
 * Print receipt to Star TSP100III via Bluetooth Serial
 * Uses hardcoded MAC address for reliability
 */
export async function printReceipt(order: OrderForPrint): Promise<PrintResult> {
  if (!isBluetoothSerialAvailable()) {
    return { success: false, error: 'Bluetooth printing only available on iOS native app' };
  }

  try {
    const BT = await getBluetoothSerial();

    console.log('[BluetoothSerial] Starting print job for order:', order.id);

    // 1. Request Bluetooth permission (iOS only needs once)
    try {
      await BT.requestEnable();
    } catch (e) {
      console.log('[BluetoothSerial] Bluetooth already enabled or permission granted');
    }

    // 2. Connect directly using hardcoded MAC address (skip discovery)
    console.log('[BluetoothSerial] Connecting to:', STAR_PRINTER_CONFIG.macAddress);

    try {
      await BT.connect({ address: STAR_PRINTER_CONFIG.macAddress });
    } catch (connectError: any) {
      // Try with list if hardcoded fails
      console.log('[BluetoothSerial] Direct connect failed, trying discovery...');
      const devices = await BT.list();
      const star = devices.find((d: any) =>
        d.name?.includes('Star') ||
        d.name?.includes('TSP') ||
        d.name?.includes(STAR_PRINTER_CONFIG.name)
      );

      if (!star) {
        throw new Error('Star printer not found. Make sure it is paired in iPad Settings.');
      }

      await BT.connect({ address: star.address });
    }

    // 3. Add 500ms delay for iOS 18+ (per advice)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Format and send receipt
    const receiptText = formatReceiptForESCPOS(order);
    const escposData = ESC_POS.INIT + receiptText + ESC_POS.CUT;

    console.log('[BluetoothSerial] Sending print data...');
    await BT.write({ data: escposData });

    // 5. Disconnect after short delay
    setTimeout(async () => {
      try {
        await BT.disconnect();
        console.log('[BluetoothSerial] Disconnected');
      } catch (e) {
        // Ignore disconnect errors
      }
    }, 1000);

    console.log('[BluetoothSerial] Print successful!');
    return {
      success: true,
      printerName: STAR_PRINTER_CONFIG.name
    };

  } catch (error: any) {
    console.error('[BluetoothSerial] Print error:', error);
    return {
      success: false,
      error: error.message || 'Unknown print error'
    };
  }
}

/**
 * Test print - prints a simple test receipt
 */
export async function testPrint(): Promise<PrintResult> {
  const testOrder: OrderForPrint = {
    id: 'TEST-' + Date.now().toString(36).toUpperCase(),
    customerName: 'Test Customer',
    items: [
      { name: 'Test Item 1', quantity: 1, price: 9.99 },
      { name: 'Test Item 2', quantity: 2, price: 4.99 },
    ],
    subtotalAmount: 19.97,
    taxAmount: 1.65,
    totalAmount: 21.62,
    fulfillmentMethod: 'pickup',
    createdAt: new Date().toISOString(),
  };

  return printReceipt(testOrder);
}

/**
 * Check printer connection status
 */
export async function checkPrinterStatus(): Promise<{ connected: boolean; name?: string; error?: string }> {
  if (!isBluetoothSerialAvailable()) {
    return { connected: false, error: 'Not on iOS native platform' };
  }

  try {
    const BT = await getBluetoothSerial();
    const isConnected = await BT.isConnected();

    return {
      connected: isConnected,
      name: isConnected ? STAR_PRINTER_CONFIG.name : undefined
    };
  } catch (error: any) {
    return { connected: false, error: error.message };
  }
}

/**
 * List available Bluetooth devices
 */
export async function listBluetoothDevices(): Promise<{ devices: any[]; error?: string }> {
  if (!isBluetoothSerialAvailable()) {
    return { devices: [], error: 'Not on iOS native platform' };
  }

  try {
    const BT = await getBluetoothSerial();
    await BT.requestEnable();
    const devices = await BT.list();
    return { devices };
  } catch (error: any) {
    return { devices: [], error: error.message };
  }
}

/**
 * Format order for ESC/POS receipt
 */
function formatReceiptForESCPOS(order: OrderForPrint): string {
  const lines: string[] = [];

  // Header
  lines.push(ESC_POS.CENTER);
  lines.push(ESC_POS.BOLD_ON);
  lines.push(ESC_POS.DOUBLE_HEIGHT);
  lines.push('LAS REINAS');
  lines.push(ESC_POS.NORMAL);
  lines.push(ESC_POS.BOLD_OFF);
  lines.push('Authentic Mexican Cuisine');
  lines.push(ESC_POS.LINE_FEED);
  lines.push(ESC_POS.LEFT);

  lines.push('================================');
  lines.push(ESC_POS.BOLD_ON);
  lines.push(`ORDER #${order.id.slice(0, 8).toUpperCase()}`);
  lines.push(ESC_POS.BOLD_OFF);
  lines.push('================================');
  lines.push('');

  // Order info
  if (order.fulfillmentMethod) {
    lines.push(`Type: ${order.fulfillmentMethod.toUpperCase()}`);
  }
  if (order.customerName) {
    lines.push(`Customer: ${order.customerName}`);
  }
  if (order.customerPhone) {
    lines.push(`Phone: ${order.customerPhone}`);
  }
  if (order.createdAt) {
    const date = new Date(order.createdAt);
    lines.push(`Time: ${date.toLocaleTimeString()}`);
    lines.push(`Date: ${date.toLocaleDateString()}`);
  }
  lines.push('');
  lines.push('--------------------------------');
  lines.push('');

  // Items
  for (const item of order.items) {
    const name = item.menuItemName || item.name || 'Item';
    const qty = item.quantity;
    const price = (item.price * qty).toFixed(2);
    const typeTag = item.itemType === 'grocery' ? ' [G]' : item.itemType === 'bakery' ? ' [B]' : '';

    lines.push(`${qty}x ${name}${typeTag}`);
    lines.push(`     $${price}`);

    if (item.notes) {
      lines.push(`   >> ${item.notes}`);
    }
  }

  lines.push('');
  lines.push('--------------------------------');

  // Totals
  if (order.subtotalAmount !== undefined) {
    lines.push(`Subtotal:        $${order.subtotalAmount.toFixed(2)}`);
  }
  if (order.taxAmount !== undefined) {
    lines.push(`Tax:             $${order.taxAmount.toFixed(2)}`);
  }
  if (order.tipAmount !== undefined && order.tipAmount > 0) {
    lines.push(`Tip:             $${order.tipAmount.toFixed(2)}`);
  }

  lines.push('');
  lines.push(ESC_POS.BOLD_ON);
  lines.push(ESC_POS.DOUBLE_HEIGHT);
  lines.push(`TOTAL:           $${order.totalAmount.toFixed(2)}`);
  lines.push(ESC_POS.NORMAL);
  lines.push(ESC_POS.BOLD_OFF);
  lines.push('');

  // Notes
  if (order.notes) {
    lines.push('--------------------------------');
    lines.push('NOTES:');
    lines.push(order.notes);
    lines.push('');
  }

  // Footer
  lines.push('================================');
  lines.push(ESC_POS.CENTER);
  lines.push('Thank you for your order!');
  lines.push('Las Reinas - Colusa, CA');
  lines.push(ESC_POS.LEFT);
  lines.push('================================');
  lines.push('');
  lines.push('');
  lines.push('');

  return lines.join(ESC_POS.LINE_FEED);
}

// Export printer config for reference
export const PRINTER_CONFIG = STAR_PRINTER_CONFIG;
