import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { normalizeOrderPayload } from '@/lib/payments/normalize-order-payload';
import { calculateOrderTax } from '@/lib/tax/calculate-tax';

function json(data: unknown, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

export async function POST(req: Request) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const payload = normalizeOrderPayload(body?.order);
    if (!payload) {
      return json({ error: 'Invalid order payload' }, { status: 400 });
    }

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return json({ amount: 0, rate: 0, provider: 'builtin', breakdown: null });
    }

    if (body?.destination && typeof body.destination === 'object') {
      const destination = body.destination as Record<string, unknown>;
      payload.destination = {
        postalCode: typeof destination.postalCode === 'string' ? destination.postalCode : payload.destination?.postalCode,
        country: typeof destination.country === 'string' ? destination.country : payload.destination?.country,
        state: typeof destination.state === 'string' ? destination.state : payload.destination?.state,
        city: typeof destination.city === 'string' ? destination.city : payload.destination?.city,
        line1: typeof destination.line1 === 'string' ? destination.line1 : payload.destination?.line1,
        line2: typeof destination.line2 === 'string' ? destination.line2 : payload.destination?.line2,
      };
    }

    const result = await calculateOrderTax({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        country: tenant.country ?? null,
        state: tenant.state ?? null,
        city: tenant.city ?? null,
        postalCode: tenant.postalCode ?? null,
        addressLine1: tenant.addressLine1 ?? null,
        addressLine2: tenant.addressLine2 ?? null,
        integrations: tenant.integrations
          ? {
              taxProvider: tenant.integrations.taxProvider ?? null,
              taxConfig: tenant.integrations.taxConfig ?? null,
              defaultTaxRate: tenant.integrations.defaultTaxRate ?? null,
            }
          : null,
      },
      items: payload.items.map((item, index) => ({
        id: item.menuItemId || `item-${index + 1}`,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      subtotal: payload.subtotalAmount,
      shipping: payload.deliveryFee ?? 0,
      surcharge: payload.platformFee ?? 0,
      destination: payload.destination ?? null,
      currency: 'USD',
    });

    return json({
      amount: result.amount,
      rate: result.rate,
      provider: result.provider,
      breakdown: result.breakdown ?? null,
      warnings: result.warnings ?? [],
    });
  } catch (error) {
    console.error('[tax] Quote failed', error);
    return json(
      { error: 'Failed to calculate tax quote.' },
      {
        status: 500,
      },
    );
  }
}
