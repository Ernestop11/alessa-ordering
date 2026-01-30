import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function resolveTenant(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('tenantSlug');
  if (!slug) return null;
  return prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
}

/**
 * GET - Session detail with transactions and cash movements
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: 'tenantSlug is required' }, { status: 400 });
    }

    const session = await prisma.pOSSession.findFirst({
      where: { id: params.id, tenantId: tenant.id },
      include: {
        transactions: { orderBy: { createdAt: 'desc' } },
        cashMovements: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Calculate totals
    const cashSales = session.transactions
      .filter((t) => t.paymentMethod === 'cash' && !t.refunded)
      .reduce((sum, t) => sum + t.total, 0);

    const cardSales = session.transactions
      .filter((t) => t.paymentMethod === 'card' && !t.refunded)
      .reduce((sum, t) => sum + t.total, 0);

    const refunds = session.transactions
      .filter((t) => t.refunded)
      .reduce((sum, t) => sum + t.total, 0);

    const cashDrops = session.cashMovements
      .filter((m) => m.type === 'CASH_DROP')
      .reduce((sum, m) => sum + m.amount, 0);

    const payouts = session.cashMovements
      .filter((m) => m.type === 'PAYOUT')
      .reduce((sum, m) => sum + m.amount, 0);

    const expectedCash = session.openingCash + cashSales - refunds - cashDrops - payouts;

    return NextResponse.json({
      session,
      summary: {
        totalSales: cashSales + cardSales,
        cashSales: Math.round(cashSales * 100) / 100,
        cardSales: Math.round(cardSales * 100) / 100,
        refunds: Math.round(refunds * 100) / 100,
        cashDrops: Math.round(cashDrops * 100) / 100,
        payouts: Math.round(payouts * 100) / 100,
        expectedCash: Math.round(expectedCash * 100) / 100,
        transactionCount: session.transactions.filter((t) => !t.refunded).length,
      },
    });
  } catch (error: any) {
    console.error('[POS Session Detail GET]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch session' }, { status: 500 });
  }
}

/**
 * PUT - Close a session (end shift)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: 'tenantSlug is required' }, { status: 400 });
    }

    const body = await request.json();
    const { closingCash } = body;

    const session = await prisma.pOSSession.findFirst({
      where: { id: params.id, tenantId: tenant.id },
      include: {
        transactions: true,
        cashMovements: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'closed') {
      return NextResponse.json({ error: 'Session is already closed' }, { status: 400 });
    }

    // Calculate expected cash
    const cashSales = session.transactions
      .filter((t) => t.paymentMethod === 'cash' && !t.refunded)
      .reduce((sum, t) => sum + t.total, 0);

    const refunds = session.transactions
      .filter((t) => t.refunded)
      .reduce((sum, t) => sum + t.total, 0);

    const cashDrops = session.cashMovements
      .filter((m) => m.type === 'CASH_DROP')
      .reduce((sum, m) => sum + m.amount, 0);

    const payouts = session.cashMovements
      .filter((m) => m.type === 'PAYOUT')
      .reduce((sum, m) => sum + m.amount, 0);

    const expectedCash = session.openingCash + cashSales - refunds - cashDrops - payouts;
    const actualClosing = closingCash !== undefined ? closingCash : expectedCash;
    const cashDifference = Math.round((actualClosing - expectedCash) * 100) / 100;

    const updated = await prisma.pOSSession.update({
      where: { id: params.id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        closingCash: actualClosing,
        expectedCash: Math.round(expectedCash * 100) / 100,
        cashDifference,
      },
    });

    return NextResponse.json({
      session: updated,
      summary: {
        expectedCash: Math.round(expectedCash * 100) / 100,
        closingCash: actualClosing,
        cashDifference,
        cashSales: Math.round(cashSales * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error('[POS Session PUT]', error);
    return NextResponse.json({ error: error.message || 'Failed to close session' }, { status: 500 });
  }
}
