import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const UBER_CLIENT_ID = process.env.UBER_CLIENT_ID;
const UBER_CLIENT_SECRET = process.env.UBER_CLIENT_SECRET;
const BASE_URL = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3001';

/**
 * GET /api/delivery/uber/callback
 *
 * Handles Uber OAuth callback:
 * 1. Verifies state token matches session
 * 2. Exchanges authorization code for access/refresh tokens
 * 3. Saves tokens to TenantIntegration
 * 4. Redirects to admin delivery setup page
 */
export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
      return NextResponse.redirect(`${BASE_URL}/admin/login?error=unauthorized`);
    }

    if (!UBER_CLIENT_ID || !UBER_CLIENT_SECRET) {
      return NextResponse.redirect(
        `${BASE_URL}/admin/delivery/setup?partner=uber&status=error&message=${encodeURIComponent('Uber credentials not configured')}`
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      return NextResponse.redirect(
        `${BASE_URL}/admin/delivery/setup?partner=uber&status=error&message=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${BASE_URL}/admin/delivery/setup?partner=uber&status=error&message=${encodeURIComponent('Missing authorization code or state')}`
      );
    }

    // Verify state token
    const storedState = cookies().get('uber_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${BASE_URL}/admin/delivery/setup?partner=uber&status=error&message=${encodeURIComponent('Invalid state token')}`
      );
    }

    // Decode state to get tenantId
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
    } catch (e) {
      return NextResponse.redirect(
        `${BASE_URL}/admin/delivery/setup?partner=uber&status=error&message=${encodeURIComponent('Invalid state format')}`
      );
    }

    const tenantId = stateData.tenantId;
    if (!tenantId) {
      return NextResponse.redirect(
        `${BASE_URL}/admin/delivery/setup?partner=uber&status=error&message=${encodeURIComponent('Missing tenant ID in state')}`
      );
    }

    // Clear state cookie
    cookies().delete('uber_oauth_state');

    // Exchange authorization code for tokens
    const redirectUri = `${BASE_URL}/api/delivery/uber/callback`;
    const tokenResponse = await fetch('https://login.uber.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: UBER_CLIENT_ID,
        client_secret: UBER_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[uber-callback] Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${BASE_URL}/admin/delivery/setup?partner=uber&status=error&message=${encodeURIComponent('Failed to exchange authorization code')}`
      );
    }

    const tokenData = await tokenResponse.json();
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    } = tokenData;

    if (!accessToken) {
      return NextResponse.redirect(
        `${BASE_URL}/admin/delivery/setup?partner=uber&status=error&message=${encodeURIComponent('No access token received')}`
      );
    }

    // Calculate expiration time
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    // Fetch merchant/account info from Uber API (optional, for merchantId)
    let merchantId: string | undefined;
    try {
      // This is a placeholder - actual endpoint depends on Uber Direct API
      // You may need to call GET /v1/eats/merchants/me or similar
      const merchantResponse = await fetch('https://api.uber.com/v1/eats/merchants/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (merchantResponse.ok) {
        const merchantData = await merchantResponse.json();
        merchantId = merchantData.id || merchantData.merchant_id;
      }
    } catch (e) {
      console.warn('[uber-callback] Could not fetch merchant info:', e);
      // Continue without merchantId
    }

    // Update or create TenantIntegration
    await prisma.tenantIntegration.upsert({
      where: { tenantId },
      create: {
        tenantId,
        uberOAuthAccessToken: accessToken,
        uberOAuthRefreshToken: refreshToken || undefined,
        uberOAuthExpiresAt: expiresAt,
        uberMerchantId: merchantId,
        uberOnboardingStatus: 'connected',
      },
      update: {
        uberOAuthAccessToken: accessToken,
        uberOAuthRefreshToken: refreshToken || undefined,
        uberOAuthExpiresAt: expiresAt,
        uberMerchantId: merchantId,
        uberOnboardingStatus: 'connected',
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      `${BASE_URL}/admin/delivery/setup?partner=uber&status=success`
    );
  } catch (error: any) {
    console.error('[uber-callback] Error:', error);
    return NextResponse.redirect(
      `${BASE_URL}/admin/delivery/setup?partner=uber&status=error&message=${encodeURIComponent(error.message || 'Unknown error')}`
    );
  }
}

