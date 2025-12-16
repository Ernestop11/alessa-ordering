import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export async function POST(req: Request) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();
    const { email, phone } = body;

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });
    }

    // Find customer by email or phone
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          email ? { email: { equals: email, mode: 'insensitive' } } : undefined,
          phone ? { phone } : undefined,
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

    response.cookies.set('customer_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[rewards-login] Error:', err);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
