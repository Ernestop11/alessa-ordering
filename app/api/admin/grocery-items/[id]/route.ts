import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';

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

  const existing = await prisma.groceryItem.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updatableFields = {
    name: body.name ?? existing.name,
    description: body.description ?? existing.description,
    price: body.price !== undefined ? parseFloat(String(body.price)) : existing.price,
    category: body.category ?? existing.category,
    unit: body.unit !== undefined ? body.unit : existing.unit,
    image: body.image !== undefined ? body.image : existing.image,
    gallery: body.gallery !== undefined ? body.gallery : existing.gallery,
    available: body.available !== undefined ? Boolean(body.available) : existing.available,
    stockQuantity: body.stockQuantity !== undefined ? (body.stockQuantity !== null ? Number(body.stockQuantity) : null) : existing.stockQuantity,
    tags: Array.isArray(body.tags) ? body.tags : existing.tags,
    displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : existing.displayOrder,
  };

  const updated = await prisma.groceryItem.update({
    where: { id },
    data: updatableFields,
  });

  revalidatePath('/grocery'); // Invalidate cache
  revalidatePath('/order');
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

  const existing = await prisma.groceryItem.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.groceryItem.delete({ where: { id } });
  revalidatePath('/grocery');
  revalidatePath('/order');
  return NextResponse.json({ ok: true });
}
