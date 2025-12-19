import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { clearUberTokenCache } from '@/lib/uber/auth';

/**
 * Connect Uber Direct Account
 *
 * Each tenant can have their own Uber Direct account (like Stripe Connect).
 * Required credentials from Uber Direct Dashboard > Developer tab:
 * - Client ID
 * - Client Secret
 * - Customer ID
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await req.json();
    const { clientId, clientSecret, customerId, sandbox = true } = body;

    if (!clientId || !clientSecret || !customerId) {
      return NextResponse.json(
        { error: 'Client ID, Client Secret, and Customer ID are required' },
        { status: 400 }
      );
    }

    // Test the credentials by attempting to get an access token
    let isSandbox = sandbox;
    try {
      // Uber Direct uses the standard auth endpoint
      const tokenUrl = 'https://auth.uber.com/oauth/v2/token';

      const testResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
          scope: 'eats.deliveries',
        }),
      });

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        throw new Error(`Invalid credentials: ${errorText}`);
      }

      // Credentials are valid, now verify we can access the customer account
      const tokenData = await testResponse.json();
      const accessToken = tokenData.access_token;

      // Test getting quotes endpoint (just to verify customerId is valid)
      const customerTestUrl = `https://api.uber.com/v1/customers/${customerId}`;
      const customerResponse = await fetch(customerTestUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // 404 means invalid customer ID
      if (customerResponse.status === 404) {
        throw new Error('Invalid Customer ID - please check your Uber Direct Dashboard');
      }

    } catch (error: unknown) {
      console.error('[Uber Direct Connect] Credential test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: `Failed to verify credentials: ${errorMessage}` },
        { status: 400 }
      );
    }

    // Clear any cached tokens for this tenant
    clearUberTokenCache(tenant.id);

    // Update or create integration record
    const integration = await prisma.tenantIntegration.upsert({
      where: { tenantId: tenant.id },
      update: {
        uberClientId: clientId,
        uberClientSecret: clientSecret, // In production, encrypt this
        uberCustomerId: customerId,
        uberSandbox: isSandbox,
      },
      create: {
        tenantId: tenant.id,
        uberClientId: clientId,
        uberClientSecret: clientSecret, // In production, encrypt this
        uberCustomerId: customerId,
        uberSandbox: isSandbox,
      },
    });

    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'uber',
        message: 'Uber Direct account connected',
        payload: {
          clientId: clientId.substring(0, 10) + '...',
          customerId: customerId.substring(0, 10) + '...',
          sandbox: isSandbox,
        },
      },
    });

    return NextResponse.json({
      success: true,
      connected: true,
      clientId: integration.uberClientId?.substring(0, 10) + '...',
      customerId: integration.uberCustomerId?.substring(0, 10) + '...',
      sandbox: integration.uberSandbox,
    });
  } catch (error: unknown) {
    console.error('[Uber Direct Connect] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect Uber Direct';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}















