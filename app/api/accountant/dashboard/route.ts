import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accountant/dashboard?accountantId={id}
 * 
 * Get multi-tenant tax data for accountant
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountantId = searchParams.get('accountantId');

    if (!accountantId) {
      return NextResponse.json(
        { error: 'accountantId is required' },
        { status: 400 }
      );
    }

    // Get accountant with tenant access
    const accountant = await prisma.accountant.findUnique({
      where: { id: accountantId },
      include: {
        tenantAccess: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!accountant) {
      return NextResponse.json(
        { error: 'Accountant not found' },
        { status: 404 }
      );
    }

    // Get tax data for all accessible tenants
    const tenantIds = accountant.tenantAccess.map((access) => access.tenantId);

    const remittances = await prisma.taxRemittance.findMany({
      where: {
        tenantId: { in: tenantIds },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { periodStart: 'desc' },
      take: 100,
    });

    const checks = await prisma.taxCheck.findMany({
      where: {
        tenantId: { in: tenantIds },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const summary = {
      totalTenants: tenantIds.length,
      totalRemittances: remittances.length,
      totalChecks: checks.length,
      totalTaxCollected: remittances.reduce((sum, r) => sum + r.totalTaxCollected, 0),
      totalTaxRemitted: remittances.reduce((sum, r) => sum + r.totalTaxRemitted, 0),
    };

    return NextResponse.json({
      accountant: {
        id: accountant.id,
        name: accountant.name,
        firmName: accountant.firmName,
        email: accountant.email,
      },
      summary,
      tenants: accountant.tenantAccess.map((access) => ({
        tenantId: access.tenant.id,
        tenantName: access.tenant.name,
        tenantSlug: access.tenant.slug,
        accessLevel: access.accessLevel,
      })),
      remittances,
      checks,
    });
  } catch (error: any) {
    console.error('[accountant-dashboard] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

