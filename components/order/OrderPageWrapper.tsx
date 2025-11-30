"use client";

import { Suspense } from 'react';
import OrderPageClient, { type OrderMenuSection, type OrderMenuItem } from './OrderPageClient';

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
}

export default function OrderPageWrapper(props: OrderPageWrapperProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-orange-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading menu...</p>
        </div>
      </div>
    }>
      <OrderPageClient {...props} />
    </Suspense>
  );
}


