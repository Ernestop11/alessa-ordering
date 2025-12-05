import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const entries = await prisma.leaderboardEntry.findMany({
      where: { leaderboardId: params.id },
      include: {
        associate: {
          select: {
            id: true,
            name: true,
            rank: true,
          },
        },
      },
      orderBy: { rank: 'asc' },
      take: 100,
    });

    const formatted = entries.map((e) => ({
      rank: e.rank,
      associateName: e.associate.name,
      associateRank: e.associate.rank,
      score: e.score,
      metadata: e.metadata,
    }));

    return NextResponse.json({ entries: formatted });
  } catch (error: any) {
    console.error('Error getting leaderboard entries:', error);
    return NextResponse.json({ error: error.message || 'Failed to get leaderboard entries' }, { status: 500 });
  }
}
