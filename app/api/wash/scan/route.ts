import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// GET /api/wash/scan?qr=xxx - Lookup truck by QR code
export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const qrCode = req.nextUrl.searchParams.get('qr');

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 });
    }

    const truck = await prisma.truck.findFirst({
      where: {
        qrCode,
        tenantId: tenant.id,
      },
      include: {
        fleet: {
          select: {
            id: true,
            name: true,
            pricePerWash: true,
            contactName: true,
            phone: true,
          },
        },
        washes: {
          orderBy: { washedAt: 'desc' },
          take: 5,
          include: {
            employee: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!truck) {
      return NextResponse.json({ error: 'Truck not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: truck.id,
      truckNumber: truck.truckNumber,
      description: truck.description,
      licensePlate: truck.licensePlate,
      fleet: {
        id: truck.fleet.id,
        name: truck.fleet.name,
        pricePerWash: Number(truck.fleet.pricePerWash),
        contactName: truck.fleet.contactName,
        phone: truck.fleet.phone,
      },
      recentWashes: truck.washes.map((wash) => ({
        id: wash.id,
        washedAt: wash.washedAt,
        price: Number(wash.price),
        employee: wash.employee.name,
      })),
    });
  } catch (error) {
    console.error('[wash/scan] Error:', error);
    return NextResponse.json({ error: 'Failed to lookup truck' }, { status: 500 });
  }
}
