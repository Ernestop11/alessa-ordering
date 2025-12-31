import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTenantByRequest } from '@/lib/tenant';
import { headers } from 'next/headers';
import GroupOrderJoinClient from './GroupOrderJoinClient';

interface PageProps {
  params: Promise<{ sessionCode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionCode } = await params;

  return {
    title: `Join Group Order - ${sessionCode}`,
    description: 'Join a group order and add your items',
  };
}

export default async function GroupOrderPage({ params }: PageProps) {
  const { sessionCode } = await params;
  const headersList = await headers();

  // Get tenant from request
  const host = headersList.get('host') || '';
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { customDomain: host },
        { slug: host.split('.')[0] },
      ],
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      slug: true,
      customDomain: true,
      primaryColor: true,
      secondaryColor: true,
      logo: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  // Find the group order
  const groupOrder = await prisma.groupOrder.findFirst({
    where: {
      sessionCode,
      tenantId: tenant.id,
    },
    select: {
      id: true,
      sessionCode: true,
      name: true,
      organizerName: true,
      fulfillmentMethod: true,
      scheduledPickupTime: true,
      status: true,
      expiresAt: true,
      orderCount: true,
      totalAmount: true,
      createdAt: true,
      // "I'm Buying" feature
      isSponsoredOrder: true,
      sponsorName: true,
    },
  });

  if (!groupOrder) {
    notFound();
  }

  // Check if expired
  const now = new Date();
  const isExpired = groupOrder.expiresAt < now;
  const isClosed = groupOrder.status !== 'open';

  // Calculate time remaining
  const timeRemainingMs = Math.max(0, groupOrder.expiresAt.getTime() - now.getTime());
  const timeRemainingMinutes = Math.floor(timeRemainingMs / 60000);

  return (
    <GroupOrderJoinClient
      tenant={{
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        logo: tenant.logo,
      }}
      groupOrder={{
        id: groupOrder.id,
        sessionCode: groupOrder.sessionCode,
        name: groupOrder.name,
        organizerName: groupOrder.organizerName,
        fulfillmentMethod: groupOrder.fulfillmentMethod,
        scheduledPickupTime: groupOrder.scheduledPickupTime?.toISOString() || null,
        status: groupOrder.status,
        expiresAt: groupOrder.expiresAt.toISOString(),
        orderCount: groupOrder.orderCount,
        isExpired,
        isClosed,
        timeRemainingMinutes,
        // "I'm Buying" feature
        isSponsoredOrder: groupOrder.isSponsoredOrder,
        sponsorName: groupOrder.sponsorName,
      }}
    />
  );
}
