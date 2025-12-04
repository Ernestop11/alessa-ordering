/**
 * Upline System
 * 
 * Get upline chain (sponsor and all ancestors)
 */

import prisma from '../prisma';

export interface UplineNode {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  rank: string;
  level: number;
  totalEarnings: number;
  totalRecruits: number;
  activeRecruits: number;
  sponsorId: string | null;
}

/**
 * Get full upline chain for an associate
 */
export async function getUplineChain(associateId: string): Promise<UplineNode[]> {
  const chain: UplineNode[] = [];
  let currentId: string | null = associateId;

  while (currentId) {
    const associate = await prisma.associate.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        rank: true,
        level: true,
        totalEarnings: true,
        totalRecruits: true,
        activeRecruits: true,
        sponsorId: true,
      },
    });

    if (!associate) break;

    chain.push({
      id: associate.id,
      name: associate.name,
      email: associate.email,
      referralCode: associate.referralCode,
      rank: associate.rank,
      level: associate.level,
      totalEarnings: associate.totalEarnings,
      totalRecruits: associate.totalRecruits,
      activeRecruits: associate.activeRecruits,
      sponsorId: associate.sponsorId,
    });

    currentId = associate.sponsorId;
  }

  return chain.reverse(); // Return from top (founder) to bottom (current)
}

/**
 * Get immediate sponsor
 */
export async function getSponsor(associateId: string): Promise<UplineNode | null> {
  const associate = await prisma.associate.findUnique({
    where: { id: associateId },
    select: { sponsorId: true },
  });

  if (!associate || !associate.sponsorId) {
    return null;
  }

  const sponsor = await prisma.associate.findUnique({
    where: { id: associate.sponsorId },
    select: {
      id: true,
      name: true,
      email: true,
      referralCode: true,
      rank: true,
      level: true,
      totalEarnings: true,
      totalRecruits: true,
      activeRecruits: true,
      sponsorId: true,
    },
  });

  if (!sponsor) return null;

  return {
    id: sponsor.id,
    name: sponsor.name,
    email: sponsor.email,
    referralCode: sponsor.referralCode,
    rank: sponsor.rank,
    level: sponsor.level,
    totalEarnings: sponsor.totalEarnings,
    activeRecruits: sponsor.activeRecruits,
    totalRecruits: sponsor.totalRecruits,
    sponsorId: sponsor.sponsorId,
  };
}

