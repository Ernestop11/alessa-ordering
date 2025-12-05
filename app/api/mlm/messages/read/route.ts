import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();
  const { messageId, associateId } = body;

  if (!messageId || !associateId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    await prisma.teamMessage.update({
      where: { id: messageId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking message as read:', error);
    return NextResponse.json({ error: error.message || 'Failed to mark message as read' }, { status: 500 });
  }
}
