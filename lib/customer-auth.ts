import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export interface CustomerFromSession {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  companyName: string | null;
  tenantId: string;
}

/**
 * Get the logged-in customer from request cookies
 * Returns null if not authenticated
 */
export async function getCustomerFromRequest(
  request: NextRequest
): Promise<CustomerFromSession | null> {
  try {
    // Get token from cookie header in the request
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return null;
    }

    // Parse the customer_session cookie
    const cookieMatch = cookieHeader.match(/customer_session=([^;]+)/);
    const token = cookieMatch ? cookieMatch[1] : null;

    if (!token) {
      return null;
    }

    const session = await prisma.customerSession.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            companyName: true,
            tenantId: true,
          },
        },
      },
    });

    if (!session?.customer) {
      return null;
    }

    return {
      id: session.customer.id,
      name: session.customer.name,
      email: session.customer.email,
      phone: session.customer.phone,
      companyName: session.customer.companyName,
      tenantId: session.customer.tenantId,
    };
  } catch (error) {
    console.error('[customer-auth] Error getting customer from request:', error);
    return null;
  }
}

/**
 * Get the logged-in customer from server-side cookies (for use in Server Components / API routes)
 */
export async function getCustomerFromCookies(
  tenantId: string
): Promise<CustomerFromSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('customer_session')?.value;

    if (!token) {
      return null;
    }

    const session = await prisma.customerSession.findFirst({
      where: {
        token,
        tenantId,
        expiresAt: { gt: new Date() },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            companyName: true,
            tenantId: true,
          },
        },
      },
    });

    if (!session?.customer) {
      return null;
    }

    return {
      id: session.customer.id,
      name: session.customer.name,
      email: session.customer.email,
      phone: session.customer.phone,
      companyName: session.customer.companyName,
      tenantId: session.customer.tenantId,
    };
  } catch (error) {
    console.error('[customer-auth] Error getting customer from cookies:', error);
    return null;
  }
}
