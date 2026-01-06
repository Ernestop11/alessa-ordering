"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { OrderMenuSection, OrderMenuItem } from './OrderPageClient';
import type { TemplateSettings } from '@/lib/template-renderer';

/**
 * TENANT-SPECIFIC COMPONENT ROUTING
 *
 * Each tenant can have their own OrderPageClient component.
 * This allows customizing one tenant without affecting others.
 *
 * To add a new tenant-specific component:
 * 1. Copy OrderPageClient.tsx to OrderPageClient{TenantName}.tsx
 * 2. Update the export function name in the new file
 * 3. Add a dynamic import below with the tenant slug as key
 * 4. Add the tenant slug to TENANT_SPECIFIC_COMPONENTS
 */

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-white mx-auto mb-4"></div>
      <p className="text-white/70 text-sm">Loading menu...</p>
    </div>
  </div>
);

// DEFAULT component (used by Las Reinas and any tenant without a specific component)
const OrderPageClient = dynamic(
  () => import('./OrderPageClient').then(mod => mod.default),
  { ssr: false, loading: LoadingSpinner }
);

// TENANT-SPECIFIC components
// Only add entries here for tenants that need CUSTOM code (not just different branding)
// All branding (logo, colors, name) comes from the database - no need to clone for that!
const OrderPageClientLaPoblanita = dynamic(
  () => import('./OrderPageClientLaPoblanita').then(mod => mod.default),
  { ssr: false, loading: LoadingSpinner }
);

// Map of tenant slugs to their specific components
// Tenants NOT listed here will use the default OrderPageClient (which is database-driven)
// Only add a tenant here if they need CUSTOM CODE FEATURES, not just different branding
const TENANT_SPECIFIC_COMPONENTS: Record<string, React.ComponentType<any>> = {
  // La Poblanita has custom panaderia (El Hornito bakery) integration
  'lapoblanita': OrderPageClientLaPoblanita,
  // Taqueria Rosita, Villa Corona, and other new tenants use the default database-driven component
  // No custom code needed - all branding comes from database!
};

const PolishedOrderPage = dynamic(
  () => import('./PolishedOrderPage'),
  { ssr: false }
);

interface CateringPackage {
  id: string;
  name: string;
  description: string;
  pricePerGuest: number;
  price?: number | null;
  category: string;
  image: string | null;
  gallery?: string[] | null;
  badge: string | null;
  customizationRemovals?: string[];
  customizationAddons?: { id: string; label: string; price: number }[];
  available: boolean;
  displayOrder: number;
}

interface RewardsData {
  membershipProgram: any;
  rewardsGallery: string[];
}

interface CustomerRewardsData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  loyaltyPoints: number;
  membershipTier: string | null;
  orders: Array<{
    id: string;
    createdAt: string;
    totalAmount: number;
    status: string;
    fulfillmentMethod: string;
    items: Array<{
      id: string;
      quantity: number;
      price: number;
      menuItem: {
        id: string;
        name: string;
        description: string;
        price: number;
        image: string | null;
        available: boolean;
      } | null;
    }>;
  }>;
}

interface FrontendUISection {
  id: string;
  name: string;
  type: 'hero' | 'quickInfo' | 'featuredCarousel' | 'menuSections' | 'promoBanner1' | 'groceryBanner' | 'weCookBanner' | 'dealStrip' | 'qualityBanner' | 'reviewsStrip';
  position: number;
  enabled: boolean;
  content: {
    title?: string;
    subtitle?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    image?: string;
    badge?: string;
    backgroundColor?: string;
    textColor?: string;
    gradientFrom?: string;
    gradientTo?: string;
  };
}

interface OrderPageWrapperProps {
  sections: OrderMenuSection[];
  featuredItems?: OrderMenuItem[];
  tenantSlug: string;
  cateringTabConfig?: any;
  cateringPackages?: CateringPackage[];
  rewardsData?: RewardsData;
  customerRewardsData?: CustomerRewardsData | null;
  isOpen?: boolean;
  closedMessage?: string;
  frontendConfig?: {
    featuredCarousel?: {
      title?: string;
      subtitle?: string;
    };
  };
  frontendUISections?: FrontendUISection[];
  enabledAddOns?: string[];
  templateSettings?: TemplateSettings;
  isPreview?: boolean;
}

// UI Version Toggle - Set to 'polished' for new UI, 'classic' for original
// Change this to 'classic' to instantly rollback to the original UI
const UI_VERSION: 'polished' | 'classic' = 'classic';

export default function OrderPageWrapper(props: OrderPageWrapperProps) {
  // Allow URL override for testing: ?ui=classic or ?ui=polished
  const [uiVersion, setUiVersion] = useState<'polished' | 'classic'>(UI_VERSION);

  useEffect(() => {
    // Sync with URL param after mount (client-side only)
    const params = new URLSearchParams(window.location.search);
    const uiParam = params.get('ui');
    if (uiParam === 'classic' || uiParam === 'polished') {
      setUiVersion(uiParam);
    }
  }, []);

  // Dynamic imports with ssr: false handle the loading state and prevent hydration issues
  if (uiVersion === 'polished') {
    return <PolishedOrderPage {...props} />;
  }

  // Check if this tenant has a specific component
  const TenantComponent = TENANT_SPECIFIC_COMPONENTS[props.tenantSlug];
  if (TenantComponent) {
    return <TenantComponent {...props} />;
  }

  // Default to the standard OrderPageClient (Las Reinas and others)
  return <OrderPageClient {...props} />;
}


