'use client';

import { TenantThemeProvider, type TenantTheme } from '@/components/TenantThemeProvider';

const mockTenantTheme: TenantTheme = {
  id: 'test-tenant-id',
  name: 'La Poblanita Test',
  slug: 'test-tenant',
  logoUrl: null,
  heroImageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=80',
  heroTitle: 'La Poblanita',
  heroSubtitle: 'Authentic Puebla Cuisine in the Heart of Atlixco',
  tagline: 'Traditional Mexican flavors',
  primaryColor: '#ff6b35',
  secondaryColor: '#004e89',
  featureFlags: ['catering'], // Enable catering feature
  contactEmail: 'info@lapoblanita.com',
  contactPhone: '(555) 123-4567',
  addressLine1: '123 Main Street',
  addressLine2: null,
  city: 'Atlixco',
  state: 'Puebla',
  country: 'MX',
  postalCode: '74200',
  deliveryRadiusMi: 5,
  minimumOrderValue: 10,
  platformPercentFee: 0.029,
  platformFlatFee: 0.3,
  defaultTaxRate: 0.16,
  deliveryBaseFee: 4.99,
  taxProvider: 'builtin',
  socials: {
    instagram: '@lapoblanita',
    facebook: 'facebook.com/lapoblanita',
    tikTok: '@lapoblanita',
    youtube: null,
  },
  membershipProgram: {
    enabled: true,
    pointsPerDollar: 10,
    heroCopy: 'Earn puntos with every order and unlock chef-curated rewards.',
    featuredMemberName: 'VIP Member',
    tiers: [
      {
        id: 'bronze',
        name: 'Bronze',
        threshold: 0,
        rewardDescription: 'Welcome gift',
        perks: ['Earn 10 points per dollar'],
        badgeColor: '#cd7f32',
        sortOrder: 1,
      },
      {
        id: 'silver',
        name: 'Silver',
        threshold: 500,
        rewardDescription: 'Free dessert every 5 orders',
        perks: ['Earn 10 points per dollar', 'Birthday surprise'],
        badgeColor: '#c0c0c0',
        sortOrder: 2,
      },
      {
        id: 'gold',
        name: 'Gold',
        threshold: 1000,
        rewardDescription: 'Priority service & exclusive specials',
        perks: ['Earn 15 points per dollar', 'Birthday surprise', 'Early access to new items'],
        badgeColor: '#ffd700',
        sortOrder: 3,
      },
    ],
  },
  upsellBundles: [
    {
      id: 'family-pack',
      name: 'Family Fiesta Pack',
      description: 'Feed the whole family with our signature bundle',
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
      tag: 'Popular',
      cta: 'Add Family Pack',
      surfaces: ['menu', 'cart'],
    },
  ],
  accessibilityDefaults: {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
  },
  branding: {
    heroImages: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=80',
    ],
    highlights: ['Authentic', 'Family-owned', 'Fresh daily'],
    recommendedItems: ['Carne Asada Taco', 'Beef Burrito'],
    location: '123 Main Street, Atlixco, Puebla',
    hours: 'Mon-Sat: 9am-9pm\nSun: 10am-8pm',
    logo: null,
  },
};

export default function TestOrderLayout({ children }: { children: React.ReactNode }) {
  return <TenantThemeProvider tenant={mockTenantTheme}>{children}</TenantThemeProvider>;
}
