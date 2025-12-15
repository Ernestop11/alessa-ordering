import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getAddOn, getAddOnSections, AVAILABLE_ADDONS } from '@/lib/addons/registry';

/**
 * GET - Fetch enabled add-ons for the tenant
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    // Get tenant settings
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { enabledAddOns: true },
    });

    const enabledAddOns = tenantSettings?.enabledAddOns || [];

    // Return enabled add-ons with full details
    const addOnsDetails = enabledAddOns
      .map((id) => getAddOn(id))
      .filter((addOn): addOn is NonNullable<typeof addOn> => addOn !== null);

    return NextResponse.json({
      enabledAddOns,
      addOns: addOnsDetails,
      available: Object.values(AVAILABLE_ADDONS),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[Add-ons GET Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch add-ons' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Toggle an add-on (enable/disable)
 * When enabling: seeds default sections into frontendConfig.frontendUISections
 * When disabling: removes sections with that source
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
    const { addOnId, enabled } = body;

    if (!addOnId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'addOnId and enabled (boolean) are required' },
        { status: 400 }
      );
    }

    // Validate add-on exists
    const addOn = getAddOn(addOnId);
    if (!addOn) {
      return NextResponse.json(
        { error: `Add-on "${addOnId}" not found` },
        { status: 404 }
      );
    }

    // Get current tenant settings
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { enabledAddOns: true, frontendConfig: true },
    });

    const currentEnabledAddOns = tenantSettings?.enabledAddOns || [];
    const frontendConfig = (tenantSettings?.frontendConfig || {}) as any;
    const currentSections = frontendConfig.frontendUISections || [];

    // Update enabled add-ons list
    let updatedEnabledAddOns: string[];
    if (enabled) {
      // Add add-on if not already enabled
      updatedEnabledAddOns = currentEnabledAddOns.includes(addOnId)
        ? currentEnabledAddOns
        : [...currentEnabledAddOns, addOnId];
    } else {
      // Remove add-on
      updatedEnabledAddOns = currentEnabledAddOns.filter((id) => id !== addOnId);
    }

    // Update frontendUISections based on enable/disable
    let updatedSections = [...currentSections];

    if (enabled) {
      // Seed default sections for this add-on
      const addOnSections = getAddOnSections(addOnId);
      const existingSectionTypes = new Set(
        currentSections.map((s: any) => s.type)
      );

      // Create default sections for each add-on section type
      addOnSections.forEach((sectionType, index) => {
        // Skip if section type already exists
        if (existingSectionTypes.has(sectionType)) {
          return;
        }

        // Create default section structure
        const newSection = {
          id: `${addOnId}-${sectionType}-${Date.now()}-${index}`,
          type: sectionType,
          name: getSectionName(sectionType, addOn.name),
          enabled: true,
          position: currentSections.length + index,
          source: addOnId, // Track which add-on created this section
          content: getDefaultSectionContent(sectionType, addOn),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        updatedSections.push(newSection);
      });
    } else {
      // Remove sections with this source
      updatedSections = updatedSections.filter(
        (section: any) => section.source !== addOnId
      );

      // Re-index positions after removal
      updatedSections = updatedSections.map((section: any, index: number) => ({
        ...section,
        position: index,
      }));
    }

    // Update tenant settings
    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {
        enabledAddOns: updatedEnabledAddOns,
        frontendConfig: {
          ...frontendConfig,
          frontendUISections: updatedSections,
        },
      },
      create: {
        tenantId: tenant.id,
        enabledAddOns: updatedEnabledAddOns,
        frontendConfig: {
          frontendUISections: updatedSections,
        },
      },
    });

    // Revalidate cache for instant frontend update
    revalidatePath('/order');
    revalidatePath('/');

    return NextResponse.json({
      success: true,
      enabledAddOns: updatedEnabledAddOns,
      sections: updatedSections,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[Add-ons PUT Error]', error);
    return NextResponse.json(
      { error: 'Failed to toggle add-on' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get display name for a section type
 */
function getSectionName(sectionType: string, addOnName: string): string {
  const nameMap: Record<string, string> = {
    weekendSpecials: 'Weekend Specials',
    bundles: 'Bundles & Packages',
    groceryBanner: 'Grocery Store',
    aisles: 'Grocery Aisles',
    dailyFresh: 'Daily Fresh',
    boxBuilder: 'Box Builder',
    categories: 'Categories',
    buildYourOwn: 'Build Your Own',
  };

  return nameMap[sectionType] || `${addOnName} Section`;
}

/**
 * Helper: Get default content for a section type
 */
function getDefaultSectionContent(sectionType: string, addOn: any): any {
  const baseContent = {
    title: '',
    subtitle: '',
    description: '',
    image: '',
    badge: '',
    buttonText: '',
    buttonLink: '',
    backgroundColor: '',
    textColor: '',
  };

  // Add-on specific defaults
  const contentMap: Record<string, any> = {
    weekendSpecials: {
      ...baseContent,
      title: 'Weekend Specials',
      subtitle: 'Fresh deals every weekend',
      badge: 'Weekend Only',
    },
    bundles: {
      ...baseContent,
      title: 'Bundles & Packages',
      subtitle: 'Save with our combo deals',
    },
    groceryBanner: {
      ...baseContent,
      title: 'Visit Our Grocery Store',
      subtitle: 'Fresh produce and essentials',
      buttonText: 'Shop Grocery',
      buttonLink: '/grocery',
    },
    aisles: {
      ...baseContent,
      title: 'Browse Aisles',
      subtitle: 'Find what you need',
    },
    dailyFresh: {
      ...baseContent,
      title: 'Daily Fresh',
      subtitle: 'Baked fresh every day',
      badge: 'Fresh',
    },
    boxBuilder: {
      ...baseContent,
      title: 'Build Your Box',
      subtitle: 'Create your perfect selection',
      buttonText: 'Start Building',
    },
    categories: {
      ...baseContent,
      title: 'Browse Categories',
      subtitle: 'Find your favorites',
    },
    buildYourOwn: {
      ...baseContent,
      title: 'Build Your Own',
      subtitle: 'Customize your drink',
      buttonText: 'Create Drink',
    },
  };

  return contentMap[sectionType] || baseContent;
}

