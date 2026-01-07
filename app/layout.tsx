import './globals.css'
import type { Metadata, Viewport } from 'next'
import type { CSSProperties } from 'react'
import { headers } from 'next/headers'
import CartLauncher from '../components/CartLauncher'
import KioskMode from '../components/KioskMode'
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

// Note: Dynamic metadata is generated below in generateMetadata()
// Static metadata removed in favor of tenant-specific dynamic metadata

export function generateViewport(): Viewport {
  try {
    const slug = getTenantSlugFromHeaders();
    const theme = getStaticTenantTheme(slug);
    return {
      themeColor: theme.themeColor,
      // Enable safe area insets for iPhone notch/Dynamic Island
      viewportFit: 'cover',
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
    };
  } catch {
    const fallback = getStaticTenantTheme();
    return {
      themeColor: fallback.themeColor,
      viewportFit: 'cover',
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const slug = getTenantSlugFromHeaders();
    const theme = getStaticTenantTheme(slug);

    // Determine icon paths based on tenant theme config (not hard-coded list)
    const hasCustomIcons = theme.hasCustomIcons === true;
    const iconPath = hasCustomIcons
      ? `/tenant/${slug}/icons/icon-192.png`
      : '/icons/alessa-cloud-icon-192.png';
    const icon512Path = hasCustomIcons
      ? `/tenant/${slug}/icons/icon-512.png`
      : '/icons/alessa-cloud-icon-512.png';

    return {
      title: {
        default: theme.name,
        template: `%s · ${theme.name}`,
      },
      description: `Order from ${theme.name}`,
      manifest: '/api/manifest',
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: theme.name,
      },
      icons: {
        icon: [
          { url: iconPath, sizes: '192x192', type: 'image/png' },
          { url: icon512Path, sizes: '512x512', type: 'image/png' },
        ],
        apple: [
          { url: iconPath, sizes: '180x180', type: 'image/png' },
        ],
        shortcut: [{ url: '/api/favicon' }],
      },
    };
  } catch {
    return {
      title: {
        default: 'Alessa Cloud',
        template: '%s · Alessa Cloud',
      },
      description: 'Multi-tenant restaurant ordering platform powered by Alessa Cloud.',
      manifest: '/api/manifest',
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
    templateType: tenant.settings?.templateType || 'restaurant',
    gradientFrom: tenant.settings?.gradientFrom || undefined,
    gradientVia: tenant.settings?.gradientVia || undefined,
    gradientTo: tenant.settings?.gradientTo || undefined,
    layoutConfig: (tenant.settings?.frontendConfig as any)?.layoutConfig || undefined,
    // Delivery is enabled if either Uber or DoorDash is connected
    deliveryEnabled:
      tenant.integrations?.uberOnboardingStatus === 'connected' ||
      tenant.integrations?.doordashOnboardingStatus === 'connected',
    deliveryPartner:
      tenant.integrations?.uberOnboardingStatus === 'connected' ? 'uber' :
      tenant.integrations?.doordashOnboardingStatus === 'connected' ? 'doordash' : null,
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
    templateType: 'restaurant',
    gradientFrom: undefined,
    gradientVia: undefined,
    gradientTo: undefined,
    layoutConfig: undefined,
    deliveryEnabled: false,
    deliveryPartner: null,
  }

  const themeVars = {
    '--tenant-primary': tenantTheme.primaryColor,
    '--tenant-secondary': tenantTheme.secondaryColor,
    '--tenant-theme-color': tenantTheme.themeColor || tenantTheme.primaryColor,
  } as CSSProperties

  // Force cache clear script - runs once per session to ensure fresh content
  const cacheCleanupScript = `
    (function() {
      var cleared = sessionStorage.getItem('sw-cleared-v12');
      if (!cleared && 'serviceWorker' in navigator) {
        // Clear all caches - AGGRESSIVE: delete everything
        if ('caches' in window) {
          caches.keys().then(function(names) {
            names.forEach(function(name) {
              console.log('[Cleanup] Deleting cache:', name);
              caches.delete(name);
            });
          });
        }
        // Force service worker update and unregister all
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          registrations.forEach(function(reg) {
            reg.unregister();
            console.log('[Cleanup] Unregistered service worker');
          });
        });
        sessionStorage.setItem('sw-cleared-v12', 'true');
        console.log('[Cleanup] Cache cleanup complete v11');
        // Force reload after clearing
        setTimeout(function() { location.reload(); }, 500);
      }
    })();
  `;

  const preventExternalBrowserScript = `
    (function() {
      // Detect if we're in a Capacitor app
      var isCapacitor = typeof window !== 'undefined' && !!(window.Capacitor);
      
      if (isCapacitor) {
        console.log('[Capacitor] Preventing external browser opening');
        
        // Store original location
        var originalLocation = window.location;
        var currentOrigin = originalLocation.origin;
        
        // Intercept window.location.href assignments
        try {
          Object.defineProperty(window, 'location', {
            get: function() {
              return originalLocation;
            },
            set: function(url) {
              if (typeof url === 'string') {
                if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
                  // Full URL - check if same origin
                  if (url.indexOf(currentOrigin) === 0) {
                    // Same origin - navigate in app using relative path
                    var path = url.replace(currentOrigin, '');
                    console.log('[Capacitor] Converting same-origin URL to relative path:', path);
                    originalLocation.href = path;
                  } else {
                    // Different origin - block it
                    console.warn('[Capacitor] Blocked external URL navigation:', url);
                    // Don't navigate - stay in app
                  }
                } else {
                  // Relative path - allow it
                  originalLocation.href = url;
                }
              } else {
                originalLocation.href = url;
              }
            },
            configurable: true
          });
        } catch (e) {
          console.warn('[Capacitor] Could not intercept window.location:', e);
        }
        
        // Intercept window.open calls
        var originalOpen = window.open;
        window.open = function(url, target, features) {
          if (url && typeof url === 'string' && (url.indexOf('http://') === 0 || url.indexOf('https://') === 0)) {
            // If it's an external URL, try to navigate within the app instead
            if (url.indexOf(currentOrigin) === 0) {
              // Same origin - use relative path
              var path = url.replace(currentOrigin, '');
              console.log('[Capacitor] Converting window.open to relative navigation:', path);
              window.location.href = path;
              return null;
            } else {
              // Different origin - log warning but allow (might be necessary for OAuth, etc.)
              console.warn('[Capacitor] External URL opened:', url);
              return originalOpen.call(window, url, target, features);
            }
          }
          return originalOpen.call(window, url, target, features);
        };
        
        // Prevent links with target="_blank" from opening externally (when ready)
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() {
            setupLinkInterception();
          });
        } else {
          setupLinkInterception();
        }
        
        function setupLinkInterception() {
          document.addEventListener('click', function(e) {
            var target = e.target;
            while (target && target.nodeName !== 'A') {
              target = target.parentElement;
            }
            if (target && target.getAttribute('target') === '_blank') {
              var href = target.getAttribute('href');
              if (href && (href.indexOf('http://') === 0 || href.indexOf('https://') === 0)) {
                if (href.indexOf(currentOrigin) === 0) {
                  // Same origin - prevent default and navigate in-app
                  e.preventDefault();
                  var path = href.replace(currentOrigin, '');
                  window.location.href = path;
                }
              }
            }
          }, true);
        }
      }
    })();
  `;

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: cacheCleanupScript }} />
        <script dangerouslySetInnerHTML={{ __html: preventExternalBrowserScript }} />
        <link rel="manifest" href="/api/manifest" />
        <meta name="theme-color" content={tenantTheme.themeColor || tenantTheme.primaryColor} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={tenantTheme.name} />
        {/* Apple touch icon for iOS home screen - use tenant-specific icon if available */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={tenantTheme.slug ? `/tenant/${tenantTheme.slug}/icons/icon-192.png?v5` : '/icons/alessa-cloud-icon-192.png'}
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href={tenantTheme.slug ? `/tenant/${tenantTheme.slug}/icons/icon-192.png?v5` : '/icons/alessa-cloud-icon-192.png'}
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href={tenantTheme.slug ? `/tenant/${tenantTheme.slug}/icons/icon-192.png?v5` : '/icons/alessa-cloud-icon-192.png'}
        />
      </head>
      <body className="font-sans antialiased" style={themeVars}>
        <Providers>
          <TenantThemeProvider tenant={tenantTheme}>
            <KioskMode />
            {children}
            <CartLauncher />
          </TenantThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
