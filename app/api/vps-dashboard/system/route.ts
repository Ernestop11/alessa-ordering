import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getSystemOverview } from '@/lib/vps-dashboard/system-scanner';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const overview = await getSystemOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error('Failed to scan system:', error);
    return NextResponse.json(
      { error: 'Failed to scan system' },
      { status: 500 }
    );
  }
}
