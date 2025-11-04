import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

interface AppleValidationBody {
  validationURL?: string;
}

export async function POST(req: Request) {
  const tenant = await requireTenant();
  const body = (await req.json()) as AppleValidationBody;

  if (!body.validationURL) {
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'apple_pay',
        level: 'error',
        message: 'Missing validationURL in request.',
        payload: { validationURL: body.validationURL ?? null },
      },
    });
    return NextResponse.json({ error: 'validationURL required' }, { status: 400 });
  }

  const merchantId = process.env.APPLE_PAY_MERCHANT_ID;

  if (!merchantId) {
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'apple_pay',
        message: 'Mock Apple Pay merchant validation executed.',
        payload: { validationURL: body.validationURL },
      },
    });
    return NextResponse.json({
      mock: true,
      message: 'Set APPLE_PAY_MERCHANT_ID and certificate paths to enable live validation.',
      merchantSession: {
        merchantIdentifier: 'mock.merchant.identifier',
        domainName: new URL(body.validationURL).hostname,
        displayName: 'Alessa Cloud (Mock)',
        initiative: 'web',
        initiativeContext: new URL(body.validationURL).hostname,
        signature: 'mock-signature',
        expiresAt: Date.now() + 5 * 60 * 1000,
      },
    });
  }

  // TODO: Implement certificate-backed call to Apple Pay validation endpoint.
  await prisma.integrationLog.create({
    data: {
      tenantId: tenant.id,
      source: 'apple_pay',
      message: 'Live Apple Pay validation stub.',
      payload: { validationURL: body.validationURL },
    },
  });
  return NextResponse.json({
    mock: true,
    message: 'Live Apple Pay merchant validation not yet configured in this environment.',
    merchantIdentifier: merchantId,
  });
}
