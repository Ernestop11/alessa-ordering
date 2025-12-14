import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';

/**
 * POST - Reorder frontend sections
 * Body: { sectionId: string, direction: 'up' | 'down' }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await req.json();
    const { sectionId, direction } = body;

    if (!sectionId || !direction || !['up', 'down'].includes(direction)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide sectionId and direction (up or down)' },
        { status: 400 }
      );
    }

    // Get current section
    const section = await prisma.frontendSection.findUnique({
      where: { id: sectionId },
    });

    if (!section || section.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Get all sections for this tenant ordered by position
    const allSections = await prisma.frontendSection.findMany({
      where: { tenantId: tenant.id },
      orderBy: { position: 'asc' },
    });

    const currentIndex = allSections.findIndex((s) => s.id === sectionId);
    if (currentIndex === -1) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Determine swap target
    let swapIndex = -1;
    if (direction === 'up' && currentIndex > 0) {
      swapIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < allSections.length - 1) {
      swapIndex = currentIndex + 1;
    }

    if (swapIndex === -1) {
      // Already at boundary, no-op
      return NextResponse.json({ ok: true, message: 'Already at boundary' });
    }

    // Swap positions
    const currentSection = allSections[currentIndex];
    const swapSection = allSections[swapIndex];

    await prisma.$transaction([
      prisma.frontendSection.update({
        where: { id: currentSection.id },
        data: { position: swapSection.position },
      }),
      prisma.frontendSection.update({
        where: { id: swapSection.id },
        data: { position: currentSection.position },
      }),
    ]);

    // Revalidate cache to ensure frontend shows updated section order
    revalidatePath('/order');
    revalidatePath('/');

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Frontend Sections Reorder Error]', error);
    return NextResponse.json(
      { error: 'Failed to reorder frontend sections' },
      { status: 500 }
    );
  }
}
