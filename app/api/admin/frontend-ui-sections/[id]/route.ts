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

    // Get current tenant settings from TenantSettings table
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { frontendConfig: true },
    });

    const frontendConfig = (tenantSettings?.frontendConfig || {}) as any;
    const currentSections = frontendConfig.frontendUISections || [];

    // Find and update the section, or create it if it doesn't exist (upsert)
    const sectionIndex = currentSections.findIndex((s: any) => s.id === sectionId);

    let updatedSections = [...currentSections];
    let savedSection;

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
      savedSection = newSection;
    } else {
      // Update existing section
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        ...body,
      };
      savedSection = updatedSections[sectionIndex];
    }

    // Get current branding to potentially update heroImages
    const fullSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { branding: true },
    });
    const currentBranding = (fullSettings?.branding || {}) as any;

    // If this is the hero section, also update branding.heroImages for instant frontend updates
    let brandingUpdate = {};
    if (sectionId === 'hero' && savedSection.content?.image) {
      // Add the hero image to branding.heroImages array for polling
      const heroImages = currentBranding.heroImages || [];
      const newImage = savedSection.content.image;
      // Replace the first image or add if empty
      const updatedHeroImages = [newImage, ...heroImages.filter((img: string) => img !== newImage)].slice(0, 5);
      brandingUpdate = {
        branding: {
          ...currentBranding,
          heroImages: updatedHeroImages,
        },
      };
    }

    // Save to tenant settings (upsert to handle case where settings don't exist)
    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {
        frontendConfig: {
          ...frontendConfig,
          frontendUISections: updatedSections,
        },
        ...brandingUpdate,
      },
      create: {
        tenantId: tenant.id,
        frontendConfig: {
          frontendUISections: updatedSections,
        },
        ...brandingUpdate,
      },
    });

    // SECURITY: Only revalidate THIS tenant's paths to prevent cross-tenant cache pollution
    revalidatePath(`/${tenant.slug}`, 'layout');
    revalidatePath(`/${tenant.slug}/order`, 'page');

    return NextResponse.json(savedSection, {
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

    // Get current tenant settings from TenantSettings table
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { frontendConfig: true },
    });

    const frontendConfig = (tenantSettings?.frontendConfig || {}) as any;
    const currentSections = frontendConfig.frontendUISections || [];

    // Remove the section
    const updatedSections = currentSections.filter((s: any) => s.id !== sectionId);

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

    // SECURITY: Only revalidate THIS tenant's paths to prevent cross-tenant cache pollution
    revalidatePath(`/${tenant.slug}`, 'layout');
    revalidatePath(`/${tenant.slug}/order`, 'page');

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

