import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await req.json();
    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Client ID and Client Secret are required' },
        { status: 400 }
      );
    }

    // Test the credentials by attempting to get an access token
    try {
      const testResponse = await fetch('https://sandbox-api.uber.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'eats.deliveries',
        }),
      });

      // If sandbox fails, try production
      let isSandbox = true;
      if (!testResponse.ok) {
        const prodResponse = await fetch('https://api.uber.com/v1/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            scope: 'eats.deliveries',
          }),
        });
        
        if (!prodResponse.ok) {
          const errorText = await prodResponse.text();
          throw new Error(`Invalid credentials: ${errorText}`);
        }
        isSandbox = false;
      }
    } catch (error: any) {
      console.error('[Uber Direct Connect] Credential test failed:', error);
      return NextResponse.json(
        { error: `Failed to verify credentials: ${error.message}` },
        { status: 400 }
      );
    }

    // Update or create integration record
    const integration = await prisma.tenantIntegration.upsert({
      where: { tenantId: tenant.id },
      update: {
        uberClientId: clientId,
        uberClientSecret: clientSecret, // In production, encrypt this
        uberSandbox: true, // Default to sandbox, can be updated later
      },
      create: {
        tenantId: tenant.id,
        uberClientId: clientId,
        uberClientSecret: clientSecret, // In production, encrypt this
        uberSandbox: true,
      },
    });

    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'uber',
        message: 'Uber Direct account connected',
        payload: {
          clientId: clientId.substring(0, 10) + '...',
          sandbox: true,
        },
      },
    });

    return NextResponse.json({
      success: true,
      connected: true,
      clientId: integration.uberClientId,
      sandbox: integration.uberSandbox,
    });
  } catch (error: any) {
    console.error('[Uber Direct Connect] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect Uber Direct' },
      { status: 500 }
    );
  }
}












