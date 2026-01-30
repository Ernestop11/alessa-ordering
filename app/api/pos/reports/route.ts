import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET - POS reports (shift summary, daily totals)
 */
export async function GET(request: NextRequest) {
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

    const dateParam = request.nextUrl.searchParams.get('date');
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    // If sessionId provided, return shift report
    if (sessionId) {
      const session = await prisma.pOSSession.findFirst({
        where: { id: sessionId, tenantId: tenant.id },
        include: {
          transactions: { orderBy: { createdAt: 'asc' } },
          cashMovements: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const validTxns = session.transactions.filter((t) => !t.refunded);
      const cashSales = validTxns.filter((t) => t.paymentMethod === 'cash').reduce((s, t) => s + t.total, 0);
      const cardSales = validTxns.filter((t) => t.paymentMethod === 'card').reduce((s, t) => s + t.total, 0);
      const totalTax = validTxns.reduce((s, t) => s + t.taxAmount, 0);
      const totalDiscount = validTxns.reduce((s, t) => s + t.discountAmount, 0);
      const refundTotal = session.transactions.filter((t) => t.refunded).reduce((s, t) => s + t.total, 0);

      return NextResponse.json({
        type: 'shift',
        session: {
          id: session.id,
          employeeName: session.employeeName,
          openedAt: session.openedAt,
          closedAt: session.closedAt,
          status: session.status,
          openingCash: session.openingCash,
          closingCash: session.closingCash,
          expectedCash: session.expectedCash,
          cashDifference: session.cashDifference,
        },
        summary: {
          transactionCount: validTxns.length,
          totalSales: Math.round((cashSales + cardSales) * 100) / 100,
          cashSales: Math.round(cashSales * 100) / 100,
          cardSales: Math.round(cardSales * 100) / 100,
          totalTax: Math.round(totalTax * 100) / 100,
          totalDiscount: Math.round(totalDiscount * 100) / 100,
          refundCount: session.transactions.filter((t) => t.refunded).length,
          refundTotal: Math.round(refundTotal * 100) / 100,
        },
        transactions: session.transactions,
        cashMovements: session.cashMovements,
      });
    }

    // Daily report
    const reportDate = dateParam ? new Date(dateParam) : new Date();
    const dayStart = new Date(reportDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const transactions = await prisma.pOSTransaction.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: dayStart, lt: dayEnd },
      },
      include: {
        session: { select: { employeeName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const sessions = await prisma.pOSSession.findMany({
      where: {
        tenantId: tenant.id,
        openedAt: { gte: dayStart, lt: dayEnd },
      },
      select: {
        id: true,
        employeeName: true,
        openedAt: true,
        closedAt: true,
        status: true,
        openingCash: true,
        closingCash: true,
        cashDifference: true,
      },
      orderBy: { openedAt: 'asc' },
    });

    const validTxns = transactions.filter((t) => !t.refunded);
    const cashSales = validTxns.filter((t) => t.paymentMethod === 'cash').reduce((s, t) => s + t.total, 0);
    const cardSales = validTxns.filter((t) => t.paymentMethod === 'card').reduce((s, t) => s + t.total, 0);

    return NextResponse.json({
      type: 'daily',
      date: dayStart.toISOString().split('T')[0],
      summary: {
        sessionCount: sessions.length,
        transactionCount: validTxns.length,
        totalSales: Math.round((cashSales + cardSales) * 100) / 100,
        cashSales: Math.round(cashSales * 100) / 100,
        cardSales: Math.round(cardSales * 100) / 100,
        refundCount: transactions.filter((t) => t.refunded).length,
        refundTotal: Math.round(transactions.filter((t) => t.refunded).reduce((s, t) => s + t.total, 0) * 100) / 100,
      },
      sessions,
      transactions,
    });
  } catch (error: any) {
    console.error('[POS Reports GET]', error);
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
}
