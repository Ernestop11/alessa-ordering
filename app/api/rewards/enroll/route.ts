import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { cookies } from 'next/headers';

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
    const { email, phone, name } = body;

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);

    // Find existing customer by email OR phone (case-insensitive email, normalized phone)
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          email ? { email: { equals: email, mode: 'insensitive' } } : undefined,
          normalizedPhone ? { phone: { contains: normalizedPhone } } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!customer) {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: name || null,
          email: email || null,
          phone: normalizedPhone || null,
          loyaltyPoints: 0,
          membershipTier: 'Bronze',
        },
      });
    } else {
      // Update existing customer - fill in missing contact info
      // This helps link accounts when user signs up with hidden email + phone,
      // then later wants to add their real email
      const updates: Record<string, any> = {
        loyaltyPoints: customer.loyaltyPoints ?? 0,
        membershipTier: customer.membershipTier || 'Bronze',
      };

      // Update name if provided and customer doesn't have one
      if (name && !customer.name) {
        updates.name = name;
      }
      // Update phone if provided and customer doesn't have one
      if (normalizedPhone && !customer.phone) {
        updates.phone = normalizedPhone;
      }
      // Note: We don't overwrite email as hidden emails should stay linked

      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: updates,
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
    console.error('[rewards-enroll] Error:', err);
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
  }
}

































