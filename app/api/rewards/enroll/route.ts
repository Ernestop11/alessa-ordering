import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();
    const { email, phone, name } = body;

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          email ? { email } : undefined,
          phone ? { phone } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: name || null,
          email: email || null,
          phone: phone || null,
          loyaltyPoints: 0,
          membershipTier: 'Bronze',
        },
      });
    } else {
      // Update existing customer to ensure they're enrolled
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          loyaltyPoints: customer.loyaltyPoints ?? 0,
          membershipTier: customer.membershipTier || 'Bronze',
        },
      });
    }

    // Create or update session
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

    // Set cookie
    const response = NextResponse.json({ 
      success: true, 
      customerId: customer.id,
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
    console.error('[rewards-enroll] Error:', err);
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
  }
}























