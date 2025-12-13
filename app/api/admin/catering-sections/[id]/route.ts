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

  const existing = await prisma.cateringSection.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updatableFields = {
    name: body.name ?? existing.name,
    description: body.description !== undefined ? body.description : existing.description,
    position: body.position !== undefined ? Number(body.position) : existing.position,
    imageUrl: body.imageUrl !== undefined ? body.imageUrl : existing.imageUrl,
  };

  const updated = await prisma.cateringSection.update({
    where: { id },
    data: updatableFields,
  });

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

  const existing = await prisma.cateringSection.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.cateringSection.delete({ where: { id } });
  revalidatePath('/order');
  return NextResponse.json({ ok: true });
}
