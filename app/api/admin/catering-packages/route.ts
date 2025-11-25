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
  const packages = await prisma.cateringPackage.findMany({
    where: { tenantId: tenant.id },
    orderBy: { displayOrder: 'asc' },
  });

  return NextResponse.json(packages);
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
    description: body.description || '',
    pricePerGuest: parseFloat(String(body.pricePerGuest || 0)),
    price: body.price !== undefined && body.price !== null ? parseFloat(String(body.price)) : null,
    category: body.category || 'popular',
    image: body.image || null,
    gallery: body.gallery || null,
    badge: body.badge || null,
    customizationRemovals: body.customizationRemovals || [],
    customizationAddons: body.customizationAddons || null,
    available: body.available === undefined ? true : Boolean(body.available),
    displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : 0,
  };

  const created = await prisma.cateringPackage.create({ data });
  return NextResponse.json(created, { status: 201 });
}
