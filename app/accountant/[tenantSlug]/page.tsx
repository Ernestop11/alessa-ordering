import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AccountantTenantViewClient from '@/components/accountant/AccountantTenantViewClient';

export const dynamic = 'force-dynamic';

export default async function AccountantTenantPage({
  params,
  searchParams,
}: {
  params: { tenantSlug: string };
  searchParams: { accountantId?: string };
}) {
  const accountantId = searchParams?.accountantId;

  if (!accountantId) {
    redirect('/accountant');
  }

  // Verify accountant has access to this tenant
  const access = await prisma.accountantTenantAccess.findFirst({
    where: {
      accountantId,
      tenant: { slug: params.tenantSlug },
    },
    include: {
      tenant: true,
      accountant: true,
    },
  });

  if (!access) {
    redirect('/accountant/dashboard?accountantId=' + accountantId);
  }

  const tenant = access.tenant;

  // Get remittances
  const remittances = await prisma.taxRemittance.findMany({
    where: { tenantId: tenant.id },
    orderBy: { periodStart: 'desc' },
    take: 12,
  });

  // Get checks
  const checks = await prisma.taxCheck.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Get ACH payments
  const achPayments = await prisma.taxAchPayment.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <AccountantTenantViewClient
      tenant={tenant}
      accountantId={accountantId}
      remittances={remittances}
      checks={checks}
      achPayments={achPayments}
      accessLevel={access.accessLevel}
    />
  );
}

