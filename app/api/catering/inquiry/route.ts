import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export async function POST(req: Request) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const { name, email, phone, eventDate, guestCount, message } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    const inquiry = await prisma.cateringInquiry.create({
      data: {
        tenantId: tenant.id,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        eventDate: eventDate ? new Date(eventDate) : null,
        guestCount: guestCount ? parseInt(String(guestCount), 10) : null,
        message: message || null,
        status: 'new',
      },
    });

    return NextResponse.json({ success: true, inquiry });
  } catch (error: any) {
    console.error('[catering-inquiry] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}

