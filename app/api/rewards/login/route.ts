import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

// Normalize phone number to digits only for consistent matching
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  // Return last 10 digits (removes country code if present)
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export async function POST(req: Request) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();
    const { email, phone } = body;

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);

    // Find customer by email or phone (case-insensitive email, normalized phone)
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          email ? { email: { equals: email, mode: 'insensitive' } } : undefined,
          normalizedPhone ? { phone: { contains: normalizedPhone } } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!customer) {
      return NextResponse.json({
        error: 'No account found with this email or phone. Please join our rewards program first!'
      }, { status: 404 });
    }

    // Create session
    const sessionToken = crypto.randomUUID();

    // Delete old sessions for this customer
    await prisma.customerSession.deleteMany({
      where: {
        tenantId: tenant.id,
        customerId: customer.id,
      },
    });

    // Create new session
    await prisma.customerSession.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    // Set cookie and return success
    const response = NextResponse.json({
      success: true,
      customerId: customer.id,
      name: customer.name,
      loyaltyPoints: customer.loyaltyPoints ?? 0,
      membershipTier: customer.membershipTier,
    });

    const expiresDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    response.cookies.set('customer_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60,
      expires: expiresDate,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[rewards-login] Error:', err);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
