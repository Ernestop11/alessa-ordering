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
    taxPercentage: body.taxPercentage !== undefined ? (body.taxPercentage !== null ? parseFloat(String(body.taxPercentage)) : null) : existing.taxPercentage,
    expirationDate: body.expirationDate !== undefined ? (body.expirationDate ? new Date(body.expirationDate) : null) : existing.expirationDate,
    isWeekendSpecial: body.isWeekendSpecial !== undefined ? Boolean(body.isWeekendSpecial) : existing.isWeekendSpecial,
    weekendPrice: body.weekendPrice !== undefined ? (body.weekendPrice !== null ? parseFloat(String(body.weekendPrice)) : null) : existing.weekendPrice,
    weekendStartDate: body.weekendStartDate !== undefined ? (body.weekendStartDate ? new Date(body.weekendStartDate) : null) : existing.weekendStartDate,
    weekendEndDate: body.weekendEndDate !== undefined ? (body.weekendEndDate ? new Date(body.weekendEndDate) : null) : existing.weekendEndDate,
  };

  const updated = await prisma.groceryItem.update({
    where: { id },
    data: updatableFields,
  });

  // SECURITY: Only revalidate THIS tenant's paths to prevent cross-tenant cache pollution
  revalidatePath(`/${tenant.slug}`, 'layout');
  revalidatePath(`/${tenant.slug}/grocery`, 'page');
  revalidatePath(`/${tenant.slug}/order`, 'page');
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
  // SECURITY: Only revalidate THIS tenant's paths to prevent cross-tenant cache pollution
  revalidatePath(`/${tenant.slug}`, 'layout');
  revalidatePath(`/${tenant.slug}/grocery`, 'page');
  revalidatePath(`/${tenant.slug}/order`, 'page');
  return NextResponse.json({ ok: true });
}
