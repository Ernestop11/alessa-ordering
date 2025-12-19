import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tax/checks
 * 
 * List tax checks for tenant
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    const checks = await prisma.taxCheck.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      include: {
        remittance: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
          },
        },
      },
    });

    return NextResponse.json({ checks });
  } catch (error: any) {
    console.error('[tax-checks] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch checks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tax/checks
 * 
 * Create a new tax check
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await req.json();
    const { remittanceId, payee, amount, memo } = body;

    if (!payee || !amount) {
      return NextResponse.json(
        { error: 'payee and amount are required' },
        { status: 400 }
      );
    }

    // Get next check number
    const lastCheck = await prisma.taxCheck.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { checkNumber: 'desc' },
    });

    const nextCheckNumber = lastCheck ? lastCheck.checkNumber + 1 : 1;

    const check = await prisma.taxCheck.create({
      data: {
        tenantId: tenant.id,
        remittanceId: remittanceId || null,
        checkNumber: nextCheckNumber,
        payee,
        amount: parseFloat(amount),
        memo: memo || null,
        status: 'pending',
      },
    });

    return NextResponse.json({ check });
  } catch (error: any) {
    console.error('[tax-checks] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create check' },
      { status: 500 }
    );
  }
}

