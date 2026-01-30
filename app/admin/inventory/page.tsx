import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { authOptions } from '@/lib/auth/options'
import InventoryDashboard from '@/components/inventory/InventoryDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminInventoryPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  const role = (session.user as { role?: string } | undefined)?.role

  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/')
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    }>
      <InventoryDashboard />
    </Suspense>
  )
}
