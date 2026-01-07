import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// GET /api/wash/fleets - List all fleets
export async function GET() {
  try {
    const tenant = await requireTenant();

    const fleets = await prisma.fleet.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: { select: { trucks: true, invoices: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      fleets.map((f) => ({
        id: f.id,
        name: f.name,
        contactName: f.contactName,
        email: f.email,
        phone: f.phone,
        address: f.address,
        pricePerWash: Number(f.pricePerWash),
        notes: f.notes,
        truckCount: f._count.trucks,
        invoiceCount: f._count.invoices,
        createdAt: f.createdAt,
      }))
    );
  } catch (error) {
    console.error('[wash/fleets] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch fleets' }, { status: 500 });
  }
}

// POST /api/wash/fleets - Create a new fleet
export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const { name, contactName, email, phone, address, pricePerWash, notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Fleet name is required' }, { status: 400 });
    }

    const fleet = await prisma.fleet.create({
      data: {
        tenantId: tenant.id,
        name,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        pricePerWash: pricePerWash || 25.0,
        notes: notes || null,
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
      createdAt: fleet.createdAt,
    });
  } catch (error) {
    console.error('[wash/fleets] POST Error:', error);
    return NextResponse.json({ error: 'Failed to create fleet' }, { status: 500 });
  }
}
