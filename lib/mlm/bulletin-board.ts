/**
 * Bulletin Board System
 *
 * Announcements, updates, and team communications
 */

import prisma from '../prisma';
import { AssociateRank } from '@prisma/client';

export interface AnnouncementFilters {
  type?: string;
  priority?: string;
  unreadOnly?: boolean;
  associateId: string;
}

/**
 * Get announcements for an associate
 * Filters by target audience (rank, team, all)
 */
export async function getAnnouncementsForAssociate(
  associateId: string,
  filters?: AnnouncementFilters
) {
  const associate = await prisma.associate.findUnique({
    where: { id: associateId },
    select: { rank: true, sponsorId: true },
  });

  if (!associate) {
    return [];
  }

  const where: any = {
    OR: [
      { targetAudience: null }, // All
      { targetAudience: 'all' },
    ],
    expiresAt: {
      OR: [
        { gte: new Date() },
        null,
      ],
    },
  };

  // Add rank-based targeting
  const rankHierarchy = ['REP', 'SENIOR_REP', 'SUPERVISOR', 'MANAGER', 'SENIOR_MANAGER', 'DIRECTOR', 'SENIOR_DIRECTOR', 'VP', 'SVP'];
  const currentRankIndex = rankHierarchy.indexOf(associate.rank);
  
  // Add announcements for current rank and below
  for (let i = currentRankIndex; i < rankHierarchy.length; i++) {
    where.OR.push({
      targetAudience: {
        startsWith: `rank:${rankHierarchy[i]}`,
      },
    });
  }

  // Add team-based targeting (sponsor's announcements)
  if (associate.sponsorId) {
    where.OR.push({
      targetAudience: `team:${associate.sponsorId}`,
    });
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.priority) {
    where.priority = filters.priority;
  }

  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      readBy: {
        where: { associateId },
        select: { readAt: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  // Mark unread status
  return announcements.map((announcement) => ({
    ...announcement,
    read: announcement.readBy.length > 0,
    readAt: announcement.readBy[0]?.readAt || null,
  }));
}

/**
 * Mark announcement as read
 */
export async function markAnnouncementRead(announcementId: string, associateId: string) {
  await prisma.announcementRead.upsert({
    where: {
      announcementId_associateId: {
        announcementId,
        associateId,
      },
    },
    create: {
      announcementId,
      associateId,
    },
    update: {},
  });
}

/**
 * Create announcement (for super admin or team leaders)
 */
export async function createAnnouncement(data: {
  title: string;
  content: string;
  type: string;
  priority: string;
  targetAudience?: string;
  authorId?: string;
  expiresAt?: Date;
}) {
  return await prisma.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      type: data.type,
      priority: data.priority,
      targetAudience: data.targetAudience || null,
      authorId: data.authorId || null,
      expiresAt: data.expiresAt || null,
    },
  });
}
