import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// GET /api/wash/invoices/[id] - Get invoice details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;

    const invoice = await prisma.washInvoice.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        fleet: true,
        washes: {
          include: {
            truck: { select: { truckNumber: true, description: true } },
            employee: { select: { name: true } },
          },
          orderBy: { washedAt: 'asc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      fleet: {
        id: invoice.fleet.id,
        name: invoice.fleet.name,
        contactName: invoice.fleet.contactName,
        email: invoice.fleet.email,
        phone: invoice.fleet.phone,
        address: invoice.fleet.address,
      },
      washCount: invoice.washCount,
      pricePerWash: Number(invoice.pricePerWash),
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      total: Number(invoice.total),
      status: invoice.status,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      notes: invoice.notes,
      washes: invoice.washes.map((w) => ({
        id: w.id,
        truckNumber: w.truck.truckNumber,
        truckDescription: w.truck.description,
        employeeName: w.employee.name,
        price: Number(w.price),
        washedAt: w.washedAt,
        notes: w.notes,
      })),
      createdAt: invoice.createdAt,
    });
  } catch (error) {
    console.error('[wash/invoices/[id]] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

// PUT /api/wash/invoices/[id] - Update invoice status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;
    const body = await req.json();

    const { status, dueDate, notes } = body;

    const existing = await prisma.washInvoice.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'paid' && !existing.paidAt) {
        updateData.paidAt = new Date();
      }
    }
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const invoice = await prisma.washInvoice.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      notes: invoice.notes,
    });
  } catch (error) {
    console.error('[wash/invoices/[id]] PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

// DELETE /api/wash/invoices/[id] - Delete invoice (only if draft)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;

    const existing = await prisma.washInvoice.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete draft invoices' },
        { status: 400 }
      );
    }

    // Unlink washes from invoice
    await prisma.washRecord.updateMany({
      where: { invoiceId: id },
      data: { invoiceId: null },
    });

    // Delete invoice
    await prisma.washInvoice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[wash/invoices/[id]] DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
