"use client";

import { createContext, useContext, useEffect, useMemo } from 'react';

export interface TenantTheme {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  tagline?: string | null;
  primaryColor: string;
  secondaryColor: string;
  themeColor?: string | null;
  featureFlags: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  deliveryRadiusMi?: number | null;
  minimumOrderValue?: number | null;
  platformPercentFee?: number | null;
  platformFlatFee?: number | null;
  defaultTaxRate?: number | null;
  deliveryBaseFee?: number | null;
  taxProvider?: string | null;
  socials?: {
    instagram?: string | null;
    facebook?: string | null;
    tikTok?: string | null;
    youtube?: string | null;
  };
  membershipProgram?: MembershipProgramConfig | null;
  upsellBundles?: UpsellBundleConfig[];
  accessibilityDefaults?: AccessibilityDefaults | null;
  branding?: TenantBranding | null;
}

export interface MembershipTierConfig {
  id: string;
  name: string;
  threshold: number;
  rewardDescription?: string | null;
  perks?: string[];
  badgeColor?: string | null;
  sortOrder?: number;
}

export interface MembershipProgramConfig {
  enabled: boolean;
  pointsPerDollar: number;
  heroCopy?: string | null;
  featuredMemberName?: string | null;
  tiers: MembershipTierConfig[];
}

export interface UpsellBundleConfig {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string | null;
  tag?: string | null;
  cta?: string | null;
  surfaces?: Array<'cart' | 'checkout' | 'menu'>;
}

export interface AccessibilityDefaults {
  highContrast?: boolean;
  largeText?: boolean;
  reducedMotion?: boolean;
}

export interface TenantBranding {
  heroImages?: string[];
  highlights?: string[];
  recommendedItems?: string[];
  location?: string | null;
  hours?: string | null;
  logo?: string | null;
}

const DEFAULT_THEME: TenantTheme = {
  id: 'default',
  name: 'Alessa Cloud',
  slug: 'alessa',
  primaryColor: '#38c4ff',
  secondaryColor: '#071836',
  themeColor: '#38c4ff',
  featureFlags: [],
  contactEmail: 'support@alessacloud.com',
  contactPhone: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  country: null,
  postalCode: null,
  deliveryRadiusMi: null,
  minimumOrderValue: null,
  platformPercentFee: 0.029,
  platformFlatFee: 0.3,
  defaultTaxRate: 0.0825,
  deliveryBaseFee: 4.99,
  taxProvider: 'builtin',
  membershipProgram: null,
  upsellBundles: [],
  accessibilityDefaults: null,
  branding: null,
};

const TenantThemeContext = createContext<TenantTheme>(DEFAULT_THEME);

function hexToRgba(hex: string, alpha = 1) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return `rgba(56, 196, 255, ${alpha})`;
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface TenantThemeProviderProps {
  tenant: TenantTheme;
  children: React.ReactNode;
}

export function TenantThemeProvider({ tenant, children }: TenantThemeProviderProps) {
  const theme = useMemo<TenantTheme>(() => {
    const merged = {
      ...DEFAULT_THEME,
      ...tenant,
    };
    merged.featureFlags = Array.isArray(tenant.featureFlags) ? tenant.featureFlags : DEFAULT_THEME.featureFlags;
    merged.themeColor = tenant.themeColor ?? DEFAULT_THEME.themeColor;
    return merged;
  }, [tenant]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary', theme.primaryColor);
    root.style.setProperty('--tenant-secondary', theme.secondaryColor);
    root.style.setProperty('--tenant-hero-gradient-start', hexToRgba(theme.primaryColor, 0.6));
    root.style.setProperty('--tenant-hero-gradient-end', hexToRgba(theme.secondaryColor, 0.6));
    root.style.setProperty('--tenant-primary-soft', hexToRgba(theme.primaryColor, 0.25));
    root.style.setProperty('--tenant-secondary-soft', hexToRgba(theme.secondaryColor, 0.25));
    root.style.setProperty('--tenant-theme-color', theme.themeColor || theme.primaryColor);
  }, [theme.primaryColor, theme.secondaryColor, theme.themeColor]);

  return <TenantThemeContext.Provider value={theme}>{children}</TenantThemeContext.Provider>;
}

export function useTenantTheme() {
  return useContext(TenantThemeContext);
}
