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
  let tenant = null;

  try {
    // 1. SUBDOMAIN OF ALESSACLOUD (lasreinas.alessacloud.com)
    if (host?.endsWith("alessacloud.com")) {
      const sub = host.replace(".alessacloud.com", "");
      if (sub && sub !== "www") tenant = sub;
    }

    // 2. CUSTOM DOMAIN (lasreinascolusa.com)
    if (!tenant && !host?.endsWith("alessacloud.com")) {
      tenant = resolveCustomDomain(host);
    }

    // 3. QUERY PARAM (?tenant=lasreinas)
    if (!tenant) {
      const qp = url.searchParams.get("tenant");
      if (qp) tenant = qp.toLowerCase();
    }

    // 4. DEFAULT TENANT
    if (!tenant) tenant = DEFAULT_TENANT;

    // Inject tenant via header (not query param to avoid rewrite loop)
    const response = NextResponse.next();
    response.headers.set('x-tenant-slug', tenant);
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
