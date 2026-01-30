import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POS Session API
 * Auth: tenantSlug query param (tablet-facing, no NextAuth)
 */

async function resolveTenant(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('tenantSlug');
  if (!slug) return null;
  return prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
}

/**
 * GET - List sessions (default: open sessions only)
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: 'tenantSlug is required' }, { status: 400 });
    }

    const status = request.nextUrl.searchParams.get('status') || 'open';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    const where: any = { tenantId: tenant.id };
    if (status !== 'all') where.status = status;

    const sessions = await prisma.pOSSession.findMany({
      where,
      include: {
        _count: { select: { transactions: true, cashMovements: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('[POS Session GET]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch sessions' }, { status: 500 });
  }
}

/**
 * POST - Open a new session (shift)
 */
export async function POST(request: NextRequest) {
  try {
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: 'tenantSlug is required' }, { status: 400 });
    }

    const body = await request.json();
    const { employeeName, employeePin, openingCash } = body;

    if (!employeeName) {
      return NextResponse.json({ error: 'employeeName is required' }, { status: 400 });
    }

    // Check if there's already an open session
    const existing = await prisma.pOSSession.findFirst({
      where: { tenantId: tenant.id, status: 'open' },
    });

    if (existing) {
      return NextResponse.json(
        { error: `There is already an open session by ${existing.employeeName}. Close it first.`, existingSession: existing },
        { status: 409 }
      );
    }

    const session = await prisma.pOSSession.create({
      data: {
        tenantId: tenant.id,
        employeeName,
        employeePin: employeePin || null,
        openingCash: openingCash || 0,
      },
    });

    // Record opening cash movement
    if (openingCash && openingCash > 0) {
      await prisma.pOSCashMovement.create({
        data: {
          tenantId: tenant.id,
          sessionId: session.id,
          type: 'OPEN',
          amount: openingCash,
          notes: 'Opening cash drawer',
        },
      });
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (error: any) {
    console.error('[POS Session POST]', error);
    return NextResponse.json({ error: error.message || 'Failed to open session' }, { status: 500 });
  }
}
