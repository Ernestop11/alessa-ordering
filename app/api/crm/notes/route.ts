import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Get CRM notes
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'super_admin') {
      return unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const author = searchParams.get('author');
    const pinned = searchParams.get('pinned');

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (author) where.author = author;
    if (pinned !== null) where.pinned = pinned === 'true';

    const notes = await prisma.cRMNote.findMany({
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
        { pinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(notes);
  } catch (error: any) {
    console.error('[CRM] Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create CRM note
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'super_admin') {
      return unauthorized();
    }

    const body = await req.json();
    const { tenantId, content, tags, pinned } = body;
    const author = (session.user as { email?: string })?.email || 'unknown';

    if (!tenantId || !content) {
      return NextResponse.json(
        { error: 'tenantId and content required' },
        { status: 400 }
      );
    }

    const note = await prisma.cRMNote.create({
      data: {
        tenantId,
        author,
        content,
        tags: Array.isArray(tags) ? tags : [],
        pinned: pinned || false,
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

    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    console.error('[CRM] Error creating note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

