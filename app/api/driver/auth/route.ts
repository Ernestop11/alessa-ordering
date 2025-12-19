import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Driver Authentication API
 *
 * Simple PIN-based authentication for drivers
 * Drivers use their phone number + PIN to login
 */

interface DriverLoginRequest {
  phone: string;
  pin: string;
  tenantSlug: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DriverLoginRequest;

    const { phone, pin, tenantSlug } = body;

    if (!phone || !pin || !tenantSlug) {
      return NextResponse.json(
        { error: 'Phone, PIN, and tenant slug are required' },
        { status: 400 }
      );
    }

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Find driver by phone and tenant
    const driver = await prisma.driver.findFirst({
      where: {
        phone,
        tenantId: tenant.id,
        isActive: true,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found or inactive' },
        { status: 401 }
      );
    }

    // Verify PIN
    if (driver.pin !== pin) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // Generate a simple session token (in production, use JWT)
    const sessionToken = Buffer.from(
      JSON.stringify({
        driverId: driver.id,
        tenantId: tenant.id,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      })
    ).toString('base64');

    return NextResponse.json({
      success: true,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      token: sessionToken,
    });
  } catch (error: unknown) {
    console.error('[Driver Auth] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
