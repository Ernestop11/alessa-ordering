import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accountant/verify?token={magicLinkToken}
 * 
 * Verify magic link token and create session cookie
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

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store session in cookie
    cookies().set({
      name: 'accountant_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Clear magic link token from database
    await prisma.accountant.update({
      where: { id: accountant.id },
      data: {
        magicLinkToken: null,
        magicLinkExpiry: null,
      },
    });

    // In production, store session in database or use JWT
    // For now, we'll encode accountant ID in the cookie value (in production, use proper session storage)

    // Redirect to dashboard
    return NextResponse.redirect(`${req.nextUrl.origin}/accountant/dashboard?accountantId=${accountant.id}`);
  } catch (error: any) {
    console.error('[accountant-verify] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify token' },
      { status: 500 }
    );
  }
}

