import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

// GET /api/wash/trucks - List all trucks (optionally filtered by fleet)
export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const fleetId = req.nextUrl.searchParams.get('fleetId');

    const trucks = await prisma.truck.findMany({
      where: {
        tenantId: tenant.id,
        ...(fleetId ? { fleetId } : {}),
      },
      include: {
        fleet: { select: { id: true, name: true, pricePerWash: true } },
        _count: { select: { washes: true } },
      },
      orderBy: [{ fleet: { name: 'asc' } }, { truckNumber: 'asc' }],
    });

    return NextResponse.json(
      trucks.map((t) => ({
        id: t.id,
        truckNumber: t.truckNumber,
        description: t.description,
        licensePlate: t.licensePlate,
        qrCode: t.qrCode,
        fleet: {
          id: t.fleet.id,
          name: t.fleet.name,
          pricePerWash: Number(t.fleet.pricePerWash),
        },
        washCount: t._count.washes,
        createdAt: t.createdAt,
      }))
    );
  } catch (error) {
    console.error('[wash/trucks] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch trucks' }, { status: 500 });
  }
}

// POST /api/wash/trucks - Create a new truck
export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const { fleetId, truckNumber, description, licensePlate } = body;

    if (!fleetId || !truckNumber) {
      return NextResponse.json(
        { error: 'fleetId and truckNumber are required' },
        { status: 400 }
      );
    }

    // Verify fleet belongs to tenant
    const fleet = await prisma.fleet.findFirst({
      where: { id: fleetId, tenantId: tenant.id },
    });

    if (!fleet) {
      return NextResponse.json({ error: 'Fleet not found' }, { status: 404 });
    }

    // Generate unique QR code
    const qrCode = randomUUID();

    const truck = await prisma.truck.create({
      data: {
        tenantId: tenant.id,
        fleetId,
        qrCode,
        truckNumber,
        description: description || null,
        licensePlate: licensePlate || null,
      },
      include: {
        fleet: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      id: truck.id,
      truckNumber: truck.truckNumber,
      description: truck.description,
      licensePlate: truck.licensePlate,
      qrCode: truck.qrCode,
      fleet: { id: truck.fleet.id, name: truck.fleet.name },
      createdAt: truck.createdAt,
    });
  } catch (error) {
    console.error('[wash/trucks] POST Error:', error);
    return NextResponse.json({ error: 'Failed to create truck' }, { status: 500 });
  }
}
