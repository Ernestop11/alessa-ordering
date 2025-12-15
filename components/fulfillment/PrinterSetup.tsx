"use client";

import { useState, useEffect } from 'react';

export type PrinterType = 'bluetooth' | 'network' | 'usb' | 'none';

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if running in Capacitor
      const { Capacitor } = require('@capacitor/core');
      const native = Capacitor.isNativePlatform();
      setIsNativeApp(native);

      if (native) {
        // In native app, Bluetooth should be available via Capacitor plugin
        setBluetoothAvailable(true);
      } else {
        // In web browser, check for Web Bluetooth
        setBluetoothAvailable('bluetooth' in navigator);
      }
    }
  }, []);

  const scanBluetoothPrinters = async () => {
    if (!bluetoothAvailable) {
      setError('Bluetooth is not available. Please use the native app on iOS/Android.');
      return;
    }

    setScanning(true);
    setError(null);
    setAvailableDevices([]);

    try {
      if (isNativeApp) {
        // Use Capacitor Bluetooth LE plugin
        const { BleClient } = require('@capacitor-community/bluetooth-le');

        // Initialize BLE client first
        await BleClient.initialize();

        // Request permissions (iOS will prompt for Bluetooth permission)
        const isEnabled = await BleClient.isEnabled();
        if (!isEnabled) {
          throw new Error('Bluetooth is not enabled. Please enable Bluetooth in Settings.');
        }

        const foundDevices: any[] = [];

        // Start scanning for BLE devices
        await BleClient.requestLEScan(
          {
            // Scan for printer service UUIDs
            services: [
              ...KNOWN_VENDORS.brother.services,
              ...KNOWN_VENDORS.star.services,
            ],
          },
          (result) => {
            // Called for each device found
            console.log('Found device:', result);
            if (result.device) {
              const device = result.device;
              // Check if we already have this device
              if (!foundDevices.find(d => d.deviceId === device.deviceId)) {
                foundDevices.push(device);
                setAvailableDevices([...foundDevices]);

                // Auto-select if it looks like a printer
                if (device.name && (
                  device.name.toLowerCase().includes('brother') ||
                  device.name.toLowerCase().includes('star') ||
                  device.name.toLowerCase().includes('print') ||
                  device.name.toLowerCase().includes('tsp') ||
                  device.name.toLowerCase().includes('ql-')
                )) {
                  setPrinterType('bluetooth');
                  setPrinterName(device.name);
                  setDeviceId(device.deviceId);
                  setSuccess(`Found printer: ${device.name}`);
                }
              }
            }
          }
        );

        // Stop scanning after 10 seconds
        setTimeout(async () => {
          try {
            await BleClient.stopLEScan();
          } catch (e) {
            console.log('Stop scan error (may already be stopped):', e);
          }
          setScanning(false);
          if (foundDevices.length === 0) {
            setError('No Bluetooth devices found. Make sure your printer is powered on and in pairing mode.');
          } else if (!deviceId) {
            setSuccess(`Found ${foundDevices.length} device(s). Select one from the list.`);
          }
        }, 10000);
      } else {
        // Use Web Bluetooth API (desktop browsers)
        const device = await ((navigator as any).bluetooth).requestDevice({
          acceptAllDevices: true,
          optionalServices: [
            ...KNOWN_VENDORS.brother.services,
            ...KNOWN_VENDORS.star.services,
            ...KNOWN_VENDORS.escpos.services,
          ],
        });

        if (device) {
          setAvailableDevices([device]);
          setPrinterType('bluetooth');
          setPrinterName(device.name || 'Unknown Printer');
          setDeviceId(device.id);
          setSuccess(`Found printer: ${device.name || 'Unknown'}`);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotFoundError') {
          setError('No printer selected');
        } else if (err.name === 'NotSupportedError') {
          setError('Bluetooth is not supported');
        } else {
          setError(`Bluetooth error: ${err.message}`);
        }
      }
      setScanning(false);
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
      name: printerName || 'Unnamed Printer',
      model,
    };

    if (printerType === 'bluetooth') {
      config.deviceId = deviceId;
    } else if (printerType === 'network') {
      config.ipAddress = ipAddress;
      config.port = port;
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
      name: printerName || 'Test Printer',
      model,
    };

    if (printerType === 'bluetooth') {
      config.deviceId = deviceId;
    } else if (printerType === 'network') {
      config.ipAddress = ipAddress;
      config.port = port;
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
            <option value="bluetooth">Bluetooth Printer</option>
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
