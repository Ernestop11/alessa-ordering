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
    });

    const cateringOptions = (settings?.upsellBundles as any)?.catering || [];

    return NextResponse.json({ options: cateringOptions });
  } catch (error: any) {
    console.error('[catering] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') return unauthorized();

    const tenant = await requireTenant();
    const { options } = await req.json();

    // Get current settings
    let settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
    });

    // Get current upsellBundles or initialize empty object
    const currentBundles = (settings?.upsellBundles as any) || {};

    // Update catering options within upsellBundles
    const updatedBundles = {
      ...currentBundles,
      catering: options,
    };

    if (!settings) {
      // Create settings if they don't exist
      settings = await prisma.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          upsellBundles: updatedBundles,
        },
      });
    } else {
      // Update existing settings
      settings = await prisma.tenantSettings.update({
        where: { tenantId: tenant.id },
        data: {
          upsellBundles: updatedBundles,
        },
      });
    }

    return NextResponse.json({ success: true, options });
  } catch (error: any) {
    console.error('[catering] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
