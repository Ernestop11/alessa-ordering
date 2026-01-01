export interface StaticTenantTheme {
  slug: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  themeColor: string;
  assets: {
    hero: string;
    membership: string;
    logo: string;
  };
}

const DEFAULT_THEME_KEY = 'lapoblanita';

const TENANT_THEME_MAP: Record<string, StaticTenantTheme> = {
  lapoblanita: {
    slug: 'lapoblanita',
    name: 'La Poblanita Mexican Food',
    primaryColor: '#1e3a5f', // Puebla/Talavera navy blue
    secondaryColor: '#3b82f6', // Bright blue accent
    themeColor: '#0f172a', // Dark navy for status bar
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
};

export function getStaticTenantTheme(slug?: string): StaticTenantTheme {
  if (slug && TENANT_THEME_MAP[slug]) {
    return TENANT_THEME_MAP[slug];
  }
  return TENANT_THEME_MAP[DEFAULT_THEME_KEY];
}
