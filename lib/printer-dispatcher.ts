import net from 'net';
import prisma from './prisma';
import { sendOrderToClover } from './cloverPrinter';
import { formatReceiptForPrinter } from './printer-service';
import type { SerializedOrder } from './order-serializer';

type PrintReason = 'order.created' | 'order.confirmed' | 'manual';

interface AutoPrintOptions {
  reason?: PrintReason;
}

interface PrintResult {
  ok: boolean;
  status?: number;
  message?: string;
  provider?: string;
}

interface BluetoothConfig {
  endpoint?: string | null;
  apiKey?: string | null;
  profile?: string | null;
}

const DEFAULT_PROFILE = 'escpos-58mm';
const NETWORK_PRINTER_TIMEOUT = Number(process.env.PRINTER_TCP_TIMEOUT ?? 5000);

async function sendEscPosToNetworkPrinter(host: string, port: number, data: string) {
  return new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host, port, timeout: NETWORK_PRINTER_TIMEOUT }, () => {
      socket.write(Buffer.from(data, 'binary'), (err) => {
        if (err) {
          socket.destroy();
          reject(err);
          return;
        }
        socket.end();
      });
    });

    let settled = false;
    const finalize = (err?: Error) => {
      if (settled) return;
      settled = true;
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    };

    socket.on('close', () => finalize());
    socket.on('error', (error) => finalize(error instanceof Error ? error : new Error(String(error))));
    socket.on('timeout', () => {
      socket.destroy();
      finalize(new Error('Network printer connection timed out'));
    });
  });
}

function formatCurrency(value: number | null | undefined) {
  if (!value || Number.isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value));
}

function formatDate(timestamp: string) {
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return timestamp;
  }
}

function buildReceipt(order: SerializedOrder) {
  const lines: string[] = [];
  const tenantName = order.tenant?.name ?? 'Order';
  const orderId = order.id.slice(-6).toUpperCase();
  const fulfillment = order.fulfillmentMethod ?? 'pickup';

  // Header with tenant name
  lines.push('================================');
  lines.push(tenantName.toUpperCase().padStart(Math.floor((32 + tenantName.length) / 2)));
  lines.push('================================');
  lines.push('');

  // Order info box
  lines.push(`       ORDER #${orderId}`);
  lines.push(`       ${fulfillment.toUpperCase()}`);
  lines.push('');

  // SCHEDULED PICKUP TIME - show prominently if set
  if (order.scheduledPickupTime) {
    const pickupTime = new Date(order.scheduledPickupTime);
    const timeStr = pickupTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    lines.push('********************************');
    lines.push('*      SCHEDULED PICKUP        *');
    lines.push(`*         ${timeStr.padStart(8).padEnd(18)}*`);
    lines.push('********************************');
    lines.push('');
  }

  lines.push(formatDate(order.createdAt));
  lines.push('--------------------------------');

  // Customer info first (like email)
  if (order.customerName || order.customer?.name) {
    lines.push(`Customer: ${order.customerName ?? order.customer?.name ?? 'Guest'}`);
  }
  if (order.customerPhone || order.customer?.phone) {
    lines.push(`Phone: ${order.customerPhone ?? order.customer?.phone ?? ''}`);
  }
  lines.push('--------------------------------');

  // Items
  lines.push('ITEMS');
  lines.push('');
  for (const item of order.items) {
    const name = item.menuItemName ?? 'Menu Item';
    const quantity = item.quantity;
    const price = formatCurrency(item.price * quantity);
    lines.push(`${quantity}× ${name}`);
    lines.push(`     ${price}`);
    if (item.notes) {
      lines.push(`     → ${item.notes}`);
    }
  }
  lines.push('--------------------------------');

  // Totals section
  lines.push(`Subtotal            ${formatCurrency(order.subtotalAmount).padStart(10)}`);
  if (order.deliveryFee && order.deliveryFee > 0) {
    lines.push(`Delivery            ${formatCurrency(order.deliveryFee).padStart(10)}`);
  }
  // Tax & Fees with rate disclosure
  const taxAndFees = (order.taxAmount ?? 0) + (order.platformFee ?? 0);
  if (taxAndFees > 0) {
    lines.push(`Tax & Fees (8.75%+) ${formatCurrency(taxAndFees).padStart(10)}`);
  }
  if (order.tipAmount && order.tipAmount > 0) {
    lines.push(`Tip                 ${formatCurrency(order.tipAmount).padStart(10)}`);
  }
  lines.push('--------------------------------');
  lines.push(`TOTAL               ${formatCurrency(order.totalAmount).padStart(10)}`);
  lines.push('================================');

  // Notes section
  if (order.notes) {
    lines.push('');
    lines.push('SPECIAL INSTRUCTIONS:');
    lines.push(order.notes);
    lines.push('');
  }

  // Footer
  lines.push('');
  lines.push('    Thank you for your order!');
  lines.push('');
  // Brief compliance note (SB 1524)
  if (order.platformFee && order.platformFee > 0) {
    lines.push('Tax & Fees includes 8.75% sales');
    lines.push('tax + processing fees.');
  }
  lines.push('');

  return lines.join('\n');
}

function parsePrinterEndpoint(rawEndpoint?: string | null): BluetoothConfig {
  if (!rawEndpoint) return {};
  const trimmed = rawEndpoint.trim();

  if (!trimmed) return {};

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return {
          endpoint: typeof parsed.endpoint === 'string' ? parsed.endpoint : typeof parsed.url === 'string' ? parsed.url : null,
          apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : typeof parsed.token === 'string' ? parsed.token : null,
          profile: typeof parsed.profile === 'string' ? parsed.profile : null,
        };
      }
    } catch {
      // Fall through to raw string handling
    }
  }

  try {
    const url = new URL(trimmed);
    let apiKey: string | null = null;
    if (url.username || url.password) {
      apiKey = url.password ? `${url.username}:${url.password}` : url.username;
      url.username = '';
      url.password = '';
    }
    return {
      endpoint: url.toString(),
      apiKey,
    };
  } catch {
    return { endpoint: trimmed };
  }
}

async function sendOrderWithESCPOS(order: SerializedOrder, printerConfig: any): Promise<PrintResult> {
  try {
    // Get tenant info for receipt header
    const tenant = await prisma.tenant.findUnique({
      where: { id: order.tenantId },
      select: {
        name: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        contactPhone: true,
      },
    });

    if (!tenant) {
      return {
        ok: false,
        provider: printerConfig.type,
        message: 'Tenant not found',
      };
    }

    // Transform serialized order to format expected by printer service
    const orderForPrint = {
      id: order.id,
      customerName: order.customerName || order.customer?.name || 'Guest',
      customerPhone: order.customerPhone || order.customer?.phone || undefined,
      fulfillmentMethod: (order.fulfillmentMethod || 'pickup') as 'delivery' | 'pickup',
      status: order.status || 'pending',
      items: order.items.map((item: any) => ({
        name: item.menuItemName || 'Unknown Item',
        quantity: item.quantity || 1,
        unitPrice: Number(item.price || 0),
        totalPrice: Number(item.price || 0) * (item.quantity || 1),
        notes: item.notes,
      })),
      subtotal: Number(order.subtotalAmount || 0),
      taxAmount: Number(order.taxAmount || 0),
      deliveryFee: Number(order.deliveryFee || 0),
      tipAmount: Number(order.tipAmount || 0),
      serviceFee: Number(order.platformFee || 0),
      totalAmount: Number(order.totalAmount || 0),
      notes: order.notes || undefined,
      createdAt: new Date(order.createdAt),
      deliveryAddress: order.deliveryAddress ? {
        street: order.deliveryAddress.line1 || '',
        apartment: order.deliveryAddress.line2 || undefined,
        city: order.deliveryAddress.city || '',
        state: order.deliveryAddress.state || '',
        zip: order.deliveryAddress.postalCode || '',
      } : undefined,
    };

    // Format receipt with ESC/POS commands
    const receiptData = formatReceiptForPrinter(
      orderForPrint,
      tenant,
      printerConfig.model || 'ESC/POS'
    );

    // Send to printer based on type
    if (printerConfig.type === 'network') {
      const ipAddress = printerConfig.ipAddress || printerConfig.host;
      const port = Number(printerConfig.port ?? 9100);

      if (!ipAddress) {
        return {
          ok: false,
          provider: 'network',
          message: 'Network printer IP address is missing.',
        };
      }

      try {
        await sendEscPosToNetworkPrinter(ipAddress, port, receiptData);
        return {
          ok: true,
          status: 200,
          provider: 'network',
        };
      } catch (error) {
        return {
          ok: false,
          provider: 'network',
          message: error instanceof Error ? error.message : 'Network printer failed',
        };
      }
    } else if (printerConfig.type === 'bluetooth') {
      // For Bluetooth, this would need to run client-side
      // For now, log that it needs client-side handling
      return {
        ok: false,
        provider: 'bluetooth',
        message: 'Bluetooth printing requires client-side Web Bluetooth API',
      };
    }

    return {
      ok: false,
      provider: printerConfig.type,
      message: 'Unsupported printer type',
    };
  } catch (error) {
    return {
      ok: false,
      provider: printerConfig.type,
      message: error instanceof Error ? error.message : 'Print failed',
    };
  }
}

async function sendOrderToBluetooth(order: SerializedOrder, config: BluetoothConfig): Promise<PrintResult> {
  const resolved = parsePrinterEndpoint(config.endpoint);
  const endpoint =
    resolved.endpoint ?? config.endpoint ?? process.env.BLUETOOTH_PRINTER_ENDPOINT ?? null;

  if (!endpoint) {
    return {
      ok: false,
      provider: 'bluetooth',
      message: 'Missing bluetooth printer endpoint.',
    };
  }

  const apiKey =
    config.apiKey ??
    resolved.apiKey ??
    process.env.BLUETOOTH_PRINTER_API_KEY ??
    process.env.PRINTER_SERVICE_API_KEY ??
    null;

  const ticket = buildReceipt(order);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        orderId: order.id,
        tenantId: order.tenantId,
        profile: config.profile ?? resolved.profile ?? DEFAULT_PROFILE,
        content: {
          type: 'text/plain',
          encoding: 'utf-8',
          data: ticket,
        },
        metadata: {
          fulfillmentMethod: order.fulfillmentMethod ?? 'pickup',
          createdAt: order.createdAt,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        status: response.status,
        message: text || 'Failed to dispatch bluetooth print job.',
        provider: 'bluetooth',
      };
    }

    return {
      ok: true,
      status: response.status,
      provider: 'bluetooth',
    };
  } catch (error) {
    return {
      ok: false,
      provider: 'bluetooth',
      message: error instanceof Error ? error.message : 'Bluetooth print failed.',
    };
  }
}

export async function autoPrintOrder(order: SerializedOrder, options: AutoPrintOptions = {}) {
  const reason: PrintReason = options.reason ?? 'order.created';

  const tenantIntegration = await prisma.tenantIntegration.findUnique({
    where: { tenantId: order.tenantId },
    select: {
      autoPrintOrders: true,
      printerType: true,
      printerEndpoint: true,
      printerConfig: true,
      cloverMerchantId: true,
      cloverApiKey: true,
    },
  }) as any;

  if (!tenantIntegration?.autoPrintOrders) {
    return false;
  }

  // Check for new printer config format
  const printerConfig = tenantIntegration.printerConfig as any;
  const printerType = printerConfig?.type || (tenantIntegration.printerType ?? 'bluetooth').toLowerCase();

  const shouldPrintNow =
    printerType === 'clover'
      ? reason === 'order.confirmed'
      : reason === 'order.created' || reason === 'manual';

  if (!shouldPrintNow) {
    return false;
  }

  let result: PrintResult;

  if (printerType === 'clover') {
    result = await sendOrderToClover(order, {
      merchantId: tenantIntegration.cloverMerchantId,
      apiKey: tenantIntegration.cloverApiKey,
    });
    result.provider = 'clover';
  } else if (printerConfig && (printerType === 'bluetooth' || printerType === 'network')) {
    // Use new ESC/POS formatting
    result = await sendOrderWithESCPOS(order, printerConfig);
  } else {
    // Fallback to old bluetooth method
    result = await sendOrderToBluetooth(order, {
      endpoint: tenantIntegration.printerEndpoint,
    });
  }

  try {
    await prisma.integrationLog.create({
      data: {
        tenantId: order.tenantId,
        source: 'printer',
        level: result.ok ? 'info' : 'error',
        message: result.ok
          ? `Auto-printed order ${order.id.slice(-6)} via ${result.provider ?? printerType}.`
          : `Failed to auto-print order ${order.id.slice(-6)} via ${result.provider ?? printerType}.`,
        payload: {
          orderId: order.id,
          reason,
          provider: result.provider ?? printerType,
          status: result.status ?? null,
          error: result.ok ? null : result.message ?? null,
        },
      },
    });
  } catch (error) {
    console.error('[printer] Failed to write integration log', error);
  }

  if (!result.ok) {
    console.error('[printer] Auto-print failure', {
      orderId: order.id,
      provider: result.provider ?? printerType,
      status: result.status,
      message: result.message,
    });
  }

  return result.ok;
}
