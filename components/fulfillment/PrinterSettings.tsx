"use client";

import { useState, useEffect } from 'react';
import PrinterSetup, { type PrinterConfig } from './PrinterSetup';
import { formatReceiptForPrinter } from '@/lib/printer-service';

interface Props {
  tenantId?: string;
  onBack?: () => void;
}

async function sendToBluetoothPrinter(deviceId: string, receiptData: string): Promise<void> {
  if (!('bluetooth' in navigator)) {
    throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera on a device with Bluetooth.');
  }

  const navigatorBluetooth = (navigator as any).bluetooth;

  try {
    // Request the previously paired device using deviceId
    // Note: Web Bluetooth doesn't directly support connecting by ID, 
    // so we'll request the device again and the browser will remember the pairing
    const device = await navigatorBluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '00001101-0000-1000-8000-00805f9b34fb', // SPP (Serial Port Profile) - Common for Star/Brother
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Brother printer service UUID
      ],
    });

    if (!device || !device.gatt) {
      throw new Error('Failed to connect to Bluetooth device');
    }

    const server = await device.gatt.connect();
    
    // Try common services for thermal printers
    const serviceUUIDs = [
      '00001101-0000-1000-8000-00805f9b34fb', // SPP
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Brother
    ];

    let service = null;
    for (const uuid of serviceUUIDs) {
      try {
        service = await server.getPrimaryService(uuid);
        break;
      } catch {
        continue;
      }
    }

    if (!service) {
      throw new Error('Could not find printer service on device');
    }

    // Common characteristics for printing
    const charUUIDs = [
      '00002a3d-0000-1000-8000-00805f9b34fb', // SPP characteristic
      'beb5483e-36e1-4688-b7f5-ea07361b26a8', // Generic write characteristic
    ];

    let characteristic = null;
    for (const uuid of charUUIDs) {
      try {
        characteristic = await service.getCharacteristic(uuid);
        break;
      } catch {
        continue;
      }
    }

    if (!characteristic) {
      // Fallback: get all characteristics and use the first writable one
      const characteristics = await service.getCharacteristics();
      characteristic = characteristics.find((c: any) => 
        c.properties.write || c.properties.writeWithoutResponse
      ) as any; // BluetoothRemoteGATTCharacteristic type not available in all TypeScript versions
    }

    if (!characteristic) {
      throw new Error('Could not find writable characteristic for printing');
    }

    // Convert ESC/POS string to bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(receiptData);

    // Write in chunks if data is large (some printers have MTU limits)
    const chunkSize = 20; // Conservative chunk size for Bluetooth
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await characteristic.writeValue(chunk);
    }

    await device.gatt.disconnect();
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      throw new Error('Printer not found. Please ensure it is powered on and in pairing mode.');
    } else if (error.name === 'NetworkError') {
      throw new Error('Failed to communicate with printer. Please try reconnecting.');
    } else {
      throw new Error(error.message || 'Failed to print via Bluetooth');
    }
  }
}

async function sendToNetworkPrinter(ipAddress: string, port: number, receiptData: string): Promise<void> {
  const response = await fetch('/api/admin/fulfillment/printer/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ipAddress,
      port,
      data: receiptData,
      orderId: null, // Test print
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send to network printer');
  }
}

export default function PrinterSettings({ tenantId, onBack }: Props) {
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPrinterConfig();
  }, [tenantId]);

  const loadPrinterConfig = async () => {
    try {
      const [configRes, settingsRes] = await Promise.all([
        fetch('/api/admin/fulfillment/printer'),
        fetch('/api/admin/tenant-settings'),
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        setPrinterConfig(configData.config);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setAutoPrintEnabled(settingsData.autoPrintOrders || false);
      }
    } catch (err) {
      console.error('Failed to load printer config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrinterConfig = async (config: PrinterConfig) => {
    try {
      const response = await fetch('/api/admin/fulfillment/printer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save printer configuration');
      }

      const data = await response.json();
      setPrinterConfig(data.config);
      setSuccess('Printer configuration saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      throw err;
    }
  };

  const handleTestPrint = async (config: PrinterConfig) => {
    try {
      // Get test receipt data from server
      const response = await fetch('/api/admin/fulfillment/printer/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate test print');
      }

      const data = await response.json();
      const receiptData = data.receiptData;

      // Send to printer based on type
      if (config.type === 'bluetooth' && config.deviceId) {
        await sendToBluetoothPrinter(config.deviceId, receiptData);
      } else if (config.type === 'network' && config.ipAddress) {
        await sendToNetworkPrinter(config.ipAddress || '192.168.1.100', config.port || 9100, receiptData);
      } else {
        throw new Error('Invalid printer configuration for test print');
      }

      setSuccess('Test print sent successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      throw err;
    }
  };

  const handleToggleAutoPrint = async (enabled: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/tenant-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoPrintOrders: enabled,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update auto-print setting');
      }

      setAutoPrintEnabled(enabled);
      setSuccess(`Auto-print ${enabled ? 'enabled' : 'disabled'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update auto-print setting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Loading printer settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Back to Orders</span>
            </button>
          )}
          <h2 className="text-xl font-bold">Printer Setup</h2>
          {onBack && <div className="w-32" />} {/* Spacer for alignment */}
        </div>

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

        <PrinterSetup
          currentConfig={printerConfig}
          onSave={handleSavePrinterConfig}
          onTest={handleTestPrint}
        />
      </div>

      {printerConfig && printerConfig.type !== 'none' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Auto-Print Settings</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Automatically print new orders</p>
              <p className="text-sm text-gray-500 mt-1">
                When enabled, orders will automatically print to your configured printer when they come in.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoPrintEnabled}
                onChange={(e) => handleToggleAutoPrint(e.target.checked)}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

