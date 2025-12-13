/**
 * Auto-Print Hook
 * Automatically prints new orders when they arrive
 * Uses client-side Bluetooth printing for Capacitor apps
 */

'use client';

import { useEffect, useRef } from 'react';
import { printOrderClientSide, isBluetoothPrintingAvailable, type PrinterConfig } from '@/lib/client-printer';
import type { FulfillmentOrder } from './useOrderFeed';

interface UseAutoPrintOptions {
  enabled: boolean;
  printerConfig: PrinterConfig | null;
  newOrder: FulfillmentOrder | null;
  tenant: {
    id: string;
    name: string;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    contactPhone?: string | null;
  };
}

export function useAutoPrint({ enabled, printerConfig, newOrder, tenant }: UseAutoPrintOptions) {
  const printedOrderIds = useRef<Set<string>>(new Set());
  const isPrinting = useRef(false);

  useEffect(() => {
    // Skip if auto-print is disabled
    if (!enabled) return;

    // Skip if no printer configured
    if (!printerConfig || printerConfig.type === 'none' || !printerConfig.deviceId) {
      return;
    }

    // Skip if no new order
    if (!newOrder) return;

    // Skip if already printed
    if (printedOrderIds.current.has(newOrder.id)) return;

    // Skip if currently printing
    if (isPrinting.current) return;

    // Only print Bluetooth printers (client-side)
    if (printerConfig.type !== 'bluetooth') {
      return;
    }

    // Check if Bluetooth is available
    if (!isBluetoothPrintingAvailable()) {
      console.warn('[Auto-Print] Bluetooth printing not available');
      return;
    }

    // Print the order
    const printOrder = async () => {
      isPrinting.current = true;
      printedOrderIds.current.add(newOrder.id);

      try {
        console.log('[Auto-Print] Printing order:', newOrder.id);

        const result = await printOrderClientSide(newOrder, tenant, printerConfig);

        if (result.success) {
          console.log('[Auto-Print] Order printed successfully:', newOrder.id);
        } else {
          console.error('[Auto-Print] Failed to print order:', result.error);
          // Remove from printed set so it can be retried
          printedOrderIds.current.delete(newOrder.id);
        }
      } catch (error) {
        console.error('[Auto-Print] Error printing order:', error);
        printedOrderIds.current.delete(newOrder.id);
      } finally {
        isPrinting.current = false;
      }
    };

    // Small delay to ensure order is fully loaded
    const timeoutId = setTimeout(printOrder, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [enabled, printerConfig, newOrder, tenant]);

  return {
    hasPrinted: (orderId: string) => printedOrderIds.current.has(orderId),
    clearPrinted: () => printedOrderIds.current.clear(),
  };
}


