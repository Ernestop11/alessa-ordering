import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { scanPages, scanApiRoutes, getPageStats } from '@/lib/vps-dashboard/page-scanner';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [pages, apiRoutes] = await Promise.all([
      scanPages(),
      scanApiRoutes(),
    ]);

    const stats = getPageStats(pages);

    return NextResponse.json({
      pages,
      apiRoutes,
      stats,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to scan pages:', error);
    return NextResponse.json(
      { error: 'Failed to scan pages' },
      { status: 500 }
    );
  }
}
