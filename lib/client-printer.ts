/**
 * Client-Side Printer Utility
 * Multi-method printing system with fallbacks:
 * 1. StarPrinter plugin (if available)
 * 2. BluetoothPrinter plugin (External Accessory)
 * 3. Bluetooth LE plugin
 * 4. PassPRNT app (Star Micronics)
 * 5. Web Bluetooth (desktop browsers)
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
 * Check if StarPrinter plugin is available
 */
export async function isStarPrinterAvailable(): Promise<boolean> {
  if (!isCapacitorNative()) return false;
  try {
    const { Plugins } = await import('@capacitor/core');
    const StarPrinter = (Plugins as any).StarPrinter;
    return !!StarPrinter;
  } catch {
    return false;
  }
}

/**
 * Check if BluetoothPrinter plugin is available
 */
export async function isBluetoothPrinterPluginAvailable(): Promise<boolean> {
  if (!isCapacitorNative()) return false;
  try {
    const { Plugins } = await import('@capacitor/core');
    const BluetoothPrinter = (Plugins as any).BluetoothPrinter;
    return !!BluetoothPrinter;
  } catch {
    return false;
  }
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
      notes: undefined,
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
 * Generate receipt data for printing
 */
function generateReceiptData(order: SerializedOrder, tenant: TenantInfo, config: PrinterConfig): string {
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

  return formatReceiptForPrinter(
    orderForPrint,
    tenantForPrint,
    config.model || 'ESC/POS'
  );
}

/**
 * Print using StarPrinter plugin (Method 1)
 */
async function printWithStarPrinterPlugin(
  receiptData: string,
  config: PrinterConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const { Plugins } = await import('@capacitor/core');
    const StarPrinter = (Plugins as any).StarPrinter;
    
    if (!StarPrinter) {
      throw new Error('StarPrinter plugin not available');
    }

    // Extract identifier (remove BT: prefix if present)
    let identifier = config.deviceId!;
    if (identifier.startsWith('BT:')) {
      identifier = identifier.substring(3);
      console.log('[StarPrinter] Removed BT: prefix, using identifier:', identifier);
    }

    // Determine interface type - TSP100III uses Bluetooth Classic (MFi)
    const interfaceType = 'bluetooth'; // Bluetooth Classic for MFi printers

    console.log('[StarPrinter] Connecting to:', identifier, 'via', interfaceType);
    
    // Connect with interface type
    await StarPrinter.connect({ 
      identifier: identifier,
      interfaceType: interfaceType
    });
    
    console.log('[StarPrinter] Connected successfully, printing...');
    
    // Print - Note: TSP100III may need image rendering, but try text first
    await StarPrinter.printRawText({ text: receiptData, cut: true });
    
    // Disconnect
    await StarPrinter.disconnect();
    
    console.log('[Print] ✅ StarPrinter plugin success');
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'StarPrinter failed';
    console.warn('[Print] StarPrinter plugin failed:', errorMsg);
    
    // If it's a TSP100III image printing error, provide helpful message
    if (errorMsg.includes('image') || errorMsg.includes('TSP100III')) {
      return { 
        success: false, 
        error: 'TSP100III requires image-based printing. Text printing not supported. This needs to be implemented.' 
      };
    }
    
    return { success: false, error: errorMsg };
  }
}

/**
 * Print using BluetoothPrinter plugin (Method 2 - External Accessory)
 */
async function printWithBluetoothPrinterPlugin(
  receiptData: string,
  config: PrinterConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const { Plugins } = await import('@capacitor/core');
    const BluetoothPrinter = (Plugins as any).BluetoothPrinter;
    
    if (!BluetoothPrinter) {
      throw new Error('BluetoothPrinter plugin not available');
    }

    // Connect
    const connectResult = await BluetoothPrinter.connect({ identifier: config.deviceId! });
    
    if (!connectResult.connected) {
      throw new Error('Failed to connect to printer');
    }
    
    // Print
    const printResult = await BluetoothPrinter.print({ text: receiptData });
    
    if (!printResult.success) {
      throw new Error('Print failed');
    }
    
    // Disconnect
    await BluetoothPrinter.disconnect();
    
    console.log('[Print] ✅ BluetoothPrinter plugin success');
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'BluetoothPrinter failed';
    console.warn('[Print] BluetoothPrinter plugin failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Print using Bluetooth LE plugin (Method 3)
 */
async function printWithBluetoothLE(
  receiptData: string,
  config: PrinterConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const { BleClient, numbersToDataView } = require('@capacitor-community/bluetooth-le');
    
    await BleClient.initialize();
    await BleClient.connect(config.deviceId!, () => {
      console.log('[Bluetooth LE] Device disconnected');
    });
    
    const services = await BleClient.getServices(config.deviceId!);
    const sppServiceUuid = '00001101-0000-1000-8000-00805f9b34fb';
    const sppService = services.find(
      (s: any) => s.uuid.toLowerCase() === sppServiceUuid.toLowerCase()
    ) || services[0];
    
    if (!sppService) {
      throw new Error('No services found');
    }
    
    const characteristics = sppService.characteristics || [];
    const writeChar = characteristics.find(
      (c: any) => c.properties?.write || c.properties?.writeWithoutResponse
    );
    
    if (!writeChar) {
      throw new Error('Write characteristic not found');
    }
    
    const encoder = new TextEncoder();
    const bytes = encoder.encode(receiptData);
    const chunkSize = 20;
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = Array.from(bytes.slice(i, i + chunkSize));
      const dataView = numbersToDataView(chunk);
      await BleClient.write(config.deviceId!, sppService.uuid, writeChar.uuid, dataView);
    }
    
    await BleClient.disconnect(config.deviceId!);
    
    console.log('[Print] ✅ Bluetooth LE success');
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Bluetooth LE failed';
    console.warn('[Print] Bluetooth LE failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Print via PassPRNT app (Method 4 - Star Micronics)
 */
async function printViaPassPRNT(
  receiptData: string,
  config: PrinterConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Encode receipt data
    const encodedData = encodeURIComponent(receiptData);
    
    // PassPRNT URL scheme
    // Format: passprnt://print?data=<encoded_data>&printer=<printer_name>
    const passprntUrl = `passprnt://print?data=${encodedData}&printer=${encodeURIComponent(config.name || 'Default')}`;
    
    // Try to open PassPRNT
    const opened = window.open(passprntUrl, '_blank');
    
    if (!opened) {
      // Fallback: try window.location
      window.location.href = passprntUrl;
    }
    
    // Give it a moment to launch
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('[Print] ✅ PassPRNT launched');
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'PassPRNT failed';
    console.warn('[Print] PassPRNT failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Print using Web Bluetooth (Method 5 - Desktop browsers)
 */
async function printWithWebBluetooth(
  receiptData: string,
  config: PrinterConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    await sendToBluetoothPrinter(config.deviceId!, receiptData);
    console.log('[Print] ✅ Web Bluetooth success');
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Web Bluetooth failed';
    console.warn('[Print] Web Bluetooth failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Print order using multi-method fallback system
 * Tries methods in order until one succeeds
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

  // Generate receipt data once
  const receiptData = generateReceiptData(order, tenant, config);
  
  const methods: Array<{ name: string; fn: () => Promise<{ success: boolean; error?: string }> }> = [];

  // Method 1: StarPrinter plugin (if available)
  if (await isStarPrinterAvailable()) {
    methods.push({
      name: 'StarPrinter plugin',
      fn: () => printWithStarPrinterPlugin(receiptData, config),
    });
  }

  // Method 2: BluetoothPrinter plugin (External Accessory)
  if (await isBluetoothPrinterPluginAvailable()) {
    methods.push({
      name: 'BluetoothPrinter plugin',
      fn: () => printWithBluetoothPrinterPlugin(receiptData, config),
    });
  }

  // Method 3: Bluetooth LE (always try if native)
  if (isCapacitorNative()) {
    methods.push({
      name: 'Bluetooth LE',
      fn: () => printWithBluetoothLE(receiptData, config),
    });
  }

  // Method 4: PassPRNT app (iOS only, Star Micronics)
  if (isCapacitorNative()) {
    methods.push({
      name: 'PassPRNT app',
      fn: () => printViaPassPRNT(receiptData, config),
    });
  }

  // Method 5: Web Bluetooth (desktop browsers)
  if (isWebBluetoothAvailable()) {
    methods.push({
      name: 'Web Bluetooth',
      fn: () => printWithWebBluetooth(receiptData, config),
    });
  }

  if (methods.length === 0) {
    return {
      success: false,
      error: 'No printing methods available. Please ensure you are using the native app or a supported browser.',
    };
  }

  // Try each method in order
  const errors: string[] = [];
  for (const method of methods) {
    console.log(`[Print] Trying ${method.name}...`);
    const result = await method.fn();
    
    if (result.success) {
      console.log(`[Print] ✅ Success with ${method.name}`);
      return { success: true };
    }
    
    errors.push(`${method.name}: ${result.error || 'Unknown error'}`);
    console.warn(`[Print] ❌ ${method.name} failed:`, result.error);
  }

  // All methods failed
  return {
    success: false,
    error: `All printing methods failed:\n${errors.join('\n')}\n\nPlease check:\n1. Printer is powered on\n2. Printer is paired in iPad Settings > Bluetooth\n3. PassPRNT app is installed (for Star printers)`,
  };
}

/**
 * Disconnect from any active printer connections
 */
export async function disconnectStarPrinter(): Promise<void> {
  // Try to disconnect from all possible plugins
  if (isCapacitorNative()) {
    try {
      const { Plugins } = await import('@capacitor/core');
      
      // Disconnect StarPrinter
      const StarPrinter = (Plugins as any).StarPrinter;
      if (StarPrinter) {
        try {
          await StarPrinter.disconnect();
        } catch (e) {
          // Ignore
        }
      }
      
      // Disconnect BluetoothPrinter
      const BluetoothPrinter = (Plugins as any).BluetoothPrinter;
      if (BluetoothPrinter) {
        try {
          await BluetoothPrinter.disconnect();
        } catch (e) {
          // Ignore
        }
      }
    } catch (e) {
      // Ignore
    }
  }
}

/**
 * Test plugin availability (for debugging)
 */
export async function testPluginAvailability(): Promise<void> {
  if (!isCapacitorNative()) {
    console.log('[Plugin Test] Not in native app');
    return;
  }

  console.log('[Plugin Test] Testing plugin availability...');
  
  try {
    const { Plugins } = await import('@capacitor/core');
    
    // Test StarPrinter
    const StarPrinter = (Plugins as any).StarPrinter;
    if (StarPrinter) {
      console.log('✅ StarPrinter plugin available');
      try {
        const result = await StarPrinter.listConnectedAccessories();
        console.log('Connected accessories:', result);
      } catch (e) {
        console.log('StarPrinter.listConnectedAccessories error:', e);
      }
    } else {
      console.log('❌ StarPrinter plugin not available');
    }
    
    // Test BluetoothPrinter
    const BluetoothPrinter = (Plugins as any).BluetoothPrinter;
    if (BluetoothPrinter) {
      console.log('✅ BluetoothPrinter plugin available');
      try {
        const result = await BluetoothPrinter.listPairedPrinters();
        console.log('Paired printers:', result);
      } catch (e) {
        console.log('BluetoothPrinter.listPairedPrinters error:', e);
      }
    } else {
      console.log('❌ BluetoothPrinter plugin not available');
    }
    
    // Test Bluetooth LE
    try {
      const { BleClient } = require('@capacitor-community/bluetooth-le');
      await BleClient.initialize();
      console.log('✅ Bluetooth LE plugin available');
    } catch (e) {
      console.log('❌ Bluetooth LE plugin not available:', e);
    }
  } catch (e) {
    console.error('[Plugin Test] Error:', e);
  }
}
