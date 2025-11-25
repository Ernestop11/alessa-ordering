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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return unauthorized();
  }

  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;
  const tenant = await requireTenant();
  const body = await req.json();

  const existing = await prisma.cateringPackage.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updatableFields = {
    name: body.name ?? existing.name,
    description: body.description ?? existing.description,
    pricePerGuest: body.pricePerGuest !== undefined ? parseFloat(String(body.pricePerGuest)) : existing.pricePerGuest,
    image: body.image !== undefined ? body.image : existing.image,
    badge: body.badge !== undefined ? body.badge : existing.badge,
    available: body.available !== undefined ? Boolean(body.available) : existing.available,
    displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : existing.displayOrder,
  };

  const updated = await prisma.cateringPackage.update({
    where: { id },
    data: updatableFields,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return unauthorized();
  }

  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;
  const tenant = await requireTenant();

  const existing = await prisma.cateringPackage.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.cateringPackage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
