import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';

function unauthorized() {
  return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return unauthorized();
  }

  const tenant = await requireTenant();
  const { searchParams } = new URL(req.url);
  const categoryFilter = searchParams.get('category');
  
  let where: any = { tenantId: tenant.id };
  if (categoryFilter) {
    const categories = categoryFilter.split(',');
    where.category = { in: categories };
  }

  const packages = await prisma.cateringPackage.findMany({
    where,
    orderBy: { displayOrder: 'asc' },
  });

  const response = NextResponse.json({ packages });
  // Prevent caching to ensure fresh data
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return unauthorized();
  }

  const tenant = await requireTenant();
  const body = await req.json();

  const data = {
    tenantId: tenant.id,
    cateringSectionId: body.cateringSectionId || null,
    name: body.name || '',
    description: body.description || '',
    pricePerGuest: parseFloat(String(body.pricePerGuest || 0)),
    price: body.price !== undefined && body.price !== null ? parseFloat(String(body.price)) : null,
    category: body.category || 'popular',
    image: body.image || null,
    gallery: body.gallery || null,
    badge: body.badge || null,
    customizationRemovals: body.customizationRemovals || [],
    customizationAddons: body.customizationAddons || null,
    available: body.available === undefined ? true : Boolean(body.available),
    displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : 0,
    // Time-specific fields
    timeSpecificEnabled: body.timeSpecificEnabled === undefined ? false : Boolean(body.timeSpecificEnabled),
    timeSpecificDays: Array.isArray(body.timeSpecificDays) ? body.timeSpecificDays : [],
    timeSpecificStartTime: body.timeSpecificStartTime || null,
    timeSpecificEndTime: body.timeSpecificEndTime || null,
    timeSpecificPrice: body.timeSpecificPrice !== undefined ? (body.timeSpecificPrice ? parseFloat(String(body.timeSpecificPrice)) : null) : null,
    timeSpecificLabel: body.timeSpecificLabel || null,
  };

  const created = await prisma.cateringPackage.create({ data });
  revalidatePath('/order'); // Invalidate cache so frontend shows updated packages
  return NextResponse.json(created, { status: 201 });
}
