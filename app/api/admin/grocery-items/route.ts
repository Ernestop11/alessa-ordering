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
    where.category = categoryFilter;
  }

  const items = await prisma.groceryItem.findMany({
    where,
    orderBy: { displayOrder: 'asc' },
  });

  const response = NextResponse.json(items);
  // Prevent caching to ensure fresh data (matches catering packages pattern)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
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
    name: body.name || '',
    description: body.description || '',
    price: parseFloat(String(body.price || 0)),
    category: body.category || 'general',
    unit: body.unit || null,
    image: body.image || null,
    gallery: body.gallery || null,
    available: body.available === undefined ? true : Boolean(body.available),
    stockQuantity: body.stockQuantity !== undefined && body.stockQuantity !== null ? Number(body.stockQuantity) : null,
    tags: Array.isArray(body.tags) ? body.tags : [],
    displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : 0,
    taxPercentage: body.taxPercentage !== undefined && body.taxPercentage !== null ? parseFloat(String(body.taxPercentage)) : null,
    expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
  };

  const created = await prisma.groceryItem.create({ data });
  revalidatePath('/grocery'); // Invalidate cache so frontend shows updated items
  revalidatePath('/order'); // Also invalidate order page if grocery banner is shown
  return NextResponse.json(created, { status: 201 });
}
