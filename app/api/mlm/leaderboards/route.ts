import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const associateId = searchParams.get('associateId');

  try {
    const leaderboards = await prisma.leaderboard.findMany({
      where: {
        endDate: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return NextResponse.json({ leaderboards });
  } catch (error: any) {
    console.error('Error getting leaderboards:', error);
    return NextResponse.json({ error: error.message || 'Failed to get leaderboards' }, { status: 500 });
  }
}
