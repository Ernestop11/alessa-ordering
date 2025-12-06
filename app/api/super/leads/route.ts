import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'super_admin') return unauthorized();

  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leads);
  } catch (error: any) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'super_admin') return unauthorized();

  try {
    const body = await req.json();
    const {
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      status,
      dealValue,
      probability,
      nextAction,
      nextActionNote,
      notes,
      tags,
    } = body;

    if (!companyName || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: 'Company name, contact name, and email are required' },
        { status: 400 },
      );
    }

    const lead = await prisma.lead.create({
      data: {
        companyName,
        contactName,
        contactEmail,
        contactPhone: contactPhone || null,
        status: status || 'new',
        dealValue: dealValue ? Number(dealValue) : null,
        probability: probability ? Number(probability) : 50,
        nextAction: nextAction ? new Date(nextAction) : null,
        nextActionNote: nextActionNote || null,
        notes: notes || null,
        tags: tags || [],
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    console.error('[Leads API] Error creating lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

