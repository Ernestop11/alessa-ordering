import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function validateApiKey(req: Request): boolean {
  const apiKey = req.headers.get('X-API-Key');
  return apiKey === process.env.ALESSACLOUD_API_KEY;
}

// Create ecosystem event (cross-product communication)
export async function POST(req: Request) {
  try {
    if (!validateApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tenantId, eventType, source, target, payload } = body;

    if (!eventType || !source) {
      return NextResponse.json(
        { error: 'eventType and source required' },
        { status: 400 }
      );
    }

    const event = await prisma.ecosystemEvent.create({
      data: {
        tenantId: tenantId || null,
        eventType,
        source,
        target: target || null,
        payload: payload || null,
      },
    });

    // Trigger any listeners for this event type
    // This is where the "mycelium network" communication happens
    console.log(`[Ecosystem] Event created: ${eventType} from ${source}`, {
      tenantId,
      eventId: event.id,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('[Ecosystem] Error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get ecosystem events
export async function GET(req: Request) {
  try {
    if (!validateApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const eventType = searchParams.get('eventType');
    const source = searchParams.get('source');
    const processed = searchParams.get('processed');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (eventType) where.eventType = eventType;
    if (source) where.source = source;
    if (processed !== null) where.processed = processed === 'true';

    const events = await prisma.ecosystemEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(events);
  } catch (error: any) {
    console.error('[Ecosystem] Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

