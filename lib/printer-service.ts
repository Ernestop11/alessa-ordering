/**
 * Printer Service - ESC/POS Receipt Formatting
 * Supports Brother QL, Star Micronics, and generic ESC/POS printers
 */

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';

export const ESCPOS_COMMANDS = {
  // Initialization
  INIT: `${ESC}@`,

  // Text formatting
  BOLD_ON: `${ESC}E${String.fromCharCode(1)}`,
  BOLD_OFF: `${ESC}E${String.fromCharCode(0)}`,
  UNDERLINE_ON: `${ESC}-${String.fromCharCode(1)}`,
  UNDERLINE_OFF: `${ESC}-${String.fromCharCode(0)}`,
  DOUBLE_HEIGHT_ON: `${ESC}!${String.fromCharCode(16)}`,
  DOUBLE_WIDTH_ON: `${ESC}!${String.fromCharCode(32)}`,
  DOUBLE_ON: `${ESC}!${String.fromCharCode(48)}`,
  NORMAL: `${ESC}!${String.fromCharCode(0)}`,

  // Alignment
  ALIGN_LEFT: `${ESC}a${String.fromCharCode(0)}`,
  ALIGN_CENTER: `${ESC}a${String.fromCharCode(1)}`,
  ALIGN_RIGHT: `${ESC}a${String.fromCharCode(2)}`,

  // Line feed
  LF: '\n',
  FEED_LINES: (n: number) => `${ESC}d${String.fromCharCode(n)}`,

  // Cut paper
  CUT_FULL: `${GS}V${String.fromCharCode(0)}`,
  CUT_PARTIAL: `${GS}V${String.fromCharCode(1)}`,

  // Barcode (Code128)
  BARCODE: (data: string) => {
    const len = data.length;
    return `${GS}k${String.fromCharCode(73)}${String.fromCharCode(len)}${data}`;
  },

  // QR Code
  QR_CODE: (data: string) => {
    const len = data.length;
    const pL = len % 256;
    const pH = Math.floor(len / 256);
    return `${GS}(k${String.fromCharCode(4)}${String.fromCharCode(0)}${String.fromCharCode(49)}${String.fromCharCode(65)}${String.fromCharCode(50)}${String.fromCharCode(0)}` +
           `${GS}(k${String.fromCharCode(3)}${String.fromCharCode(0)}${String.fromCharCode(49)}${String.fromCharCode(67)}${String.fromCharCode(8)}` +
           `${GS}(k${String.fromCharCode(pL + 3)}${String.fromCharCode(pH)}${String.fromCharCode(49)}${String.fromCharCode(80)}${String.fromCharCode(48)}${data}` +
           `${GS}(k${String.fromCharCode(3)}${String.fromCharCode(0)}${String.fromCharCode(49)}${String.fromCharCode(81)}${String.fromCharCode(48)}`;
  },
};

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface OrderForPrint {
  id: string;
  customerName: string;
  customerPhone?: string;
  fulfillmentMethod: 'delivery' | 'pickup';
  status: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount?: number;
  deliveryFee?: number;
  tipAmount?: number;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  deliveryAddress?: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface TenantForPrint {
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  contactPhone?: string | null;
}

/**
 * Format a receipt for printing
 */
export function formatReceiptForPrinter(
  order: OrderForPrint,
  tenant: TenantForPrint,
  model: string = 'ESC/POS'
): string {
  let receipt = '';

  // Initialize printer
  receipt += ESCPOS_COMMANDS.INIT;

  // Header - Restaurant Name
  receipt += ESCPOS_COMMANDS.ALIGN_CENTER;
  receipt += ESCPOS_COMMANDS.DOUBLE_ON;
  receipt += ESCPOS_COMMANDS.BOLD_ON;
  receipt += tenant.name.toUpperCase();
  receipt += ESCPOS_COMMANDS.NORMAL;
  receipt += ESCPOS_COMMANDS.LF;

  // Restaurant Address
  if (tenant.addressLine1) {
    receipt += tenant.addressLine1 + ESCPOS_COMMANDS.LF;
  }
  if (tenant.city && tenant.state) {
    receipt += `${tenant.city}, ${tenant.state} ${tenant.postalCode || ''}`;
    receipt += ESCPOS_COMMANDS.LF;
  }
  if (tenant.contactPhone) {
    receipt += tenant.contactPhone + ESCPOS_COMMANDS.LF;
  }

  // Separator
  receipt += ESCPOS_COMMANDS.LF;
  receipt += '='.repeat(42) + ESCPOS_COMMANDS.LF;
  receipt += ESCPOS_COMMANDS.LF;

  // Order Type
  receipt += ESCPOS_COMMANDS.ALIGN_LEFT;
  receipt += ESCPOS_COMMANDS.DOUBLE_HEIGHT_ON;
  receipt += ESCPOS_COMMANDS.BOLD_ON;
  receipt += `[${order.fulfillmentMethod.toUpperCase()}]`;
  receipt += ESCPOS_COMMANDS.NORMAL;
  receipt += ESCPOS_COMMANDS.LF;
  receipt += ESCPOS_COMMANDS.LF;

  // Order Info
  receipt += ESCPOS_COMMANDS.BOLD_ON;
  receipt += `Order: ${order.id}`;
  receipt += ESCPOS_COMMANDS.BOLD_OFF;
  receipt += ESCPOS_COMMANDS.LF;

  receipt += `Date: ${formatDateTime(order.createdAt)}`;
  receipt += ESCPOS_COMMANDS.LF;

  receipt += `Status: ${order.status.toUpperCase()}`;
  receipt += ESCPOS_COMMANDS.LF;
  receipt += ESCPOS_COMMANDS.LF;

  // Customer Info
  receipt += ESCPOS_COMMANDS.BOLD_ON;
  receipt += 'CUSTOMER:';
  receipt += ESCPOS_COMMANDS.BOLD_OFF;
  receipt += ESCPOS_COMMANDS.LF;

  receipt += `Name: ${order.customerName}`;
  receipt += ESCPOS_COMMANDS.LF;

  if (order.customerPhone) {
    receipt += `Phone: ${order.customerPhone}`;
    receipt += ESCPOS_COMMANDS.LF;
  }

  // Delivery Address
  if (order.fulfillmentMethod === 'delivery' && order.deliveryAddress) {
    receipt += ESCPOS_COMMANDS.LF;
    receipt += ESCPOS_COMMANDS.BOLD_ON;
    receipt += 'DELIVERY ADDRESS:';
    receipt += ESCPOS_COMMANDS.BOLD_OFF;
    receipt += ESCPOS_COMMANDS.LF;

    receipt += order.deliveryAddress.street + ESCPOS_COMMANDS.LF;
    if (order.deliveryAddress.apartment) {
      receipt += order.deliveryAddress.apartment + ESCPOS_COMMANDS.LF;
    }
    receipt += `${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zip}`;
    receipt += ESCPOS_COMMANDS.LF;
  }

  // Separator
  receipt += ESCPOS_COMMANDS.LF;
  receipt += '-'.repeat(42) + ESCPOS_COMMANDS.LF;
  receipt += ESCPOS_COMMANDS.LF;

  // Items Header
  receipt += ESCPOS_COMMANDS.BOLD_ON;
  receipt += padRight('ITEM', 22);
  receipt += padRight('QTY', 6);
  receipt += padLeft('PRICE', 14);
  receipt += ESCPOS_COMMANDS.BOLD_OFF;
  receipt += ESCPOS_COMMANDS.LF;

  receipt += '-'.repeat(42) + ESCPOS_COMMANDS.LF;

  // Order Items
  order.items.forEach((item) => {
    // Item name
    const name = truncate(item.name, 22);
    receipt += padRight(name, 22);

    // Quantity
    receipt += padRight(`x${item.quantity}`, 6);

    // Price
    receipt += padLeft(`$${item.totalPrice.toFixed(2)}`, 14);
    receipt += ESCPOS_COMMANDS.LF;

    // Item notes (if any)
    if (item.notes) {
      receipt += `  * ${item.notes}`;
      receipt += ESCPOS_COMMANDS.LF;
    }
  });

  // Separator
  receipt += '-'.repeat(42) + ESCPOS_COMMANDS.LF;

  // Totals
  receipt += ESCPOS_COMMANDS.ALIGN_RIGHT;

  // Subtotal
  receipt += padLeft(`Subtotal:`, 28);
  receipt += padLeft(`$${order.subtotal.toFixed(2)}`, 14);
  receipt += ESCPOS_COMMANDS.LF;

  // Tax
  if (order.taxAmount && order.taxAmount > 0) {
    receipt += padLeft(`Tax:`, 28);
    receipt += padLeft(`$${order.taxAmount.toFixed(2)}`, 14);
    receipt += ESCPOS_COMMANDS.LF;
  }

  // Delivery Fee
  if (order.deliveryFee && order.deliveryFee > 0) {
    receipt += padLeft(`Delivery:`, 28);
    receipt += padLeft(`$${order.deliveryFee.toFixed(2)}`, 14);
    receipt += ESCPOS_COMMANDS.LF;
  }

  // Tip
  if (order.tipAmount && order.tipAmount > 0) {
    receipt += padLeft(`Tip:`, 28);
    receipt += padLeft(`$${order.tipAmount.toFixed(2)}`, 14);
    receipt += ESCPOS_COMMANDS.LF;
  }

  // Total
  receipt += ESCPOS_COMMANDS.BOLD_ON;
  receipt += ESCPOS_COMMANDS.DOUBLE_HEIGHT_ON;
  receipt += padLeft(`TOTAL:`, 28);
  receipt += padLeft(`$${order.totalAmount.toFixed(2)}`, 14);
  receipt += ESCPOS_COMMANDS.NORMAL;
  receipt += ESCPOS_COMMANDS.LF;
  receipt += ESCPOS_COMMANDS.LF;

  // Order Notes
  if (order.notes) {
    receipt += ESCPOS_COMMANDS.ALIGN_LEFT;
    receipt += ESCPOS_COMMANDS.BOLD_ON;
    receipt += 'NOTES:';
    receipt += ESCPOS_COMMANDS.BOLD_OFF;
    receipt += ESCPOS_COMMANDS.LF;

    // Wrap notes to 42 characters
    const wrappedNotes = wrapText(order.notes, 42);
    wrappedNotes.forEach((line) => {
      receipt += line + ESCPOS_COMMANDS.LF;
    });
    receipt += ESCPOS_COMMANDS.LF;
  }

  // Footer
  receipt += ESCPOS_COMMANDS.ALIGN_CENTER;
  receipt += '='.repeat(42) + ESCPOS_COMMANDS.LF;
  receipt += ESCPOS_COMMANDS.LF;

  receipt += 'Thank you for your order!';
  receipt += ESCPOS_COMMANDS.LF;
  receipt += ESCPOS_COMMANDS.LF;

  // QR Code for order tracking (optional)
  // const trackingUrl = `https://yourapp.com/order/${order.id}`;
  // receipt += ESCPOS_COMMANDS.QR_CODE(trackingUrl);
  // receipt += ESCPOS_COMMANDS.LF;
  // receipt += ESCPOS_COMMANDS.LF;

  // Feed and cut
  receipt += ESCPOS_COMMANDS.FEED_LINES(3);
  receipt += ESCPOS_COMMANDS.CUT_PARTIAL;

  return receipt;
}

/**
 * Convert ESC/POS string to byte array for sending to printer
 */
export function stringToBytes(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

/**
 * Send data to Bluetooth printer
 * Supports both Capacitor (iOS/Android) and Web Bluetooth (desktop browsers)
 */
export async function sendToBluetoothPrinter(
  deviceId: string,
  data: string
): Promise<void> {
  // Check if running in Capacitor (native app)
  if (typeof window !== 'undefined') {
    const { Capacitor } = require('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Bluetooth plugin for iOS/Android
      try {
        const { BluetoothLE } = require('@capacitor-community/bluetooth-le');
        
        // Connect to device
        await BluetoothLE.connect({ address: deviceId });
        
        // Find the serial port service (SPP)
        const services = await BluetoothLE.discover({ address: deviceId });
        const sppService = services.services?.find(
          (s: any) => s.uuid.toLowerCase() === '00001101-0000-1000-8000-00805f9b34fb'
        );
        
        if (!sppService) {
          throw new Error('Serial Port Profile service not found');
        }
        
        // Find the characteristic for writing data
        const characteristics = await BluetoothLE.characteristics({ 
          address: deviceId,
          service: sppService.uuid 
        });
        
        const writeChar = characteristics.characteristics?.find(
          (c: any) => c.properties?.write || c.properties?.writeWithoutResponse
        );
        
        if (!writeChar) {
          throw new Error('Write characteristic not found');
        }
        
        // Convert data to bytes and write
        const bytes = stringToBytes(data);
        await BluetoothLE.write({
          address: deviceId,
          service: sppService.uuid,
          characteristic: writeChar.uuid,
          value: Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''),
        });
        
        // Disconnect
        await BluetoothLE.disconnect({ address: deviceId });
        
        return;
      } catch (error) {
        console.error('[Bluetooth Printer] Capacitor error:', error);
        throw new Error(`Failed to send data to Bluetooth printer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  // Fallback to Web Bluetooth API (for desktop browsers)
  if (!('bluetooth' in navigator)) {
    throw new Error('Web Bluetooth is not supported. Please use the native app on iOS/Android.');
  }

  try {
    // Get the previously paired device
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [{ services: ['00001101-0000-1000-8000-00805f9b34fb'] }],
    });

    if (!device.gatt) {
      throw new Error('GATT not available');
    }

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('00002a3d-0000-1000-8000-00805f9b34fb');

    const bytes = stringToBytes(data);
    await characteristic.writeValue(bytes);

    await device.gatt.disconnect();
  } catch (error) {
    console.error('[Bluetooth Printer] Error:', error);
    throw new Error('Failed to send data to Bluetooth printer');
  }
}

/**
 * Send data to network printer
 */
export async function sendToNetworkPrinter(
  ipAddress: string,
  port: number,
  data: string
): Promise<void> {
  // Note: Direct network printing from browser requires a WebSocket proxy
  // or server-side printing service. This is a placeholder.

  try {
    const response = await fetch('/api/admin/fulfillment/printer/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ipAddress,
        port,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send to network printer');
    }
  } catch (error) {
    console.error('[Network Printer] Error:', error);
    throw new Error('Failed to send data to network printer');
  }
}

// Utility functions

function padRight(str: string, width: number): string {
  return str.padEnd(width, ' ');
}

function padLeft(str: string, width: number): string {
  return str.padStart(width, ' ');
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine.length > 0 ? ' ' : '') + word;
    } else {
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  });

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

function formatDateTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  return new Intl.DateTimeFormat('en-US', options).format(date);
}
