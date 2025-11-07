import './globals.css'
import type { Metadata, Viewport } from 'next'
import type { CSSProperties } from 'react'
import CartLauncher from '../components/CartLauncher'
import { Providers } from './providers'
import { requireTenant } from '../lib/tenant'
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
  manifest: '/manifest.webmanifest',
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

export const viewport: Viewport = {
  themeColor: '#38c4ff',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await requireTenant()

  const tenantTheme: TenantTheme = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logoUrl,
    heroImageUrl: tenant.heroImageUrl,
    heroTitle: tenant.heroTitle || tenant.name,
    heroSubtitle: tenant.heroSubtitle || tenant.settings?.tagline || '',
    tagline: tenant.settings?.tagline || '',
    primaryColor: tenant.primaryColor || '#38c4ff',
    secondaryColor: tenant.secondaryColor || '#071836',
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
  }

  const themeVars = {
    '--tenant-primary': tenantTheme.primaryColor,
    '--tenant-secondary': tenantTheme.secondaryColor,
  } as CSSProperties

  return (
    <html lang="en">
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
