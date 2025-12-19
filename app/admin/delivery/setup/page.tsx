import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import DeliverySetupClient from '@/components/admin/DeliverySetupClient';

export const dynamic = 'force-dynamic';

export default async function DeliverySetupPage() {
  // Verify admin authentication
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

  // Fetch integration status
  const integration = await prisma.tenantIntegration.findUnique({
    where: { tenantId: tenant.id },
  });

  // Determine status for each partner
  const uberStatus = integration?.uberOnboardingStatus || 'not_connected';
  const doordashStatus = integration?.doordashOnboardingStatus || 'not_connected';

  return (
    <DeliverySetupClient
      uberStatus={uberStatus as any}
      uberMerchantId={integration?.uberMerchantId || undefined}
      doordashStatus={doordashStatus as any}
      doordashBusinessId={integration?.doordashBusinessId || undefined}
    />
  );
}

