import { requireTenant } from '@/lib/tenant';
import CustomerLoginForm from './form';

export default async function CustomerLoginPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const tenant = await requireTenant();
  const returnTo = searchParams?.returnTo;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-400">{tenant.name}</p>
          <h1 className="text-3xl font-bold text-gray-900">Access Your Order History</h1>
          <p className="text-sm text-gray-500">
            Use the one-time code we send to your email or phone to view receipts, reorder favorites, and check delivery status.
          </p>
        </div>
        <div className="rounded-xl bg-white p-8 shadow-lg border border-gray-200">
          <CustomerLoginForm returnTo={returnTo} tenantSlug={tenant.slug} />
        </div>
      </div>
    </div>
  );
}
