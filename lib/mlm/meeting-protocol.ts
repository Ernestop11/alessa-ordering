/**
 * Meeting Protocol System
 * 
 * MLM Best Practice: Get new recruits to a meeting ASAP
 * Based on principles from Jim Rohn, John Maxwell, etc.
 */

import prisma from '../prisma';

export interface MeetingInvitation {
  meetingId: string;
  associateId: string;
  priority: 'urgent' | 'high' | 'normal';
  message: string;
  autoSchedule: boolean; // Auto-schedule next available meeting
}

/**
 * Create urgent meeting invitation for new recruit
 * MLM Principle: "Get them to a meeting within 48 hours"
 */
export async function createUrgentMeetingInvitation(
  newRecruitId: string,
  sponsorId: string
): Promise<MeetingInvitation | null> {
  try {
    // Find or create next available team meeting
    const nextMeeting = await prisma.meeting.findFirst({
      where: {
        hostId: sponsorId,
        type: 'recruiting',
        status: 'scheduled',
        scheduledAt: {
          gte: new Date(),
        },
      },
      include: {
        attendees: true,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    // If no meeting found or meeting is full, create one for 48 hours from now
    let meetingId: string;
    const shouldCreateNew = !nextMeeting || 
      (nextMeeting.maxAttendees && nextMeeting.attendees.length >= nextMeeting.maxAttendees);

    if (shouldCreateNew) {
      const newMeeting = await prisma.meeting.create({
        data: {
          title: 'New Recruit Orientation',
          description: 'Welcome meeting for new associates. Learn about the opportunity, products, and how to get started.',
          type: 'recruiting',
          hostId: sponsorId,
          scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
          duration: 60,
          status: 'scheduled',
          maxAttendees: 20,
        },
      });
      meetingId = newMeeting.id;
    } else {
      meetingId = nextMeeting.id;
    }

    // Create attendee invitation
    await prisma.meetingAttendee.create({
      data: {
        meetingId,
        associateId: newRecruitId,
        status: 'invited',
      },
    });

    // Send urgent message
    await prisma.teamMessage.create({
      data: {
        senderId: sponsorId,
        recipientId: newRecruitId,
        subject: '🎯 Welcome! Your First Meeting is Scheduled',
        content: `Welcome to the team! I've scheduled your first orientation meeting. This is your opportunity to learn about our products, the compensation plan, and how to build your business. See you there!`,
        type: 'invitation',
        priority: 'urgent',
      },
    });

    return {
      meetingId,
      associateId: newRecruitId,
      priority: 'urgent',
      message: 'Meeting scheduled within 48 hours',
      autoSchedule: true,
    };
  } catch (error) {
    console.error('Error creating meeting invitation:', error);
    return null;
  }
}

/**
 * Get upcoming meetings for an associate
 */
export async function getUpcomingMeetings(associateId: string) {
  const attendees = await prisma.meetingAttendee.findMany({
    where: {
      associateId,
      status: { in: ['invited', 'confirmed'] },
      meeting: {
        scheduledAt: {
          gte: new Date(),
        },
        status: 'scheduled',
      },
    },
    include: {
      meeting: {
        include: {
          host: {
            select: {
              id: true,
              name: true,
              rank: true,
            },
          },
        },
      },
    },
    orderBy: {
      meeting: {
        scheduledAt: 'asc',
      },
    },
  });

  // Format for frontend
  return attendees.map((att) => ({
    id: att.meeting.id,
    title: att.meeting.title,
    description: att.meeting.description,
    type: att.meeting.type,
    scheduledAt: att.meeting.scheduledAt.toISOString(),
    duration: att.meeting.duration,
    meetingUrl: att.meeting.meetingUrl,
    location: att.meeting.location,
    status: att.meeting.status,
    host: att.meeting.host,
    attendeeStatus: att.status,
    confirmedAt: att.confirmedAt?.toISOString() || null,
  }));
}
