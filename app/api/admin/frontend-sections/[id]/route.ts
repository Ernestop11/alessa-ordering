import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';

/**
 * PATCH - Update a frontend section
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const body = await req.json();

    // Check that section exists and belongs to tenant
    const existing = await prisma.frontendSection.findUnique({
      where: { id },
    });

    if (!existing || existing.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.frontendSection.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : existing.name,
        type: body.type !== undefined ? body.type : existing.type,
        position: body.position !== undefined ? body.position : existing.position,
        enabled: body.enabled !== undefined ? body.enabled : existing.enabled,
        content: body.content !== undefined ? body.content : existing.content,
        insertAfter: body.insertAfter !== undefined ? body.insertAfter : existing.insertAfter,
      },
    });

    // Revalidate cache to ensure frontend shows updated sections
    revalidatePath('/order');
    revalidatePath('/');

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Frontend Section PATCH Error]', error);
    return NextResponse.json(
      { error: 'Failed to update frontend section' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a frontend section
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    // Check that section exists and belongs to tenant
    const existing = await prisma.frontendSection.findUnique({
      where: { id },
    });

    if (!existing || existing.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.frontendSection.delete({ where: { id } });

    // Revalidate cache to ensure frontend shows updated sections
    revalidatePath('/order');
    revalidatePath('/');

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Frontend Section DELETE Error]', error);
    return NextResponse.json(
      { error: 'Failed to delete frontend section' },
      { status: 500 }
    );
  }
}
