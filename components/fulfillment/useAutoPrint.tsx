/**
 * Auto-Print Hook
 * Automatically prints new orders when they arrive
 * Uses multi-method printing system with fallbacks
 */

'use client';

import { useEffect, useRef } from 'react';
import { printOrderClientSide, isBluetoothPrintingAvailable, isNetworkPrintingAvailable, disconnectStarPrinter, type PrinterConfig } from '@/lib/client-printer';
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
    if (!printerConfig || printerConfig.type === 'none') {
      return;
    }

    // Skip if no new order
    if (!newOrder) return;

    // Skip if already printed
    if (printedOrderIds.current.has(newOrder.id)) return;

    // Skip if currently printing
    if (isPrinting.current) return;

    // Handle Bluetooth printers
    if (printerConfig.type === 'bluetooth') {
      if (!printerConfig.deviceId) {
        console.warn('[Auto-Print] Bluetooth printer deviceId not configured');
        return;
      }
      if (!isBluetoothPrintingAvailable()) {
        console.warn('[Auto-Print] Bluetooth printing not available');
        return;
      }
    }

    // Handle Network printers (WiFi thermal printers)
    if (printerConfig.type === 'network') {
      const host = (printerConfig as any).ipAddress || (printerConfig as any).host;
      if (!host) {
        console.warn('[Auto-Print] Network printer host not configured');
        return;
      }
      if (!isNetworkPrintingAvailable()) {
        console.warn('[Auto-Print] Network printing not available (offline)');
        return;
      }
      console.log(`[Auto-Print] Network printer configured: ${host}:${printerConfig.port || 9100}`);
    }

    // Skip unsupported printer types
    if (printerConfig.type !== 'bluetooth' && printerConfig.type !== 'network') {
      console.log('[Auto-Print] Unsupported printer type:', printerConfig.type);
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

















