import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { resolveTenant } from '@/lib/tenant';
import { getStaticTenantTheme } from '@/lib/tenant-theme-map';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';

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
    const headersList = headers();
    const host = headersList.get('host') || '';

    // Resolve tenant from host directly (same as middleware does)
    const tenant = await resolveTenant({ host });
    const staticTheme = tenant ? getStaticTenantTheme(tenant.slug) : getStaticTenantTheme();

    // Determine tenant name for PWA
    const tenantName = tenant?.name || 'Alessa Cloud';
    const shortName = tenant?.name
      ? (tenant.name.length > 12 ? tenant.name.substring(0, 12) : tenant.name)
      : 'Alessa';

    // Determine colors
    const themeColor = tenant?.primaryColor || staticTheme.themeColor;
    const backgroundColor = tenant?.secondaryColor || staticTheme.secondaryColor;

    // Determine icon paths - check for tenant-specific icons from theme config
    const iconSlug = tenant?.slug || 'default';
    // Use theme config instead of hard-coded list to determine if tenant has custom icons
    const hasCustomIcons = staticTheme.hasCustomIcons === true;
    // Cache buster for icon updates (increment when icons change)
    const iconVersion = 'v5';

    const icons = hasCustomIcons
      ? [
          {
            src: `/tenant/${iconSlug}/icons/icon-192.png?${iconVersion}`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `/tenant/${iconSlug}/icons/icon-512.png?${iconVersion}`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `/tenant/${iconSlug}/logo.png?${iconVersion}`,
            sizes: '500x500',
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
