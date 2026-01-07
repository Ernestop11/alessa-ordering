import { NextResponse } from 'next/server';

// DEPRECATED: This endpoint is deprecated for security reasons.
// Use /api/track/[tenantSlug]/[orderId] instead to ensure tenant isolation.
// This prevents cross-tenant data access where users could track orders from other tenants.

export async function GET() {
  return NextResponse.json(
    {
      error: 'This endpoint is deprecated for security reasons',
      message: 'Use /api/track/{tenantSlug}/{orderId} for tenant-scoped order tracking',
    },
    { status: 410 } // 410 Gone - resource no longer available
  );
}
