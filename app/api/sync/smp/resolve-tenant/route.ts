import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * SMP Tenant Resolution Endpoint
 * Resolves SMP tenant IDs/aliases to Alessa Cloud tenant UUIDs
 *
 * GET /api/sync/smp/resolve-tenant?smpTenantId=lasreinas-tenant-001
 * Headers: X-API-Key: {ALESSACLOUD_API_KEY}
 *
 * This allows SMP to use its own tenant ID format while Alessa uses UUIDs
 */

// Mapping of SMP tenant IDs to Alessa tenant slugs/IDs
// Both local dev and VPS IDs resolve to the same slug
const TENANT_ALIAS_MAP: Record<string, string> = {
  'lasreinas-tenant-001': 'lasreinas',
  'lasreinas': 'lasreinas',
  // Local dev UUID
  '79bd3027-5520-480b-8979-2e37b21e58d0': 'lasreinas',
  // VPS UUID
  'f941ea79-5af8-4c33-bb17-9a98a992a232': 'lasreinas',
  // Add more mappings as needed
};

export async function GET(req: NextRequest) {
  try {
    // Validate API key
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== process.env.ALESSACLOUD_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const smpTenantId = searchParams.get('smpTenantId');

    if (!smpTenantId) {
      return NextResponse.json({ error: 'smpTenantId is required' }, { status: 400 });
    }

    // Check if it's already a UUID (Alessa format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(smpTenantId);

    if (isUUID) {
      // Direct UUID lookup
      const tenant = await prisma.tenant.findUnique({
        where: { id: smpTenantId },
        select: {
          id: true,
          slug: true,
          name: true,
          primaryColor: true,
          secondaryColor: true,
          logoUrl: true,
        },
      });

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }

      // Verify SMP subscription
      const subscription = await prisma.tenantProduct.findFirst({
        where: {
          tenantId: tenant.id,
          product: { slug: 'switchmenu-pro' },
          status: { in: ['active', 'prepaid'] },
        },
      });

      return NextResponse.json({
        success: true,
        resolved: true,
        smpTenantId,
        alessaTenantId: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        branding: {
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          logoUrl: tenant.logoUrl,
        },
        smpSubscriptionActive: !!subscription,
        endpoints: {
          products: `/api/sync/ordering/${tenant.id}/products`,
          categories: `/api/sync/ordering/${tenant.id}/categories`,
          ordersReady: `/api/sync/smp/orders-ready?tenantId=${tenant.id}`,
          promos: `/api/sync/smp/promos?tenantId=${tenant.id}`,
        },
      });
    }

    // Look up alias
    const slugOrAlias = TENANT_ALIAS_MAP[smpTenantId] || smpTenantId;

    // Find tenant by slug
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: slugOrAlias },
          { slug: smpTenantId },
        ],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({
        error: 'Tenant not found',
        hint: 'Check the smpTenantId or add a mapping in TENANT_ALIAS_MAP',
        availableAliases: Object.keys(TENANT_ALIAS_MAP),
      }, { status: 404 });
    }

    // Verify SMP subscription
    const subscription = await prisma.tenantProduct.findFirst({
      where: {
        tenantId: tenant.id,
        product: { slug: 'switchmenu-pro' },
        status: { in: ['active', 'prepaid'] },
      },
    });

    return NextResponse.json({
      success: true,
      resolved: true,
      smpTenantId,
      alessaTenantId: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      branding: {
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        logoUrl: tenant.logoUrl,
      },
      smpSubscriptionActive: !!subscription,
      endpoints: {
        products: `/api/sync/ordering/${tenant.id}/products`,
        categories: `/api/sync/ordering/${tenant.id}/categories`,
        ordersReady: `/api/sync/smp/orders-ready?tenantId=${tenant.id}`,
        promos: `/api/sync/smp/promos?tenantId=${tenant.id}`,
      },
    });
  } catch (error) {
    console.error('[SMP Resolve Tenant] Error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve tenant', details: String(error) },
      { status: 500 }
    );
  }
}
