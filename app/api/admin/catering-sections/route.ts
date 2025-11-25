import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

function unauthorized() {
  return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return unauthorized();
  }

  const tenant = await requireTenant();
  const sections = await prisma.cateringSection.findMany({
    where: { tenantId: tenant.id },
    orderBy: { position: 'asc' },
    include: {
      _count: {
        select: { packages: true },
      },
    },
  });

  return NextResponse.json(sections);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return unauthorized();
  }

  const tenant = await requireTenant();
  const body = await req.json();

  const data = {
    tenantId: tenant.id,
    name: body.name || '',
    description: body.description || null,
    position: body.position !== undefined ? Number(body.position) : 0,
    imageUrl: body.imageUrl || null,
  };

  const created = await prisma.cateringSection.create({ data });
  return NextResponse.json(created, { status: 201 });
}
