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

  try {
    const tenant = await requireTenant();

    const menuItems = await prisma.menuItem.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        available: true,
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(menuItems);
  } catch (err) {
    console.error('[admin-menu-items] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

