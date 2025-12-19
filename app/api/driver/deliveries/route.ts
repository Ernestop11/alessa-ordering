import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Driver Deliveries API
 *
 * Get assigned deliveries for a driver
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

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // active, completed, all

    // Build query
    const whereClause: Record<string, unknown> = {
      driverId: session.driverId,
      tenantId: session.tenantId,
    };

    if (status === 'active') {
      whereClause.status = { in: ['assigned', 'picked_up', 'en_route'] };
    } else if (status === 'completed') {
      whereClause.status = { in: ['delivered', 'cancelled'] };
    }

    const deliveries = await prisma.selfDelivery.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            totalAmount: true,
            status: true,
            items: {
              select: {
                quantity: true,
                menuItemName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ deliveries });
  } catch (error: unknown) {
    console.error('[Driver Deliveries] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch deliveries';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
