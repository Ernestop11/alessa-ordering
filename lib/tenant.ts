import { headers, cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from './prisma';

// NOTE: We intentionally don't use a default tenant fallback to prevent cross-tenant pollution
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

function safeCookies() {
  try {
    return cookies();
  } catch {
    return null;
  }
}

function getTenantFromCookie(): string | null {
  const cookieStore = safeCookies();
  if (!cookieStore) return null;
  const tenantCookie = cookieStore.get('x-tenant-slug');
  return tenantCookie?.value || null;
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

  // Root domain - no subdomain tenant
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return null;
  }

  // Subdomain of ROOT_DOMAIN (e.g., lasreinas.alessacloud.com)
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, '');
    if (subdomain && subdomain !== 'www') {
      return subdomain.toLowerCase();
    }
    return null;
  }

  // Local development with subdomain (e.g., lasreinas.localhost:3000)
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1) {
      return parts[0].toLowerCase();
    }
    return null;
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
  // Priority 1: Check header from middleware
  const headerList = safeHeaders();
  if (headerList) {
    const slugHeader = headerList.get('x-tenant-slug');
    if (slugHeader) {
      try {
        return assertValidSlug(slugHeader, 'header');
      } catch {
        // Fall through
      }
    }
  }

  // Priority 2: Check cookie from middleware
  const cookieSlug = getTenantFromCookie();
  if (cookieSlug) {
    try {
      return assertValidSlug(cookieSlug, 'cookie');
    } catch {
      // Fall through
    }
  }

  // Priority 3: Try to derive from host subdomain
  if (headerList) {
    const host = normalizeHost(headerList.get('host'));
    const derived = deriveSubdomainSlug(host);
    if (derived) {
      try {
        return assertValidSlug(derived, 'header-subdomain');
      } catch {
        // Fall through
      }
    }
  }

  // SECURITY: Throw error instead of returning default
  throw new Error('Unable to determine tenant from headers or cookies');
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

  // Skip tenant resolution for root domain - should show landing page
  if (hostHeader === ROOT_DOMAIN || hostHeader === `www.${ROOT_DOMAIN}`) {
    throw new Error(
      `Root domain accessed - should show landing page (host="${hostHeader}", path="${path || 'unknown'}")`,
    );
  }

  // PRIORITY 1: Check x-tenant-slug header set by middleware (most reliable for custom domains)
  const headerSlug = headerList?.get('x-tenant-slug');
  if (headerSlug) {
    try {
      const slug = assertValidSlug(headerSlug, 'x-tenant-slug header');
      const tenantFromHeader = await getTenantBySlug(slug);
      if (tenantFromHeader) {
        return tenantFromHeader;
      }
    } catch (err) {
      console.error('Invalid x-tenant-slug header:', err);
    }
  }

  // PRIORITY 2: Check cookie set by middleware (fallback for RSC)
  const cookieSlug = getTenantFromCookie();
  if (cookieSlug) {
    try {
      const slug = assertValidSlug(cookieSlug, 'x-tenant-slug cookie');
      const tenantFromCookie = await getTenantBySlug(slug);
      if (tenantFromCookie) {
        return tenantFromCookie;
      }
    } catch (err) {
      console.error('Invalid x-tenant-slug cookie:', err);
    }
  }

  // PRIORITY 3: Query param (?tenant=xxx)
  if (queryCandidate) {
    const slug = assertValidSlug(queryCandidate, 'query parameter "tenant"');
    const tenantFromQuery = await getTenantBySlug(slug);
    if (tenantFromQuery) {
      return tenantFromQuery;
    }
  }

  // PRIORITY 4: Subdomain of ROOT_DOMAIN (lasreinas.alessacloud.com)
  const derivedSlug = deriveSubdomainSlug(hostHeader);
  if (derivedSlug) {
    try {
      const slug = assertValidSlug(derivedSlug, 'subdomain/host');
      const tenantFromSubdomain = await getTenantBySlug(slug);
      if (tenantFromSubdomain) {
        return tenantFromSubdomain;
      }
    } catch {
      // Invalid subdomain format, continue
    }
  }

  // PRIORITY 5: Try custom domain lookup directly from DB
  if (hostHeader && hostHeader.includes('.')) {
    const tenantFromCustomDomain = await prisma.tenant.findFirst({
      where: {
        OR: [
          { customDomain: hostHeader },
          { customDomain: hostHeader.replace(/^www\./, '') },
        ],
      },
      include: {
        settings: true,
        integrations: true,
      },
    });
    if (tenantFromCustomDomain) {
      return tenantFromCustomDomain;
    }
  }

  // SECURITY: NO DEFAULT FALLBACK - fail explicitly to prevent cross-tenant pollution
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
