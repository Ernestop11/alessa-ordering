import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { validateApplePayMerchant, getApplePayConfig } from '@/lib/apple-pay/validation';

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

  // Get tenant integration for Apple Pay config
  const integration = await prisma.tenantIntegration.findUnique({
    where: { tenantId: tenant.id },
    select: {
      applePayMerchantId: true,
      applePayPaymentProcessingCertificate: true,
    },
  });

  const config = getApplePayConfig(integration || undefined);

  if (!config) {
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'apple_pay',
        message: 'Mock Apple Pay merchant validation executed (no merchant ID configured).',
        payload: { validationURL: body.validationURL },
      },
    });
    return NextResponse.json({
      mock: true,
      message: 'Set APPLE_PAY_MERCHANT_ID and certificate paths/content to enable live validation.',
      merchantSession: {
        merchantIdentifier: 'mock.merchant.identifier',
        domainName: new URL(body.validationURL).hostname,
        displayName: tenant.name || 'Alessa Ordering (Mock)',
        initiative: 'web',
        initiativeContext: new URL(body.validationURL).hostname,
        signature: 'mock-signature',
        expiresAt: Date.now() + 5 * 60 * 1000,
      },
    });
  }

  try {
    // Perform live merchant validation with Apple
    const result = await validateApplePayMerchant(body.validationURL, {
      ...config,
      displayName: config.displayName || tenant.name || 'Alessa Ordering',
    });

    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'apple_pay',
        message: 'Apple Pay merchant validation successful.',
        payload: {
          validationURL: body.validationURL,
          merchantId: config.merchantId,
          domainName: result.merchantSession.domainName,
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Apple Pay Validation] Error:', error);

    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'apple_pay',
        level: 'error',
        message: `Apple Pay merchant validation failed: ${errorMessage}`,
        payload: {
          validationURL: body.validationURL,
          error: errorMessage,
        },
      },
    });

    // Return error but don't fail completely - allow fallback to mock
    return NextResponse.json({
      error: 'Apple Pay validation failed',
      message: errorMessage,
      mock: true,
      merchantSession: {
        merchantIdentifier: config.merchantId,
        domainName: new URL(body.validationURL).hostname,
        displayName: tenant.name || 'Alessa Ordering',
        initiative: 'web',
        initiativeContext: new URL(body.validationURL).hostname,
        signature: 'fallback-signature',
        expiresAt: Date.now() + 5 * 60 * 1000,
      },
    }, { status: 500 });
  }
}
