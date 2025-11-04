import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenant = await requireTenant();

  const logs = await prisma.integrationLog.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(
    logs.map((log) => ({
      id: log.id,
      source: log.source,
      level: log.level,
      message: log.message,
      payload: log.payload,
      createdAt: log.createdAt,
    })),
  );
}
