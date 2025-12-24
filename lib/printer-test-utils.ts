/**
 * Printer Plugin Testing Utilities
 * Use these functions to test plugin availability and functionality
 */

import { isCapacitorNative, testPluginAvailability } from './client-printer';

/**
 * Test all printer plugins and log results
 * Call this from browser console or a test page
 */
export async function testAllPrinterPlugins(): Promise<void> {
  console.log('🧪 Testing Printer Plugins...\n');
  
  if (!isCapacitorNative()) {
    console.log('❌ Not running in native app - plugins only work in Capacitor native apps');
    return;
  }

  await testPluginAvailability();
  
  console.log('\n✅ Plugin test complete!');
  console.log('\nTo test printing:');
  console.log('1. Go to Fulfillment > Settings > Printer Setup');
  console.log('2. Scan for printers');
  console.log('3. Select a printer');
  console.log('4. Click "Test Print"');
}

/**
 * List available printers using all methods
 */
export async function listAllAvailablePrinters(): Promise<any> {
  if (!isCapacitorNative()) {
    return { error: 'Not in native app' };
  }

  const results: any = {
    starPrinter: null,
    bluetoothPrinter: null,
    bluetoothLE: null,
  };

  try {
    const { Plugins } = await import('@capacitor/core');
    
    // Try StarPrinter
    const StarPrinter = (Plugins as any).StarPrinter;
    if (StarPrinter) {
      try {
        const result = await StarPrinter.listConnectedAccessories();
        results.starPrinter = result;
      } catch (e: any) {
        results.starPrinter = { error: e.message };
      }
    }
    
    // Try BluetoothPrinter
    const BluetoothPrinter = (Plugins as any).BluetoothPrinter;
    if (BluetoothPrinter) {
      try {
        const result = await BluetoothPrinter.listPairedPrinters();
        results.bluetoothPrinter = result;
      } catch (e: any) {
        results.bluetoothPrinter = { error: e.message };
      }
    }
    
    // Try Bluetooth LE
    try {
      const { BleClient } = require('@capacitor-community/bluetooth-le');
      await BleClient.initialize();
      results.bluetoothLE = { initialized: true };
    } catch (e: any) {
      results.bluetoothLE = { error: e.message };
    }
  } catch (e: any) {
    return { error: e.message };
  }

  return results;
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testPrinterPlugins = testAllPrinterPlugins;
  (window as any).listPrinters = listAllAvailablePrinters;
}

