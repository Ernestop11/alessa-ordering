import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { getStaticTenantTheme } from '@/lib/tenant-theme-map';
import DisplayClient from '@/components/display/DisplayClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function DisplayPage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string }> | { screen?: string };
}) {
  const tenant = await requireTenant();
  const params = await Promise.resolve(searchParams || {});
  const screen = params.screen || 'left';
  const theme = getStaticTenantTheme(tenant.slug);

  const sections = await prisma.menuSection.findMany({
    where: { tenantId: tenant.id },
    orderBy: { position: 'asc' },
    include: {
      menuItems: {
        where: { available: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const menuData = sections.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    items: s.menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      image: item.image,
      tags: item.tags || [],
      isFeatured: item.isFeatured,
    })),
  }));

  return (
    <DisplayClient
      sections={menuData}
      tenantName={tenant.name}
      tenantSlug={tenant.slug}
      screen={screen}
      primaryColor={theme.primaryColor}
      secondaryColor={theme.secondaryColor}
      logoUrl={theme.assets.logo}
    />
  );
}
