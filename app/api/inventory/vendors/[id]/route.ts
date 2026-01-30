import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * PUT - Apply a vendor credit (mark as applied and optionally create RETURN movement)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    const credit = await prisma.vendorCredit.findFirst({
      where: { id: params.id, tenantId: tenant.id },
    });

    if (!credit) {
      return NextResponse.json({ error: 'Credit not found' }, { status: 404 });
    }

    if (credit.status === 'applied') {
      return NextResponse.json({ error: 'Credit already applied' }, { status: 400 });
    }

    // If credit is tied to an item and has a quantity, create a RETURN movement
    if (credit.itemId && credit.quantity) {
      await prisma.$transaction([
        prisma.inventoryMovement.create({
          data: {
            tenantId: tenant.id,
            itemId: credit.itemId,
            type: 'RETURN',
            quantity: -Math.abs(credit.quantity),
            notes: `Vendor return to ${credit.vendorName}: ${credit.reason || 'N/A'}`,
            createdBy: session.user?.name || session.user?.email || 'admin',
          },
        }),
        prisma.inventoryItem.update({
          where: { id: credit.itemId },
          data: { currentStock: { decrement: Math.abs(credit.quantity) } },
        }),
        prisma.vendorCredit.update({
          where: { id: params.id },
          data: { status: 'applied', appliedAt: new Date() },
        }),
      ]);
    } else {
      await prisma.vendorCredit.update({
        where: { id: params.id },
        data: { status: 'applied', appliedAt: new Date() },
      });
    }

    const updated = await prisma.vendorCredit.findUnique({
      where: { id: params.id },
      include: { item: { select: { id: true, name: true, unit: true } } },
    });

    return NextResponse.json({ credit: updated });
  } catch (error: any) {
    console.error('[Vendor Credit PUT]', error);
    return NextResponse.json({ error: error.message || 'Failed to apply credit' }, { status: 500 });
  }
}
