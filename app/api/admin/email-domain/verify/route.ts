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

    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    // Get tenant with Resend domain ID
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    if (!tenant.resendDomainId) {
      return NextResponse.json(
        { error: 'No email domain configured for this tenant' },
        { status: 400 }
      );
    }

    // Verify domain with Resend
    const result = await resend.domains.verify(tenant.resendDomainId);

    if (result.error) {
      console.error('[email-domain] Resend verify error:', result.error);
      return NextResponse.json(
        { error: result.error.message || 'Failed to verify domain' },
        { status: 400 }
      );
    }

    // Get updated domain status
    const domainInfo = await resend.domains.get(tenant.resendDomainId);
    const isVerified = domainInfo.data?.status === 'verified';

    // Update tenant verification status
    if (isVerified) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { emailDomainVerified: true },
      });
    }

    return NextResponse.json({
      success: true,
      verified: isVerified,
      status: domainInfo.data?.status,
      records: domainInfo.data?.records || [],
      message: isVerified
        ? 'Domain verified! Emails will now send from your custom domain.'
        : 'Domain not yet verified. Please add all DNS records and try again.',
    });
  } catch (error) {
    console.error('[email-domain] Verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email domain' },
      { status: 500 }
    );
  }
}
