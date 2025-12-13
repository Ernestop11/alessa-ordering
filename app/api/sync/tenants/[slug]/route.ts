import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// API Key validation middleware
function validateApiKey(req: Request): boolean {
  const apiKey = req.headers.get('X-API-Key');
  const validKey = process.env.ALESSACLOUD_API_KEY;
  if (!validKey) {
    console.warn('[Sync API] ALESSACLOUD_API_KEY not configured');
    return false;
  }
  return apiKey === validKey;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    if (!validateApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: resolvedParams.slug },
      select: {
        id: true,
        slug: true,
        name: true,
        primaryColor: true,
        secondaryColor: true,
        status: true,
        contactEmail: true,
        contactPhone: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error: any) {
    console.error('[Sync API] Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    
    // Note: POST doesn't require API key - it's called internally or by trusted systems
    // But we can optionally validate if needed
    const apiKey = req.headers.get('X-API-Key');
    const validKey = process.env.ALESSACLOUD_API_KEY;
    if (validKey && apiKey !== validKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: resolvedParams.slug },
      include: {
        settings: true,
        integrations: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Determine which services are enabled
    const alessaServices = {
      ordering: tenant.status === 'LIVE' || tenant.status === 'APPROVED',
      digitalMenu: true, // Always available if tenant exists
      catering: !!tenant.settings?.cateringTabConfig,
      smp: true, // SMP integration available
    };

    // Update or create TenantSync record
    await prisma.tenantSync.upsert({
      where: {
        tenantId_productType: {
          tenantId: tenant.id,
          productType: 'SMP',
        },
      },
      create: {
        tenantId: tenant.id,
        productType: 'SMP',
        lastSyncAt: new Date(),
        syncStatus: 'success',
        syncConfig: {
          alessaCloudId: tenant.id,
          alessaSlug: tenant.slug,
          alessaServices,
        },
      },
      update: {
        lastSyncAt: new Date(),
        syncStatus: 'success',
        syncConfig: {
          alessaCloudId: tenant.id,
          alessaSlug: tenant.slug,
          alessaServices,
        },
      },
    });

    return NextResponse.json({
      id: tenant.id,
      name: tenant.name,
      alessaCloudId: tenant.id,
      alessaSlug: tenant.slug,
      alessaServices,
    });
  } catch (error: any) {
    console.error('[Sync API] Error syncing tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

