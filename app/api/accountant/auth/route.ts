import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/accountant/auth
 * 
 * Request magic link for accountant login
 * Body: { email }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find or create accountant
    let accountant = await prisma.accountant.findUnique({
      where: { email },
    });

    if (!accountant) {
      accountant = await prisma.accountant.create({
        data: {
          email,
          name: email.split('@')[0], // Default name from email
        },
      });
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.accountant.update({
      where: { id: accountant.id },
      data: {
        magicLinkToken: token,
        magicLinkExpiry: expiresAt,
      },
    });

    // TODO: Send magic link email
    // For now, return the token in development
    const magicLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/accountant/login?token=${token}`;

    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        message: 'Magic link generated (development mode)',
        magicLink, // Only in dev
      });
    }

    // In production, email would be sent here
    return NextResponse.json({
      message: 'Magic link sent to your email',
    });
  } catch (error: any) {
    console.error('[accountant-auth] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate magic link' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/accountant/auth?token={magicLinkToken}
 * 
 * Verify magic link token and return session
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const accountant = await prisma.accountant.findFirst({
      where: {
        magicLinkToken: token,
        magicLinkExpiry: { gt: new Date() },
      },
      include: {
        tenantAccess: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!accountant) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Clear token after use
    await prisma.accountant.update({
      where: { id: accountant.id },
      data: {
        magicLinkToken: null,
        magicLinkExpiry: null,
      },
    });

    // Return accountant data (in production, create a proper session)
    return NextResponse.json({
      accountant: {
        id: accountant.id,
        email: accountant.email,
        name: accountant.name,
        firmName: accountant.firmName,
        tenants: accountant.tenantAccess.map((access) => ({
          tenantId: access.tenantId,
          tenantName: access.tenant.name,
          tenantSlug: access.tenant.slug,
          accessLevel: access.accessLevel,
        })),
      },
    });
  } catch (error: any) {
    console.error('[accountant-auth] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify token' },
      { status: 500 }
    );
  }
}

