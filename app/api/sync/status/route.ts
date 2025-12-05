import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function validateApiKey(req: Request): boolean {
  const apiKey = req.headers.get('X-API-Key');
  return apiKey === process.env.ALESSACLOUD_API_KEY;
}

// Get sync status for a tenant
export async function GET(req: Request) {
  try {
    if (!validateApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const productType = searchParams.get('productType');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const where: any = { tenantId };
    if (productType) {
      where.productType = productType;
    }

    const syncs = await prisma.tenantSync.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(syncs);
  } catch (error: any) {
    console.error('[Sync API] Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update sync status
export async function POST(req: Request) {
  try {
    if (!validateApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tenantId, productType, syncStatus, syncError, syncConfig } = body;

    if (!tenantId || !productType) {
      return NextResponse.json(
        { error: 'tenantId and productType required' },
        { status: 400 }
      );
    }

    const sync = await prisma.tenantSync.upsert({
      where: {
        tenantId_productType: {
          tenantId,
          productType,
        },
      },
      create: {
        tenantId,
        productType,
        syncStatus: syncStatus || 'pending',
        syncError: syncError || null,
        syncConfig: syncConfig || null,
        lastSyncAt: syncStatus === 'success' ? new Date() : null,
      },
      update: {
        syncStatus: syncStatus || undefined,
        syncError: syncError || null,
        syncConfig: syncConfig || undefined,
        lastSyncAt: syncStatus === 'success' ? new Date() : undefined,
      },
    });

    return NextResponse.json(sync);
  } catch (error: any) {
    console.error('[Sync API] Error updating sync status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

