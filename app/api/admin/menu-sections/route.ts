import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';
import {
  menuSectionCreateSchema,
  menuSectionReorderSchema,
  menuSectionUpdateSchema,
} from '@/lib/validation/menuSections';
import { validateRequestBody } from '@/lib/validation/validateRequest';

function unauthorized() {
  return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function json(data: unknown, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') return unauthorized();

  const tenant = await requireTenant();

  const sections = await prisma.menuSection.findMany({
    where: { tenantId: tenant.id },
    orderBy: { position: 'asc' },
    include: {
      _count: {
        select: { menuItems: true },
      },
    },
  });

  return json(sections);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') return unauthorized();

  const tenant = await requireTenant();
  const validation = await validateRequestBody(req, menuSectionCreateSchema);
  if (!validation.success) {
    return validation.response;
  }

  const body = validation.data;

  const greatestPosition = await prisma.menuSection.aggregate({
    where: { tenantId: tenant.id },
    _max: { position: true },
  });

  const section = await prisma.menuSection.create({
    data: {
      tenantId: tenant.id,
      name: body.name,
      description: body.description ?? '',
      type: body.type || 'RESTAURANT',
      position: (greatestPosition._max.position ?? 0) + 1,
      hero: body.hero ?? false,
    },
  });

  revalidatePath('/order');

  return json(section, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') return unauthorized();

  const tenant = await requireTenant();
  const raw = await req.json();

  if (Array.isArray(raw?.order)) {
    const reorderValidation = menuSectionReorderSchema.safeParse(raw);
    if (!reorderValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid reorder payload',
          details: reorderValidation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const updates = reorderValidation.data.order.map((sectionId, index) =>
      prisma.menuSection.updateMany({
        where: { id: sectionId, tenantId: tenant.id },
        data: { position: index },
      }),
    );
    await prisma.$transaction(updates);
    revalidatePath('/order');
    return json({ ok: true });
  }

  const updateValidation = menuSectionUpdateSchema.safeParse(raw);
  if (!updateValidation.success) {
    return NextResponse.json(
      {
        error: 'Invalid update payload',
        details: updateValidation.error.flatten(),
      },
      { status: 400 },
    );
  }

  const body = updateValidation.data;

  const existing = await prisma.menuSection.findUnique({
    where: { id: body.id },
    select: { id: true, tenantId: true },
  });

  if (!existing || existing.tenantId !== tenant.id) {
    return json({ error: 'Not found' }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.hero !== undefined) updateData.hero = body.hero;
  if (body.position !== undefined) updateData.position = body.position;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields provided for update' }, { status: 400 });
  }

  const updated = await prisma.menuSection.update({
    where: { id: body.id },
    data: updateData,
  });

  revalidatePath('/order');

  return json(updated);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') return unauthorized();

  const tenant = await requireTenant();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return json({ error: 'id is required' }, { status: 400 });
  }

  const existing = await prisma.menuSection.findUnique({
    where: { id },
    select: { id: true, tenantId: true },
  });

  if (!existing || existing.tenantId !== tenant.id) {
    return json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.menuItem.updateMany({
      where: { menuSectionId: id, tenantId: tenant.id },
      data: { menuSectionId: null },
    });

    await tx.menuSection.delete({
      where: { id },
    });
  });

  revalidatePath('/order');

  return json({ ok: true });
}
