import { NextResponse } from 'next/server';
import { getUpcomingMeetings } from '@/lib/mlm/meeting-protocol';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const associateId = searchParams.get('associateId');

  if (!associateId) {
    return NextResponse.json({ error: 'Associate ID required' }, { status: 400 });
  }

  try {
    const meetings = await getUpcomingMeetings(associateId);
    return NextResponse.json({ meetings });
  } catch (error: any) {
    console.error('Error getting meetings:', error);
    return NextResponse.json({ error: error.message || 'Failed to get meetings' }, { status: 500 });
  }
}
