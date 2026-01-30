import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

interface AuthResult {
  tenantId: string;
  userName: string;
  isAdmin: boolean;
}

/**
 * Dual auth for inventory APIs:
 * 1. Admin session (NextAuth) - for admin dashboard
 * 2. tenantSlug query param - for tablet/department views
 *
 * Returns tenant ID and user identity, or null if unauthorized.
 */
export async function resolveInventoryAuth(
  request: NextRequest
): Promise<AuthResult | null> {
  // Try admin session first
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (session && (role === 'admin' || role === 'super_admin')) {
    const tenant = await requireTenant();
    return {
      tenantId: tenant.id,
      userName: session.user?.name || session.user?.email || 'admin',
      isAdmin: true,
    };
  }

  // Fallback: tenantSlug query param (tablet access)
  const tenantSlug = request.nextUrl.searchParams.get('tenantSlug');
  if (tenantSlug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    if (tenant) {
      const employeeName = request.nextUrl.searchParams.get('employee') || 'tablet';
      return {
        tenantId: tenant.id,
        userName: employeeName,
        isAdmin: false,
      };
    }
  }

  return null;
}
