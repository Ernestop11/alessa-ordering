"use client";

import { Suspense, useState, useEffect } from 'react';
import OrderPageClient, { type OrderMenuSection, type OrderMenuItem } from './OrderPageClient';
import PolishedOrderPage from './PolishedOrderPage';

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
}

// UI Version Toggle - Set to 'polished' for new UI, 'classic' for original
// Change this to 'classic' to instantly rollback to the original UI
const UI_VERSION: 'polished' | 'classic' = 'classic';

export default function OrderPageWrapper(props: OrderPageWrapperProps) {
  // Allow URL override for testing: ?ui=classic or ?ui=polished
  // Start with default, then sync with URL on client-side to avoid hydration mismatch
  const [uiVersion, setUiVersion] = useState<'polished' | 'classic'>(UI_VERSION);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Sync with URL param after mount (client-side only)
    const params = new URLSearchParams(window.location.search);
    const uiParam = params.get('ui');
    if (uiParam === 'classic' || uiParam === 'polished') {
      setUiVersion(uiParam);
    }
  }, []);

  const LoadingFallback = (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-white mx-auto mb-4"></div>
        <p className="text-white/70 text-sm">Loading menu...</p>
      </div>
    </div>
  );

  // Render the selected UI version
  if (uiVersion === 'polished') {
    return (
      <Suspense fallback={LoadingFallback}>
        <PolishedOrderPage {...props} />
      </Suspense>
    );
  }

  // Classic/Original UI
  return (
    <Suspense fallback={LoadingFallback}>
      <OrderPageClient {...props} />
    </Suspense>
  );
}


