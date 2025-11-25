import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/options'
import { requireTenant } from '@/lib/tenant'
import DoorDashPage from '@/components/admin/DoorDashPage'

export default async function AdminDoorDashPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  const role = (session.user as { role?: string } | undefined)?.role

  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/')
  }

  const tenant = await requireTenant()

  return <DoorDashPage tenant={tenant} />
}

