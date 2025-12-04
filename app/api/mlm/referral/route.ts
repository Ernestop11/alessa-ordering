import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

// GET - Get referrals for an associate
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  const { searchParams } = new URL(req.url);
  const associateId = searchParams.get('associateId');
  const tenantId = searchParams.get('tenantId');

  if (!associateId && role !== 'super_admin') {
    return NextResponse.json({ error: 'Associate ID required' }, { status: 400 });
  }

  try {
    const where: any = {};
    if (associateId) where.associateId = associateId;
    if (tenantId) where.tenantId = tenantId;

    const referrals = await prisma.tenantReferral.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            subscriptionMonthlyFee: true,
          },
        },
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
    });

    return NextResponse.json(referrals);
  } catch (error: any) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create tenant referral (when tenant signs up with referral code)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, associateId, referralCode, commissionRate } = body;

    if (!tenantId || !associateId) {
      return NextResponse.json(
        { error: 'Tenant ID and Associate ID are required' },
        { status: 400 }
      );
    }

    // Check if referral already exists
    const existing = await prisma.tenantReferral.findUnique({
      where: {
        tenantId_associateId: {
          tenantId,
          associateId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Referral already exists for this tenant' },
        { status: 409 }
      );
    }

    const referral = await prisma.tenantReferral.create({
      data: {
        tenantId,
        associateId,
        referralCode: referralCode || '',
        commissionRate: commissionRate || 0.10,
        status: 'pending',
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        associate: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
          },
        },
      },
    });

    return NextResponse.json(referral, { status: 201 });
  } catch (error: any) {
    console.error('Error creating referral:', error);
    return NextResponse.json(
      { error: 'Failed to create referral', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update referral status
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Referral ID and status are required' },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (status === 'approved' && !body.approvedAt) {
      updateData.approvedAt = new Date();
    }
    if (status === 'active' && !body.activatedAt) {
      updateData.activatedAt = new Date();
    }

    const referral = await prisma.tenantReferral.update({
      where: { id },
      data: updateData,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        associate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(referral);
  } catch (error: any) {
    console.error('Error updating referral:', error);
    return NextResponse.json(
      { error: 'Failed to update referral', details: error.message },
      { status: 500 }
    );
  }
}

