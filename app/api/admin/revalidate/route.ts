import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { revalidatePath } from 'next/cache';

/**
 * POST - Revalidate specific paths (cache busting)
 * Used by admin components to trigger frontend cache invalidation
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paths = searchParams.getAll('path');

    if (paths.length === 0) {
      return NextResponse.json({ error: 'At least one path is required' }, { status: 400 });
    }

    // Revalidate each path
    for (const path of paths) {
      revalidatePath(path);
    }

    return NextResponse.json({ 
      success: true, 
      revalidated: paths 
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[Revalidate API Error]', error);
    return NextResponse.json(
      { error: 'Failed to revalidate paths' },
      { status: 500 }
    );
  }
}

