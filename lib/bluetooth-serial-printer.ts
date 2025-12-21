/**
 * Bluetooth BLE Printer for Star TSP100III
 *
 * Uses @capacitor-community/bluetooth-le plugin for iOS
 * Star TSP100-K0084 (Las Reinas)
 *
 * Archive: MVP Bluetooth Printing Setup - Dec 2025
 */

import { Capacitor } from '@capacitor/core';

// Star TSP100III BLE service & characteristic UUIDs
const STAR_SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
const STAR_WRITE_CHAR_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';

// Star TSP100-K0084 Bluetooth Info (from printer self-test)
const STAR_PRINTER_CONFIG = {
  name: 'TSP100-K0084',
  iosName: 'TSP100',
  // MAC address format: colons for BLE plugin
  macAddress: '00:11:62:2E:10:2A',
  serialNumber: '2550822111300084',
};

// Dynamically import BLE client to avoid SSR issues
let BleClient: any = null;
let numbersToDataView: any = null;

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
 * Check if BLE printing is available (iOS native only)
 */
export function isBluetoothPrintingAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

/**
 * Initialize BLE client (lazy load)
 */
async function getBleClient(): Promise<{ BleClient: any; numbersToDataView: any }> {
  if (!BleClient) {
    try {
      const module = await import('@capacitor-community/bluetooth-le');
      BleClient = module.BleClient;
      numbersToDataView = module.numbersToDataView;
    } catch (error) {
      console.error('[BLE] Failed to load plugin:', error);
      throw new Error('Bluetooth LE plugin not available');
    }
  }
  return { BleClient, numbersToDataView };
}

/**
 * Convert string to Uint8Array for ESC/POS
 */
function stringToBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) & 0xFF);
  }
  return bytes;
}

/**
 * Build ESC/POS command buffer
 */
function buildEscPosCommands(text: string): Uint8Array {
  const commands: number[] = [
    0x1B, 0x40,  // ESC @ - Initialize printer
    ...stringToBytes(text),
    0x0A, 0x0A, 0x0A,  // Line feeds
    0x1D, 0x56, 0x00   // GS V 0 - Full cut
  ];
  return new Uint8Array(commands);
}

/**
 * Print receipt to Star TSP100III via BLE
 */
export async function printReceipt(order: OrderForPrint): Promise<PrintResult> {
  if (!isBluetoothPrintingAvailable()) {
    return { success: false, error: 'Bluetooth printing only available on iOS native app' };
  }

  try {
    const { BleClient, numbersToDataView } = await getBleClient();

    console.log('[BLE] Starting print job for order:', order.id);

    // Initialize BLE
    await BleClient.initialize();
    console.log('[BLE] Initialized');

    // Connect using hardcoded MAC address
    const printerAddress = STAR_PRINTER_CONFIG.macAddress;
    console.log('[BLE] Connecting to:', printerAddress);

    try {
      await BleClient.connect(printerAddress);
      console.log('[BLE] Connected');
    } catch (connectError: any) {
      // If direct connect fails, try scanning
      console.log('[BLE] Direct connect failed, scanning for printer...');

      let foundDevice: any = null;

      await BleClient.requestLEScan(
        { services: [STAR_SERVICE_UUID] },
        (result: any) => {
          console.log('[BLE] Found device:', result.device.name);
          if (result.device.name?.includes('TSP') || result.device.name?.includes('Star')) {
            foundDevice = result.device;
          }
        }
      );

      // Wait for scan
      await new Promise(resolve => setTimeout(resolve, 3000));
      await BleClient.stopLEScan();

      if (!foundDevice) {
        throw new Error('Star printer not found. Make sure it is paired in iPad Settings.');
      }

      await BleClient.connect(foundDevice.deviceId);
      console.log('[BLE] Connected via scan to:', foundDevice.name);
    }

    // Add 500ms delay for iOS 18+ stability
    await new Promise(resolve => setTimeout(resolve, 500));

    // Format receipt and convert to ESC/POS
    const receiptText = formatReceiptText(order);
    const escPosData = buildEscPosCommands(receiptText);

    console.log('[BLE] Sending', escPosData.length, 'bytes...');

    // Write to printer
    await BleClient.write(
      printerAddress,
      STAR_SERVICE_UUID,
      STAR_WRITE_CHAR_UUID,
      numbersToDataView(Array.from(escPosData))
    );

    console.log('[BLE] Data sent successfully');

    // Disconnect after delay
    setTimeout(async () => {
      try {
        await BleClient.disconnect(printerAddress);
        console.log('[BLE] Disconnected');
      } catch (e) {
        // Ignore disconnect errors
      }
    }, 1000);

    return {
      success: true,
      printerName: STAR_PRINTER_CONFIG.name
    };

  } catch (error: any) {
    console.error('[BLE] Print error:', error);
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
 * Scan for available BLE printers
 */
export async function scanForPrinters(): Promise<{ devices: any[]; error?: string }> {
  if (!isBluetoothPrintingAvailable()) {
    return { devices: [], error: 'Not on iOS native platform' };
  }

  try {
    const { BleClient } = await getBleClient();
    await BleClient.initialize();

    const devices: any[] = [];

    await BleClient.requestLEScan(
      { services: [STAR_SERVICE_UUID] },
      (result: any) => {
        console.log('[BLE] Found:', result.device.name, result.device.deviceId);
        devices.push({
          name: result.device.name,
          address: result.device.deviceId,
          rssi: result.rssi
        });
      }
    );

    // Scan for 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    await BleClient.stopLEScan();

    return { devices };
  } catch (error: any) {
    return { devices: [], error: error.message };
  }
}

/**
 * Format order as plain text receipt
 */
function formatReceiptText(order: OrderForPrint): string {
  const lines: string[] = [];
  const LINE_WIDTH = 32;

  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((LINE_WIDTH - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const divider = '='.repeat(LINE_WIDTH);
  const thinDivider = '-'.repeat(LINE_WIDTH);

  // Header
  lines.push(center('LAS REINAS'));
  lines.push(center('Authentic Mexican Cuisine'));
  lines.push('');
  lines.push(divider);
  lines.push(center(`ORDER #${order.id.slice(0, 8).toUpperCase()}`));
  lines.push(divider);
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
  lines.push(thinDivider);
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
  lines.push(thinDivider);

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
  lines.push(`TOTAL:           $${order.totalAmount.toFixed(2)}`);
  lines.push('');

  // Notes
  if (order.notes) {
    lines.push(thinDivider);
    lines.push('NOTES:');
    lines.push(order.notes);
    lines.push('');
  }

  // Footer
  lines.push(divider);
  lines.push(center('Thank you for your order!'));
  lines.push(center('Las Reinas - Colusa, CA'));
  lines.push(divider);

  return lines.join('\n');
}

// Export printer config for reference
export const PRINTER_CONFIG = STAR_PRINTER_CONFIG;

// Re-export for backwards compatibility
export const isBluetoothSerialAvailable = isBluetoothPrintingAvailable;
