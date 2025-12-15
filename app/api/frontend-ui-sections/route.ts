import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

// Force dynamic - prevent build-time caching for multi-tenant data
export const dynamic = 'force-dynamic';

/**
 * GET - Fetch all frontend UI sections for a tenant (PUBLIC - no auth required)
 * Used by the frontend order page to display sections in the correct order
 */
export async function GET(req: Request) {
  try {
    const tenant = await requireTenant();

    // Get sections from TenantSettings table
    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { frontendConfig: true },
    });

    const frontendConfig = (tenantSettings?.frontendConfig || {}) as any;
    const sections = frontendConfig.frontendUISections || [];

    // Return with cache-busting headers
    return NextResponse.json(sections, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Frontend UI Sections GET Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch frontend UI sections' },
      { status: 500 }
    );
  }
}

