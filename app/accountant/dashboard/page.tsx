import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import AccountantDashboardClient from '@/components/accountant/AccountantDashboardClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getAccountantFromSession(): Promise<string | null> {
  // In production, implement proper session storage
  // For now, check cookie or query param
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('accountant_session')?.value;
  
  // For MVP, we'll use query param (in production, decode from session token)
  return null; // Will be passed via query param for now
}

export default async function AccountantDashboardPage({
  searchParams,
}: {
  searchParams: { accountantId?: string };
}) {
  const accountantId = searchParams?.accountantId;

  if (!accountantId) {
    redirect('/accountant');
  }

  // Get accountant with tenant access
  const accountant = await prisma.accountant.findUnique({
    where: { id: accountantId },
    include: {
      tenantAccess: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          },
        },
      },
    },
  });

  if (!accountant) {
    redirect('/accountant');
  }

  // Get tax summaries for all accessible tenants
  const tenantIds = accountant.tenantAccess.map((access) => access.tenantId);
  
  const remittances = await prisma.taxRemittance.findMany({
    where: {
      tenantId: { in: tenantIds },
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { periodStart: 'desc' },
    take: 50,
  });

  // Calculate current period summaries per tenant
  const tenantSummaries = await Promise.all(
    accountant.tenantAccess.map(async (access) => {
      const recentRemittances = remittances.filter((r) => r.tenantId === access.tenantId);
      const totalCollected = recentRemittances.reduce((sum, r) => sum + r.totalTaxCollected, 0);
      const totalRemitted = recentRemittances.reduce((sum, r) => sum + r.totalTaxRemitted, 0);
      const pending = recentRemittances.filter((r) => r.status === 'pending').length;

      return {
        tenantId: access.tenant.id,
        tenantName: access.tenant.name,
        tenantSlug: access.tenant.slug,
        logoUrl: access.tenant.logoUrl,
        accessLevel: access.accessLevel,
        totalCollected,
        totalRemitted,
        pendingRemittances: pending,
        lastActivity: recentRemittances[0]?.periodEnd || null,
      };
    })
  );

  return (
    <AccountantDashboardClient
      accountant={{
        id: accountant.id,
        name: accountant.name,
        firmName: accountant.firmName,
        email: accountant.email,
      }}
      tenantSummaries={tenantSummaries}
    />
  );
}

