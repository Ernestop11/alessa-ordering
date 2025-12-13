import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    // Check for Switch Menu Pro sync configuration
    const syncConfig = await prisma.tenantSync.findFirst({
      where: {
        tenantId: tenant.id,
        productType: 'SMP',
        isActive: true,
      },
      orderBy: {
        lastSyncAt: 'desc',
      },
    });

    // Get product count
    const productCount = await prisma.menuItem.count({
      where: { tenantId: tenant.id },
    });

    // Check auto-seed status
    const autoSeedStatus = await fetch(
      `${process.env.ALESSACLOUD_API_URL || 'https://alessacloud.com'}/api/tenants/${tenant.id}/auto-seed-status`,
      {
        headers: {
          'X-API-Key': process.env.ALESSACLOUD_API_KEY || '',
        },
      }
    ).catch(() => null);

    let needsAutoSeed = false;
    if (autoSeedStatus?.ok) {
      const data = await autoSeedStatus.json();
      needsAutoSeed = data.needsAutoSeed || false;
    }

    return NextResponse.json({
      enabled: !!syncConfig,
      lastSyncAt: syncConfig?.lastSyncAt?.toISOString() || null,
      syncStatus: syncConfig?.syncStatus || null,
      productCount,
      hasProducts: productCount > 0,
      needsAutoSeed,
      message: syncConfig
        ? `Last sync: ${syncConfig.syncStatus || 'unknown'}`
        : 'Switch Menu Pro sync not configured',
    });
  } catch (error: any) {
    console.error('[SMP Sync Status] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get sync status' },
      { status: 500 }
    );
  }
}


