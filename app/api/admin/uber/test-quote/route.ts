import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import { getUberAccessToken, isUberDirectConfigured } from '@/lib/uber/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    if (!isUberDirectConfigured()) {
      return NextResponse.json({
        deliveryFee: 6.99,
        etaMinutes: 30,
        mode: 'mock',
        message: 'Uber Direct not configured. Using mock data.',
      });
    }

    const accessToken = await getUberAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to authenticate with Uber Direct' },
        { status: 500 }
      );
    }

    // Test quote with sample addresses
    const testRequest = {
      pickup_address: `${tenant.addressLine1 || '123 Main St'}, ${tenant.city || 'San Francisco'}, ${tenant.state || 'CA'} ${tenant.postalCode || '94102'}`,
      dropoff_address: '456 Market St, San Francisco, CA 94103',
      order_value: 25.00,
    };

    // Note: Actual API endpoint will be provided by Uber after partnership
    // For now, return mock data
    return NextResponse.json({
      deliveryFee: 6.99,
      etaMinutes: 30,
      mode: 'test',
      message: 'Test quote generated. Actual API integration pending partnership approval.',
    });
  } catch (error: any) {
    console.error('[Uber Direct Test Quote] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate test quote' },
      { status: 500 }
    );
  }
}

