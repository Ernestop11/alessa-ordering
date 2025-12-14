import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * POST - Reorder frontend UI sections
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

    if (!body.sections || !Array.isArray(body.sections)) {
      return NextResponse.json(
        { error: 'Sections array is required' },
        { status: 400 }
      );
    }

    // Get current tenant settings
    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { settings: true },
    });

    const currentSettings = (tenantData?.settings || {}) as any;
    const currentSections = currentSettings.frontendUISections || [];

    // Update positions
    const updatedSections = currentSections.map((section: any) => {
      const update = body.sections.find((s: any) => s.id === section.id);
      return update ? { ...section, position: update.position } : section;
    }).sort((a: any, b: any) => a.position - b.position);

    // Save to tenant settings
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        settings: {
          ...currentSettings,
          frontendUISections: updatedSections,
        },
      },
    });

    // Revalidate cache
    revalidatePath('/order');
    revalidatePath('/');

    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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

