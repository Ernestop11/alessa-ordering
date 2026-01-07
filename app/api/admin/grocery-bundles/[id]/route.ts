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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return unauthorized();
  }

  const tenant = await requireTenant();
  const { id } = params;
  const body = await req.json();

  const existing = await prisma.groceryBundle.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
  }

  const updatableFields = {
    name: body.name ?? existing.name,
    description: body.description ?? existing.description,
    price: body.price !== undefined ? parseFloat(String(body.price)) : existing.price,
    category: body.category ?? existing.category,
    image: body.image !== undefined ? body.image : existing.image,
    gallery: body.gallery !== undefined ? body.gallery : existing.gallery,
    available: body.available !== undefined ? Boolean(body.available) : existing.available,
    badge: body.badge !== undefined ? body.badge : existing.badge,
    items: body.items !== undefined ? body.items : existing.items,
    displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : existing.displayOrder,
  };

  const updated = await prisma.groceryBundle.update({
    where: { id },
    data: updatableFields,
  });

  // SECURITY: Only revalidate THIS tenant's paths to prevent cross-tenant cache pollution
  revalidatePath(`/${tenant.slug}`, 'layout');
  revalidatePath(`/${tenant.slug}/grocery`, 'page');
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return unauthorized();
  }

  const tenant = await requireTenant();
  const { id } = params;

  const existing = await prisma.groceryBundle.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
  }

  await prisma.groceryBundle.delete({ where: { id } });
  // SECURITY: Only revalidate THIS tenant's paths to prevent cross-tenant cache pollution
  revalidatePath(`/${tenant.slug}`, 'layout');
  revalidatePath(`/${tenant.slug}/grocery`, 'page');
  return NextResponse.json({ success: true });
}
