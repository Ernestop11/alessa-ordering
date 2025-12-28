/**
 * Auto Print Dispatcher Stub
 * Automatically routes print jobs to configured printers
 */

import type { SerializedOrder } from '../order-serializer';
import { formatOrderForThermalPrinter } from './bluetooth';
import type { BluetoothPrinterConfig } from './bluetooth';

export interface PrinterConfig {
  type: 'bluetooth' | 'network' | 'cloud';
  enabled: boolean;
  config: BluetoothPrinterConfig | Record<string, unknown>;
}

export interface DispatchResult {
  success: boolean;
  printerId?: string;
  jobId?: string;
  error?: string;
}

/**
 * Auto-dispatch order to configured printer
 */
export async function autoDispatchOrder(
  order: SerializedOrder,
  printerConfig: PrinterConfig
): Promise<DispatchResult> {
  if (!printerConfig.enabled) {
    return { success: false, error: 'Printer not enabled' };
  }

  console.log('[Auto Dispatch] Stub: Dispatching order to printer', {
    orderId: order.id,
    printerType: printerConfig.type,
  });

  try {
    switch (printerConfig.type) {
      case 'bluetooth': {
        const { printToBluetooth } = await import('./bluetooth');
        const formattedContent = formatOrderForThermalPrinter({
          id: order.id,
          items: order.items.map((item) => ({
            name: item.menuItemName || 'Item',
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: order.totalAmount,
          customerName: order.customerName || undefined,
          notes: order.notes || undefined,
        });

        const result = await printToBluetooth(
          {
            id: `order_${order.id}`,
            content: formattedContent,
            format: 'escpos',
            copies: 1,
          },
          printerConfig.config as BluetoothPrinterConfig
        );

        return {
          success: result.success,
          printerId: 'bluetooth_1',
          jobId: result.jobId,
          error: result.error,
        };
      }

      case 'network': {
        const net = await import('net');
        const config = printerConfig.config as { ipAddress?: string; port?: number };

        if (!config.ipAddress) {
          return { success: false, error: 'Network printer IP not configured' };
        }

        const formattedContent = formatOrderForThermalPrinter({
          id: order.id,
          items: order.items.map((item) => ({
            name: item.menuItemName || 'Item',
            quantity: item.quantity,
            price: item.price,
            note: item.note || undefined,
          })),
          totalAmount: order.totalAmount,
          customerName: order.customerName || undefined,
          notes: order.notes || undefined,
          fulfillmentMethod: order.fulfillmentMethod || undefined,
          customerPhone: order.customerPhone || undefined,
        });

        const port = config.port || 9100;
        console.log(`[Auto Dispatch] Sending to network printer ${config.ipAddress}:${port}`);

        return new Promise((resolve) => {
          const socket = new net.Socket();
          const timeout = setTimeout(() => {
            socket.destroy();
            resolve({ success: false, error: 'Connection timeout' });
          }, 10000);

          socket.connect(port, config.ipAddress!, () => {
            clearTimeout(timeout);
            // Send ESC/POS data
            socket.write(formattedContent, () => {
              socket.end();
              console.log('[Auto Dispatch] Order sent to network printer');
              resolve({
                success: true,
                printerId: `${config.ipAddress}:${port}`,
                jobId: `net_${Date.now()}`,
              });
            });
          });

          socket.on('error', (err) => {
            clearTimeout(timeout);
            console.error('[Auto Dispatch] Network printer error:', err.message);
            resolve({ success: false, error: err.message });
          });
        });
      }

      case 'cloud': {
        // TODO: Implement cloud printer dispatch (e.g., Google Cloud Print)
        console.log('[Auto Dispatch] Cloud printer not implemented');
        return { success: false, error: 'Cloud printer not implemented' };
      }

      default:
        return { success: false, error: `Unknown printer type: ${printerConfig.type}` };
    }
  } catch (error: any) {
    console.error('[Auto Dispatch] Error:', error);
    return { success: false, error: error.message || 'Dispatch failed' };
  }
}

/**
 * Get available printers
 */
export async function getAvailablePrinters(): Promise<Array<{
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
}>> {
  // TODO: Implement printer discovery
  console.log('[Auto Dispatch] Stub: Getting available printers');
  return [
    {
      id: 'bt_1',
      name: 'Bluetooth Printer (Stub)',
      type: 'bluetooth',
      status: 'online',
    },
  ];
}
