'use client';

import { useEffect, useState } from 'react';
import CustomizePreview from './CustomizePreview';
import type { TenantTheme } from '../TenantThemeProvider';
import type { OrderMenuSection, OrderMenuItem } from '../order/OrderPageClient';

// Mock data for preview
const mockSections: OrderMenuSection[] = [
  {
    id: '1',
    name: 'Tacos',
    description: 'Authentic Mexican tacos',
    type: 'RESTAURANT',
    items: [
      {
        id: '1',
        name: 'Carne Asada Taco',
        description: 'Grilled beef with onions and cilantro',
        price: 3.99,
        category: 'Tacos',
        available: true,
        image: 'https://images.unsplash.com/photo-1565299585323-38174c4a6c3a?w=400&q=80',
        gallery: [],
        tags: ['popular', 'spicy'],
      },
      {
        id: '2',
        name: 'Al Pastor Taco',
        description: 'Marinated pork with pineapple',
        price: 3.99,
        category: 'Tacos',
        available: true,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
        gallery: [],
        tags: ['popular'],
      },
    ],
  },
  {
    id: 'bakery',
    name: 'Panadería',
    description: 'Fresh baked goods daily',
    type: 'BAKERY',
    items: [
      {
        id: '8',
        name: 'Conchas',
        description: 'Traditional Mexican sweet bread',
        price: 2.50,
        category: 'Bakery',
        available: true,
        image: 'https://images.unsplash.com/photo-1608031330583-83d9c0c70a43?w=400&q=80',
        gallery: [],
        tags: ['popular', 'fresh'],
      },
    ],
  },
];

const mockFeaturedItems: OrderMenuItem[] = [
  {
    id: '1',
    name: 'Carne Asada Taco',
    description: 'Grilled beef with onions and cilantro',
    price: 3.99,
    category: 'Tacos',
    available: true,
    image: 'https://images.unsplash.com/photo-1565299585323-38174c4a6c3a?w=400&q=80',
    gallery: [],
    tags: ['popular', 'spicy'],
  },
];

export default function CustomizeTab() {
  const [tenant, setTenant] = useState<TenantTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await fetch('/api/admin/tenant-settings');
        if (!response.ok) {
          throw new Error('Failed to fetch tenant settings');
        }
        const data = await response.json();

        // Transform API response to TenantTheme
        const tenantTheme: TenantTheme = {
          id: data.id,
          name: data.name,
          slug: data.slug,
          logoUrl: data.logoUrl,
          heroImageUrl: data.heroImageUrl,
          heroTitle: data.heroTitle || data.name,
          heroSubtitle: data.heroSubtitle || data.settings?.tagline || '',
          tagline: data.settings?.tagline || '',
          primaryColor: data.primaryColor || '#38c4ff',
          secondaryColor: data.secondaryColor || '#071836',
          featureFlags: data.featureFlags || [],
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
          deliveryRadiusMi: data.settings?.deliveryRadiusMi,
          minimumOrderValue: data.settings?.minimumOrderValue,
          platformPercentFee: data.integrations?.platformPercentFee ?? 0.029,
          platformFlatFee: data.integrations?.platformFlatFee ?? 0.3,
          defaultTaxRate: data.integrations?.defaultTaxRate ?? 0.0825,
          deliveryBaseFee: data.integrations?.deliveryBaseFee ?? 4.99,
          taxProvider: data.integrations?.taxProvider ?? 'builtin',
          socials: {
            instagram: data.settings?.socialInstagram,
            facebook: data.settings?.socialFacebook,
            tikTok: data.settings?.socialTikTok,
            youtube: data.settings?.socialYouTube,
          },
          membershipProgram: data.settings?.membershipProgram,
          upsellBundles: data.settings?.upsellBundles || [],
          accessibilityDefaults: data.settings?.accessibilityDefaults,
          branding: data.settings?.branding,
        };

        setTenant(tenantTheme);
      } catch (err) {
        console.error('Error fetching tenant:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tenant');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenant();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading customization settings...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="rounded-lg bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-800">Error Loading Settings</h3>
        <p className="mt-2 text-red-600">{error || 'Failed to load tenant data'}</p>
      </div>
    );
  }

  return (
    <CustomizePreview
      initialTenant={tenant}
      mockSections={mockSections}
      mockFeaturedItems={mockFeaturedItems}
    />
  );
}
