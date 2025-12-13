/**
 * Client-Side Printer Utility
 * Handles Bluetooth printing using Capacitor on iOS/Android tablets
 * Falls back to Web Bluetooth API for desktop browsers
 */

import { formatReceiptForPrinter, sendToBluetoothPrinter, stringToBytes } from './printer-service';
import type { SerializedOrder } from './order-serializer';

export interface PrinterConfig {
  type: 'bluetooth' | 'network' | 'usb' | 'none';
  name: string;
  deviceId?: string; // Bluetooth device ID/address
  ipAddress?: string; // Network printer IP
  port?: number; // Network printer port
  model?: string; // Printer model (ESC/POS, Brother QL, etc.)
}

export interface TenantInfo {
  id: string;
  name: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  contactPhone?: string | null;
}

/**
 * Check if running in Capacitor native app
 */
export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const { Capacitor } = require('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Check if Web Bluetooth is available
 */
export function isWebBluetoothAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return 'bluetooth' in navigator;
}

/**
 * Check if Bluetooth printing is available
 */
export function isBluetoothPrintingAvailable(): boolean {
  return isCapacitorNative() || isWebBluetoothAvailable();
}

/**
 * Format order for printing
 */
function formatOrderForPrint(order: SerializedOrder, tenant: TenantInfo) {
  return {
    id: order.id,
    customerName: order.customerName || order.customer?.name || 'Guest',
    customerPhone: order.customerPhone || order.customer?.phone || undefined,
    fulfillmentMethod: (order.fulfillmentMethod || 'pickup') as 'delivery' | 'pickup',
    status: order.status || 'pending',
    items: order.items.map((item) => ({
      name: item.menuItemName || 'Unknown Item',
      quantity: item.quantity || 1,
      unitPrice: Number(item.price || 0),
      totalPrice: Number(item.price || 0) * (item.quantity || 1),
      notes: undefined, // Order items don't have notes in serialized format
    })),
    subtotal: Number(order.subtotalAmount || 0),
    taxAmount: Number(order.taxAmount || 0),
    deliveryFee: Number(order.deliveryFee || 0),
    tipAmount: Number(order.tipAmount || 0),
    totalAmount: Number(order.totalAmount || 0),
    notes: order.notes || undefined,
    createdAt: new Date(order.createdAt),
    deliveryAddress: order.deliveryAddress
      ? {
          street: order.deliveryAddress.line1 || '',
          apartment: order.deliveryAddress.line2 || undefined,
          city: order.deliveryAddress.city || '',
          state: order.deliveryAddress.state || '',
          zip: order.deliveryAddress.postalCode || '',
        }
      : undefined,
  };
}

/**
 * Print order using client-side Bluetooth (Capacitor or Web Bluetooth)
 */
export async function printOrderClientSide(
  order: SerializedOrder,
  tenant: TenantInfo,
  config: PrinterConfig
): Promise<{ success: boolean; error?: string }> {
  if (config.type !== 'bluetooth' || !config.deviceId) {
    return { success: false, error: 'Bluetooth printer not configured' };
  }

  if (!isBluetoothPrintingAvailable()) {
    return {
      success: false,
      error: 'Bluetooth printing not available. Please use the native app on iOS/Android.',
    };
  }

  try {
    // Format order for printing
    const orderForPrint = formatOrderForPrint(order, tenant);
    const tenantForPrint = {
      name: tenant.name,
      addressLine1: tenant.addressLine1,
      addressLine2: tenant.addressLine2,
      city: tenant.city,
      state: tenant.state,
      postalCode: tenant.postalCode,
      contactPhone: tenant.contactPhone,
    };

    // Generate ESC/POS receipt
    const receiptData = formatReceiptForPrinter(
      orderForPrint,
      tenantForPrint,
      config.model || 'ESC/POS'
    );

    // Send to Bluetooth printer
    await sendToBluetoothPrinter(config.deviceId, receiptData);

    return { success: true };
  } catch (error) {
    console.error('[Client Printer] Error printing order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to print order',
    };
  }
}

/**
 * Print order using Web Bluetooth API (desktop browsers)
 */
export async function printOrderWebBluetooth(
  order: SerializedOrder,
  tenant: TenantInfo,
  config: PrinterConfig
): Promise<{ success: boolean; error?: string }> {
  if (!isWebBluetoothAvailable()) {
    return { success: false, error: 'Web Bluetooth is not supported' };
  }

  try {
    const orderForPrint = formatOrderForPrint(order, tenant);
    const tenantForPrint = {
      name: tenant.name,
      addressLine1: tenant.addressLine1,
      addressLine2: tenant.addressLine2,
      city: tenant.city,
      state: tenant.state,
      postalCode: tenant.postalCode,
      contactPhone: tenant.contactPhone,
    };

    const receiptData = formatReceiptForPrinter(
      orderForPrint,
      tenantForPrint,
      config.model || 'ESC/POS'
    );

    // Use Web Bluetooth API
    const navigatorBluetooth = (navigator as any).bluetooth;
    const device = await navigatorBluetooth.requestDevice({
      filters: [{ services: ['00001101-0000-1000-8000-00805f9b34fb'] }], // SPP service
    });

    if (!device.gatt) {
      throw new Error('GATT not available');
    }

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('00002a3d-0000-1000-8000-00805f9b34fb');

    const bytes = stringToBytes(receiptData);

    // Write in chunks (BLE has 20-byte limit)
    const chunkSize = 20;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      await characteristic.writeValue(bytes.slice(i, i + chunkSize));
    }

    await device.gatt.disconnect();

    return { success: true };
  } catch (error) {
    console.error('[Web Bluetooth] Error printing order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to print order',
    };
  }
}

