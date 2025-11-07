import prisma from './prisma';
import { sendOrderToClover } from './cloverPrinter';
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
  lines.push(tenantName.toUpperCase());
  lines.push(`Order ${order.id.slice(-6).toUpperCase()}`);
  lines.push(formatDate(order.createdAt));
  lines.push('------------------------------');

  for (const item of order.items) {
    const name = item.menuItemName ?? 'Menu Item';
    const quantity = item.quantity;
    const price = formatCurrency(item.price * quantity);
    lines.push(`${quantity} × ${name}`);
    lines.push(`   ${price}`);
  }

  lines.push('------------------------------');
  lines.push(`Subtotal: ${formatCurrency(order.subtotalAmount)}`);
  if (order.taxAmount && order.taxAmount > 0) {
    lines.push(`Tax: ${formatCurrency(order.taxAmount)}`);
  }
  if (order.deliveryFee && order.deliveryFee > 0) {
    lines.push(`Delivery: ${formatCurrency(order.deliveryFee)}`);
  }
  if (order.platformFee && order.platformFee > 0) {
    lines.push(`Fees: ${formatCurrency(order.platformFee)}`);
  }
  if (order.tipAmount && order.tipAmount > 0) {
    lines.push(`Tip: ${formatCurrency(order.tipAmount)}`);
  }
  lines.push(`Total: ${formatCurrency(order.totalAmount)}`);
  lines.push('------------------------------');

  const fulfillment = order.fulfillmentMethod ?? 'pickup';
  lines.push(`Fulfillment: ${fulfillment.toUpperCase()}`);

  if (order.customerName || order.customer?.name) {
    lines.push(`Customer: ${order.customerName ?? order.customer?.name ?? 'Guest'}`);
  }
  if (order.customerPhone || order.customer?.phone) {
    lines.push(`Phone: ${order.customerPhone ?? order.customer?.phone ?? ''}`);
  }
  if (order.customerEmail || order.customer?.email) {
    lines.push(`Email: ${order.customerEmail ?? order.customer?.email ?? ''}`);
  }

  if (order.notes) {
    lines.push('------------------------------');
    lines.push('Notes:');
    lines.push(order.notes);
  }

  lines.push('------------------------------');
  lines.push('Thank you for your order!');

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
      cloverMerchantId: true,
      cloverApiKey: true,
    },
  });

  if (!tenantIntegration?.autoPrintOrders) {
    return false;
  }

  const printerType = (tenantIntegration.printerType ?? 'bluetooth').toLowerCase();

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
  } else {
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
