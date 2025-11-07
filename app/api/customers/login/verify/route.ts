import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

interface VerifyBody {
  token?: string;
}

export async function POST(req: Request) {
  const tenant = await requireTenant();
  const body = (await req.json()) as VerifyBody;

  if (!body.token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 });
  }

  const session = await prisma.customerSession.findFirst({
    where: {
      tenantId: tenant.id,
      token: body.token,
      expiresAt: { gt: new Date() },
    },
    include: { customer: true },
  });

  if (!session) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const persistentToken = crypto.randomUUID();
  const persistentExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.customerSession.update({
    where: { id: session.id },
    data: {
      token: persistentToken,
      expiresAt: persistentExpiresAt,
    },
  });

  await prisma.customerSession.deleteMany({
    where: {
      tenantId: tenant.id,
      customerId: session.customerId,
      id: { not: session.id },
    },
  });

  cookies().set({
    name: 'customer_session',
    value: persistentToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  await prisma.integrationLog.create({
    data: {
      tenantId: tenant.id,
      source: 'customer-login',
      message: 'Customer verified and session issued.',
      payload: { customerId: session.customerId },
    },
  });

  return NextResponse.json({ ok: true });
}
