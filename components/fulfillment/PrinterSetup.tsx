"use client";

import { useState, useEffect } from 'react';
import { isCapacitorNative } from '@/lib/client-printer';

export type PrinterType = 'bluetooth' | 'network' | 'usb' | 'passprnt' | 'none';

export interface PrinterConfig {
  type: PrinterType;
  name: string;
  deviceId?: string; // Bluetooth device ID
  ipAddress?: string; // Network printer IP
  port?: number; // Network printer port (default: 9100)
  vendorId?: number; // USB vendor ID
  productId?: number; // USB product ID
  model?: string; // Printer model (Brother QL, Star, ESC/POS, etc.)
}

interface Props {
  currentConfig?: PrinterConfig | null;
  onSave: (config: PrinterConfig) => Promise<void>;
  onTest: (config: PrinterConfig) => Promise<void>;
}

// Known printer vendors for Bluetooth detection
const KNOWN_VENDORS = {
  brother: {
    name: 'Brother',
    services: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2'], // Brother printer service UUID
    models: ['QL-820NWB', 'QL-1110NWB', 'QL-700', 'QL-800'],
  },
  star: {
    name: 'Star Micronics',
    services: ['00001101-0000-1000-8000-00805f9b34fb'], // SPP service UUID
    models: ['TSP143III', 'TSP654II', 'TSP100'],
  },
  escpos: {
    name: 'ESC/POS Compatible',
    services: ['00001101-0000-1000-8000-00805f9b34fb'], // Generic SPP
    models: ['Generic ESC/POS'],
  },
};

export default function PrinterSetup({ currentConfig, onSave, onTest }: Props) {
  const [printerType, setPrinterType] = useState<PrinterType>(currentConfig?.type || 'none');
  const [printerName, setPrinterName] = useState(currentConfig?.name || '');
  const [deviceId, setDeviceId] = useState(currentConfig?.deviceId || '');
  const [ipAddress, setIpAddress] = useState(currentConfig?.ipAddress || '');
  const [port, setPort] = useState(currentConfig?.port || 9100);
  const [model, setModel] = useState(currentConfig?.model || 'ESC/POS');

  const [scanning, setScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if Bluetooth is available (Capacitor or Web Bluetooth)
  const [bluetoothAvailable, setBluetoothAvailable] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [scanListener, setScanListener] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if running in Capacitor native app
      const native = isCapacitorNative();
      console.log('[PrinterSetup] isCapacitorNative:', native);
      console.log('[PrinterSetup] window.Capacitor:', (window as any).Capacitor);
      setIsNativeApp(native);
      setBluetoothAvailable(native); // Bluetooth LE works in native app
    }

    // Cleanup scan listener on unmount
    return () => {
      if (scanListener) {
        try {
          scanListener.remove?.();
        } catch (e) {
          console.warn('[PrinterSetup] Error removing scan listener:', e);
        }
      }
    };
  }, [scanListener]);

  const scanBluetoothPrinters = async () => {
    console.log('[PrinterSetup] scanBluetoothPrinters called, isNativeApp:', isNativeApp);

    if (!isNativeApp) {
      setError('Bluetooth printing requires the native iOS/Android app. Please use the installed app on your iPad.');
      return;
    }

    setScanning(true);
    setError(null);
    setAvailableDevices([]);

    try {
      // FIRST: Try StarPrinter plugin to check already-paired devices (for MFi Bluetooth Classic like TSP100III)
      const { Plugins } = require('@capacitor/core');
      const StarPrinter = Plugins.StarPrinter as any;
      
      if (StarPrinter) {
        console.log('[PrinterSetup] ✅ StarPrinter plugin available, checking for already-paired devices...');
        
        try {
          // Method 1: Check EAAccessoryManager for already-connected accessories
          // This is what the Star utility app uses - it finds already-paired printers
          const listResult = await StarPrinter.listConnectedAccessories();
          console.log('[PrinterSetup] listConnectedAccessories result:', listResult);
          
          if (listResult?.accessories && listResult.accessories.length > 0) {
            console.log('[PrinterSetup] Found', listResult.accessories.length, 'accessory/ies via EAAccessoryManager');
            
            // Filter for Star printers and map to our format
            const starPrinters = listResult.accessories
              .filter((acc: any) => {
                const isStar = acc.isStarPrinter || 
                             acc.protocols?.some((p: string) => p.includes('star')) ||
                             acc.protocols?.includes('jp.star-m.starpro');
                if (isStar) {
                  console.log('[PrinterSetup] ✅ Found Star printer:', acc.name, acc.model);
                }
                return isStar;
              })
              .map((acc: any) => ({
                deviceId: acc.identifier || `BT:${acc.serial}`,
                identifier: acc.identifier || `BT:${acc.serial}`,
                name: acc.name || 'Star Printer',
                model: acc.model || acc.modelNumber || 'Unknown',
                manufacturer: acc.manufacturer || 'Star Micronics',
                isConnected: acc.isConnected || false,
                serial: acc.serial || acc.serialNumber,
                source: 'StarPrinter-EAAccessory',
              }));
            
            if (starPrinters.length > 0) {
              console.log('[PrinterSetup] ✅ Found', starPrinters.length, 'Star printer(s) already paired!');
              setAvailableDevices(starPrinters);
              setScanning(false);
              if (starPrinters.length === 1) {
                // Auto-select single printer
                const printer = starPrinters[0];
                setPrinterType('bluetooth');
                setPrinterName(printer.name);
                setDeviceId(printer.deviceId);
                setModel('ESC/POS');
                setSuccess(`✅ Found printer: ${printer.name} (${printer.model})`);
              } else {
                setSuccess(`✅ Found ${starPrinters.length} Star printer(s) already paired. Select one from the list.`);
              }
              return; // Success - exit early
            } else {
              console.log('[PrinterSetup] No Star printers found in already-paired accessories');
            }
          }
          
          // Method 2: If no already-connected, try StarIO10 discovery
          console.log('[PrinterSetup] Trying StarIO10 discovery...');
          const discoverResult = await StarPrinter.discoverPrinters();
          console.log('[PrinterSetup] discoverPrinters result:', discoverResult);
          
          if (discoverResult?.printers && discoverResult.printers.length > 0) {
            const discoveredPrinters = discoverResult.printers.map((p: any) => ({
              deviceId: p.identifier,
              identifier: p.identifier,
              name: p.name || 'Star Printer',
              model: p.model || 'Unknown',
              interfaceType: p.interfaceType || 'bluetooth',
              source: 'StarPrinter-StarIO10',
            }));
            
            console.log('[PrinterSetup] ✅ Found', discoveredPrinters.length, 'printer(s) via StarIO10');
            setAvailableDevices(discoveredPrinters);
            setScanning(false);
            if (discoveredPrinters.length === 1) {
              const printer = discoveredPrinters[0];
              setPrinterType('bluetooth');
              setPrinterName(printer.name);
              setDeviceId(printer.deviceId);
              setModel('ESC/POS');
              setSuccess(`✅ Found printer: ${printer.name}`);
            } else {
              setSuccess(`✅ Found ${discoveredPrinters.length} printer(s). Select one from the list.`);
            }
            return; // Success - exit early
          }
          
          console.log('[PrinterSetup] StarPrinter plugin found no printers, falling back to Bluetooth LE...');
        } catch (starError: any) {
          console.warn('[PrinterSetup] StarPrinter plugin error (will try Bluetooth LE):', starError);
          // Continue to Bluetooth LE fallback
        }
      } else {
        console.log('[PrinterSetup] StarPrinter plugin not available, using Bluetooth LE only');
      }
      
      // FALLBACK: Use Bluetooth LE plugin for BLE printers (not MFi Classic)
      console.log('[PrinterSetup] Using Bluetooth LE scanning as fallback...');
      const { BleClient } = require('@capacitor-community/bluetooth-le');
      
      console.log('[PrinterSetup] Initializing Bluetooth LE...');
      await BleClient.initialize();
      console.log('[PrinterSetup] Bluetooth LE initialized');

      console.log('[PrinterSetup] Starting Bluetooth LE scan...');
      
      const printerServices = [
        '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile (SPP)
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Brother printers
      ];

      const foundDevices = new Map<string, any>();

      await BleClient.requestLEScan(
        {
          services: printerServices,
          allowDuplicates: false,
        },
        (result: any) => {
          console.log('[PrinterSetup] Found BLE device:', result);
          
          const deviceId = result.device?.deviceId || result.deviceId;
          if (!deviceId) return;

          if (foundDevices.has(deviceId)) return;

          const deviceName = result.name || result.localName || result.device?.name || `Printer (${deviceId.slice(-8)})`;
          
          foundDevices.set(deviceId, {
            deviceId,
            identifier: deviceId,
            name: deviceName,
            rssi: result.rssi,
            services: result.serviceUuids || [],
            source: 'Bluetooth-LE',
          });

          setAvailableDevices(Array.from(foundDevices.values()));
        }
      );

      // Stop scanning after 15 seconds
      const scanTimeout = setTimeout(async () => {
        try {
          await BleClient.stopLEScan();
          console.log('[PrinterSetup] BLE scan stopped');

          setScanning(false);

          const devices = Array.from(foundDevices.values());
          if (devices.length === 0) {
            setError('No Bluetooth printers found.\n\nFor Star TSP100III:\n1. Make sure printer is powered on\n2. Make sure it\'s already paired in iPad Settings > Bluetooth\n3. The Star utility app should be able to print (to verify pairing)\n\nIf Star utility works but this doesn\'t, the StarPrinter plugin may need to be checked.');
          } else if (devices.length === 1) {
            const printer = devices[0];
            setPrinterType('bluetooth');
            setPrinterName(printer.name);
            setDeviceId(printer.deviceId);
            setModel('ESC/POS');
            setSuccess(`Found printer: ${printer.name}`);
          } else {
            setSuccess(`Found ${devices.length} printer(s). Select one from the list.`);
          }
        } catch (stopError) {
          console.error('[PrinterSetup] Error stopping scan:', stopError);
          setScanning(false);
        }
      }, 15000);

      return () => {
        clearTimeout(scanTimeout);
      };

    } catch (err) {
      console.error('[PrinterSetup] Bluetooth scan error:', err);
      setScanning(false);
      
      try {
        const { BleClient } = require('@capacitor-community/bluetooth-le');
        await BleClient.stopLEScan();
      } catch (stopErr) {
        // Ignore stop errors
      }
      
      if (err instanceof Error) {
        if (err.message.includes('permission') || err.message.includes('Permission')) {
          setError('Bluetooth permission denied. Please:\n1. Go to iPad Settings > Privacy & Security > Bluetooth\n2. Enable Bluetooth for "Alessa Ordering" app\n3. Try scanning again');
        } else {
          setError(`Bluetooth scan failed: ${err.message}\n\nFor Star TSP100III: Make sure it's already paired in iPad Settings > Bluetooth first (the Star utility app should be able to print to verify).`);
        }
      } else {
        setError('Failed to scan for Bluetooth printers. Make sure Bluetooth is enabled and permissions are granted.');
      }
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (printerType === 'none') {
      setError('Please select a printer type');
      return;
    }

    if (printerType === 'bluetooth' && !deviceId) {
      setError('Please scan for a Bluetooth printer');
      return;
    }

    if (printerType === 'network' && !ipAddress) {
      setError('Please enter a network printer IP address');
      return;
    }

    const config: PrinterConfig = {
      type: printerType,
      name: printerName || (printerType === 'passprnt' ? 'Star PassPRNT' : 'Unnamed Printer'),
      model: printerType === 'passprnt' ? 'Star TSP100III' : model,
    };

    if (printerType === 'bluetooth') {
      config.deviceId = deviceId;
    } else if (printerType === 'network') {
      config.ipAddress = ipAddress;
      config.port = port;
    } else if (printerType === 'passprnt') {
      // PassPRNT doesn't need deviceId or IP - uses URL scheme
      config.model = 'Star TSP100III';
    }

    setSaving(true);
    try {
      await onSave(config);
      setSuccess('Printer configuration saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save printer configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setError(null);
    setSuccess(null);

    const config: PrinterConfig = {
      type: printerType,
      name: printerName || (printerType === 'passprnt' ? 'Star PassPRNT' : 'Test Printer'),
      model: printerType === 'passprnt' ? 'Star TSP100III' : model,
    };

    if (printerType === 'bluetooth') {
      config.deviceId = deviceId;
    } else if (printerType === 'network') {
      config.ipAddress = ipAddress;
      config.port = port;
    } else if (printerType === 'passprnt') {
      config.model = 'Star TSP100III';
    }

    setTesting(true);
    try {
      await onTest(config);
      setSuccess('Test print sent successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test print failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Printer Setup</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {/* Printer Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Printer Type
          </label>
          <select
            value={printerType}
            onChange={(e) => setPrinterType(e.target.value as PrinterType)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">No Printer (Disabled)</option>
            <option value="passprnt">Star PassPRNT (Recommended for iPad)</option>
            <option value="bluetooth">Bluetooth Printer (Native App Only)</option>
            <option value="network">Network Printer (IP/Port)</option>
            <option value="usb">USB Printer (Manual)</option>
          </select>
        </div>

        {/* Bluetooth Configuration */}
        {printerType === 'bluetooth' && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Bluetooth Printer
              </label>
              <button
                onClick={scanBluetoothPrinters}
                disabled={scanning || !bluetoothAvailable}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {scanning ? 'Scanning...' : 'Scan for Printers'}
              </button>
            </div>

            {!bluetoothAvailable && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                <p className="font-medium mb-1">⚠️ Bluetooth Not Available</p>
                {isNativeApp ? (
                  <p>Bluetooth permissions may be required. Please check your device settings.</p>
                ) : (
                  <div>
                    <p className="mb-2">Web Bluetooth is not available in Safari on iOS/iPadOS.</p>
                    <p className="mb-2">To use Bluetooth printing on iPad:</p>
                    <ul className="list-disc list-inside space-y-1 mb-2">
                      <li>Install the native iOS app (built with Capacitor)</li>
                      <li>Or use a <strong>Network Printer</strong> instead (works on all devices)</li>
                    </ul>
                    <p className="text-xs">Web Bluetooth works in Chrome, Edge, or Opera on desktop computers.</p>
                  </div>
                )}
              </div>
            )}

            {/* Device list from scanning */}
            {availableDevices.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Found Devices ({availableDevices.length})
                </label>
                {availableDevices.map((device, idx) => (
                  <button
                    key={device.deviceId || idx}
                    onClick={() => {
                      setPrinterName(device.name || 'Unknown Printer');
                      setDeviceId(device.deviceId);
                      setSuccess(`Selected: ${device.name || 'Unknown Printer'}`);
                    }}
                    className={`w-full p-3 rounded border text-left transition-colors ${
                      deviceId === device.deviceId
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <p className="text-sm font-medium">{device.name || 'Unknown Device'}</p>
                    <p className="text-xs text-gray-600">ID: {device.deviceId}</p>
                  </button>
                ))}
              </div>
            )}

            {deviceId && (
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <p className="text-sm font-medium text-green-800">✓ Selected: {printerName}</p>
                <p className="text-xs text-green-600">Device ID: {deviceId}</p>
              </div>
            )}

            <div className="text-xs text-gray-500">
              <p className="font-medium mb-1">Supported Models:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Brother QL series (QL-820NWB, QL-1110NWB, QL-700, QL-800)</li>
                <li>Star Micronics (TSP143III, TSP654II, TSP100)</li>
                <li>Any ESC/POS compatible Bluetooth printer</li>
              </ul>
            </div>
          </div>
        )}

        {/* PassPRNT Configuration */}
        {printerType === 'passprnt' && (
          <div className="space-y-3 border-t pt-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              <p className="font-medium mb-2">✅ Star PassPRNT - Best for iPad</p>
              <p className="mb-2">
                PassPRNT uses the official Star Micronics app to print receipts.
                Works in Safari, PWA, or any browser on iPad.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Printer Name (for display)
              </label>
              <input
                type="text"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder="Star TSP100III"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <p className="font-medium mb-2">📋 Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Download <strong>Star PassPRNT</strong> from the App Store</li>
                <li>Pair your Star printer with iPad in <strong>Settings → Bluetooth</strong></li>
                <li>Open PassPRNT app and select your printer</li>
                <li>Save this configuration and test print</li>
              </ol>
              <p className="mt-3 text-xs text-gray-500">
                When you print, the PassPRNT app will open briefly to send the receipt,
                then return you to this app.
              </p>
            </div>

            <div className="text-xs text-gray-500">
              <p className="font-medium mb-1">Supported Printers:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Star TSP100III (Bluetooth)</li>
                <li>Star TSP143III</li>
                <li>Star TSP654II</li>
                <li>Any Star printer compatible with PassPRNT</li>
              </ul>
            </div>
          </div>
        )}

        {/* Network Configuration */}
        {printerType === 'network' && (
          <div className="space-y-3 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Printer Name
              </label>
              <input
                type="text"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder="Kitchen Printer"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IP Address
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.1.100"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value))}
                placeholder="9100"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: 9100 (raw printing port for most network printers)
              </p>
            </div>

            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
              <p className="font-medium mb-1">How to find your printer&apos;s IP:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Print a configuration page from your printer</li>
                <li>Check your router&apos;s DHCP client list</li>
                <li>Use network scanning tools (e.g., Angry IP Scanner)</li>
              </ol>
            </div>
          </div>
        )}

        {/* USB Configuration */}
        {printerType === 'usb' && (
          <div className="space-y-3 border-t pt-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
              <p className="font-medium mb-2">⚠️ USB Printing Limitations</p>
              <p>
                Direct USB printing from web browsers is limited. Consider using:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Network-connected printer instead</li>
                <li>Print server software (CUPS, PrintNode)</li>
                <li>Browser printing API (window.print)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Printer Model */}
        {printerType !== 'none' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Printer Model/Protocol
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ESC/POS">ESC/POS (Generic)</option>
              <option value="Brother QL">Brother QL Series</option>
              <option value="Star TSPL">Star TSPL</option>
              <option value="Star Line">Star Line Mode</option>
              <option value="ZPL">Zebra ZPL</option>
            </select>
          </div>
        )}

        {/* Action Buttons */}
        {printerType !== 'none' && (
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleTest}
              disabled={testing || saving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {testing ? 'Testing...' : 'Test Print'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || testing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        )}
      </div>

      {/* Current Configuration Display */}
      {currentConfig && currentConfig.type !== 'none' && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Current Configuration</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium capitalize">{currentConfig.type}</span>

              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{currentConfig.name}</span>

              <span className="text-gray-600">Model:</span>
              <span className="font-medium">{currentConfig.model || 'N/A'}</span>

              {currentConfig.ipAddress && (
                <>
                  <span className="text-gray-600">IP Address:</span>
                  <span className="font-medium">{currentConfig.ipAddress}:{currentConfig.port}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
