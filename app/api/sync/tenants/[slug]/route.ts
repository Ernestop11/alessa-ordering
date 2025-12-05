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

