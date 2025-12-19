import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import BillingOverviewClient from '@/components/admin/BillingOverviewClient';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h1>
          <p className="text-gray-600">Please log in as an admin to access this page.</p>
        </div>
      </div>
    );
  }

  const tenant = await requireTenant();

  // Get tenant's subscribed products
  const tenantProducts = await prisma.tenantProduct.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: ['active', 'trial', 'past_due'] },
    },
    include: {
      product: {
        include: {
          pricingTiers: true,
        },
      },
      tier: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate total monthly cost
  const totalMonthly = tenantProducts.reduce((sum, tp) => sum + tp.monthlyAmount, 0);

  return (
    <BillingOverviewClient
      tenantId={tenant.id}
      tenantSlug={tenant.slug}
      tenantProducts={tenantProducts.map((tp) => ({
        id: tp.id,
        productId: tp.product.id,
        productName: tp.product.name,
        productIcon: tp.product.icon,
        tierName: tp.tier?.name,
        status: tp.status,
        billingCycle: tp.billingCycle,
        monthlyAmount: tp.monthlyAmount,
        currentPeriodEnd: tp.currentPeriodEnd,
        stripeSubscriptionId: tp.stripeSubscriptionId,
      }))}
      totalMonthly={totalMonthly}
    />
  );
}

