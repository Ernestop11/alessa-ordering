import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import VPSDashboard from '@/components/vps-dashboard/VPSDashboard';
import { scanPages, scanApiRoutes, getPageStats } from '@/lib/vps-dashboard/page-scanner';
import { getSystemOverview } from '@/lib/vps-dashboard/system-scanner';

export const dynamic = 'force-dynamic';

export default async function VPSDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  // Only super admins can access this dashboard
  if (!session || role !== 'super_admin') {
    redirect('/admin/login');
  }

  // Scan pages and system in parallel
  const [pages, apiRoutes, systemOverview] = await Promise.all([
    scanPages(),
    scanApiRoutes(),
    getSystemOverview(),
  ]);

  const pageStats = getPageStats(pages);

  return (
    <VPSDashboard
      initialPages={pages}
      initialApiRoutes={apiRoutes}
      initialSystem={systemOverview}
      pageStats={pageStats}
    />
  );
}
