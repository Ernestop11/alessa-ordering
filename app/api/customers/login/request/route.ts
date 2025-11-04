import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

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

  await prisma.integrationLog.create({
    data: {
      tenantId: tenant.id,
      source: 'customer-login',
      message: 'One-time login requested.',
      payload: { customerId: customer.id, email: customer.email, phone: customer.phone },
    },
  });

  // TODO: integrate email/SMS delivery. For now, return the token in the response for testing.
  return NextResponse.json({
    ok: true,
    token,
    expiresAt,
  });
}
