import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const UBER_CLIENT_ID = process.env.UBER_CLIENT_ID;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3001';

/**
 * GET /api/delivery/uber/oauth
 *
 * Initiates Uber Direct OAuth flow by:
 * 1. Generating a secure state token with tenantId
 * 2. Building Uber authorization URL
 * 3. Redirecting to Uber authorization page
 */
export async function GET() {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!UBER_CLIENT_ID) {
      return NextResponse.json({ error: 'Uber client ID not configured' }, { status: 500 });
    }

    const tenant = await requireTenant();

    // Generate state token: base64 encoded JSON with tenantId and nonce
    const stateData = {
      tenantId: tenant.id,
      nonce: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    const stateToken = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    // Store state token in httpOnly cookie (expires in 10 minutes)
    cookies().set({
      name: 'uber_oauth_state',
      value: stateToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Build Uber authorization URL
    const redirectUri = `${BASE_URL}/api/delivery/uber/callback`;
    const scope = 'eats.deliveries';
    const authUrl = `https://login.uber.com/oauth/v2/authorize?${new URLSearchParams({
      client_id: UBER_CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scope,
      state: stateToken,
    }).toString()}`;

    // Redirect to Uber authorization page
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('[uber-oauth] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Uber OAuth' },
      { status: 500 }
    );
  }
}

