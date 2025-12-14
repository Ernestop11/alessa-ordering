import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { getCustomerFromCookie } from '../../../../lib/auth/customer';

export async function GET() {
  try {
    const tenant = await requireTenant();
    const customer = await getCustomerFromCookie(tenant.id);

    if (!customer) {
      return NextResponse.json({ accessibility: null, loyaltyPoints: 0, membershipTier: null }, { status: 200 });
    }

    return NextResponse.json({
      accessibility: customer.accessibilityPreferences ?? null,
      loyaltyPoints: customer.loyaltyPoints ?? 0,
      membershipTier: customer.membershipTier ?? null,
    });
  } catch (error) {
    // If tenant resolution fails or any other error occurs, return default values
    // This prevents 401/500 errors when tenant is not found or other issues occur
    console.error('[customer/preferences] GET error:', error);
    return NextResponse.json({ accessibility: null, loyaltyPoints: 0, membershipTier: null }, { status: 200 });
  }
}

export async function PATCH(req: Request) {
  try {
    const tenant = await requireTenant();
    const customer = await getCustomerFromCookie(tenant.id);

    if (!customer) {
      // Return 200 OK with no action - this prevents 401 errors in console for anonymous users
      // Accessibility preferences are still saved in localStorage for non-authenticated users
      return NextResponse.json({ ok: true, message: 'No customer session - preferences saved locally only' }, { status: 200 });
    }

    const body = await req.json();
    const accessibility = body?.accessibility ?? null;

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        accessibilityPreferences: accessibility,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[customer/preferences] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
