/**
 * Leaderboard System
 *
 * Sales contests, recruiting contests, earnings leaderboards
 */

import prisma from '../prisma';

export interface LeaderboardConfig {
  type: 'sales' | 'recruiting' | 'earnings' | 'rank_points';
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  startDate?: Date;
  endDate?: Date;
}

/**
 * Generate leaderboard
 */
export async function generateLeaderboard(config: LeaderboardConfig) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (config.period) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'weekly':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      startDate = weekStart;
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'all-time':
      startDate = new Date(0); // Beginning of time
      break;
    default:
      startDate = config.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = config.endDate || now;
  }

  let query: any = {};

  switch (config.type) {
    case 'sales':
      query = {
        sales: {
          where: {
            soldAt: {
              gte: startDate,
              lte: endDate,
            },
            status: 'completed',
          },
        },
      };
      break;
    case 'recruiting':
      query = {
        downline: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: 'ACTIVE',
          },
        },
      };
      break;
    case 'earnings':
      query = {
        commissions: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: { in: ['APPROVED', 'PAID'] },
          },
        },
      };
      break;
    case 'rank_points':
      query = {
        achievements: {
          where: {
            earnedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      };
      break;
  }

  const associates = await prisma.associate.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: query,
  });

  const scores = associates.map((associate) => {
    let score = 0;
    let metadata: any = {};

    switch (config.type) {
      case 'sales':
        score = associate.sales?.length || 0;
        metadata = {
          salesCount: associate.sales?.length || 0,
          totalRevenue: associate.sales?.reduce((sum, s) => sum + s.amount, 0) || 0,
        };
        break;
      case 'recruiting':
        score = associate.downline?.length || 0;
        metadata = {
          recruitsCount: associate.downline?.length || 0,
        };
        break;
      case 'earnings':
        score = associate.commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
        metadata = {
          totalEarnings: score,
          commissionCount: associate.commissions?.length || 0,
        };
        break;
      case 'rank_points':
        score = associate.achievements?.reduce((sum, a) => sum + a.points, 0) || 0;
        metadata = {
          points: score,
          achievementCount: associate.achievements?.length || 0,
        };
        break;
    }

    return {
      associateId: associate.id,
      associateName: associate.name,
      associateRank: associate.rank,
      score,
      metadata,
    };
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Assign ranks
  const ranked = scores.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  return ranked;
}

/**
 * Create or update leaderboard
 */
export async function createOrUpdateLeaderboard(
  name: string,
  config: LeaderboardConfig
) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (config.period) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'weekly':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      startDate = weekStart;
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'all-time':
      startDate = new Date(0);
      break;
    default:
      startDate = config.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = config.endDate || now;
  }

  const ranked = await generateLeaderboard(config);

  // Find existing leaderboard by name and type
  const existing = await prisma.leaderboard.findFirst({
    where: {
      name,
      type: config.type,
      period: config.period,
    },
  });

  let leaderboard;
  if (existing) {
    leaderboard = await prisma.leaderboard.update({
      where: { id: existing.id },
      data: {
        endDate,
      },
    });
  } else {
    leaderboard = await prisma.leaderboard.create({
      data: {
        name,
        type: config.type,
        period: config.period,
        startDate,
        endDate,
      },
    });
  }

  // Delete old entries
  await prisma.leaderboardEntry.deleteMany({
    where: { leaderboardId: leaderboard.id },
  });

  // Create new entries
  for (const entry of ranked) {
    await prisma.leaderboardEntry.create({
      data: {
        leaderboardId: leaderboard.id,
        associateId: entry.associateId,
        rank: entry.rank,
        score: entry.score,
        metadata: entry.metadata,
      },
    });
  }

  return leaderboard;
}
