import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/options'
import SignageDashboard from '@/components/admin/SignageDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminSignagePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  const role = (session.user as { role?: string } | undefined)?.role

  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/')
  }

  return <SignageDashboard />
}
