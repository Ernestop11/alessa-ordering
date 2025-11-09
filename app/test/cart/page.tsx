'use client';

import Cart from '@/components/Cart';
import { TenantThemeProvider } from '@/components/TenantThemeProvider';

// Mock tenant theme
const mockTenant = {
  id: 'test-tenant',
  name: 'Test Restaurant',
  slug: 'test-tenant',
  primaryColor: '#dc2626',
  secondaryColor: '#f59e0b',
  logoUrl: null,
  heroImageUrl: null,
  heroTitle: 'Test Restaurant',
  heroSubtitle: 'Order direct for pickup or delivery',
  tagline: 'Delicious food, delivered fresh',
  platformPercentFee: 0.03,
  platformFlatFee: 0.3,
  defaultTaxRate: 0.085,
  deliveryBaseFee: 4.99,
  membershipProgram: null,
  featureFlags: [],
  contactEmail: null,
  contactPhone: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  country: null,
  postalCode: null,
  deliveryRadiusMi: null,
  minimumOrderValue: null,
};

export default function TestCartPage() {
  return (
    <TenantThemeProvider tenant={mockTenant}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <Cart />
          </div>
        </div>
      </div>
    </TenantThemeProvider>
  );
}

