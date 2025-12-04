import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAndAwardAchievements, getAssociateAchievements, getAchievementProgress } from '@/lib/mlm/achievement-system';

/**
 * GET - Get achievements for an associate
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const associateId = searchParams.get('associateId');
  const includeProgress = searchParams.get('progress') === 'true';

  if (!associateId) {
    return NextResponse.json({ error: 'Associate ID required' }, { status: 400 });
  }

  try {
    if (includeProgress) {
      const progress = await getAchievementProgress(associateId);
      return NextResponse.json({ achievements: progress });
    } else {
      const achievements = await getAssociateAchievements(associateId);
      return NextResponse.json({ achievements });
    }
  } catch (error: any) {
    console.error('Error getting achievements:', error);
    return NextResponse.json({ error: error.message || 'Failed to get achievements' }, { status: 500 });
  }
}

/**
 * POST - Check and award achievements for an associate
 */
export async function POST(req: Request) {
  const body = await req.json();
  const associateId = body.associateId;

  if (!associateId) {
    return NextResponse.json({ error: 'Associate ID required' }, { status: 400 });
  }

  try {
    const result = await checkAndAwardAchievements(associateId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error checking achievements:', error);
    return NextResponse.json({ error: error.message || 'Failed to check achievements' }, { status: 500 });
  }
}

