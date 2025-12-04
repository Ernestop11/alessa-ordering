import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

/**
 * GET - Get bulletin posts
 * NOTE: BulletinPost model not yet added to schema - returning empty for now
 */
export async function GET(req: Request) {
  // BulletinPost model not yet in schema - return empty array
  return NextResponse.json({ posts: [] });
}

/**
 * POST - Create bulletin post (super admin or team leader)
 * NOTE: BulletinPost model not yet added to schema
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // BulletinPost model not yet in schema
  return NextResponse.json(
    { error: 'BulletinPost feature not yet available' },
    { status: 501 }
  );
}
