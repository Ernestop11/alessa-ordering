/**
 * Web fallback for Star Printer plugin
 * Star printers require native SDK, so this just provides stubs
 */

import { WebPlugin } from '@capacitor/core';
import type { StarPrinterPlugin, StarPrinterDevice, PrintReceiptOptions, PrinterStatus } from './star-printer';

export class StarPrinterWeb extends WebPlugin implements StarPrinterPlugin {
  async discoverPrinters(): Promise<{ printers: StarPrinterDevice[] }> {
    console.warn('Star Printer: Discovery only available in native app');
    throw new Error('Star Printer requires the native iOS/Android app. Please use the installed app on your iPad.');
  }

  async connect(_options: { identifier: string }): Promise<{ connected: boolean; identifier: string }> {
    console.warn('Star Printer: Connect only available in native app');
    throw new Error('Star Printer requires the native iOS/Android app.');
  }

  async disconnect(): Promise<{ disconnected: boolean }> {
    console.warn('Star Printer: Disconnect only available in native app');
    return { disconnected: true };
  }

  async printReceipt(_options: PrintReceiptOptions): Promise<{ success: boolean }> {
    console.warn('Star Printer: Print only available in native app');
    throw new Error('Star Printer requires the native iOS/Android app.');
  }

  async printRawText(_options: { text: string; cut?: boolean }): Promise<{ success: boolean }> {
    console.warn('Star Printer: Print only available in native app');
    throw new Error('Star Printer requires the native iOS/Android app.');
  }

  async getStatus(): Promise<PrinterStatus> {
    console.warn('Star Printer: Status only available in native app');
    return {
      online: false,
      coverOpen: false,
      paperEmpty: false,
      paperNearEmpty: false,
    };
  }
}
