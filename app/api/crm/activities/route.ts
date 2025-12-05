import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Get CRM activities
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'super_admin') {
      return unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const activityType = searchParams.get('activityType');
    const completed = searchParams.get('completed');
    const assignedTo = searchParams.get('assignedTo');

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (activityType) where.activityType = activityType;
    if (completed !== null) where.completed = completed === 'true';
    if (assignedTo) where.assignedTo = assignedTo;

    const activities = await prisma.cRMActivity.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(activities);
  } catch (error: any) {
    console.error('[CRM] Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create CRM activity
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'super_admin') {
      return unauthorized();
    }

    const body = await req.json();
    const {
      tenantId,
      activityType,
      title,
      description,
      assignedTo,
      dueDate,
      metadata,
    } = body;

    if (!activityType || !title) {
      return NextResponse.json(
        { error: 'activityType and title required' },
        { status: 400 }
      );
    }

    const activity = await prisma.cRMActivity.create({
      data: {
        tenantId: tenantId || null,
        activityType,
        title,
        description: description || null,
        assignedTo: assignedTo || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        metadata: metadata || null,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    console.error('[CRM] Error creating activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

