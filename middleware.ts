import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const DEFAULT_TENANT = process.env.DEFAULT_TENANT_SLUG || "lapoblanita";

function resolveCustomDomain(host?: string | null) {
  if (!host) return null;
  const mapJson = process.env.CUSTOM_DOMAIN_MAP;
  if (!mapJson) return null;
  try {
    const parsed = JSON.parse(mapJson) as Record<string, string>;
    const slug = parsed[host];
    return slug || null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host")?.toLowerCase();
  const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "alessacloud.com";
  let tenant = null;

  try {
    // Skip tenant resolution for root domain (show landing page)
    const hostname = host?.split(':')[0] || '';
    if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
      const response = NextResponse.next();
      // Don't set tenant header for root domain - let app/page.tsx handle it
      return response;
    }

    // 1. SUBDOMAIN OF ALESSACLOUD (lasreinas.alessacloud.com)
    if (host?.endsWith(`.${ROOT_DOMAIN}`)) {
      const sub = host.replace(`.${ROOT_DOMAIN}`, "");
      if (sub && sub !== "www") tenant = sub;
    }

    // 2. CUSTOM DOMAIN (lasreinascolusa.com)
    if (!tenant && !host?.endsWith(`.${ROOT_DOMAIN}`) && hostname !== ROOT_DOMAIN) {
      tenant = resolveCustomDomain(host);
    }

    // 3. QUERY PARAM (?tenant=lasreinas)
    if (!tenant) {
      const qp = url.searchParams.get("tenant");
      if (qp) tenant = qp.toLowerCase();
    }

    // 4. DEFAULT TENANT (only if we have a path that needs a tenant)
    if (!tenant) tenant = DEFAULT_TENANT;

    // Inject tenant via header (not query param to avoid rewrite loop)
    const response = NextResponse.next();
    response.headers.set('x-tenant-slug', tenant);

    // Force no-cache for dynamic pages (order, admin, etc.)
    if (url.pathname.startsWith('/order') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/checkout')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }

    return response;

  } catch (err) {
    console.error("MIDDLEWARE ERROR", err);
    const response = NextResponse.next();
    response.headers.set('x-tenant-slug', DEFAULT_TENANT);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (handled by NextAuth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico / assets
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
