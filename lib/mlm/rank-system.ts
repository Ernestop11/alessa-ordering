/**
 * MLM Rank System
 *
 * Handles rank promotion logic, requirements checking, and automatic promotions
 * NOTE: MLM models not yet fully added to schema - stubbed for now
 */

import { AssociateRank } from '@prisma/client';

export interface RankRequirements {
  rank: AssociateRank;
  minRecruits: number;
  minActiveRecruits: number;
  minSales: number;
  minEarnings: number;
  minManagersInDownline?: number;
  trainingRequired?: string[];
  description: string;
}

export const RANK_REQUIREMENTS: Record<AssociateRank, RankRequirements> = {
  REP: {
    rank: 'REP',
    minRecruits: 0,
    minActiveRecruits: 0,
    minSales: 0,
    minEarnings: 0,
    description: 'Entry level representative',
  },
  SENIOR_REP: {
    rank: 'SENIOR_REP',
    minRecruits: 1,
    minActiveRecruits: 1,
    minSales: 1,
    minEarnings: 0,
    description: 'Completed first sale and recruited first associate',
  },
  SUPERVISOR: {
    rank: 'SUPERVISOR',
    minRecruits: 3,
    minActiveRecruits: 3,
    minSales: 3,
    minEarnings: 500,
    description: '3 active recruits and $500 in sales',
  },
  MANAGER: {
    rank: 'MANAGER',
    minRecruits: 5,
    minActiveRecruits: 5,
    minSales: 10,
    minEarnings: 2000,
    description: '5 active recruits and $2000 in sales',
  },
  SENIOR_MANAGER: {
    rank: 'SENIOR_MANAGER',
    minRecruits: 10,
    minActiveRecruits: 8,
    minSales: 25,
    minEarnings: 5000,
    minManagersInDownline: 2,
    description: '10 recruits with 2 managers',
  },
  DIRECTOR: {
    rank: 'DIRECTOR',
    minRecruits: 25,
    minActiveRecruits: 20,
    minSales: 50,
    minEarnings: 10000,
    minManagersInDownline: 5,
    description: '25 recruits with 5 managers',
  },
  SENIOR_DIRECTOR: {
    rank: 'SENIOR_DIRECTOR',
    minRecruits: 50,
    minActiveRecruits: 40,
    minSales: 100,
    minEarnings: 25000,
    minManagersInDownline: 10,
    description: '50 recruits with 10 managers',
  },
  VP: {
    rank: 'VP',
    minRecruits: 100,
    minActiveRecruits: 75,
    minSales: 200,
    minEarnings: 50000,
    minManagersInDownline: 20,
    description: 'VP level achievement',
  },
  SVP: {
    rank: 'SVP',
    minRecruits: 200,
    minActiveRecruits: 150,
    minSales: 500,
    minEarnings: 100000,
    minManagersInDownline: 50,
    description: 'Senior VP achievement',
  },
};

/**
 * Get current rank requirements
 */
export function getRankRequirements(rank: AssociateRank): RankRequirements {
  return RANK_REQUIREMENTS[rank];
}

/**
 * Get next rank
 */
export function getNextRank(currentRank: AssociateRank): AssociateRank | null {
  const ranks = Object.keys(RANK_REQUIREMENTS) as AssociateRank[];
  const currentIndex = ranks.indexOf(currentRank);
  if (currentIndex === -1 || currentIndex === ranks.length - 1) {
    return null;
  }
  return ranks[currentIndex + 1];
}

/**
 * Check rank requirements
 */
export async function checkRankRequirements(
  associateId: string,
  rank: AssociateRank
): Promise<{ met: boolean; missing: string[] }> {
  // MLM models not yet in schema - return default
  return { met: false, missing: ['MLM system not yet available'] };
}

/**
 * Get rank progress
 */
export async function getRankProgress(associateId: string): Promise<{
  currentRank: AssociateRank;
  nextRank: AssociateRank | null;
  requirements: RankRequirements | null;
  progress: Record<string, { current: number; required: number }>;
  readyForPromotion: boolean;
}> {
  // MLM models not yet in schema - return default
  return {
    currentRank: 'REP',
    nextRank: 'SENIOR_REP',
    requirements: RANK_REQUIREMENTS.SENIOR_REP,
    progress: {},
    readyForPromotion: false,
  };
}

/**
 * Promote associate to next rank
 */
export async function promoteAssociate(
  associateId: string,
  newRank: AssociateRank
): Promise<boolean> {
  // MLM models not yet in schema - return false
  return false;
}
