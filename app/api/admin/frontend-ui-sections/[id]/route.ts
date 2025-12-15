import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * PUT - Update a frontend UI section
 */
export async function PUT(
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
    const sectionId = resolvedParams.id;
    const body = await req.json();

    // Get current tenant settings
    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { settings: true },
    });

    const currentSettings = (tenantData?.settings || {}) as any;
    const currentSections = currentSettings.frontendUISections || [];

    // Find and update the section, or create it if it doesn't exist (upsert)
    const sectionIndex = currentSections.findIndex((s: any) => s.id === sectionId);

    let updatedSections = [...currentSections];
    if (sectionIndex === -1) {
      // Section doesn't exist - create it with the provided data
      const newSection = {
        id: sectionId,
        name: body.name || sectionId,
        type: body.type || sectionId,
        position: currentSections.length,
        enabled: body.enabled !== undefined ? body.enabled : true,
        content: body.content || {},
        ...body,
      };
      updatedSections.push(newSection);
    } else {
      // Update existing section
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        ...body,
      };
    }

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

    return NextResponse.json(updatedSections[sectionIndex], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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
 * DELETE - Delete a frontend UI section (disable it)
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
    const sectionId = resolvedParams.id;

    // Get current tenant settings
    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { settings: true },
    });

    const currentSettings = (tenantData?.settings || {}) as any;
    const currentSections = currentSettings.frontendUISections || [];

    // Remove the section
    const updatedSections = currentSections.filter((s: any) => s.id !== sectionId);

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
    console.error('[Frontend UI Sections DELETE Error]', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}

