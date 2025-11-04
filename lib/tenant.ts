import { headers } from 'next/headers';
import prisma from './prisma';

const DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG || 'lapoblanita';

export function getTenantSlugFromHeaders(): string {
  try {
    const headerList = headers();
    const slug = headerList.get('x-tenant-slug');
    if (slug) return slug;
  } catch {
    // headers() throws outside of request lifecycle (e.g. during build)
  }
  return DEFAULT_TENANT_SLUG;
}

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: {
      slug,
    },
    include: {
      settings: true,
      integrations: true,
    },
  });
}

export async function requireTenant(slug?: string) {
  const resolvedSlug = slug || getTenantSlugFromHeaders();
  const tenant = await getTenantBySlug(resolvedSlug);

  if (!tenant) {
    throw new Error(`Tenant ${resolvedSlug} not found`);
  }

  return tenant;
}

export async function getTenantId(slug?: string) {
  const tenant = await requireTenant(slug);
  return tenant.id;
}
