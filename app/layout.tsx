import './globals.css'
import type { Metadata, Viewport } from 'next'
import type { CSSProperties } from 'react'
import { headers } from 'next/headers'
import CartLauncher from '../components/CartLauncher'
import { Providers } from './providers'
import { getTenantSlugFromHeaders, requireTenant } from '../lib/tenant'
import { getStaticTenantTheme } from '../lib/tenant-theme-map'
import {
  TenantThemeProvider,
  type TenantTheme,
  type MembershipProgramConfig,
  type UpsellBundleConfig,
  type AccessibilityDefaults,
  type TenantBranding,
} from '../components/TenantThemeProvider'

export const metadata: Metadata = {
  title: {
    default: 'Alessa Cloud',
    template: '%s · Alessa Cloud',
  },
  description: 'Multi-tenant restaurant ordering platform powered by Alessa Cloud.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Alessa Ordering',
  },
  icons: {
    icon: [
      { url: '/icons/alessa-cloud-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/alessa-cloud-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/alessa-cloud-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export function generateViewport(): Viewport {
  try {
    const slug = getTenantSlugFromHeaders();
    const theme = getStaticTenantTheme(slug);
    return {
      themeColor: theme.themeColor,
    };
  } catch {
    const fallback = getStaticTenantTheme();
    return {
      themeColor: fallback.themeColor,
    };
  }
}

// Force dynamic rendering to ensure tenant data is always fresh
export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if we're on the root domain - if so, use default theme without tenant
  const headersList = headers();
  const hostHeader = headersList.get('host') || '';
  const hostname = hostHeader.split(':')[0];
  const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'alessacloud.com';
  const isRootDomain = hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}` || hostname === 'localhost';
  
  let tenant;
  try {
    if (isRootDomain) {
      // For root domain, use a minimal tenant object for theme
      tenant = null;
    } else {
      tenant = await requireTenant();
    }
  } catch (error) {
    // If tenant resolution fails and we're not on root domain, use default
    if (!isRootDomain) {
      throw error;
    }
    tenant = null;
  }
  
  const staticTheme = getStaticTenantTheme(tenant?.slug)

  // For root domain, use default theme; otherwise use tenant theme
  const tenantTimestamp = tenant ? new Date(tenant.updatedAt).getTime() : Date.now();
  const addCacheBuster = (url: string | null) => {
    if (!url) return null;
    return url.includes('?') ? `${url}&t=${tenantTimestamp}` : `${url}?t=${tenantTimestamp}`;
  };

  const tenantTheme: TenantTheme = tenant ? {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: addCacheBuster(tenant.logoUrl || staticTheme.assets.logo),
    heroImageUrl: addCacheBuster(tenant.heroImageUrl || staticTheme.assets.hero),
    heroTitle: tenant.heroTitle || tenant.name,
    heroSubtitle: tenant.heroSubtitle || tenant.settings?.tagline || '',
    tagline: tenant.settings?.tagline || '',
    primaryColor: tenant.primaryColor || staticTheme.primaryColor,
    secondaryColor: tenant.secondaryColor || staticTheme.secondaryColor,
    themeColor: staticTheme.themeColor,
    featureFlags: tenant.featureFlags || [],
    contactEmail: tenant.contactEmail || null,
    contactPhone: tenant.contactPhone || null,
    addressLine1: tenant.addressLine1 || null,
    addressLine2: tenant.addressLine2 || null,
    city: tenant.city || null,
    state: tenant.state || null,
    country: tenant.country || 'US',
    postalCode: tenant.postalCode || null,
    deliveryRadiusMi: tenant.settings?.deliveryRadiusMi ?? null,
    minimumOrderValue: tenant.settings?.minimumOrderValue ?? null,
    platformPercentFee: tenant.integrations?.platformPercentFee ?? 0.029,
    platformFlatFee: tenant.integrations?.platformFlatFee ?? 0.3,
    defaultTaxRate: tenant.integrations?.defaultTaxRate ?? 0.0825,
    deliveryBaseFee: tenant.integrations?.deliveryBaseFee ?? 4.99,
    taxProvider: tenant.integrations?.taxProvider ?? 'builtin',
    socials: {
      instagram: tenant.settings?.socialInstagram || null,
      facebook: tenant.settings?.socialFacebook || null,
      tikTok: tenant.settings?.socialTikTok || null,
      youtube: tenant.settings?.socialYouTube || null,
    },
    membershipProgram: (tenant.settings?.membershipProgram ?? null) as unknown as MembershipProgramConfig | null,
    upsellBundles: Array.isArray(tenant.settings?.upsellBundles)
      ? (tenant.settings!.upsellBundles as unknown as UpsellBundleConfig[])
      : [],
    accessibilityDefaults: (tenant.settings?.accessibilityDefaults ?? null) as unknown as AccessibilityDefaults | null,
    branding: (tenant.settings?.branding ?? null) as unknown as TenantBranding | null,
  } : {
    id: 'root',
    name: 'Alessa Cloud',
    slug: 'root',
    logoUrl: staticTheme.assets.logo,
    heroImageUrl: staticTheme.assets.hero,
    heroTitle: 'Alessa Cloud',
    heroSubtitle: 'Multi-tenant restaurant ordering platform',
    tagline: '',
    primaryColor: staticTheme.primaryColor,
    secondaryColor: staticTheme.secondaryColor,
    themeColor: staticTheme.themeColor,
    featureFlags: [],
    contactEmail: null,
    contactPhone: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    country: 'US',
    postalCode: null,
    deliveryRadiusMi: null,
    minimumOrderValue: null,
    platformPercentFee: 0.029,
    platformFlatFee: 0.3,
    defaultTaxRate: 0.0825,
    deliveryBaseFee: 4.99,
    taxProvider: 'builtin',
    socials: {
      instagram: null,
      facebook: null,
      tikTok: null,
      youtube: null,
    },
    membershipProgram: null,
    upsellBundles: [],
    accessibilityDefaults: null,
    branding: null,
  }

  const themeVars = {
    '--tenant-primary': tenantTheme.primaryColor,
    '--tenant-secondary': tenantTheme.secondaryColor,
    '--tenant-theme-color': tenantTheme.themeColor || tenantTheme.primaryColor,
  } as CSSProperties

  // Force cache clear script - runs once per session to ensure fresh content
  const cacheCleanupScript = `
    (function() {
      var cleared = sessionStorage.getItem('sw-cleared-v6');
      if (!cleared && 'serviceWorker' in navigator) {
        // Clear all caches
        if ('caches' in window) {
          caches.keys().then(function(names) {
            names.forEach(function(name) {
              if (name.indexOf('v6-2025-12-14') === -1) {
                console.log('[Cleanup] Deleting cache:', name);
                caches.delete(name);
              }
            });
          });
        }
        // Force service worker update
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          registrations.forEach(function(reg) {
            reg.update();
          });
        });
        sessionStorage.setItem('sw-cleared-v6', 'true');
        console.log('[Cleanup] Cache cleanup complete');
      }
    })();
  `;

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: cacheCleanupScript }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={tenantTheme.themeColor || tenantTheme.primaryColor} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={tenantTheme.name} />
      </head>
      <body className="font-sans antialiased" style={themeVars}>
        <Providers>
          <TenantThemeProvider tenant={tenantTheme}>
            {children}
            <CartLauncher />
          </TenantThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
