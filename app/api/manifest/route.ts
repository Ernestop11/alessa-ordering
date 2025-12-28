import { NextResponse } from 'next/server';
import { headers, cookies } from 'next/headers';
import { getTenantBySlug } from '@/lib/tenant';
import { getStaticTenantTheme } from '@/lib/tenant-theme-map';

/**
 * Dynamic manifest.json for tenant-specific PWA branding
 *
 * Returns PWA manifest with:
 * - Tenant name and short_name
 * - Tenant theme colors
 * - Tenant-specific icons (if available)
 */
export async function GET() {
  try {
    // Try header first, then cookie (middleware sets both)
    const headersList = headers();
    const cookieStore = cookies();

    const tenantSlug =
      headersList.get('x-tenant-slug') ||
      cookieStore.get('x-tenant-slug')?.value;

    let tenant = null;
    if (tenantSlug) {
      try {
        tenant = await getTenantBySlug(tenantSlug);
      } catch {
        // Tenant lookup failed
      }
    }

    const staticTheme = tenant ? getStaticTenantTheme(tenant.slug) : getStaticTenantTheme();

    // Determine tenant name for PWA
    const tenantName = tenant?.name || 'Alessa Cloud';
    const shortName = tenant?.name
      ? (tenant.name.length > 12 ? tenant.name.substring(0, 12) : tenant.name)
      : 'Alessa';

    // Determine colors
    const themeColor = tenant?.primaryColor || staticTheme.themeColor;
    const backgroundColor = tenant?.secondaryColor || staticTheme.secondaryColor;

    // Determine icon paths - check for tenant-specific icons
    const tenantSlug = tenant?.slug || 'default';
    const hasCustomIcons = tenant?.slug === 'lasreinas'; // Can expand this check

    const icons = hasCustomIcons
      ? [
          {
            src: `/tenant/${tenantSlug}/images/logo.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `/tenant/${tenantSlug}/images/logo.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
        ]
      : [
          {
            src: '/icons/alessa-cloud-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/alessa-cloud-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ];

    const manifest = {
      name: tenantName,
      short_name: shortName,
      description: tenant
        ? `Order from ${tenantName}`
        : 'Multi-tenant restaurant ordering platform by Alessa Cloud.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      background_color: backgroundColor,
      theme_color: themeColor,
      icons,
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    // Fallback to default manifest on error
    const defaultTheme = getStaticTenantTheme();

    return NextResponse.json({
      name: 'Alessa Cloud',
      short_name: 'Alessa',
      description: 'Multi-tenant restaurant ordering platform by Alessa Cloud.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      background_color: defaultTheme.secondaryColor,
      theme_color: defaultTheme.themeColor,
      icons: [
        {
          src: '/icons/alessa-cloud-icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: '/icons/alessa-cloud-icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    }, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
