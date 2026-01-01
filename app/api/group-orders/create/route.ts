import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantByRequest } from '@/lib/tenant';
import { getCustomerFromRequest } from '@/lib/customer-auth';
import { v4 as uuidv4 } from 'uuid';
import { sendGroupOrderInvitationEmail, getTenantFromAddress, getTenantReplyTo } from '@/lib/email-service';

// Generate a short, readable session code
function generateSessionCode(tenantSlug: string): string {
  const prefix = tenantSlug.substring(0, 2).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${randomPart}`;
}

interface Invitee {
  name: string;
  email: string;
  contactId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantByRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Try to get logged-in customer (optional)
    const customer = await getCustomerFromRequest(request);

    const body = await request.json();
    const {
      name, // Legacy field
      companyName, // New field - Company/Office name
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
      // Invitees for the group order
      invitees = [] as Invitee[],
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

    // Use companyName if provided, fall back to name for backwards compatibility
    const effectiveCompanyName = companyName || name || null;

    // Create the group order
    const groupOrder = await prisma.groupOrder.create({
      data: {
        tenantId: tenant.id,
        sessionCode,
        name: effectiveCompanyName, // Legacy field for backwards compatibility
        companyName: effectiveCompanyName,
        organizerName,
        organizerEmail,
        organizerPhone,
        organizerCustomerId: customer?.id || null,
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

    // If customer is logged in and companyName is provided, save it for future auto-seeding
    if (customer && effectiveCompanyName) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { companyName: effectiveCompanyName },
      });
    }

    // Build shareable link using custom domain or default
    const domain = tenant.customDomain || `${tenant.slug}.alessa.app`;
    const baseShareableLink = `https://${domain}/group/${sessionCode}`;

    // Create invitations if any invitees provided
    let invitationsCreated = 0;
    let emailsSent = 0;
    if (invitees.length > 0) {
      const invitationData = invitees
        .filter((inv: Invitee) => inv.email && inv.name)
        .map((inv: Invitee) => ({
          groupOrderId: groupOrder.id,
          contactId: inv.contactId || null,
          email: inv.email.trim().toLowerCase(),
          name: inv.name.trim(),
          token: uuidv4(),
          status: 'pending',
        }));

      if (invitationData.length > 0) {
        await prisma.groupOrderInvitation.createMany({
          data: invitationData,
          skipDuplicates: true,
        });
        invitationsCreated = invitationData.length;

        // Get email configuration for this tenant
        const tenantForEmail = {
          name: tenant.name,
          emailDomainVerified: (tenant as { emailDomainVerified?: boolean }).emailDomainVerified,
          customDomain: tenant.customDomain,
          contactEmail: tenant.contactEmail,
        };
        const fromAddress = getTenantFromAddress(tenantForEmail);
        const replyTo = getTenantReplyTo(tenantForEmail);

        // Send invitation emails (don't block response, fire and forget)
        for (const inv of invitationData) {
          const inviteUrl = `${baseShareableLink}?t=${inv.token}`;
          sendGroupOrderInvitationEmail({
            to: inv.email,
            recipientName: inv.name,
            organizerName,
            companyName: effectiveCompanyName || 'Team',
            tenantName: tenant.name,
            tenantLogo: tenant.logoUrl,
            groupOrderUrl: inviteUrl,
            expiresAt,
            sponsorName: isSponsoredOrder ? (sponsorName || organizerName) : null,
            primaryColor: tenant.primaryColor || '#dc2626',
            fromAddress,
            replyTo,
          })
            .then(() => {
              console.log(`[Group Orders] Invitation email sent to ${inv.email}`);
            })
            .catch((err) => {
              console.error(`[Group Orders] Failed to send invitation email to ${inv.email}:`, err);
            });
          emailsSent++;
        }
      }
    }

    return NextResponse.json({
      id: groupOrder.id,
      sessionCode: groupOrder.sessionCode,
      name: groupOrder.name,
      companyName: groupOrder.companyName,
      organizerName: groupOrder.organizerName,
      fulfillmentMethod: groupOrder.fulfillmentMethod,
      scheduledPickupTime: groupOrder.scheduledPickupTime,
      expiresAt: groupOrder.expiresAt,
      shareableLink: baseShareableLink,
      status: groupOrder.status,
      // "I'm Buying" feature
      isSponsoredOrder: groupOrder.isSponsoredOrder,
      sponsorName: groupOrder.sponsorName,
      // Invitation info
      invitationsCreated,
      emailsSent,
    });
  } catch (error) {
    console.error('[Group Orders] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create group order' },
      { status: 500 }
    );
  }
}
