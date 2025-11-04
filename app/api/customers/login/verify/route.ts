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

  await prisma.customerSession.delete({
    where: { id: session.id },
  });

  cookies().set({
    name: 'customer_session',
    value: session.token,
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
