import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function OrderingDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    redirect('/admin/login');
  }

  const tenants = await prisma.tenant.findMany({
    where: {
      productSubscriptions: {
        some: {
          product: {
            slug: 'alessa-ordering',
          },
          status: 'active',
        },
      },
    },
    include: {
      productSubscriptions: {
        where: {
          product: {
            slug: 'alessa-ordering',
          },
        },
        include: {
          product: true,
        },
      },
      _count: {
        select: {
          orders: true,
          menuItems: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalOrders = await prisma.order.count();
  const totalRevenue = await prisma.order.aggregate({
    _sum: {
      totalAmount: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alessa Ordering System</h1>
              <p className="mt-1 text-sm text-gray-600">Manage all ordering system tenants and operations</p>
            </div>
            <Link
              href="/super-admin"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">Total Tenants</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{tenants.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              ${Number(totalRevenue._sum.totalAmount || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tenants List */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-900">Ordering System Tenants</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        {tenant.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {tenant._count.orders} orders • {tenant._count.menuItems} menu items
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      <Link
                        href={`https://${tenant.slug}.alessacloud.com/order`}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        View Storefront →
                      </Link>
                      {' • '}
                      <Link
                        href={`/admin?tenant=${tenant.slug}`}
                        className="text-blue-600 hover:underline"
                      >
                        Admin Dashboard →
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {tenants.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No tenants subscribed to Alessa Ordering yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

