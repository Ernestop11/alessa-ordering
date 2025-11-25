import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') return unauthorized();

    const tenant = await requireTenant();
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { cateringGallery: true },
    });

    return NextResponse.json({ gallery: settings?.cateringGallery || [] });
  } catch (error: any) {
    console.error('[catering-gallery] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') return unauthorized();

    const tenant = await requireTenant();
    const { gallery } = await req.json();

    if (!Array.isArray(gallery)) {
      return NextResponse.json({ error: 'Gallery must be an array' }, { status: 400 });
    }

    let settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          cateringGallery: gallery,
        },
      });
    } else {
      settings = await prisma.tenantSettings.update({
        where: { tenantId: tenant.id },
        data: {
          cateringGallery: gallery,
        },
      });
    }

    return NextResponse.json({ success: true, gallery: settings.cateringGallery });
  } catch (error: any) {
    console.error('[catering-gallery] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

