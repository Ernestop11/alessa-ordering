import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Optional API key validation
function validateApiKey(req: Request): boolean {
  const apiKey = req.headers.get('X-API-Key');
  const validKey = process.env.ALESSACLOUD_API_KEY;
  if (!validKey) {
    return true; // If no key configured, allow access
  }
  return apiKey === validKey;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    
    // Optional validation
    if (process.env.ALESSACLOUD_API_KEY && !validateApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: resolvedParams.id },
      include: {
        menuItems: {
          select: { id: true },
        },
        tenantSyncs: {
          where: { productType: 'SMP' },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if products have been synced
    const syncRecord = tenant.tenantSyncs[0];
    const hasProducts = tenant.menuItems.length > 0;
    const lastSyncAt = syncRecord?.lastSyncAt;
    const syncStatus = syncRecord?.syncStatus;

    // Determine if auto-seed is needed
    // Auto-seed is needed if:
    // 1. Products exist
    // 2. Sync was successful
    // 3. No auto-seed flag set (or flag indicates it's needed)
    const needsAutoSeed = hasProducts && syncStatus === 'success';

    return NextResponse.json({
      needsAutoSeed,
      hasProducts,
      productCount: tenant.menuItems.length,
      lastSyncAt: lastSyncAt ? lastSyncAt.toISOString() : null,
      syncStatus: syncStatus || 'pending',
      message: needsAutoSeed
        ? 'Products are synced and ready for auto-seeding'
        : hasProducts
        ? 'Products exist but sync status is not confirmed'
        : 'No products found - sync products first',
    });
  } catch (error: any) {
    console.error('[Sync API] Error checking auto-seed status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}









