import { NextResponse } from 'next/server';
import { createUrgentMeetingInvitation } from '@/lib/mlm/meeting-protocol';

export async function POST(req: Request) {
  const body = await req.json();
  const { newRecruitId, sponsorId } = body;

  if (!newRecruitId || !sponsorId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const invitation = await createUrgentMeetingInvitation(newRecruitId, sponsorId);
    if (!invitation) {
      return NextResponse.json({ error: 'Failed to create meeting invitation' }, { status: 500 });
    }
    return NextResponse.json({ invitation });
  } catch (error: any) {
    console.error('Error creating meeting invitation:', error);
    return NextResponse.json({ error: error.message || 'Failed to create meeting invitation' }, { status: 500 });
  }
}
