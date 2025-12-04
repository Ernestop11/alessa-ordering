/**
 * MLM Achievement System
 * 
 * Handles achievement earning, badge display, and points system
 */

import prisma from '../prisma';
import { AchievementType, AssociateRank } from '@prisma/client';

export interface AchievementDefinition {
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  points: number;
  checkFunction: (associateId: string) => Promise<boolean>;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    type: 'FIRST_SALE',
    title: 'First Sale',
    description: 'Completed your first sale',
    icon: '🎯',
    points: 10,
    checkFunction: async (associateId: string) => {
      const sales = await prisma.sale.count({
        where: { associateId, status: 'completed' },
      });
      return sales >= 1;
    },
  },
  {
    type: 'TEN_SALES',
    title: 'Ten Sales',
    description: 'Completed 10 sales',
    icon: '🔥',
    points: 50,
    checkFunction: async (associateId: string) => {
      const sales = await prisma.sale.count({
        where: { associateId, status: 'completed' },
      });
      return sales >= 10;
    },
  },
  {
    type: 'HUNDRED_SALES',
    title: 'Hundred Sales',
    description: 'Completed 100 sales',
    icon: '💎',
    points: 500,
    checkFunction: async (associateId: string) => {
      const sales = await prisma.sale.count({
        where: { associateId, status: 'completed' },
      });
      return sales >= 100;
    },
  },
  {
    type: 'FIRST_RECRUIT',
    title: 'First Recruit',
    description: 'Recruited your first associate',
    icon: '👥',
    points: 25,
    checkFunction: async (associateId: string) => {
      const recruits = await prisma.associate.count({
        where: { sponsorId: associateId },
      });
      return recruits >= 1;
    },
  },
  {
    type: 'THREE_RECRUITS',
    title: 'Three Recruits',
    description: 'Recruited 3 associates',
    icon: '🌟',
    points: 100,
    checkFunction: async (associateId: string) => {
      const recruits = await prisma.associate.count({
        where: { sponsorId: associateId },
      });
      return recruits >= 3;
    },
  },
  {
    type: 'TEN_RECRUITS',
    title: 'Ten Recruits',
    description: 'Recruited 10 associates',
    icon: '🏆',
    points: 500,
    checkFunction: async (associateId: string) => {
      const recruits = await prisma.associate.count({
        where: { sponsorId: associateId },
      });
      return recruits >= 10;
    },
  },
  {
    type: 'FIFTY_RECRUITS',
    title: 'Fifty Recruits',
    description: 'Recruited 50 associates',
    icon: '👑',
    points: 2500,
    checkFunction: async (associateId: string) => {
      const recruits = await prisma.associate.count({
        where: { sponsorId: associateId },
      });
      return recruits >= 50;
    },
  },
  {
    type: 'FIRST_COMMISSION',
    title: 'First Commission',
    description: 'Earned your first commission',
    icon: '💰',
    points: 15,
    checkFunction: async (associateId: string) => {
      const commissions = await prisma.commission.count({
        where: { associateId, status: { in: ['APPROVED', 'PAID'] } },
      });
      return commissions >= 1;
    },
  },
  {
    type: 'THOUSAND_EARNED',
    title: '$1,000 Earned',
    description: 'Earned $1,000 in commissions',
    icon: '💵',
    points: 200,
    checkFunction: async (associateId: string) => {
      const associate = await prisma.associate.findUnique({
        where: { id: associateId },
        select: { totalEarnings: true },
      });
      return (associate?.totalEarnings || 0) >= 1000;
    },
  },
  {
    type: 'TEN_THOUSAND_EARNED',
    title: '$10,000 Earned',
    description: 'Earned $10,000 in commissions',
    icon: '💸',
    points: 2000,
    checkFunction: async (associateId: string) => {
      const associate = await prisma.associate.findUnique({
        where: { id: associateId },
        select: { totalEarnings: true },
      });
      return (associate?.totalEarnings || 0) >= 10000;
    },
  },
  {
    type: 'FIRST_ORDERING_SALE',
    title: 'First Ordering Sale',
    description: 'Sold your first Alessa Ordering System',
    icon: '🍽️',
    points: 30,
    checkFunction: async (associateId: string) => {
      const sales = await prisma.sale.count({
        where: {
          associateId,
          productType: 'ORDERING_SYSTEM',
          status: 'completed',
        },
      });
      return sales >= 1;
    },
  },
  {
    type: 'FIRST_HOSTING_SALE',
    title: 'First Hosting Sale',
    description: 'Sold your first web hosting package',
    icon: '🌐',
    points: 30,
    checkFunction: async (associateId: string) => {
      const sales = await prisma.sale.count({
        where: {
          associateId,
          productType: 'WEB_HOSTING',
          status: 'completed',
        },
      });
      return sales >= 1;
    },
  },
  {
    type: 'TRAINING_COMPLETE',
    title: 'Training Complete',
    description: 'Completed your first training course',
    icon: '📚',
    points: 20,
    checkFunction: async (associateId: string) => {
      const training = await prisma.trainingProgress.count({
        where: { associateId, completed: true },
      });
      return training >= 1;
    },
  },
  {
    type: 'SALES_CERTIFIED',
    title: 'Sales Certified',
    description: 'Completed sales certification',
    icon: '🎓',
    points: 100,
    checkFunction: async (associateId: string) => {
      const training = await prisma.trainingProgress.findFirst({
        where: {
          associateId,
          courseName: { contains: 'Sales', mode: 'insensitive' },
          completed: true,
        },
      });
      return !!training;
    },
  },
];

/**
 * Check and award achievements for an associate
 */
export async function checkAndAwardAchievements(associateId: string): Promise<{
  awarded: number;
  newAchievements: AchievementType[];
}> {
  const existingAchievements = await prisma.achievement.findMany({
    where: { associateId },
    select: { type: true },
  });

  const existingTypes = new Set(existingAchievements.map((a) => a.type));
  const newAchievements: AchievementType[] = [];

  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    // Skip if already earned
    if (existingTypes.has(definition.type)) {
      continue;
    }

    // Check if requirement is met
    const meets = await definition.checkFunction(associateId);
    if (meets) {
      // Award achievement
      await prisma.achievement.create({
        data: {
          associateId,
          type: definition.type,
          title: definition.title,
          description: definition.description,
          icon: definition.icon,
          points: definition.points,
        },
      });

      // Update associate rank points
      await prisma.associate.update({
        where: { id: associateId },
        data: {
          rankPoints: { increment: definition.points },
        },
      });

      newAchievements.push(definition.type);
    }
  }

  return {
    awarded: newAchievements.length,
    newAchievements,
  };
}

/**
 * Get all achievements for an associate
 */
export async function getAssociateAchievements(associateId: string) {
  return await prisma.achievement.findMany({
    where: { associateId },
    orderBy: { earnedAt: 'desc' },
  });
}

/**
 * Get achievement progress (which achievements are close to being earned)
 */
export async function getAchievementProgress(associateId: string): Promise<
  Array<{
    type: AchievementType;
    title: string;
    description: string;
    icon: string;
    points: number;
    earned: boolean;
    progress?: number; // 0-100 if applicable
  }>
> {
  const existingAchievements = await prisma.achievement.findMany({
    where: { associateId },
    select: { type: true },
  });

  const existingTypes = new Set(existingAchievements.map((a) => a.type));

  const progress: Array<{
    type: AchievementType;
    title: string;
    description: string;
    icon: string;
    points: number;
    earned: boolean;
    progress?: number;
  }> = [];

  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    const earned = existingTypes.has(definition.type);
    let progressValue: number | undefined;

    // Calculate progress for some achievements
    if (!earned) {
      if (definition.type === 'TEN_SALES') {
        const sales = await prisma.sale.count({
          where: { associateId, status: 'completed' },
        });
        progressValue = Math.min((sales / 10) * 100, 100);
      } else if (definition.type === 'THREE_RECRUITS') {
        const recruits = await prisma.associate.count({
          where: { sponsorId: associateId },
        });
        progressValue = Math.min((recruits / 3) * 100, 100);
      } else if (definition.type === 'THOUSAND_EARNED') {
        const associate = await prisma.associate.findUnique({
          where: { id: associateId },
          select: { totalEarnings: true },
        });
        const earnings = associate?.totalEarnings || 0;
        progressValue = Math.min((earnings / 1000) * 100, 100);
      }
    }

    progress.push({
      type: definition.type,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
      points: definition.points,
      earned,
      progress: progressValue,
    });
  }

  return progress;
}

