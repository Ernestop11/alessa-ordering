import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import OrderingDashboardClient from '@/components/super/ordering/OrderingDashboardClient';

export default async function OrderingDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    redirect('/admin/login');
  }

  return <OrderingDashboardClient />;
}

