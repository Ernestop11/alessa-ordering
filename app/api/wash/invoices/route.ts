import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// GET /api/wash/invoices - List all invoices
export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const status = req.nextUrl.searchParams.get('status');
    const fleetId = req.nextUrl.searchParams.get('fleetId');

    const invoices = await prisma.washInvoice.findMany({
      where: {
        tenantId: tenant.id,
        ...(status ? { status } : {}),
        ...(fleetId ? { fleetId } : {}),
      },
      include: {
        fleet: { select: { id: true, name: true } },
        _count: { select: { washes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        fleet: { id: inv.fleet.id, name: inv.fleet.name },
        washCount: inv.washCount,
        pricePerWash: Number(inv.pricePerWash),
        subtotal: Number(inv.subtotal),
        tax: Number(inv.tax),
        total: Number(inv.total),
        status: inv.status,
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
        createdAt: inv.createdAt,
      }))
    );
  } catch (error) {
    console.error('[wash/invoices] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST /api/wash/invoices - Generate invoice for a fleet
export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const { fleetId, periodStart, periodEnd, taxRate = 0, notes } = body;

    if (!fleetId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'fleetId, periodStart, and periodEnd are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(periodStart);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(periodEnd);
    endDate.setHours(23, 59, 59, 999);

    // Get fleet
    const fleet = await prisma.fleet.findFirst({
      where: { id: fleetId, tenantId: tenant.id },
    });

    if (!fleet) {
      return NextResponse.json({ error: 'Fleet not found' }, { status: 404 });
    }

    // Get uninvoiced washes for this fleet in the date range
    const washes = await prisma.washRecord.findMany({
      where: {
        tenantId: tenant.id,
        invoiceId: null,
        washedAt: { gte: startDate, lte: endDate },
        truck: { fleetId },
      },
      include: {
        truck: { select: { truckNumber: true } },
        employee: { select: { name: true } },
      },
    });

    if (washes.length === 0) {
      return NextResponse.json(
        { error: 'No uninvoiced washes found for this period' },
        { status: 400 }
      );
    }

    // Calculate totals
    const washCount = washes.length;
    const subtotal = washes.reduce((sum, w) => sum + Number(w.price), 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    // Generate invoice number: RPW-YYYYMMDD-XXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const existingCount = await prisma.washInvoice.count({
      where: {
        tenantId: tenant.id,
        invoiceNumber: { startsWith: `RPW-${dateStr}` },
      },
    });
    const invoiceNumber = `RPW-${dateStr}-${String(existingCount + 1).padStart(3, '0')}`;

    // Create invoice and link washes
    const invoice = await prisma.washInvoice.create({
      data: {
        tenantId: tenant.id,
        fleetId,
        invoiceNumber,
        washCount,
        pricePerWash: fleet.pricePerWash,
        subtotal,
        tax,
        total,
        periodStart: startDate,
        periodEnd: endDate,
        status: 'draft',
        notes: notes || null,
      },
      include: {
        fleet: { select: { id: true, name: true, email: true } },
      },
    });

    // Link washes to invoice
    await prisma.washRecord.updateMany({
      where: { id: { in: washes.map((w) => w.id) } },
      data: { invoiceId: invoice.id },
    });

    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      fleet: {
        id: invoice.fleet.id,
        name: invoice.fleet.name,
        email: invoice.fleet.email,
      },
      washCount: invoice.washCount,
      pricePerWash: Number(invoice.pricePerWash),
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      total: Number(invoice.total),
      status: invoice.status,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      washes: washes.map((w) => ({
        id: w.id,
        truckNumber: w.truck.truckNumber,
        employeeName: w.employee.name,
        price: Number(w.price),
        washedAt: w.washedAt,
      })),
    });
  } catch (error) {
    console.error('[wash/invoices] POST Error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
