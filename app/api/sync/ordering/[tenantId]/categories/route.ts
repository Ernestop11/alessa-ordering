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

    const categories = await prisma.menuSection.findMany({
      where: { tenantId: resolvedParams.tenantId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        position: true,
        hero: true,
        _count: {
          select: {
            menuItems: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    const formatted = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      type: cat.type,
      position: cat.position,
      hero: cat.hero,
      itemCount: cat._count.menuItems,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('[Sync API] Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

