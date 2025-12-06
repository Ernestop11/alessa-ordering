import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'super_admin') return unauthorized();

  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();

    const lead = await prisma.lead.update({
      where: { id: resolvedParams.id },
      data: {
        ...(body.companyName && { companyName: body.companyName }),
        ...(body.contactName && { contactName: body.contactName }),
        ...(body.contactEmail && { contactEmail: body.contactEmail }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
        ...(body.status && { status: body.status }),
        ...(body.dealValue !== undefined && { dealValue: body.dealValue ? Number(body.dealValue) : null }),
        ...(body.probability !== undefined && { probability: Number(body.probability) }),
        ...(body.nextAction !== undefined && { nextAction: body.nextAction ? new Date(body.nextAction) : null }),
        ...(body.nextActionNote !== undefined && { nextActionNote: body.nextActionNote }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.proposals !== undefined && { proposals: body.proposals }),
        ...(body.prototypes !== undefined && { prototypes: body.prototypes }),
        ...(body.convertedToTenantId && {
          convertedToTenantId: body.convertedToTenantId,
          convertedAt: new Date(),
          status: 'converted',
        }),
      },
    });

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error('[Leads API] Error updating lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'super_admin') return unauthorized();

  try {
    const resolvedParams = await Promise.resolve(params);
    await prisma.lead.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Leads API] Error deleting lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

