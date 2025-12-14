import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic';

// CateringPackage expected by frontend
interface CateringPackage {
  id: string;
  name: string;
  description: string;
  pricePerGuest: number;
  price?: number | null;
  category: string;
  image: string | null;
  gallery?: string[] | null;
  badge: string | null;
  customizationRemovals?: string[];
  customizationAddons?: {
    id: string;
    label: string;
    price: number;
  }[];
  available: boolean;
  displayOrder: number;
}

interface CateringSection {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  packages: CateringPackage[];
}

export async function GET() {
  try {
    const tenant = await requireTenant();

    // Fetch catering sections with their packages
    const sections = await prisma.cateringSection.findMany({
      where: { tenantId: tenant.id },
      orderBy: { position: 'asc' },
      include: {
        packages: {
          where: { available: true },
          orderBy: [
            { displayOrder: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    // Fetch gallery from tenant settings
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { cateringGallery: true },
    });

    // Format sections with their packages
    const formattedSections: CateringSection[] = sections.map((section) => ({
      id: section.id,
      name: section.name,
      description: section.description,
      imageUrl: section.imageUrl,
      packages: section.packages.map((pkg) => {
        // Handle gallery - it's stored as JSON in the database
        let gallery: string[] | null = null;
        if (pkg.gallery) {
          if (Array.isArray(pkg.gallery)) {
            gallery = pkg.gallery.filter((url): url is string => typeof url === 'string' && url.length > 0);
          } else if (typeof pkg.gallery === 'string') {
            try {
              const parsed = JSON.parse(pkg.gallery);
              if (Array.isArray(parsed)) {
                gallery = parsed.filter((url): url is string => typeof url === 'string' && url.length > 0);
              }
            } catch {
              gallery = [pkg.gallery];
            }
          }
        }

        // Handle customizationAddons - it's stored as JSON
        let customizationAddons: { id: string; label: string; price: number }[] | undefined = undefined;
        if (pkg.customizationAddons) {
          if (Array.isArray(pkg.customizationAddons)) {
            customizationAddons = pkg.customizationAddons.filter((addon): addon is { id: string; label: string; price: number } => {
              return typeof addon === 'object' && addon !== null && 'label' in addon && 'price' in addon;
            }) as { id: string; label: string; price: number }[];
          } else if (typeof pkg.customizationAddons === 'string') {
            try {
              const parsed = JSON.parse(pkg.customizationAddons);
              if (Array.isArray(parsed)) {
                customizationAddons = parsed;
              }
            } catch {
              // If parsing fails, leave as undefined
            }
          }
        }

        const category = (pkg.category && pkg.category.trim() !== '') ? pkg.category : 'popular';

        return {
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          pricePerGuest: pkg.pricePerGuest,
          price: pkg.price,
          category: category,
          image: pkg.image,
          gallery: gallery && gallery.length > 0 ? gallery : null,
          badge: pkg.badge,
          customizationRemovals: pkg.customizationRemovals || [],
          customizationAddons: customizationAddons,
          available: pkg.available,
          displayOrder: pkg.displayOrder,
        };
      }),
    }));

    // Parse gallery from settings
    let gallery: string[] = [];
    if (settings?.cateringGallery) {
      if (Array.isArray(settings.cateringGallery)) {
        gallery = settings.cateringGallery.filter((url): url is string => typeof url === 'string');
      }
    }

    // Debug logging
    console.log('========================================');
    console.log('[catering-packages] Tenant:', tenant.slug, tenant.id);
    console.log('[catering-packages] Sections:', formattedSections.length);
    formattedSections.forEach(s => {
      console.log(`  - ${s.name}: ${s.packages.length} packages`);
    });
    console.log('[catering-packages] Gallery images:', gallery.length);
    console.log('========================================');

    const response = NextResponse.json({
      sections: formattedSections,
      gallery: gallery,
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (err) {
    console.error('[catering-packages] GET error:', err);
    const errorResponse = NextResponse.json({ error: 'Failed to fetch catering packages' }, { status: 500 });
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return errorResponse;
  }
}
