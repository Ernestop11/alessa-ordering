import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

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

export async function GET() {
  try {
    const tenant = await requireTenant();

    // Fetch catering packages from database (same source as admin editor)
    // NOTE: We fetch ALL packages and filter by available in the response
    // This ensures we can see what's in the database for debugging
    const packages = await prisma.cateringPackage.findMany({
      where: {
        tenantId: tenant.id,
        // Removed available filter - we'll filter in the response to see all packages
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' }, // Secondary sort for consistent ordering
      ],
    });

    // Map database records to frontend format
    // Filter to only include available packages for frontend display
    const formattedPackages: CateringPackage[] = packages
      .filter((pkg) => pkg.available === true) // Filter available packages
      .map((pkg) => {
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
            // If parsing fails, treat as single URL
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

      // Ensure category is set - default to 'popular' if null/empty
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
    });

    // Sort by displayOrder (already sorted by query, but ensure consistency)
    formattedPackages.sort((a, b) => a.displayOrder - b.displayOrder);

    // Debug logging - CRITICAL for troubleshooting
    console.log('========================================');
    console.log('[catering-packages] 🏢 Tenant:', tenant.slug, tenant.id);
    console.log('[catering-packages] 📦 Raw packages from DB:', packages.length);
    if (packages.length > 0) {
      console.log('[catering-packages] 📋 ALL packages from DB (before filtering):');
      packages.forEach(p => {
        console.log(`  - ${p.name}: category="${p.category}", available=${p.available}, id=${p.id}`);
      });
    } else {
      console.log('[catering-packages] ⚠️ WARNING: No packages found in database for tenant:', tenant.slug);
    }
    console.log('[catering-packages] ✅ Formatted packages (after available filter):', formattedPackages.length);
    if (formattedPackages.length > 0) {
      console.log('[catering-packages] 📋 Formatted packages being returned:');
      formattedPackages.forEach(p => {
        console.log(`  - ${p.name}: category="${p.category}", available=${p.available}`);
      });
    } else if (packages.length > 0) {
      console.log('[catering-packages] ⚠️ WARNING: Packages found but ALL filtered out! Check available=true');
      console.log('[catering-packages] Packages that were filtered:', packages.map(p => ({
        name: p.name,
        available: p.available
      })));
    }
    console.log('========================================');

    const response = NextResponse.json(formattedPackages);
    // Prevent caching to ensure fresh data
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
