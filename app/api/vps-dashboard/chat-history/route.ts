import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';

// GET - List sessions or get session messages
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session || role !== 'super_admin' || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const panelType = searchParams.get('panelType');

  try {
    if (sessionId) {
      // Get specific session with messages
      const chatSession = await prisma.vPSChatSession.findFirst({
        where: { id: sessionId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!chatSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      return NextResponse.json(chatSession);
    }

    // List sessions for panel type
    const sessions = await prisma.vPSChatSession.findMany({
      where: {
        userId,
        ...(panelType ? { panelType } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        panelType: true,
        title: true,
        model: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Chat history GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
}

// POST - Create session or add message
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session || role !== 'super_admin' || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, sessionId, panelType, model, role: messageRole, content } = await request.json();

    if (action === 'create-session') {
      // Create new chat session
      const newSession = await prisma.vPSChatSession.create({
        data: {
          userId,
          panelType,
          model,
          title: content ? content.slice(0, 50) + (content.length > 50 ? '...' : '') : 'New Chat',
        },
      });

      return NextResponse.json({ session: newSession });
    }

    if (action === 'add-message') {
      if (!sessionId || !messageRole || !content) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Verify session belongs to user
      const chatSession = await prisma.vPSChatSession.findFirst({
        where: { id: sessionId, userId },
      });

      if (!chatSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      // Add message
      const message = await prisma.vPSChatMessage.create({
        data: {
          sessionId,
          role: messageRole,
          content,
        },
      });

      // Update session title if first user message
      if (messageRole === 'user') {
        const messageCount = await prisma.vPSChatMessage.count({
          where: { sessionId, role: 'user' },
        });

        if (messageCount === 1) {
          await prisma.vPSChatSession.update({
            where: { id: sessionId },
            data: {
              title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
              updatedAt: new Date(),
            },
          });
        } else {
          await prisma.vPSChatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
          });
        }
      }

      return NextResponse.json({ message });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Chat history POST error:', error);
    return NextResponse.json({ error: 'Failed to save chat' }, { status: 500 });
  }
}

// DELETE - Delete session
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!session || role !== 'super_admin' || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    // Verify and delete
    const chatSession = await prisma.vPSChatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await prisma.vPSChatSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat history DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
