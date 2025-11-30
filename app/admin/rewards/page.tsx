import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/options'
import RewardsEditorPage from '@/components/admin/RewardsEditorPage'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminRewardsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  const role = (session.user as { role?: string } | undefined)?.role

  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/')
  }

  return <RewardsEditorPage />
}

