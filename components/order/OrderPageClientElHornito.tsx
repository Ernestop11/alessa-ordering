/**
 * OrderPageClientElHornito - El Hornito Bakery Order Page Wrapper
 *
 * This component wraps OrderPageClientLaPoblanita to reuse its complete UI
 * while adding El Hornito-specific branding and back navigation.
 *
 * Key features:
 * - Reuses 100% of La Poblanita's UI code
 * - Adds "Back to La Poblanita" navigation header
 * - Overrides theme to El Hornito's amber/orange colors
 * - Shared cart with parent tenant
 */
"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import OrderPageClientLaPoblanita from './OrderPageClientLaPoblanita';
import type { OrderMenuSection, OrderMenuItem } from './OrderPageClientLaPoblanita';

interface ElHornitoTenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
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

interface OrderPageClientElHornitoProps {
  sections: OrderMenuSection[];
  featuredItems?: OrderMenuItem[];
  tenantSlug: string;
  elHornitoTenant: ElHornitoTenant;
  rewardsData?: RewardsData;
  customerRewardsData?: CustomerRewardsData | null;
  isOpen?: boolean;
  closedMessage?: string;
}

export default function OrderPageClientElHornito({
  sections,
  featuredItems = [],
  tenantSlug,
  elHornitoTenant,
  rewardsData,
  customerRewardsData,
  isOpen = false,
  closedMessage,
}: OrderPageClientElHornitoProps) {
  // Inject El Hornito CSS custom properties for theme override
  useEffect(() => {
    const root = document.documentElement;
    const originalPrimary = root.style.getPropertyValue('--tenant-primary');
    const originalSecondary = root.style.getPropertyValue('--tenant-secondary');
    const originalGradientFrom = root.style.getPropertyValue('--tenant-gradient-from');
    const originalGradientVia = root.style.getPropertyValue('--tenant-gradient-via');
    const originalGradientTo = root.style.getPropertyValue('--tenant-gradient-to');

    // Override with El Hornito bakery theme (amber/orange)
    root.style.setProperty('--tenant-primary', elHornitoTenant.primaryColor || '#d97706');
    root.style.setProperty('--tenant-secondary', elHornitoTenant.secondaryColor || '#f59e0b');
    root.style.setProperty('--tenant-gradient-from', '#78350f'); // amber-900
    root.style.setProperty('--tenant-gradient-via', '#92400e'); // amber-800
    root.style.setProperty('--tenant-gradient-to', '#78350f'); // amber-900

    // Add global CSS to push La Poblanita header down by El Hornito banner height
    const styleId = 'el-hornito-header-offset';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      /* El Hornito: Push La Poblanita's fixed header down */
      [data-el-hornito-wrapper] header.fixed {
        top: calc(env(safe-area-inset-top, 0px) + 44px) !important;
      }
      /* El Hornito: Push mobile section nav down */
      [data-el-hornito-wrapper] .fixed.sm\\:hidden {
        top: calc(env(safe-area-inset-top, 0px) + 108px) !important;
      }
      /* El Hornito: Adjust scrolled header position */
      [data-el-hornito-wrapper] header.fixed[style*="padding-top"] {
        padding-top: 0 !important;
        top: calc(env(safe-area-inset-top, 0px) + 44px) !important;
      }
    `;

    return () => {
      // Restore original theme on unmount
      if (originalPrimary) root.style.setProperty('--tenant-primary', originalPrimary);
      if (originalSecondary) root.style.setProperty('--tenant-secondary', originalSecondary);
      if (originalGradientFrom) root.style.setProperty('--tenant-gradient-from', originalGradientFrom);
      if (originalGradientVia) root.style.setProperty('--tenant-gradient-via', originalGradientVia);
      if (originalGradientTo) root.style.setProperty('--tenant-gradient-to', originalGradientTo);
      // Remove the style element
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [elHornitoTenant]);

  return (
    <div className="relative" data-el-hornito-wrapper>
      {/* El Hornito Back Navigation Banner - Fixed at very top, above La Poblanita header */}
      <div
        className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 shadow-lg"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between">
          <Link
            href="/order"
            className="flex items-center gap-2 text-white font-semibold hover:text-amber-100 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to La Poblanita</span>
            <span className="sm:hidden">La Poblanita</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {elHornitoTenant.logoUrl ? (
                <Image
                  src={elHornitoTenant.logoUrl}
                  alt={elHornitoTenant.name}
                  width={28}
                  height={28}
                  className="rounded-full bg-white p-0.5"
                  unoptimized
                />
              ) : (
                <span className="text-xl">🥐</span>
              )}
              <span className="text-white font-bold text-sm sm:text-base">El Hornito Bakery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for the fixed El Hornito banner - this pushes all content down */}
      <div className="h-[44px]" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }} />

      {/* Reuse the full La Poblanita component with El Hornito data */}
      <OrderPageClientLaPoblanita
        sections={sections}
        featuredItems={featuredItems}
        tenantSlug={tenantSlug}
        rewardsData={rewardsData}
        customerRewardsData={customerRewardsData}
        isOpen={isOpen}
        closedMessage={closedMessage}
        frontendConfig={{
          featuredCarousel: {
            title: "Today's Fresh Picks",
            subtitle: "Baked fresh this morning",
          },
        }}
        // Disable catering for bakery
        cateringTabConfig={{ enabled: false, label: 'Catering' }}
        cateringPackages={[]}
        // Don't show other add-ons in bakery view
        enabledAddOns={[]}
      />
    </div>
  );
}

// Re-export types for the page component
export type { OrderMenuSection, OrderMenuItem };
