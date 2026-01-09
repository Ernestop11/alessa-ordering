import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/wash/employees - List all employees for a tenant
export async function GET(req: NextRequest) {
  try {
    const tenantSlug = req.nextUrl.searchParams.get('tenantSlug');

    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'Tenant slug is required' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const employees = await prisma.washEmployee.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        pin: true,
        role: true,
        hourlyRate: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            washes: true,
            shifts: true,
          },
        },
      },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('[wash/employees] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST /api/wash/employees - Create a new employee
export async function POST(req: NextRequest) {
  try {
    const { tenantSlug, name, phone, role, hourlyRate, requesterId } = await req.json();

    if (!tenantSlug || !name || !phone) {
      return NextResponse.json(
        { error: 'Tenant slug, name, and phone are required' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Verify requester is owner or staff
    if (requesterId) {
      const requester = await prisma.washEmployee.findUnique({
        where: { id: requesterId },
      });

      if (!requester || !['owner', 'staff'].includes(requester.role)) {
        return NextResponse.json(
          { error: 'Only owners and staff can add employees' },
          { status: 403 }
        );
      }
    }

    // Clean phone number and get last 4 digits for PIN
    const cleanPhone = phone.replace(/\D/g, '');
    const pin = cleanPhone.slice(-4);

    if (pin.length !== 4) {
      return NextResponse.json(
        { error: 'Phone number must have at least 4 digits' },
        { status: 400 }
      );
    }

    // Check if PIN already exists for this tenant
    const existingPin = await prisma.washEmployee.findFirst({
      where: {
        tenantId: tenant.id,
        pin: pin,
      },
    });

    if (existingPin) {
      return NextResponse.json(
        { error: 'An employee with the same last 4 digits already exists' },
        { status: 409 }
      );
    }

    const employee = await prisma.washEmployee.create({
      data: {
        tenantId: tenant.id,
        name,
        phone: cleanPhone,
        pin,
        role: role || 'employee',
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      },
    });

    return NextResponse.json({
      ok: true,
      employee: {
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        pin: employee.pin,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error('[wash/employees] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}

// DELETE /api/wash/employees - Delete an employee
export async function DELETE(req: NextRequest) {
  try {
    const { employeeId, requesterId } = await req.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Verify requester is owner
    if (requesterId) {
      const requester = await prisma.washEmployee.findUnique({
        where: { id: requesterId },
      });

      if (!requester || requester.role !== 'owner') {
        return NextResponse.json(
          { error: 'Only owners can delete employees' },
          { status: 403 }
        );
      }
    }

    // Don't allow deleting yourself
    if (employeeId === requesterId) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    await prisma.washEmployee.delete({
      where: { id: employeeId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[wash/employees] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
