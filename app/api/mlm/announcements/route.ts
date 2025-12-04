import { NextResponse } from 'next/server';
import { getAnnouncementsForAssociate, markAnnouncementRead, createAnnouncement } from '@/lib/mlm/bulletin-board';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const associateId = searchParams.get('associateId');
  const filter = searchParams.get('filter');

  if (!associateId) {
    return NextResponse.json({ error: 'Associate ID required' }, { status: 400 });
  }

  try {
    const announcements = await getAnnouncementsForAssociate(associateId, {
      associateId,
      unreadOnly: filter === 'unread',
      type: filter && filter !== 'all' && filter !== 'unread' ? filter : undefined,
    });
    return NextResponse.json({ announcements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  
  if (role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const announcement = await createAnnouncement(body);
  return NextResponse.json({ announcement });
}

