import { NextResponse } from 'next/server';
import { markAnnouncementRead } from '@/lib/mlm/bulletin-board';

export async function POST(req: Request) {
  const body = await req.json();
  const { announcementId, associateId } = body;

  if (!announcementId || !associateId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    await markAnnouncementRead(announcementId, associateId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

