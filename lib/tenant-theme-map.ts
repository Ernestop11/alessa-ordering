export interface StaticTenantTheme {
  slug: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  themeColor: string;
  hasCustomIcons?: boolean; // Whether tenant has /tenant/[slug]/icons folder
  assets: {
    hero: string;
    membership: string;
    logo: string;
  };
}

// Generic fallback theme - NOT a specific tenant
const GENERIC_FALLBACK_THEME: StaticTenantTheme = {
  slug: 'alessacloud',
  name: 'Alessa Cloud',
  primaryColor: '#0f172a', // Slate-900 - neutral/professional
  secondaryColor: '#3b82f6', // Blue-500 - accent
  themeColor: '#0f172a',
  assets: {
    hero: '/images/default-hero.jpg',
    membership: '/images/default-membership.jpg',
    logo: '/icons/alessa-cloud-icon-512.png',
  },
};

const TENANT_THEME_MAP: Record<string, StaticTenantTheme> = {
  lapoblanita: {
    slug: 'lapoblanita',
    name: 'La Poblanita Mexican Food',
    primaryColor: '#1e3a5f', // Puebla/Talavera navy blue
    secondaryColor: '#3b82f6', // Bright blue accent
    themeColor: '#0f172a', // Dark navy for status bar
    hasCustomIcons: true, // Has /tenant/lapoblanita/icons folder
    assets: {
      hero: '/tenant/lapoblanita/hero.jpg',
      membership: '/tenant/lapoblanita/membership.jpg',
      logo: '/tenant/lapoblanita/logo.png',
    },
  },
  lasreinas: {
    slug: 'lasreinas',
    name: 'Las Reinas',
    primaryColor: '#DC2626',
    secondaryColor: '#FBBF24',
    themeColor: '#5C1515', // Matches top of header gradient for seamless status bar
    hasCustomIcons: true, // Has /tenant/lasreinas/icons folder
    assets: {
      hero: '/tenant/lasreinas/images/hero-quesabirria-action.jpg',
      membership: '/tenant/lasreinas/images/membership.jpg',
      logo: '/tenant/lasreinas/logo.png', // Main logo (blue bull with text)
    },
  },
  villacorona: {
    slug: 'villacorona',
    name: 'Villa Corona',
    primaryColor: '#1d4ed8',
    secondaryColor: '#f97316',
    themeColor: '#1d4ed8',
    assets: {
      hero: '/tenant/villacorona/hero.jpg',
      membership: '/tenant/villacorona/membership.jpg',
      logo: '/tenant/villacorona/logo.png',
    },
  },
  elhornito: {
    slug: 'elhornito',
    name: 'El Hornito Bakery',
    primaryColor: '#d97706', // amber-600
    secondaryColor: '#f59e0b', // amber-500
    themeColor: '#78350f', // amber-900 for status bar
    assets: {
      hero: '/tenant/elhornito/hero.jpg',
      membership: '/tenant/lapoblanita/membership.jpg', // Uses parent tenant membership
      logo: '/tenant/elhornito/logo.png',
    },
  },
  taqueriarosita: {
    slug: 'taqueriarosita',
    name: 'Taqueria Rosita',
    primaryColor: '#1a1a1a', // Rich black - matches their menu design
    secondaryColor: '#c41e3a', // Cardinal red - bold Mexican accent
    themeColor: '#0a0a0a', // Deep black for status bar
    assets: {
      hero: '/tenant/taqueriarosita/images/hero/burrito-hero.jpg',
      membership: '/tenant/taqueriarosita/images/hero/tacos-hero.jpg',
      logo: '/tenant/taqueriarosita/logo.png',
    },
  },
};

export function getStaticTenantTheme(slug?: string): StaticTenantTheme {
  if (slug && TENANT_THEME_MAP[slug]) {
    return TENANT_THEME_MAP[slug];
  }
  // IMPORTANT: Return generic theme, NOT a specific tenant's theme
  // This prevents cross-tenant branding pollution
  return GENERIC_FALLBACK_THEME;
}

// Export for testing
export { TENANT_THEME_MAP };
