import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * POST - Reorder frontend UI sections (up/down)
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
    const { sectionId, direction } = body; // direction: 'up' | 'down'

    if (!sectionId || !direction) {
      return NextResponse.json(
        { error: 'Section ID and direction (up/down) are required' },
        { status: 400 }
      );
    }

    if (direction !== 'up' && direction !== 'down') {
      return NextResponse.json(
        { error: 'Direction must be "up" or "down"' },
        { status: 400 }
      );
    }

    // Get current tenant settings from TenantSettings table
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { frontendConfig: true },
    });

    const frontendConfig = (tenantSettings?.frontendConfig || {}) as any;
    const sections = [...(frontendConfig.frontendUISections || [])];

    // Find current index
    const currentIndex = sections.findIndex((s: any) => s.id === sectionId);
    if (currentIndex === -1) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Calculate new index
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sections.length) {
      return NextResponse.json({ error: 'Cannot move further' }, { status: 400 });
    }

    // Swap positions
    [sections[currentIndex], sections[newIndex]] = [sections[newIndex], sections[currentIndex]];

    // Update positions
    const reorderedSections = sections.map((s: any, i: number) => ({
      ...s,
      position: i,
    }));

    // Save to tenant settings
    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {
        frontendConfig: {
          ...frontendConfig,
          frontendUISections: reorderedSections,
        },
      },
      create: {
        tenantId: tenant.id,
        frontendConfig: {
          frontendUISections: reorderedSections,
        },
      },
    });

    // SECURITY: Only revalidate THIS tenant's paths to prevent cross-tenant cache pollution
    revalidatePath(`/${tenant.slug}`, 'layout');
    revalidatePath(`/${tenant.slug}/order`, 'page');

    return NextResponse.json({ 
      success: true, 
      sections: reorderedSections 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Frontend UI Sections Reorder Error]', error);
    return NextResponse.json(
      { error: 'Failed to reorder sections' },
      { status: 500 }
    );
  }
}

