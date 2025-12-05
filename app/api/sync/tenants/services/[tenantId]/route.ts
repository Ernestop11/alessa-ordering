import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function validateApiKey(req: Request): boolean {
  const apiKey = req.headers.get('X-API-Key');
  return apiKey === process.env.ALESSACLOUD_API_KEY;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> | { tenantId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    if (!validateApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: resolvedParams.tenantId },
      include: {
        settings: true,
        integrations: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Determine which services are enabled
    const services = {
      ordering: tenant.status === 'LIVE',
      digitalMenu: true, // Always available if tenant exists
      catering: !!tenant.settings?.cateringTabConfig,
      smp: true, // SMP integration available
    };

    return NextResponse.json({
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      services,
    });
  } catch (error: any) {
    console.error('[Sync API] Error fetching services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

