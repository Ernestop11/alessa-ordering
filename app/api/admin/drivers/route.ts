import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * Driver Management API
 *
 * Manage restaurant's own delivery drivers for self-delivery
 */

// GET: List all drivers for tenant
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    const drivers = await prisma.driver.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { deliveries: true },
        },
      },
    });

    return NextResponse.json({ drivers });
  } catch (error: unknown) {
    console.error('[Drivers] Error fetching drivers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch drivers';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST: Create a new driver
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await req.json();

    const { name, phone, email, vehicleType, licensePlate, pin } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      );
    }

    // Generate a random 4-digit PIN if not provided
    const driverPin = pin || Math.floor(1000 + Math.random() * 9000).toString();

    const driver = await prisma.driver.create({
      data: {
        tenantId: tenant.id,
        name,
        phone,
        email,
        vehicleType,
        licensePlate,
        pin: driverPin,
      },
    });

    return NextResponse.json({
      success: true,
      driver: {
        ...driver,
        pin: driverPin, // Return PIN on creation so admin can share with driver
      },
    });
  } catch (error: unknown) {
    console.error('[Drivers] Error creating driver:', error);

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A driver with this phone number already exists' },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to create driver';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
