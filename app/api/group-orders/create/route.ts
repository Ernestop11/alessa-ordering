import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantByRequest } from '@/lib/tenant';

// Generate a short, readable session code
function generateSessionCode(tenantSlug: string): string {
  const prefix = tenantSlug.substring(0, 2).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${randomPart}`;
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantByRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      organizerName,
      organizerEmail,
      organizerPhone,
      fulfillmentMethod = 'pickup',
      deliveryAddress,
      scheduledPickupTime,
      expiresInHours = 2,
      // "I'm Buying" feature
      isSponsoredOrder = false,
      sponsorName,
    } = body;

    // Validate required fields
    if (!organizerName) {
      return NextResponse.json(
        { error: 'Organizer name is required' },
        { status: 400 }
      );
    }

    // Generate unique session code
    let sessionCode = generateSessionCode(tenant.slug);
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.groupOrder.findUnique({
        where: { sessionCode },
      });
      if (!existing) break;
      sessionCode = generateSessionCode(tenant.slug);
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'Unable to generate unique session code' },
        { status: 500 }
      );
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Create the group order
    const groupOrder = await prisma.groupOrder.create({
      data: {
        tenantId: tenant.id,
        sessionCode,
        name: name || 'Group Order',
        organizerName,
        organizerEmail,
        organizerPhone,
        fulfillmentMethod,
        deliveryAddress,
        scheduledPickupTime: scheduledPickupTime ? new Date(scheduledPickupTime) : null,
        expiresAt,
        status: 'open',
        // "I'm Buying" feature
        isSponsoredOrder: Boolean(isSponsoredOrder),
        sponsorName: isSponsoredOrder ? (sponsorName || organizerName) : null,
      },
    });

    // Build shareable link using custom domain or default
    const domain = tenant.customDomain || `${tenant.slug}.alessa.app`;
    const shareableLink = `https://${domain}/group/${sessionCode}`;

    return NextResponse.json({
      id: groupOrder.id,
      sessionCode: groupOrder.sessionCode,
      name: groupOrder.name,
      organizerName: groupOrder.organizerName,
      fulfillmentMethod: groupOrder.fulfillmentMethod,
      scheduledPickupTime: groupOrder.scheduledPickupTime,
      expiresAt: groupOrder.expiresAt,
      shareableLink,
      status: groupOrder.status,
      // "I'm Buying" feature
      isSponsoredOrder: groupOrder.isSponsoredOrder,
      sponsorName: groupOrder.sponsorName,
    });
  } catch (error) {
    console.error('[Group Orders] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create group order' },
      { status: 500 }
    );
  }
}
