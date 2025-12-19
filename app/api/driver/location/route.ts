import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Driver Location API
 *
 * Allows drivers to update their real-time location
 * Used for live tracking on customer's order status page
 */

// Helper to verify driver token
async function verifyDriverToken(token: string): Promise<{ driverId: string; tenantId: string } | null> {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.exp < Date.now()) {
      return null; // Token expired
    }
    return { driverId: decoded.driverId, tenantId: decoded.tenantId };
  } catch {
    return null;
  }
}

interface LocationUpdateRequest {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

export async function POST(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const session = await verifyDriverToken(token);

    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = (await req.json()) as LocationUpdateRequest;

    const { lat, lng, accuracy, heading, speed } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Save location
    const location = await prisma.driverLocation.create({
      data: {
        driverId: session.driverId,
        lat,
        lng,
        accuracy,
        heading,
        speed,
      },
    });

    // Clean up old locations (keep last 100 per driver)
    const oldLocations = await prisma.driverLocation.findMany({
      where: { driverId: session.driverId },
      orderBy: { createdAt: 'desc' },
      skip: 100,
      select: { id: true },
    });

    if (oldLocations.length > 0) {
      await prisma.driverLocation.deleteMany({
        where: {
          id: { in: oldLocations.map((l) => l.id) },
        },
      });
    }

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        lat: location.lat,
        lng: location.lng,
        timestamp: location.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error('[Driver Location] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update location';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
