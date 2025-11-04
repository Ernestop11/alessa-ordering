import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenant = await requireTenant();

  const recentErrors = await prisma.integrationLog.findMany({
    where: {
      tenantId: tenant.id,
      level: { in: ['error', 'warn'] },
      createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // TODO: Push to email/SMS provider.

  return NextResponse.json({
    ok: true,
    message: 'Notifications would be sent for the following logs.',
    logs: recentErrors,
  });
}
