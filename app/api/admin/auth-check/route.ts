import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'admin') {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return NextResponse.json({ authenticated: true, user: { ...session.user, role } });
}
