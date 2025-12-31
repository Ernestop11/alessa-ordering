import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        customDomain: true,
        resendDomainId: true,
        emailDomainVerified: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // If no domain configured
    if (!tenant.resendDomainId) {
      return NextResponse.json({
        configured: false,
        verified: false,
        domain: null,
        records: [],
        message: 'No custom email domain configured',
      });
    }

    // Get domain info from Resend
    if (!resend) {
      return NextResponse.json({
        configured: true,
        verified: tenant.emailDomainVerified,
        domain: tenant.customDomain,
        records: [],
        message: 'Resend API key not configured - cannot fetch DNS records',
      });
    }

    const domainInfo = await resend.domains.get(tenant.resendDomainId);

    if (domainInfo.error) {
      console.error('[email-domain] Resend get error:', domainInfo.error);
      return NextResponse.json({
        configured: true,
        verified: tenant.emailDomainVerified,
        domain: tenant.customDomain,
        records: [],
        error: domainInfo.error.message,
      });
    }

    // Sync verification status if it changed
    const isVerified = domainInfo.data?.status === 'verified';
    if (isVerified !== tenant.emailDomainVerified) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { emailDomainVerified: isVerified },
      });
    }

    return NextResponse.json({
      configured: true,
      verified: isVerified,
      domain: tenant.customDomain,
      status: domainInfo.data?.status,
      records: domainInfo.data?.records || [],
    });
  } catch (error) {
    console.error('[email-domain] Status error:', error);
    return NextResponse.json(
      { error: 'Failed to get email domain status' },
      { status: 500 }
    );
  }
}
