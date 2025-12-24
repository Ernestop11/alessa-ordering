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
  type: 'bluetooth' | 'network' | 'usb' | 'passprnt' | 'none';
  name: string;
  deviceId?: string; // Bluetooth device ID/address
  ipAddress?: string; // Network printer IP
  host?: string; // Alias for ipAddress
  port?: number; // Network printer port
  model?: string; // Printer model (ESC/POS, Brother QL, etc.)
  profile?: string; // Printer profile (escpos-80mm, escpos-58mm, etc.)
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
 * Print via PassPRNT app (Star Micronics iOS/Android)
 * Uses the official Star PassPRNT URL scheme
 * Docs: https://www.star-m.jp/products/s_print/sdk/passprnt/manual/ios/en/data_specifications.html
 */
async function printViaPassPRNT(
  receiptData: string,
  config: PrinterConfig,
  orderId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Parse the plain text receipt and convert to well-formatted HTML
    // The receiptData contains ESC/POS formatted text, we need to make it readable
    const lines = receiptData.split('\n');
    let htmlContent = '';

    for (const line of lines) {
      // Skip ESC/POS control characters (they start with \x1b or \x1d)
      const cleanLine = line.replace(/[\x00-\x1f]/g, '').trim();
      if (!cleanLine) {
        htmlContent += '<br>';
        continue;
      }

      // Detect headers (centered, usually restaurant name or order #)
      if (cleanLine.includes('===') || cleanLine.includes('---')) {
        htmlContent += '<hr style="border:1px dashed #000;margin:8px 0;">';
      } else if (cleanLine.match(/^[A-Z\s]+$/) && cleanLine.length < 30) {
        // All caps short text = header
        htmlContent += `<div style="text-align:center;font-weight:bold;font-size:24px;margin:8px 0;">${cleanLine}</div>`;
      } else if (cleanLine.startsWith('Order #') || cleanLine.startsWith('ORDER #')) {
        htmlContent += `<div style="text-align:center;font-weight:bold;font-size:20px;margin:8px 0;">${cleanLine}</div>`;
      } else if (cleanLine.startsWith('TOTAL') || cleanLine.startsWith('Total')) {
        htmlContent += `<div style="font-weight:bold;font-size:20px;margin:8px 0;">${cleanLine}</div>`;
      } else if (cleanLine.match(/^\d+\s*x\s/i)) {
        // Item line (starts with quantity like "2 x ")
        htmlContent += `<div style="font-size:18px;margin:4px 0;">${cleanLine}</div>`;
      } else if (cleanLine.match(/^\$[\d.]+/) || cleanLine.match(/[\d.]+$/)) {
        // Price line
        htmlContent += `<div style="font-size:16px;margin:2px 0;">${cleanLine}</div>`;
      } else {
        htmlContent += `<div style="font-size:16px;margin:2px 0;">${cleanLine}</div>`;
      }
    }

    // Build a clean HTML receipt optimized for thermal printing
    const htmlReceipt = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 16px;
      line-height: 1.4;
      padding: 10px;
      max-width: 100%;
    }
    hr { border: 1px dashed #000; margin: 10px 0; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;

    // Build PassPRNT URL scheme
    // Format: starpassprnt://v1/print/nopreview?html=...&back=...&size=...&cut=...
    let passprntUrl = 'starpassprnt://v1/print/nopreview?';

    // Add HTML content (URL encoded)
    passprntUrl += 'html=' + encodeURIComponent(htmlReceipt);

    // Set paper width (576 dots = 80mm, 384 dots = 58mm)
    const paperWidth = config.profile?.includes('58mm') ? '384' : '576';
    passprntUrl += '&size=' + paperWidth;

    // Set cut type (partial cut for easier tearing)
    passprntUrl += '&cut=partial';

    // Set callback URL to return to the app after printing
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (currentUrl) {
      passprntUrl += '&back=' + encodeURIComponent(currentUrl);
    }

    console.log(`[PassPRNT] Launching with ${orderId ? `order ${orderId}` : 'receipt'}...`);
    console.log(`[PassPRNT] URL length: ${passprntUrl.length} chars`);

    // Launch PassPRNT - iOS requires direct user gesture or window.location
    if (typeof window !== 'undefined') {
      // Method: Use window.location.href which is most reliable for URL schemes on iOS
      // The 'back' parameter should bring user back to the PWA after printing
      window.location.href = passprntUrl;
    }

    // Give it a moment to launch
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('[PassPRNT] ✅ App launch triggered');
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'PassPRNT failed';
    console.warn('[PassPRNT] Failed:', errorMsg);
    return {
      success: false,
      error: `PassPRNT failed: ${errorMsg}. Make sure PassPRNT app is installed from the App Store.`
    };
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
 * Try to print via HTTP to the printer directly (some printers support this)
 * This works if the browser is on the same network as the printer
 */
async function tryHttpPrinting(
  receiptData: string,
  host: string,
  httpPort: number = 80
): Promise<{ success: boolean; error?: string }> {
  try {
    // Some ESC/POS printers accept raw POST to their HTTP port
    const response = await fetch(`http://${host}:${httpPort}/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: receiptData,
      mode: 'no-cors', // Needed for cross-origin requests to local printers
    });

    // With no-cors mode, we can't read the response, so we assume success if no exception
    console.log('[Print] HTTP print request sent (no-cors mode)');
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'HTTP print failed';
    return { success: false, error: errorMsg };
  }
}

/**
 * Print to network printer via server relay API
 * NOTE: This only works if the VPS can reach the printer.
 * For local network printers not accessible from VPS, this will fail gracefully.
 */
async function printToNetworkPrinterViaRelay(
  receiptData: string,
  config: PrinterConfig,
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const host = config.ipAddress || config.host;
  const port = config.port || 9100;

  if (!host) {
    return { success: false, error: 'Network printer host not configured' };
  }

  // Check if this looks like a local network IP
  const isLocalNetwork = host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.startsWith('172.16.') ||
    host.startsWith('172.17.') ||
    host.startsWith('172.18.') ||
    host.startsWith('172.19.') ||
    host.startsWith('172.20.') ||
    host.startsWith('172.21.') ||
    host.startsWith('172.22.') ||
    host.startsWith('172.23.') ||
    host.startsWith('172.24.') ||
    host.startsWith('172.25.') ||
    host.startsWith('172.26.') ||
    host.startsWith('172.27.') ||
    host.startsWith('172.28.') ||
    host.startsWith('172.29.') ||
    host.startsWith('172.30.') ||
    host.startsWith('172.31.');

  if (isLocalNetwork) {
    console.log(`[Print] Local network printer detected (${host})`);

    // First, try direct HTTP printing from browser (works if printer supports HTTP)
    console.log('[Print] Attempting direct HTTP print to printer...');
    const httpResult = await tryHttpPrinting(receiptData, host, 80);
    if (httpResult.success) {
      console.log('[Print] ✅ Direct HTTP print succeeded');
      return { success: true };
    }
    console.log('[Print] Direct HTTP print failed, trying relay API...');
  }

  try {
    console.log(`[Print] Sending to network printer ${host}:${port} via relay API`);

    // Call server API endpoint to relay print job to network printer
    const response = await fetch('/api/fulfillment/print-network', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host,
        port,
        data: receiptData,
        orderId,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('[Print] ✅ Network printer relay success');
      return { success: true };
    } else {
      // Check for "unreachable" hint - this means VPS can't reach local printer
      if (result.hint?.includes('local network')) {
        console.log('[Print] VPS cannot reach local printer - this is expected for local network printers');
        return {
          success: false,
          error: `Printer at ${host} is on a local network not accessible from the server. Manual print required, or use a local print relay service.`,
        };
      }
      return { success: false, error: result.error || 'Unknown error' };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Network print failed';
    console.warn('[Print] Network printer relay failed:', errorMsg);
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
  // Handle PassPRNT (Star Micronics via URL scheme)
  // This is the recommended method for Star printers on iPad
  if (config.type === 'passprnt') {
    console.log('[Print] Using PassPRNT (Star Micronics) for printing');
    const receiptData = generateReceiptData(order, tenant, config);
    return printViaPassPRNT(receiptData, config, order.id);
  }

  // Handle network printers (WiFi thermal printers)
  if (config.type === 'network') {
    const host = config.ipAddress || config.host;
    if (!host) {
      return { success: false, error: 'Network printer host not configured' };
    }

    // Generate receipt data
    const receiptData = generateReceiptData(order, tenant, config);

    // Use the relay API for network printing
    return printToNetworkPrinterViaRelay(receiptData, config, order.id);
  }

  // Handle Bluetooth printers
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
 * Check if network printing is available (for client-side network printers)
 */
export function isNetworkPrintingAvailable(): boolean {
  // Network printing via relay API is always available when online
  return typeof window !== 'undefined' && navigator.onLine;
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
