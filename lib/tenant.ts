import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from './prisma';

const DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG || 'lapoblanita';
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'alessacloud.com';

const tenantSlugSchema = z
  .string()
  .min(2, 'Tenant slug must be at least 2 characters')
  .max(64, 'Tenant slug must be at most 64 characters')
  .regex(/^[a-z0-9-]+$/i, 'Tenant slug can only include letters, numbers, and hyphens');

type TenantResolutionOptions = {
  request?: NextRequest;
  host?: string | null;
  searchParams?: URLSearchParams | null;
  pathname?: string | null;
  tenantParam?: string | null;
};

function safeHeaders() {
  try {
    return headers();
  } catch {
    return null;
  }
}

function normalizeHost(host?: string | null) {
  return host?.split(':')[0]?.trim().toLowerCase() ?? '';
}

function extractQueryTenant(ctx: TenantResolutionOptions, headerList: Headers | null) {
  if (ctx.tenantParam) return ctx.tenantParam;
  if (ctx.searchParams?.get) return ctx.searchParams.get('tenant');
  if (ctx.request) return ctx.request.nextUrl.searchParams.get('tenant');
  const headerParam = headerList?.get('x-tenant-slug');
  return headerParam || null;
}

function extractPath(ctx: TenantResolutionOptions, headerList: Headers | null) {
  if (ctx.pathname) return ctx.pathname;
  if (ctx.request) return ctx.request.nextUrl.pathname;
  return headerList?.get('x-invoke-path') ?? null;
}

function deriveSubdomainSlug(hostname: string) {
  if (!hostname) return null;

  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return DEFAULT_TENANT_SLUG;
  }

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, '');
    if (subdomain && subdomain !== 'www') {
      return subdomain.toLowerCase();
    }
    return DEFAULT_TENANT_SLUG;
  }

  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1) {
      return parts[0].toLowerCase();
    }
    return DEFAULT_TENANT_SLUG;
  }

  return null;
}

function assertValidSlug(candidate: string, source: string) {
  const parsed = tenantSlugSchema.safeParse(candidate.toLowerCase());
  if (!parsed.success) {
    throw new Error(`Invalid tenant slug from ${source}: ${parsed.error.message}`);
  }
  return parsed.data.toLowerCase();
}

export function getTenantSlugFromHeaders(): string {
  const headerList = safeHeaders();
  if (headerList) {
    const slugHeader = headerList.get('x-tenant-slug');
    if (slugHeader) {
      try {
        return assertValidSlug(slugHeader, 'header');
      } catch {
        // Fall through to derived slug/default
      }
    }
    const host = normalizeHost(headerList.get('host'));
    const derived = deriveSubdomainSlug(host);
    if (derived) {
      try {
        return assertValidSlug(derived, 'header-subdomain');
      } catch {
        return DEFAULT_TENANT_SLUG;
      }
    }
  }
  return DEFAULT_TENANT_SLUG;
}

export async function getTenantBySlug(slug: string) {
  let tenant = await prisma.tenant.findUnique({
    where: {
      slug,
    },
    include: {
      settings: true,
      integrations: true,
    },
  });

  if (!tenant) {
    tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { domain: slug },
          { customDomain: slug },
        ],
      },
      include: {
        settings: true,
        integrations: true,
      },
    });
  }

  return tenant;
}

export async function resolveTenant(options: TenantResolutionOptions = {}) {
  const headerList = safeHeaders();
  const hostHeader =
    normalizeHost(
      options.host ??
        options.request?.headers.get('host') ??
        headerList?.get('host'),
    );
  const queryCandidate = extractQueryTenant(options, headerList);
  const path = extractPath(options, headerList);

  console.error('Tenant resolver input:', {
    host: hostHeader || null,
    query: queryCandidate || null,
    path: path || null,
  });

  if (hostHeader) {
    const tenantFromHost = await getTenantBySlug(hostHeader);
    if (tenantFromHost) {
      return tenantFromHost;
    }
  }

  if (queryCandidate) {
    const slug = assertValidSlug(queryCandidate, 'query parameter "tenant"');
    const tenantFromQuery = await getTenantBySlug(slug);
    if (tenantFromQuery) {
      return tenantFromQuery;
    }
  }

  const derivedSlug = deriveSubdomainSlug(hostHeader);
  if (derivedSlug) {
    const slug = assertValidSlug(derivedSlug, 'subdomain/host');
    const tenantFromSubdomain = await getTenantBySlug(slug);
    if (tenantFromSubdomain) {
      return tenantFromSubdomain;
    }
  }

  throw new Error(
    `Tenant not found (host="${hostHeader || 'unknown'}", path="${path || 'unknown'}")`,
  );
}

export async function requireTenant(slug?: string, options?: TenantResolutionOptions) {
  if (slug) {
    const validated = assertValidSlug(slug, 'explicit argument');
    const tenant = await getTenantBySlug(validated);
    if (!tenant) {
      throw new Error(`Tenant ${validated} not found`);
    }
    return tenant;
  }

  const tenant = await resolveTenant(options ?? {});
  return tenant;
}

export async function getTenantId(slug?: string, options?: TenantResolutionOptions) {
  const tenant = await requireTenant(slug, options);
  return tenant.id;
}
