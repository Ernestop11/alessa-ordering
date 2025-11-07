import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { maskEmail, maskPhone } from '@/lib/customer/login-masking';

type LoginRequestBody =
  | { email: string; phone?: string }
  | { email?: string; phone: string };

export async function POST(req: Request) {
  const tenant = await requireTenant();
  const body = (await req.json()) as LoginRequestBody;

  if (!body.email && !body.phone) {
    return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  let customer = await prisma.customer.findFirst({
    where: {
      tenantId: tenant.id,
      OR: [
        body.email ? { email: body.email } : undefined,
        body.phone ? { phone: body.phone } : undefined,
      ].filter(Boolean) as any,
    },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        email: body.email || null,
        phone: body.phone || null,
      },
    });
  }

  await prisma.customerSession.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      token,
      expiresAt,
    },
  });

  const deliveries: Array<{ channel: 'email' | 'sms'; destination: string }> = [];
  const debugExpose =
    process.env.CUSTOMER_LOGIN_DEBUG_TOKEN === 'true' || process.env.NODE_ENV !== 'production';

  if (customer.email) {
    deliveries.push({ channel: 'email', destination: customer.email });
    if (debugExpose) {
      console.info(`[customer-login] Sent login code to ${customer.email}: ${token}`);
    }
  }

  if (customer.phone) {
    deliveries.push({ channel: 'sms', destination: customer.phone });
    if (debugExpose) {
      console.info(`[customer-login] Sent login code via SMS to ${customer.phone}: ${token}`);
    }
  }

  const maskedDeliveries = deliveries.map((delivery) => ({
    channel: delivery.channel,
    destination: delivery.channel === 'email' ? maskEmail(delivery.destination) : maskPhone(delivery.destination),
  }));

  await prisma.integrationLog.create({
    data: {
      tenantId: tenant.id,
      source: 'customer-login',
      message: 'Customer login code generated and queued for delivery.',
      payload: {
        customerId: customer.id,
        email: customer.email,
        phone: customer.phone,
        deliveries: maskedDeliveries,
        tokenPreview: `${token.slice(0, 4)}…`,
      },
    },
  });

  const message =
    maskedDeliveries.length > 0
      ? `Your login code was sent to ${maskedDeliveries
          .map((delivery) => (delivery.channel === 'email' ? `email ${delivery.destination}` : `phone ${delivery.destination}`))
          .join(' & ')}.`
      : 'Your login code is ready.';

  return NextResponse.json({
    ok: true,
    expiresAt,
    message,
    delivery: maskedDeliveries,
    ...(debugExpose ? { debugToken: token } : {}),
  });
}
