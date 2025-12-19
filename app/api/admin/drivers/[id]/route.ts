import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get a specific driver
export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const { id } = await context.params;

    const driver = await prisma.driver.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            order: {
              select: {
                id: true,
                customerName: true,
                totalAmount: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: { deliveries: true },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json({ driver });
  } catch (error: unknown) {
    console.error('[Drivers] Error fetching driver:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch driver';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Update a driver
export async function PUT(req: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const { id } = await context.params;
    const body = await req.json();

    // Verify driver belongs to tenant
    const existingDriver = await prisma.driver.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingDriver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const { name, phone, email, vehicleType, licensePlate, isActive, pin } = body;

    const driver = await prisma.driver.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(vehicleType !== undefined && { vehicleType }),
        ...(licensePlate !== undefined && { licensePlate }),
        ...(isActive !== undefined && { isActive }),
        ...(pin !== undefined && { pin }),
      },
    });

    return NextResponse.json({ success: true, driver });
  } catch (error: unknown) {
    console.error('[Drivers] Error updating driver:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update driver';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Remove a driver
export async function DELETE(req: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const { id } = await context.params;

    // Verify driver belongs to tenant
    const existingDriver = await prisma.driver.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingDriver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    await prisma.driver.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[Drivers] Error deleting driver:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete driver';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
