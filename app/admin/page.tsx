import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/options'
import { requireTenant } from '@/lib/tenant'
import prisma from '@/lib/prisma'
import AdminDashboardHome from '@/components/admin/AdminDashboardHome'
import { headers } from 'next/headers'

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'alessacloud.com'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  const role = (session.user as { role?: string; tenantSlug?: string } | undefined)?.role
  const tenantSlug = (session.user as { tenantSlug?: string } | undefined)?.tenantSlug

  // Always redirect super admins to super admin dashboard
  if (role === 'super_admin') {
    redirect('https://alessacloud.com/super-admin')
  }

  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/')
  }

  // Check if we're on root domain - if so, redirect tenant admin to their subdomain
  // This prevents "Root domain accessed" error from requireTenant()
  const headersList = headers()
  const host = headersList.get('host') || ''
  const hostname = host.split(':')[0]
  
  if ((hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) && tenantSlug) {
    // Redirect tenant admin to their subdomain before calling requireTenant()
    redirect(`https://${tenantSlug}.alessacloud.com/admin`)
  }

  // If we're on root domain without tenant slug, redirect to login
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    redirect('/admin/login')
  }

  const tenant = await requireTenant()
  
  // Get Stripe status
  const stripeStatus = tenant.integrations?.stripeAccountId 
    ? { connected: true, accountId: tenant.integrations.stripeAccountId }
    : { connected: false, accountId: null }

  // Get DoorDash status
  const doordashStatus = tenant.integrations?.doorDashStoreId
    ? { connected: true, storeId: tenant.integrations.doorDashStoreId }
    : { connected: false, storeId: null }

  // Get order stats
  const orderStats = await prisma.order.aggregate({
    where: { tenantId: tenant.id },
    _count: { id: true },
    _sum: { totalAmount: true },
  })

  const recentOrders = await prisma.order.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  })

  // Check how many menu items exist
  const menuItemCount = await prisma.menuItem.count({
    where: { tenantId: tenant.id },
  })

  return (
    <AdminDashboardHome
      tenant={tenant}
      stripeStatus={stripeStatus}
      doordashStatus={doordashStatus}
      menuItemCount={menuItemCount}
      orderStats={{
        totalOrders: orderStats._count.id,
        totalRevenue: orderStats._sum.totalAmount || 0,
      }}
      recentOrders={recentOrders.map(order => ({
        id: order.id,
        createdAt: order.createdAt,
        status: order.status,
        totalAmount: order.totalAmount,
        customerName: order.customer?.name || 'Guest',
      }))}
    />
  )
}
