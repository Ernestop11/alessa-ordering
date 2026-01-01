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

// Tenant resolution is now fully database-driven
// No hardcoded UUIDs or tenant slugs - prevents contamination and security leaks
// Tenants are resolved by:
// 1. UUID lookup (if smpTenantId is a valid UUID)
// 2. Slug lookup (if smpTenantId matches a tenant slug)
// 3. TenantSync lookup (if tenant has a sync record with that smpTenantId)

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

    // Find tenant by slug (direct database lookup - no hardcoded mappings)
    const tenant = await prisma.tenant.findFirst({
      where: {
        slug: smpTenantId,
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
      // Try to find via TenantSync record (for SMP-specific IDs)
      const tenantSync = await prisma.tenantSync.findFirst({
        where: {
          productType: 'SMP',
          syncConfig: {
            path: ['smpTenantId'],
            equals: smpTenantId,
          },
        },
        include: {
          tenant: {
            select: {
              id: true,
              slug: true,
              name: true,
              primaryColor: true,
              secondaryColor: true,
              logoUrl: true,
            },
          },
        },
      });

      if (!tenantSync?.tenant) {
        return NextResponse.json({
          error: 'Tenant not found',
          hint: 'Use a valid tenant slug or UUID. Tenant must exist in database.',
        }, { status: 404 });
      }

      // Use tenant from TenantSync
      const syncedTenant = tenantSync.tenant;

      // Verify SMP subscription
      const subscription = await prisma.tenantProduct.findFirst({
        where: {
          tenantId: syncedTenant.id,
          product: { slug: 'switchmenu-pro' },
          status: { in: ['active', 'prepaid'] },
        },
      });

      return NextResponse.json({
        success: true,
        resolved: true,
        smpTenantId,
        alessaTenantId: syncedTenant.id,
        slug: syncedTenant.slug,
        name: syncedTenant.name,
        branding: {
          primaryColor: syncedTenant.primaryColor,
          secondaryColor: syncedTenant.secondaryColor,
          logoUrl: syncedTenant.logoUrl,
        },
        smpSubscriptionActive: !!subscription,
        endpoints: {
          products: `/api/sync/ordering/${syncedTenant.id}/products`,
          categories: `/api/sync/ordering/${syncedTenant.id}/categories`,
          ordersReady: `/api/sync/smp/orders-ready?tenantId=${syncedTenant.id}`,
          promos: `/api/sync/smp/promos?tenantId=${syncedTenant.id}`,
        },
      });
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
