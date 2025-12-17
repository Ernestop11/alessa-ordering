/**
 * Star Printer Plugin for Capacitor
 * Wraps the native StarIO10 SDK for Star TSP100III and other Star printers
 */

import { registerPlugin } from '@capacitor/core';

export interface StarPrinterPlugin {
  discoverPrinters(): Promise<{ printers: StarPrinterDevice[] }>;
  listConnectedAccessories(): Promise<{ accessories: ConnectedAccessory[]; count: number }>;
  connect(options: { identifier: string; interfaceType?: string }): Promise<{ connected: boolean; identifier: string; interfaceType?: string }>;
  disconnect(): Promise<{ disconnected: boolean }>;
  printReceipt(options: PrintReceiptOptions): Promise<{ success: boolean }>;
  printRawText(options: { text: string; cut?: boolean }): Promise<{ success: boolean }>;
  getStatus(): Promise<PrinterStatus>;
  addListener(
    eventName: 'printerFound',
    listenerFunc: (event: { identifier: string; interfaceType: string }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'discoveryFinished',
    listenerFunc: (event: { count: number }) => void
  ): Promise<{ remove: () => void }>;
}

export interface ConnectedAccessory {
  name: string;
  manufacturer: string;
  model: string;
  serial: string;
  protocols: string[];
  isConnected: boolean;
  connectionID: number;
  isStarPrinter: boolean;
  identifier: string;
}

export interface StarPrinterDevice {
  identifier: string;
  interfaceType: string;
  model?: string;
}

export interface PrintReceiptOptions {
  content: string;
  customerName?: string;
  orderId?: string;
  total?: string;
  items?: Array<{ name: string; quantity: number; price: number; notes?: string }>;
  notes?: string;
}

export interface PrinterStatus {
  online: boolean;
  coverOpen: boolean;
  paperEmpty: boolean;
  paperNearEmpty: boolean;
}

// Register the plugin
const StarPrinter = registerPlugin<StarPrinterPlugin>('StarPrinter', {
  web: () => import('./star-printer-web').then(m => new m.StarPrinterWeb()),
});

export default StarPrinter;

// Helper function to check if Star Printer is available (native only)
export function isStarPrinterAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const { Capacitor } = require('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

// Format order for Star printer receipt
export function formatOrderForStarPrinter(order: {
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
}): string {
  const lines: string[] = [];

  // Header
  lines.push('================================');
  lines.push(`ORDER #${order.id.slice(0, 8).toUpperCase()}`);
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
  }
  lines.push('');
  lines.push('--------------------------------');
  lines.push('');

  // Items
  for (const item of order.items) {
    const name = item.menuItemName || item.name || 'Item';
    const qty = item.quantity;
    const price = (item.price * qty).toFixed(2);
    const typeEmoji = item.itemType === 'grocery' ? '[G]' : item.itemType === 'bakery' ? '[B]' : '';

    lines.push(`${qty}x ${name} ${typeEmoji}`);
    lines.push(`   $${price}`);

    if (item.notes) {
      lines.push(`   >> ${item.notes}`);
    }
  }

  lines.push('');
  lines.push('--------------------------------');

  // Totals
  if (order.subtotalAmount) {
    lines.push(`Subtotal: $${order.subtotalAmount.toFixed(2)}`);
  }
  if (order.taxAmount) {
    lines.push(`Tax: $${order.taxAmount.toFixed(2)}`);
  }
  if (order.tipAmount) {
    lines.push(`Tip: $${order.tipAmount.toFixed(2)}`);
  }
  lines.push('');
  lines.push(`TOTAL: $${order.totalAmount.toFixed(2)}`);
  lines.push('');

  // Notes
  if (order.notes) {
    lines.push('--------------------------------');
    lines.push('NOTES:');
    lines.push(order.notes);
  }

  lines.push('');
  lines.push('================================');
  lines.push('Thank you for your order!');
  lines.push('================================');
  lines.push('');
  lines.push('');

  return lines.join('\n');
}
