import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

function unauthorized() {
  return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function json(data: unknown, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

export interface UpsellBundle {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  tag?: string;
  cta?: string;
  surfaces?: ('cart' | 'checkout')[];
  menuItemId?: string; // Link to actual menu item
}

// GET - List all upsell bundles
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== 'admin' && role !== 'super_admin')) {
    return unauthorized();
  }

  const tenant = await requireTenant();

  // Get upsell bundles from tenant settings
  const upsellBundles = (tenant.settings?.upsellBundles as UpsellBundle[]) || [];

  // Also get menu items for linking
  const menuItems = await prisma.menuItem.findMany({
    where: { tenantId: tenant.id, available: true },
    select: { id: true, name: true, price: true, image: true, description: true },
    orderBy: { name: 'asc' },
  });

  return json({ upsellBundles, menuItems });
}

// POST - Add a new upsell bundle
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== 'admin' && role !== 'super_admin')) {
    return unauthorized();
  }

  const tenant = await requireTenant();
  const body = await req.json();

  const { name, description, price, image, tag, cta, surfaces, menuItemId } = body;

  if (!name || price === undefined) {
    return json({ error: 'Name and price are required' }, { status: 400 });
  }

  const currentBundles = (tenant.settings?.upsellBundles as UpsellBundle[]) || [];

  const newBundle: UpsellBundle = {
    id: `upsell-${Date.now()}`,
    name,
    description: description || '',
    price: Number(price),
    image: image || null,
    tag: tag || null,
    cta: cta || '+ Add',
    surfaces: surfaces || ['cart', 'checkout'],
    menuItemId: menuItemId || null,
  };

  const updatedBundles = [...currentBundles, newBundle];

  await prisma.tenantSettings.update({
    where: { tenantId: tenant.id },
    data: { upsellBundles: updatedBundles },
  });

  return json({ success: true, bundle: newBundle });
}

// PUT - Update all upsell bundles (for reordering or bulk update)
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== 'admin' && role !== 'super_admin')) {
    return unauthorized();
  }

  const tenant = await requireTenant();
  const body = await req.json();

  const { upsellBundles } = body;

  if (!Array.isArray(upsellBundles)) {
    return json({ error: 'upsellBundles must be an array' }, { status: 400 });
  }

  await prisma.tenantSettings.update({
    where: { tenantId: tenant.id },
    data: { upsellBundles },
  });

  return json({ success: true, upsellBundles });
}

// DELETE - Remove a specific upsell bundle by ID
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== 'admin' && role !== 'super_admin')) {
    return unauthorized();
  }

  const tenant = await requireTenant();
  const { searchParams } = new URL(req.url);
  const bundleId = searchParams.get('id');

  if (!bundleId) {
    return json({ error: 'Bundle ID is required' }, { status: 400 });
  }

  const currentBundles = (tenant.settings?.upsellBundles as UpsellBundle[]) || [];
  const updatedBundles = currentBundles.filter((b) => b.id !== bundleId);

  await prisma.tenantSettings.update({
    where: { tenantId: tenant.id },
    data: { upsellBundles: updatedBundles },
  });

  return json({ success: true });
}
