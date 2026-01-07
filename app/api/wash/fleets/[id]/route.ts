import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// GET /api/wash/fleets/[id] - Get fleet details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;

    const fleet = await prisma.fleet.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        trucks: {
          orderBy: { truckNumber: 'asc' },
          include: {
            _count: { select: { washes: true } },
          },
        },
        _count: { select: { invoices: true } },
      },
    });

    if (!fleet) {
      return NextResponse.json({ error: 'Fleet not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: fleet.id,
      name: fleet.name,
      contactName: fleet.contactName,
      email: fleet.email,
      phone: fleet.phone,
      address: fleet.address,
      pricePerWash: Number(fleet.pricePerWash),
      notes: fleet.notes,
      invoiceCount: fleet._count.invoices,
      trucks: fleet.trucks.map((t) => ({
        id: t.id,
        truckNumber: t.truckNumber,
        description: t.description,
        licensePlate: t.licensePlate,
        qrCode: t.qrCode,
        washCount: t._count.washes,
      })),
      createdAt: fleet.createdAt,
    });
  } catch (error) {
    console.error('[wash/fleets/[id]] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch fleet' }, { status: 500 });
  }
}

// PUT /api/wash/fleets/[id] - Update fleet
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;
    const body = await req.json();

    const { name, contactName, email, phone, address, pricePerWash, notes } = body;

    // Verify fleet belongs to tenant
    const existing = await prisma.fleet.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Fleet not found' }, { status: 404 });
    }

    const fleet = await prisma.fleet.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        contactName: contactName ?? existing.contactName,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        address: address ?? existing.address,
        pricePerWash: pricePerWash ?? existing.pricePerWash,
        notes: notes ?? existing.notes,
      },
    });

    return NextResponse.json({
      id: fleet.id,
      name: fleet.name,
      contactName: fleet.contactName,
      email: fleet.email,
      phone: fleet.phone,
      address: fleet.address,
      pricePerWash: Number(fleet.pricePerWash),
      notes: fleet.notes,
    });
  } catch (error) {
    console.error('[wash/fleets/[id]] PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update fleet' }, { status: 500 });
  }
}

// DELETE /api/wash/fleets/[id] - Delete fleet
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;

    // Verify fleet belongs to tenant
    const existing = await prisma.fleet.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Fleet not found' }, { status: 404 });
    }

    await prisma.fleet.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[wash/fleets/[id]] DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete fleet' }, { status: 500 });
  }
}
