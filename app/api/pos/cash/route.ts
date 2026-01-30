import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST - Record a cash drawer event (cash drop, payout, adjustment)
 */
export async function POST(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('tenantSlug');
    if (!slug) {
      return NextResponse.json({ error: 'tenantSlug is required' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { sessionId, type, amount, notes } = body;

    if (!sessionId || !type || amount === undefined) {
      return NextResponse.json({ error: 'sessionId, type, and amount are required' }, { status: 400 });
    }

    const validTypes = ['CASH_DROP', 'PAYOUT', 'ADJUSTMENT'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `type must be one of: ${validTypes.join(', ')}` }, { status: 400 });
    }

    // Verify session is open
    const session = await prisma.pOSSession.findFirst({
      where: { id: sessionId, tenantId: tenant.id, status: 'open' },
    });

    if (!session) {
      return NextResponse.json({ error: 'No open session found' }, { status: 400 });
    }

    const movement = await prisma.pOSCashMovement.create({
      data: {
        tenantId: tenant.id,
        sessionId,
        type,
        amount,
        notes: notes || null,
      },
    });

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error: any) {
    console.error('[POS Cash POST]', error);
    return NextResponse.json({ error: error.message || 'Failed to record cash movement' }, { status: 500 });
  }
}
