import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

// GET - Get commissions for an associate
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  const { searchParams } = new URL(req.url);
  const associateId = searchParams.get('associateId');
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  if (!associateId && role !== 'super_admin') {
    return NextResponse.json({ error: 'Associate ID required' }, { status: 400 });
  }

  try {
    const where: any = {};
    if (associateId) where.associateId = associateId;
    if (status) where.status = status;
    if (type) where.type = type;

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        associate: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Calculate totals
    const totals = await prisma.commission.aggregate({
      where: associateId ? { associateId } : {},
      _sum: { amount: true },
      _count: { id: true },
    });

    return NextResponse.json({
      commissions,
      totals: {
        totalAmount: totals._sum.amount || 0,
        totalCount: totals._count.id || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching commissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commissions', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create commission (typically called when tenant pays subscription or order is placed)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  // For testing, allow creating commissions without auth
  // if (role !== 'super_admin') {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const body = await req.json();
    const { associateId, tenantId, orderId, referralId, amount, type, description } = body;

    if (!associateId || !amount || !type) {
      return NextResponse.json(
        { error: 'Associate ID, amount, and type are required' },
        { status: 400 }
      );
    }

    const commission = await prisma.commission.create({
      data: {
        associateId,
        tenantId: tenantId || null,
        orderId: orderId || null,
        referralId: referralId || null,
        amount: Number(amount),
        type,
        status: 'PENDING',
        description: description || null,
      },
      include: {
        associate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update associate earnings
    await prisma.associate.update({
      where: { id: associateId },
      data: {
        totalEarnings: { increment: amount },
        totalCommissions: { increment: amount },
        totalPending: { increment: amount },
        lifetimeEarnings: { increment: amount },
      },
    });

    return NextResponse.json(commission, { status: 201 });
  } catch (error: any) {
    console.error('Error creating commission:', error);
    return NextResponse.json(
      { error: 'Failed to create commission', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update commission status (e.g., mark as paid)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  // For testing, allow creating commissions without auth
  // if (role !== 'super_admin') {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const body = await req.json();
    const { id, status, paymentNotes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Commission ID and status are required' },
        { status: 400 }
      );
    }

    // Get current commission
    const current = await prisma.commission.findUnique({
      where: { id },
      select: { associateId: true, amount: true, status: true },
    });

    if (!current) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
    }

    const updateData: any = { status };
    if (status === 'PAID' && !body.paidAt) {
      updateData.paidAt = new Date();
      updateData.paymentNotes = paymentNotes || null;
    }

    const commission = await prisma.commission.update({
      where: { id },
      data: updateData,
    });

    // Update associate earnings if status changed to PAID
    if (current.status !== 'PAID' && status === 'PAID') {
      await prisma.associate.update({
        where: { id: current.associateId },
        data: {
          totalPaid: { increment: current.amount },
          totalPending: { decrement: current.amount },
        },
      });
    }

    return NextResponse.json(commission);
  } catch (error: any) {
    console.error('Error updating commission:', error);
    return NextResponse.json(
      { error: 'Failed to update commission', details: error.message },
      { status: 500 }
    );
  }
}

