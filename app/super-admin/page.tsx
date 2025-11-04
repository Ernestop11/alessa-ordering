import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import SuperAdminDashboard from '@/components/super/SuperAdminDashboard';

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    redirect('/admin/login');
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      integrations: true,
    },
  });

  const summaries = tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    contactEmail: tenant.contactEmail,
    contactPhone: tenant.contactPhone,
    primaryColor: tenant.primaryColor,
    secondaryColor: tenant.secondaryColor,
    stripeAccountId: tenant.integrations?.stripeAccountId || null,
    createdAt: tenant.createdAt.toISOString(),
  }));

  return <SuperAdminDashboard initialTenants={summaries} rootDomain={ROOT_DOMAIN} />;
}
