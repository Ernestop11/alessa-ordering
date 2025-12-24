/**
 * Auto-Print Hook
 * Automatically prints new orders when they arrive
 * Uses multi-method printing system with fallbacks
 */

'use client';

import { useEffect, useRef } from 'react';
import { printOrderClientSide, isBluetoothPrintingAvailable, disconnectStarPrinter, type PrinterConfig } from '@/lib/client-printer';
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

  // Cleanup printer connections on unmount
  useEffect(() => {
    return () => {
      disconnectStarPrinter().catch(() => {
        // Ignore cleanup errors
      });
    };
  }, []);

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

    // Check if Bluetooth printing is available
    if (!isBluetoothPrintingAvailable()) {
      console.warn('[Auto-Print] Bluetooth printing not available');
      return;
    }

    // Print the order with retry logic
    const printOrder = async (retryCount = 0) => {
      isPrinting.current = true;
      printedOrderIds.current.add(newOrder.id);

      try {
        console.log(`[Auto-Print] Printing order: ${newOrder.id}${retryCount > 0 ? ` - Retry ${retryCount}` : ''}`);

        const result = await printOrderClientSide(newOrder, tenant, printerConfig);

        if (result.success) {
          console.log('[Auto-Print] ✅ Order printed successfully:', newOrder.id);
        } else {
          console.error('[Auto-Print] ❌ Failed to print order:', result.error);
          
          // Retry logic: retry up to 2 times with exponential backoff
          if (retryCount < 2) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s
            console.log(`[Auto-Print] Retrying in ${delay}ms...`);
            setTimeout(() => {
              printedOrderIds.current.delete(newOrder.id);
              isPrinting.current = false;
              printOrder(retryCount + 1);
            }, delay);
            return; // Don't mark as failed yet
          } else {
            // Final failure - remove from printed set so it can be manually printed
            console.error('[Auto-Print] Max retries reached, giving up');
            printedOrderIds.current.delete(newOrder.id);
          }
        }
      } catch (error) {
        console.error('[Auto-Print] Exception printing order:', error);
        
        // Retry on exception too
        if (retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`[Auto-Print] Retrying after exception in ${delay}ms...`);
          setTimeout(() => {
            printedOrderIds.current.delete(newOrder.id);
            isPrinting.current = false;
            printOrder(retryCount + 1);
          }, delay);
          return;
        } else {
          printedOrderIds.current.delete(newOrder.id);
        }
      } finally {
        if (retryCount === 0 || retryCount >= 2) {
          isPrinting.current = false;
        }
      }
    };

    // Small delay to ensure order is fully loaded and printer is ready
    const timeoutId = setTimeout(() => printOrder(0), 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [enabled, printerConfig, newOrder, tenant]);

  return {
    hasPrinted: (orderId: string) => printedOrderIds.current.has(orderId),
    clearPrinted: () => printedOrderIds.current.clear(),
  };
}

















