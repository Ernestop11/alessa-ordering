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

  const bundles = await prisma.groceryBundle.findMany({
    where: { tenantId: tenant.id },
    orderBy: { displayOrder: 'asc' },
  });

  const response = NextResponse.json(bundles);
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
    category: body.category || 'combo',
    image: body.image || null,
    gallery: body.gallery || null,
    available: body.available === undefined ? true : Boolean(body.available),
    badge: body.badge || null,
    items: body.items || [],
    displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : 0,
  };

  const created = await prisma.groceryBundle.create({ data });
  // SECURITY: Only revalidate THIS tenant's paths to prevent cross-tenant cache pollution
  revalidatePath(`/${tenant.slug}`, 'layout');
  revalidatePath(`/${tenant.slug}/grocery`, 'page');
  revalidatePath(`/${tenant.slug}/order`, 'page');
  return NextResponse.json(created, { status: 201 });
}
