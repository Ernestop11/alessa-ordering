import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'alessacloud.com';
const DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG || 'lapoblanita';

function extractTenantSlug(request: NextRequest) {
  const hostHeader = request.headers.get('host') || '';
  const hostname = hostHeader.split(':')[0];

  // Allow overriding via query param in local development (?tenant=slug)
  const tenantParam = request.nextUrl.searchParams.get('tenant');
  if (tenantParam) return tenantParam.toLowerCase();

  if (!hostname) return DEFAULT_TENANT_SLUG;

  // Check if it's exactly the root domain (or www.root domain)
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return DEFAULT_TENANT_SLUG;
  }

  // Check for subdomains of root domain
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, '');
    if (subdomain && subdomain !== 'www') {
      return subdomain.toLowerCase();
    }
    return DEFAULT_TENANT_SLUG;
  }

  // For localhost / preview links
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 1) {
      return parts[0].toLowerCase();
    }
    return DEFAULT_TENANT_SLUG;
  }

  // Custom domains fallback - rely on DB lookup later
  return hostname.toLowerCase();
}

export function middleware(request: NextRequest) {
  // Skip tenant resolution for super-admin routes
  if (request.nextUrl.pathname.startsWith('/super-admin') ||
      request.nextUrl.pathname.startsWith('/api/super')) {
    return NextResponse.next();
  }

  const tenantSlug = extractTenantSlug(request);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-slug', tenantSlug);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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
