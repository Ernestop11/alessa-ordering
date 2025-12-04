import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { promoteAssociate, getRankProgress, checkRankRequirements } from '@/lib/mlm/rank-system';

/**
 * GET - Get rank progress for an associate
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const associateId = searchParams.get('associateId');

  if (!associateId) {
    return NextResponse.json({ error: 'Associate ID required' }, { status: 400 });
  }

  try {
    const progress = await getRankProgress(associateId);
    return NextResponse.json(progress);
  } catch (error: any) {
    console.error('Error getting rank progress:', error);
    return NextResponse.json({ error: error.message || 'Failed to get rank progress' }, { status: 500 });
  }
}

/**
 * POST - Promote an associate (check and promote if requirements met)
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  // Allow super admin or the associate themselves
  const body = await req.json();
  const associateId = body.associateId;

  if (!associateId) {
    return NextResponse.json({ error: 'Associate ID required' }, { status: 400 });
  }

  // Check if user is super admin or the associate themselves
  if (role !== 'super_admin') {
    // For now, allow any authenticated user to check their own promotion
    // TODO: Add proper associate authentication
  }

  try {
    const result = await promoteAssociate(associateId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error promoting associate:', error);
    return NextResponse.json({ error: error.message || 'Failed to promote associate' }, { status: 500 });
  }
}

