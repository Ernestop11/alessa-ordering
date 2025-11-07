import type { SerializedOrder } from './order-serializer';

interface SendOptions {
  merchantId?: string | null;
  apiKey?: string | null;
}

interface CloverResponse {
  ok: boolean;
  status?: number;
  message?: string;
}

const DEFAULT_ENDPOINT = 'https://api.clover.com/v3';

function toCents(amount: number | null | undefined) {
  if (!amount || Number.isNaN(amount)) return 0;
  return Math.round(Number(amount) * 100);
}

export async function sendOrderToClover(order: SerializedOrder, options: SendOptions = {}): Promise<CloverResponse> {
  const apiKey = options.apiKey ?? process.env.CLOVER_API_KEY ?? null;
  const merchantId = options.merchantId ?? process.env.CLOVER_MERCHANT_ID ?? null;

  if (!apiKey || !merchantId) {
    return {
      ok: false,
      message: 'Missing Clover credentials (api key or merchant id).',
    };
  }

  try {
    const url = `${DEFAULT_ENDPOINT}/merchants/${merchantId}/orders`;
    const lineItems = order.items.map((item) => ({
      name: item.menuItemName ?? 'Menu Item',
      price: toCents(item.price),
      quantity: item.quantity,
      note: order.notes,
    }));

    const payload = {
      title: `Online Order ${order.id.slice(-6).toUpperCase()}`,
      state: order.status ?? 'pending',
      total: toCents(order.totalAmount),
      note: order.notes ?? '',
      currency: 'USD',
      lineItems,
      metadata: {
        tenantId: order.tenantId,
        fulfillmentMethod: order.fulfillmentMethod ?? '',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        status: response.status,
        message: text || 'Failed to send order to Clover',
      };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Unknown Clover print error',
    };
  }
}
