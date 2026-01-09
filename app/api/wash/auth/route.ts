import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/wash/auth - Login with last 4 digits of phone
export async function POST(req: NextRequest) {
  try {
    const { pin, tenantSlug } = await req.json();

    if (!pin || !tenantSlug) {
      return NextResponse.json(
        { error: 'PIN and tenant slug are required' },
        { status: 400 }
      );
    }

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Find employee by PIN (last 4 of phone)
    const employee = await prisma.washEmployee.findFirst({
      where: {
        tenantId: tenant.id,
        pin: pin,
        active: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        tenantId: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Invalid PIN. Use the last 4 digits of your phone number.' },
        { status: 401 }
      );
    }

    // Return employee info (in production, you'd create a JWT token)
    return NextResponse.json({
      ok: true,
      employee: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        tenantId: employee.tenantId,
      },
    });
  } catch (error) {
    console.error('[wash/auth] Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
