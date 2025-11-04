import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

interface DeliveryQuoteRequest {
  subtotalAmount?: number;
  address?: string;
}

export async function POST(req: Request) {
  const tenant = await requireTenant();
  const body = (await req.json()) as DeliveryQuoteRequest;

  const subtotal = Number(body.subtotalAmount || 0);
  const baseFee = tenant.integrations?.deliveryBaseFee ?? 4.99;
  const perMileFee = 1.5;
  const estimatedMiles = 3;

  const deliveryFee = parseFloat((baseFee + perMileFee * estimatedMiles).toFixed(2));
  const etaMinutes = 35;

  await prisma.integrationLog.create({
    data: {
      tenantId: tenant.id,
      source: 'doordash',
      message: 'Delivery quote generated (mock).',
      payload: { subtotal, deliveryFee, estimatedMiles, etaMinutes },
    },
  });

  return NextResponse.json({
    partner: 'doordash',
    subtotal,
    deliveryFee,
    estimatedMiles,
    etaMinutes,
    message: 'Mock quote generated. Connect DoorDash Drive API for live pricing.',
  });
}
