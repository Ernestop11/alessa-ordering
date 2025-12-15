import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * GET - Fetch all frontend UI sections for a tenant
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    // Get sections from TenantSettings table
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { frontendConfig: true },
    });

    const frontendConfig = (tenantSettings?.frontendConfig || {}) as any;
    const sections = frontendConfig.frontendUISections || [];

    // Return with cache-busting headers
    return NextResponse.json(sections, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Frontend UI Sections GET Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch frontend UI sections' },
      { status: 500 }
    );
  }
}

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

    // Get current tenant settings from TenantSettings table
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { frontendConfig: true },
    });

    const frontendConfig = (tenantSettings?.frontendConfig || {}) as any;
    const currentSections = frontendConfig.frontendUISections || [];

    // Update positions
    const updatedSections = currentSections.map((section: any) => {
      const update = body.sections.find((s: any) => s.id === section.id);
      return update ? { ...section, position: update.position } : section;
    }).sort((a: any, b: any) => a.position - b.position);

    // Save to tenant settings
    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {
        frontendConfig: {
          ...frontendConfig,
          frontendUISections: updatedSections,
        },
      },
      create: {
        tenantId: tenant.id,
        frontendConfig: {
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
    console.error('[Frontend UI Sections POST Error]', error);
    return NextResponse.json(
      { error: 'Failed to reorder sections' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update section (toggle enabled, edit content)
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await req.json();
    const { sectionId, updates } = body;

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID required' }, { status: 400 });
    }

    // Get current tenant settings
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { frontendConfig: true },
    });

    const frontendConfig = (tenantSettings?.frontendConfig || {}) as any;
    const currentSections = frontendConfig.frontendUISections || [];

    // Update the specific section
    const updatedSections = currentSections.map((section: any) => {
      if (section.id === sectionId) {
        return { ...section, ...updates, updatedAt: new Date().toISOString() };
      }
      return section;
    });

    // Save to tenant settings
    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {
        frontendConfig: {
          ...frontendConfig,
          frontendUISections: updatedSections,
        },
      },
      create: {
        tenantId: tenant.id,
        frontendConfig: {
          frontendUISections: updatedSections,
        },
      },
    });

    // Revalidate cache - THIS IS YOUR INSTANT SYNC
    revalidatePath('/order');
    revalidatePath('/');

    return NextResponse.json({ success: true, sections: updatedSections }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Frontend UI Sections PUT Error]', error);
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a section
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get('id');

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID required' }, { status: 400 });
    }

    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { frontendConfig: true },
    });

    const frontendConfig = (tenantSettings?.frontendConfig || {}) as any;
    const currentSections = frontendConfig.frontendUISections || [];

    // Remove the section
    const updatedSections = currentSections.filter((s: any) => s.id !== sectionId);

    // Re-index positions
    const reindexedSections = updatedSections.map((s: any, i: number) => ({
      ...s,
      position: i,
    }));

    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {
        frontendConfig: {
          ...frontendConfig,
          frontendUISections: reindexedSections,
        },
      },
      create: {
        tenantId: tenant.id,
        frontendConfig: {
          frontendUISections: reindexedSections,
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
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Frontend UI Sections DELETE Error]', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}

