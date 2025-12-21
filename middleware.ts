import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// SECURITY: Do NOT fall back to a default tenant - fail explicitly instead
// This prevents cross-tenant pollution when tenant resolution fails
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "alessacloud.com";

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
  let tenant: string | null = null;

  try {
    // Skip tenant resolution for health check endpoint
    if (url.pathname === '/api/health') {
      return NextResponse.next();
    }

    // Skip tenant resolution for root domain (show landing page)
    const hostname = host?.split(':')[0] || '';
    if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
      const response = NextResponse.next();
      return response;
    }

    // 1. SUBDOMAIN OF ALESSACLOUD (lasreinas.alessacloud.com)
    if (host?.endsWith(`.${ROOT_DOMAIN}`)) {
      const sub = host.replace(`.${ROOT_DOMAIN}`, "");
      if (sub && sub !== "www") tenant = sub;
    }

    // 2. CUSTOM DOMAIN (lasreinascolusa.com, www.lasreinascolusa.com)
    if (!tenant && !host?.endsWith(`.${ROOT_DOMAIN}`) && hostname !== ROOT_DOMAIN) {
      tenant = resolveCustomDomain(host);
    }

    // 3. QUERY PARAM (?tenant=lasreinas)
    if (!tenant) {
      const qp = url.searchParams.get("tenant");
      if (qp) tenant = qp.toLowerCase();
    }

    // SECURITY: If no tenant resolved and not root domain, this is an error
    // Do NOT silently fall back to a default tenant - that causes cross-tenant pollution
    if (!tenant) {
      console.error(`[middleware] TENANT RESOLUTION FAILED: host="${hostname}", path="${url.pathname}"`);
      // Return error page instead of falling back
      return NextResponse.rewrite(new URL('/tenant-not-found', req.url));
    }

    // Use request headers to pass tenant to server components
    // This works because we're modifying the request, not the response
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-tenant-slug', tenant);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Also set a cookie for client-side access (more reliable than headers)
    response.cookies.set('x-tenant-slug', tenant, {
      httpOnly: false, // Allow JS access for client components
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Force no-cache for dynamic pages
    if (url.pathname.startsWith('/order') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/checkout') || url.pathname.startsWith('/grocery')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');
    }

    return response;

  } catch (err) {
    console.error("MIDDLEWARE ERROR", err);
    // SECURITY: Do NOT fall back to default tenant on error
    return NextResponse.rewrite(new URL('/tenant-not-found', req.url));
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
