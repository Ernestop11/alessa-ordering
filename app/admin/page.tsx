import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/options'
import dynamic from 'next/dynamic'

// Dynamically import the client dashboard UI (no SSR)
const AdminDashboardClient = dynamic(
  () => import('../../components/admin/AdminDashboardClient'),
  { ssr: false }
)

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  const role = (session.user as { role?: string } | undefined)?.role

  if (role === 'super_admin') {
    redirect('/super-admin')
  }

  if (role !== 'admin') {
    redirect('/')
  }

  return <AdminDashboardClient />
}
