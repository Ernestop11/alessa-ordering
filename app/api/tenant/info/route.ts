import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';

export async function GET(req: Request) {
  try {
    const tenant = await requireTenant();

    return NextResponse.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      primaryColor: tenant.primaryColor || '#dc2626',
      secondaryColor: tenant.secondaryColor || '#f59e0b',
    });
  } catch (error: any) {
    console.error('[Tenant Info API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant info' },
      { status: 500 }
    );
  }
}

