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

  const existing = await prisma.cateringPackage.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updatableFields = {
    cateringSectionId: body.cateringSectionId !== undefined ? body.cateringSectionId : existing.cateringSectionId,
    name: body.name ?? existing.name,
    description: body.description ?? existing.description,
    pricePerGuest: body.pricePerGuest !== undefined ? parseFloat(String(body.pricePerGuest)) : existing.pricePerGuest,
    price: body.price !== undefined ? (body.price !== null ? parseFloat(String(body.price)) : null) : existing.price,
    category: body.category ?? existing.category,
    image: body.image !== undefined ? body.image : existing.image,
    gallery: body.gallery !== undefined ? body.gallery : existing.gallery,
    badge: body.badge !== undefined ? body.badge : existing.badge,
    customizationRemovals: body.customizationRemovals !== undefined ? body.customizationRemovals : existing.customizationRemovals,
    customizationAddons: body.customizationAddons !== undefined ? body.customizationAddons : existing.customizationAddons,
    available: body.available !== undefined ? Boolean(body.available) : existing.available,
    displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : existing.displayOrder,
    // Time-specific fields
    timeSpecificEnabled: body.timeSpecificEnabled !== undefined ? Boolean(body.timeSpecificEnabled) : (existing as any).timeSpecificEnabled ?? false,
    timeSpecificDays: Array.isArray(body.timeSpecificDays) ? body.timeSpecificDays : (existing as any).timeSpecificDays ?? [],
    timeSpecificStartTime: body.timeSpecificStartTime !== undefined ? body.timeSpecificStartTime : (existing as any).timeSpecificStartTime ?? null,
    timeSpecificEndTime: body.timeSpecificEndTime !== undefined ? body.timeSpecificEndTime : (existing as any).timeSpecificEndTime ?? null,
    timeSpecificPrice: body.timeSpecificPrice !== undefined ? (body.timeSpecificPrice ? parseFloat(String(body.timeSpecificPrice)) : null) : (existing as any).timeSpecificPrice ?? null,
    timeSpecificLabel: body.timeSpecificLabel !== undefined ? body.timeSpecificLabel : (existing as any).timeSpecificLabel ?? null,
  };

  const updated = await prisma.cateringPackage.update({
    where: { id },
    data: updatableFields,
  });

  // SECURITY: Only revalidate THIS tenant's paths to prevent cross-tenant cache pollution
  revalidatePath(`/${tenant.slug}`, 'layout');
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

  const existing = await prisma.cateringPackage.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.cateringPackage.delete({ where: { id } });
  // SECURITY: Only revalidate THIS tenant's paths to prevent cross-tenant cache pollution
  revalidatePath(`/${tenant.slug}`, 'layout');
  revalidatePath(`/${tenant.slug}/order`, 'page');
  return NextResponse.json({ ok: true });
}
