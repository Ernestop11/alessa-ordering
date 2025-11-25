import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') return unauthorized();

    const tenant = await requireTenant();
    const inquiries = await prisma.cateringInquiry.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ inquiries });
  } catch (error: any) {
    console.error('[catering-inquiries] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') return unauthorized();

    const tenant = await requireTenant();
    const { id, status, responseNotes } = await req.json();

    const inquiry = await prisma.cateringInquiry.update({
      where: {
        id,
        tenantId: tenant.id,
      },
      data: {
        status: status || undefined,
        responseNotes: responseNotes !== undefined ? responseNotes : undefined,
        respondedAt: status && status !== 'new' ? new Date() : undefined,
      },
    });

    return NextResponse.json({ success: true, inquiry });
  } catch (error: any) {
    console.error('[catering-inquiries] PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

