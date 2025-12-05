import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();
  const { meetingId, associateId } = body;

  if (!meetingId || !associateId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    await prisma.meetingAttendee.update({
      where: {
        meetingId_associateId: {
          meetingId,
          associateId,
        },
      },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error confirming meeting:', error);
    return NextResponse.json({ error: error.message || 'Failed to confirm meeting' }, { status: 500 });
  }
}
