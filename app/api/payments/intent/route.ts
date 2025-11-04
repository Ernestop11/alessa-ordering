import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

interface CreateIntentBody {
  subtotalAmount: number;
  taxAmount?: number;
  deliveryFee?: number;
  tipAmount?: number;
  totalAmount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

function toCents(value: number) {
  return Math.round(value * 100);
}

export async function POST(req: Request) {
  const tenant = await requireTenant();
  const body = (await req.json()) as CreateIntentBody;

  const accountId = tenant.integrations?.stripeAccountId;
  if (!accountId) {
    return NextResponse.json({ error: 'Stripe account not configured for this tenant.' }, { status: 400 });
  }

  const subtotal = Number(body.subtotalAmount || 0);
  const total = Number(body.totalAmount || 0);
  if (!Number.isFinite(subtotal) || subtotal <= 0 || !Number.isFinite(total) || total <= 0) {
    return NextResponse.json({ error: 'Invalid amount values.' }, { status: 400 });
  }

  const percentFee = tenant.integrations?.platformPercentFee ?? 0;
  const flatFee = tenant.integrations?.platformFlatFee ?? 0;
  const applicationFee = Math.max(0, subtotal * percentFee + flatFee);

  const currency = (tenant.settings?.currency || 'USD').toLowerCase();

  const intent = await stripe.paymentIntents.create(
    {
      amount: toCents(total),
      currency,
      application_fee_amount: toCents(applicationFee),
      automatic_payment_methods: { enabled: true },
      metadata: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        ...body.metadata,
      },
      transfer_data: {
        destination: accountId,
      },
    },
    {
      stripeAccount: undefined,
    },
  );

  await prisma.integrationLog.create({
    data: {
      tenantId: tenant.id,
      source: 'stripe',
      message: 'Payment intent created',
      payload: {
        paymentIntentId: intent.id,
        amount: intent.amount,
        currency: intent.currency,
        applicationFeeAmount: intent.application_fee_amount,
      },
    },
  });

  return NextResponse.json({
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  });
}
