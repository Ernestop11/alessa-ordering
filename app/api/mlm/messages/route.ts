import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const associateId = searchParams.get('associateId');
  const tab = searchParams.get('tab') || 'inbox';

  if (!associateId) {
    return NextResponse.json({ error: 'Associate ID required' }, { status: 400 });
  }

  try {
    let messages;
    if (tab === 'sent') {
      messages = await prisma.teamMessage.findMany({
        where: { senderId: associateId },
        include: {
          recipient: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (tab === 'team') {
      messages = await prisma.teamMessage.findMany({
        where: { recipientId: null, teamId: { not: null } },
        include: {
          sender: { select: { id: true, name: true, rank: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      messages = await prisma.teamMessage.findMany({
        where: { recipientId: associateId },
        include: {
          sender: { select: { id: true, name: true, rank: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Error getting messages:', error);
    return NextResponse.json({ error: error.message || 'Failed to get messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { senderId, recipientId, subject, content, type, priority } = body;

  if (!senderId || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const message = await prisma.teamMessage.create({
      data: {
        senderId,
        recipientId: recipientId || null,
        subject: subject || null,
        content,
        type: type || 'message',
        priority: priority || 'normal',
      },
    });
    return NextResponse.json({ message });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}
