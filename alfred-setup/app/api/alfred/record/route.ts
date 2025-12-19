/**
 * Record Event API - Allows external services to record learning events
 */
import { NextRequest, NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  noStore();
  
  try {
    const body = await request.json();
    const { type, metadata, userId, sessionId } = body;

    if (!type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 });
    }

    // Try to get event recorder
    try {
      const learning = require('../../../../lib/learning/event-recorder');
      const eventRecorder = learning.getEventRecorder();
      
      await eventRecorder.record({
        type,
        userId,
        sessionId,
        metadata: metadata || {},
      });
    } catch (error) {
      console.warn('[Alfred] Learning system not available:', error);
      return NextResponse.json({
        success: false,
        message: 'Learning system not available',
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      message: 'Event recorded',
    });
  } catch (error) {
    console.error('[Alfred] Error recording event:', error);
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    );
  }
}

