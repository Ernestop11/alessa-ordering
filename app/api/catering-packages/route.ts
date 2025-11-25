import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

// CateringOption from admin CateringManager
interface CateringOption {
  id: string;
  name: string;
  description: string;
  price: number;
  servingInfo: string;
  category: 'regular' | 'holiday';
  removals: string[];
  addons: {
    id: string;
    label: string;
    price: number;
  }[];
  badge?: string;
  featured?: boolean;
}

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

    // Fetch catering options from TenantSettings (same location as admin editor)
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
    });

    const cateringOptions = (settings?.upsellBundles as any)?.catering || [];

    // Map CateringOption (admin format) to CateringPackage (frontend format)
    const packages: CateringPackage[] = cateringOptions.map((option: CateringOption, index: number) => ({
      id: option.id,
      name: option.name,
      description: option.description,
      pricePerGuest: option.price, // Use price as pricePerGuest
      price: option.price, // Also include as price
      category: option.category === 'regular' ? 'popular' : option.category, // Map regular -> popular
      image: null, // Can be added later if needed
      gallery: null, // Can be added later if needed
      badge: option.badge || null,
      customizationRemovals: option.removals || [],
      customizationAddons: option.addons || [],
      available: true, // All packages from editor are available
      displayOrder: option.featured ? index : index + 1000, // Featured items first
    }));

    // Sort: featured first, then by displayOrder
    packages.sort((a, b) => {
      const aFeatured = cateringOptions.find((o: CateringOption) => o.id === a.id)?.featured || false;
      const bFeatured = cateringOptions.find((o: CateringOption) => o.id === b.id)?.featured || false;
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return a.displayOrder - b.displayOrder;
    });

    return NextResponse.json(packages);
  } catch (err) {
    console.error('[catering-packages] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch catering packages' }, { status: 500 });
  }
}
