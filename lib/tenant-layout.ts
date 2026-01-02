/**
 * Per-Tenant Layout Configuration System
 *
 * This allows each tenant to customize their page layout (spacing, sizing, etc.)
 * without affecting other tenants - similar to Wix/Shopify customization.
 *
 * Layout values are stored in TenantSettings.frontendConfig.layoutConfig
 * and injected as CSS variables by TenantThemeProvider.
 */

export type LayoutPreset = 'compact' | 'normal' | 'spacious' | 'custom';
export type ContainerWidth = 'narrow' | 'default' | 'wide' | 'full';
export type SpacingSize = 'tight' | 'normal' | 'relaxed';
export type PaddingSize = 'compact' | 'normal' | 'spacious';
export type HeaderStyle = 'minimal' | 'standard' | 'large';
export type HeroHeight = 'short' | 'medium' | 'tall';
export type CardSize = 'compact' | 'normal' | 'large';

export interface TenantLayoutConfig {
  // Quick preset (applies sensible defaults for all values)
  preset: LayoutPreset;

  // Container width
  containerWidth?: ContainerWidth;

  // Section spacing (vertical gap between sections)
  sectionSpacing?: SpacingSize;

  // Section padding (internal padding within sections)
  sectionPadding?: PaddingSize;

  // Header configuration
  headerStyle?: HeaderStyle;

  // Hero section
  heroHeight?: HeroHeight;
  heroPadding?: PaddingSize;

  // Card/item display
  cardSize?: CardSize;
  cardGap?: SpacingSize;

  // Nav bar position (distance from top when scrolled/not scrolled)
  navScrolledTop?: string;
  navExpandedTop?: string;
}

// CSS value mappings
export const CONTAINER_WIDTH_MAP: Record<ContainerWidth, string> = {
  narrow: '64rem',   // max-w-5xl (1024px)
  default: '80rem',  // max-w-7xl (1280px)
  wide: '96rem',     // max-w-[1536px]
  full: '100%',      // full width
};

export const SECTION_SPACING_MAP: Record<SpacingSize, string> = {
  tight: '1rem',     // 16px
  normal: '2rem',    // 32px (current default)
  relaxed: '3rem',   // 48px
};

export const SECTION_PADDING_MAP: Record<PaddingSize, string> = {
  compact: '1rem',   // py-4
  normal: '2rem',    // py-8 (current default)
  spacious: '4rem',  // py-16
};

export const HERO_HEIGHT_MAP: Record<HeroHeight, string> = {
  short: '300px',
  medium: '500px',   // current default
  tall: '700px',
};

export const HERO_PADDING_MAP: Record<PaddingSize, string> = {
  compact: '2rem',   // py-8
  normal: '3rem',    // py-12 (current default)
  spacious: '5rem',  // py-20
};

export const CARD_GAP_MAP: Record<SpacingSize, string> = {
  tight: '0.75rem',  // gap-3
  normal: '1.5rem',  // gap-6 (current default)
  relaxed: '2rem',   // gap-8
};

export const HEADER_HEIGHT_MAP: Record<HeaderStyle, { scrolled: string; expanded: string }> = {
  minimal: { scrolled: '48px', expanded: '64px' },
  standard: { scrolled: '64px', expanded: '88px' },  // current default
  large: { scrolled: '72px', expanded: '100px' },
};

// Preset configurations
export const LAYOUT_PRESETS: Record<LayoutPreset, Omit<TenantLayoutConfig, 'preset'>> = {
  compact: {
    containerWidth: 'default',
    sectionSpacing: 'tight',
    sectionPadding: 'compact',
    headerStyle: 'minimal',
    heroHeight: 'short',
    heroPadding: 'compact',
    cardSize: 'compact',
    cardGap: 'tight',
  },
  normal: {
    containerWidth: 'default',
    sectionSpacing: 'normal',
    sectionPadding: 'normal',
    headerStyle: 'standard',
    heroHeight: 'medium',
    heroPadding: 'normal',
    cardSize: 'normal',
    cardGap: 'normal',
  },
  spacious: {
    containerWidth: 'wide',
    sectionSpacing: 'relaxed',
    sectionPadding: 'spacious',
    headerStyle: 'large',
    heroHeight: 'tall',
    heroPadding: 'spacious',
    cardSize: 'large',
    cardGap: 'relaxed',
  },
  custom: {
    // Custom uses individual values from config, falls back to 'normal' defaults
    containerWidth: 'default',
    sectionSpacing: 'normal',
    sectionPadding: 'normal',
    headerStyle: 'standard',
    heroHeight: 'medium',
    heroPadding: 'normal',
    cardSize: 'normal',
    cardGap: 'normal',
  },
};

/**
 * Get resolved layout config with all values filled in
 * Merges preset defaults with any custom overrides
 */
export function resolveLayoutConfig(config?: Partial<TenantLayoutConfig>): Required<Omit<TenantLayoutConfig, 'navScrolledTop' | 'navExpandedTop'>> & { navScrolledTop?: string; navExpandedTop?: string } {
  const preset = config?.preset || 'normal';
  const presetDefaults = LAYOUT_PRESETS[preset] || LAYOUT_PRESETS.normal;

  return {
    preset,
    containerWidth: config?.containerWidth || presetDefaults.containerWidth || 'default',
    sectionSpacing: config?.sectionSpacing || presetDefaults.sectionSpacing || 'normal',
    sectionPadding: config?.sectionPadding || presetDefaults.sectionPadding || 'normal',
    headerStyle: config?.headerStyle || presetDefaults.headerStyle || 'standard',
    heroHeight: config?.heroHeight || presetDefaults.heroHeight || 'medium',
    heroPadding: config?.heroPadding || presetDefaults.heroPadding || 'normal',
    cardSize: config?.cardSize || presetDefaults.cardSize || 'normal',
    cardGap: config?.cardGap || presetDefaults.cardGap || 'normal',
    navScrolledTop: config?.navScrolledTop,
    navExpandedTop: config?.navExpandedTop,
  };
}

/**
 * Convert layout config to CSS variable values
 */
export function getLayoutCSSValues(config?: Partial<TenantLayoutConfig>): Record<string, string> {
  const resolved = resolveLayoutConfig(config);
  const headerHeights = HEADER_HEIGHT_MAP[resolved.headerStyle];

  return {
    '--layout-container-width': CONTAINER_WIDTH_MAP[resolved.containerWidth],
    '--layout-section-spacing': SECTION_SPACING_MAP[resolved.sectionSpacing],
    '--layout-section-padding': SECTION_PADDING_MAP[resolved.sectionPadding],
    '--layout-hero-height': HERO_HEIGHT_MAP[resolved.heroHeight],
    '--layout-hero-padding': HERO_PADDING_MAP[resolved.heroPadding],
    '--layout-card-gap': CARD_GAP_MAP[resolved.cardGap],
    '--layout-header-scrolled': headerHeights.scrolled,
    '--layout-header-expanded': headerHeights.expanded,
    // Nav position = header height (for positioning nav below header)
    '--layout-nav-scrolled-top': resolved.navScrolledTop || headerHeights.scrolled,
    '--layout-nav-expanded-top': resolved.navExpandedTop || headerHeights.expanded,
  };
}

/**
 * Default layout config (matches current hardcoded values)
 */
export const DEFAULT_LAYOUT_CONFIG: TenantLayoutConfig = {
  preset: 'normal',
};
