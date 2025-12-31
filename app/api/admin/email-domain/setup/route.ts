import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      );
    }

    const { tenantId, domain } = await request.json();

    if (!tenantId || !domain) {
      return NextResponse.json(
        { error: 'Missing tenantId or domain' },
        { status: 400 }
      );
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Add domain to Resend
    const result = await resend.domains.create({ name: domain });

    if (result.error) {
      console.error('[email-domain] Resend error:', result.error);
      return NextResponse.json(
        { error: result.error.message || 'Failed to add domain to Resend' },
        { status: 400 }
      );
    }

    // Update tenant with Resend domain ID
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        customDomain: domain,
        resendDomainId: result.data?.id,
        emailDomainVerified: false,
      },
    });

    return NextResponse.json({
      success: true,
      domainId: result.data?.id,
      records: result.data?.records || [],
      message: 'Domain added. Add the DNS records shown below to verify.',
    });
  } catch (error) {
    console.error('[email-domain] Setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup email domain' },
      { status: 500 }
    );
  }
}
