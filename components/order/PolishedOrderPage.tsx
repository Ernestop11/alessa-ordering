"use client";

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getStockImageForCategory, cycleFallbackImage } from '../../lib/menu-imagery';
import { useCart } from '../../lib/store/cart';
import { getTenantAssets } from '../../lib/tenant-assets';
import { useTenantTheme } from '../TenantThemeProvider';
import MenuCard from './MenuCard';
import PolishedHeader from './PolishedHeader';
import MobileBottomBar from './MobileBottomBar';

// Import existing components for modals/functionality
import FeaturedCarousel from './FeaturedCarousel';
import RewardsModal from './RewardsModal';
import JoinRewardsModal from './JoinRewardsModal';

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

interface CustomizationOption {
  id: string;
  label: string;
  price: number;
}

export interface OrderMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: string | null;
  gallery?: string[];
  tags?: string[];
  displayImage?: string;
  displayGallery?: string[];
  emoji?: string;
  customizationRemovals?: string[];
  customizationAddons?: CustomizationOption[];
}

export interface OrderMenuSection {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  items: OrderMenuItem[];
}

interface PolishedOrderPageProps {
  sections: OrderMenuSection[];
  featuredItems?: OrderMenuItem[];
  tenantSlug: string;
  cateringTabConfig?: { enabled: boolean; label: string };
  cateringPackages?: CateringPackage[];
  rewardsData?: { membershipProgram: any; rewardsGallery: string[] };
  customerRewardsData?: CustomerRewardsData | null;
  isOpen?: boolean;
  closedMessage?: string;
}

type LayoutView = 'grid' | 'list' | 'cards';

const SECTION_ICONS: Record<string, string> = {
  RESTAURANT: '🌮',
  BAKERY: '🥐',
  GROCERY: '🛒',
  BEVERAGE: '🥤',
  SPECIAL: '👨‍🍳',
  OTHER: '🍽️',
};

const CATEGORY_TO_EMOJI: Record<string, string> = {
  tacos: '🌮',
  bakery: '🥖',
  dessert: '🍰',
  beverages: '🥤',
  drink: '🥤',
  coffee: '☕',
  breakfast: '🍳',
  grocery: '🛒',
  special: '👨‍🍳',
};

function getEmojiForItem(item: OrderMenuItem, sectionType: string) {
  const key = item.category?.toLowerCase?.() || sectionType.toLowerCase();
  const match = Object.entries(CATEGORY_TO_EMOJI).find(([category]) => key.includes(category));
  if (match) return match[1];
  return SECTION_ICONS[sectionType] || '🍽️';
}

export default function PolishedOrderPage({
  sections,
  featuredItems = [],
  tenantSlug,
  cateringTabConfig = { enabled: true, label: 'Catering' },
  cateringPackages: initialCateringPackages = [],
  rewardsData,
  customerRewardsData: initialCustomerRewardsData,
  isOpen = true,
  closedMessage,
}: PolishedOrderPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenant = useTenantTheme();
  const assets = getTenantAssets(tenantSlug || tenant.slug);
  const { addToCart, items: cartItems } = useCart();
  const cartItemCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const safeSections = useMemo(() => Array.isArray(sections) ? sections : [], [sections]);
  const navSections = useMemo(() => {
    return safeSections.filter((section) => section && Array.isArray(section.items) && section.items.length > 0);
  }, [safeSections]);

  const [activeLayout, setActiveLayout] = useState<LayoutView>(() => {
    const paramView = searchParams.get('view') as LayoutView | null;
    if (paramView && ['grid', 'list', 'cards'].includes(paramView)) return paramView;
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'grid';
    return 'grid';
  });

  const [activeSectionId, setActiveSectionId] = useState(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && navSections.some((section) => section.id === categoryParam)) return categoryParam;
    return navSections[0]?.id ?? '';
  });

  const [notification, setNotification] = useState('');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Modal states
  const [cateringPanelOpen, setCateringPanelOpen] = useState(false);
  const [membershipPanelOpen, setMembershipPanelOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [accessibilityState, setAccessibilityState] = useState({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
  });

  // Catering state (same as OrderPageClient)
  const [cateringPackagesState, setCateringPackagesState] = useState<CateringPackage[]>(initialCateringPackages);
  const [cateringGalleryIndex, setCateringGalleryIndex] = useState(0);
  const [cateringGalleryImages, setCateringGalleryImages] = useState<string[]>([]);
  const [cateringName, setCateringName] = useState('');
  const [cateringEmail, setCateringEmail] = useState('');
  const [cateringPhone, setCateringPhone] = useState('');
  const [cateringEventDate, setCateringEventDate] = useState('');
  const [cateringGuestCount, setCateringGuestCount] = useState('');
  const [cateringMessage, setCateringMessage] = useState('');

  // Rewards state
  const [customerData, setCustomerData] = useState<CustomerRewardsData | null>(initialCustomerRewardsData || null);
  const [rewardsGalleryIndex, setRewardsGalleryIndex] = useState(0);
  const [rewardsGalleryImages, setRewardsGalleryImages] = useState<string[]>(rewardsData?.rewardsGallery || []);

  // Customization modal state (for catering packages)
  const [customModal, setCustomModal] = useState<{ item: any; config: any } | null>(null);

  // Catering gallery - fetch from tenant settings
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const timestamp = Date.now();
        const res = await fetch(`/api/catering-packages/gallery?t=${timestamp}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
        });
        if (res.ok) {
          const data = await res.json();
          setCateringGalleryImages(Array.isArray(data.gallery) ? data.gallery : []);
        }
      } catch (err) {
        console.error('Failed to fetch catering gallery:', err);
      }
    };
    fetchGallery();
  }, []);

  const cateringGallery = useMemo(() => {
    if (cateringGalleryImages.length > 0) return cateringGalleryImages;
    return [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1920&q=80',
      'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=1920&q=80',
    ];
  }, [cateringGalleryImages]);

  // Group catering packages
  const popularPackages = useMemo(() => {
    if (!Array.isArray(cateringPackagesState)) return [];
    return cateringPackagesState.filter(pkg => {
      if (!pkg) return false;
      const category = (pkg.category && pkg.category.trim()) || 'popular';
      return category === 'popular';
    });
  }, [cateringPackagesState]);

  const holidayPackages = useMemo(() => {
    if (!Array.isArray(cateringPackagesState)) return [];
    return cateringPackagesState.filter(pkg => pkg && pkg.category === 'holiday');
  }, [cateringPackagesState]);

  const rewardsGallery = useMemo(() => {
    if (rewardsGalleryImages.length > 0) return rewardsGalleryImages;
    return [cycleFallbackImage(50), cycleFallbackImage(51), cycleFallbackImage(52)];
  }, [rewardsGalleryImages]);

  // Notification helper - defined early so other callbacks can use it
  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 2500);
  }, []);

  // Catering form submission
  const handleCateringSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/catering/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cateringName,
          email: cateringEmail,
          phone: cateringPhone,
          eventDate: cateringEventDate || null,
          guestCount: cateringGuestCount || null,
          message: cateringMessage || null,
        }),
      });
      if (response.ok) {
        showNotification('Thank you! We\'ll contact you within 24 hours.');
        setCateringName('');
        setCateringEmail('');
        setCateringPhone('');
        setCateringEventDate('');
        setCateringGuestCount('');
        setCateringMessage('');
        setCateringPanelOpen(false);
      } else {
        showNotification('Something went wrong. Please try again.');
      }
    } catch {
      showNotification('Something went wrong. Please try again.');
    }
  }, [cateringName, cateringEmail, cateringPhone, cateringEventDate, cateringGuestCount, cateringMessage]);

  // Handle re-order from rewards panel
  const handleReorder = useCallback(async (order: CustomerRewardsData['orders'][0]) => {
    if (!order.items || order.items.length === 0) {
      showNotification('This order has no items to reorder');
      return;
    }
    order.items.forEach((item) => {
      if (item.menuItem && item.menuItem.available) {
        for (let i = 0; i < item.quantity; i++) {
          addToCart({
            id: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            quantity: 1,
            image: item.menuItem.image || '',
          });
        }
      }
    });
    showNotification(`Added ${order.items.length} item(s) to cart!`);
    setMembershipPanelOpen(false);
    setTimeout(() => {
      const cartButton = document.querySelector('[data-cart-launcher]') as HTMLElement;
      cartButton?.click();
    }, 300);
  }, [addToCart]);

  // Intersection observer for section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            const sectionId = entry.target.id.replace('section-', '');
            if (sectionId && sectionId !== activeSectionId) {
              setActiveSectionId(sectionId);
            }
          }
        });
      },
      { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [navSections]);

  // Enrich sections with display data
  const enrichedSections = useMemo(() => {
    return safeSections.map((section, sectionIndex) => ({
      ...section,
      icon: SECTION_ICONS[section.type] || '🍽️',
      items: section.items.map((item, itemIndex) => {
        const fallback = getStockImageForCategory(item.category || section.type, itemIndex + sectionIndex);
        const baseGallery = Array.isArray(item.gallery) ? item.gallery.filter(Boolean) : [];
        const displayGallery = [...baseGallery];
        if (item.image && !displayGallery.includes(item.image)) {
          displayGallery.unshift(item.image);
        }
        if (displayGallery.length === 0) {
          displayGallery.push(fallback);
        }
        return {
          ...item,
          displayImage: displayGallery[0] ?? fallback,
          displayGallery,
          emoji: getEmojiForItem(item, section.type),
        };
      }),
    }));
  }, [safeSections]);

  // Featured carousel items
  const carouselItems = useMemo(() => {
    const items = featuredItems.length > 0 ? featuredItems : enrichedSections.flatMap((s) => s.items).slice(0, 5);
    return items.map((item) => ({
      ...item,
      displayImage: item.displayImage || item.image || getStockImageForCategory(item.category, 0),
    }));
  }, [featuredItems, enrichedSections]);

  const handleAddToCart = useCallback(
    (item: OrderMenuItem, image?: string | null) => {
      if (!isOpen) {
        showNotification(closedMessage || 'We are currently closed.');
        return;
      }
      if (!item.available) return;

      addToCart({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        quantity: 1,
        image: image || item.image || undefined,
      });
      showNotification(`Added ${item.name} to cart`);
    },
    [addToCart, showNotification, isOpen, closedMessage]
  );

  const handleCustomize = useCallback(
    (item: OrderMenuItem, sectionType: string) => {
      // For now, just add to cart - customize modal can be integrated later
      handleAddToCart(item, item.displayImage);
    },
    [handleAddToCart]
  );

  const handleCarouselAddToCart = useCallback(
    (item: any) => {
      if (!isOpen) {
        showNotification(closedMessage || 'We are currently closed.');
        return;
      }
      addToCart({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        quantity: 1,
        image: item.displayImage || item.image || '',
      });
      showNotification(`Added ${item.name} to cart`);
    },
    [addToCart, showNotification, isOpen, closedMessage]
  );

  const handleCartClick = useCallback(() => {
    const cartButton = document.querySelector('[data-cart-launcher]') as HTMLElement;
    cartButton?.click();
  }, []);

  const cateringEnabled = tenant.featureFlags?.includes('catering') ?? false;

  // Modal handlers
  const handleOpenCatering = useCallback(() => setCateringPanelOpen(true), []);
  const handleOpenRewards = useCallback(() => {
    if (customerData) {
      setMembershipPanelOpen(true);
    } else {
      setJoinModalOpen(true);
    }
  }, [customerData]);
  const handleToggleAccessibility = useCallback(() => setAccessibilityOpen(prev => !prev), []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      {/* Closed Banner */}
      {!isOpen && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white shadow-lg">
          <div className="mx-auto max-w-6xl px-4 py-3 text-center">
            <p className="font-semibold text-sm md:text-base flex items-center justify-center gap-2">
              <span>🚫</span>
              {closedMessage || 'We are currently closed'}
            </p>
          </div>
        </div>
      )}

      {/* Polished Header */}
      <PolishedHeader
        sections={navSections}
        activeSectionId={activeSectionId}
        onSectionChange={setActiveSectionId}
        activeLayout={activeLayout}
        onLayoutChange={setActiveLayout}
        cartItemCount={cartItemCount}
        onCartClick={handleCartClick}
        onCateringClick={handleOpenCatering}
        onRewardsClick={handleOpenRewards}
        onAccessibilityClick={handleToggleAccessibility}
        cateringEnabled={cateringEnabled}
        isAccessibilityOpen={accessibilityOpen}
        hasCustomerData={!!customerData}
      />

      {/* Hero Section - Compact */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-red-700 py-12 md:py-16">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-950 to-transparent" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            Order Now - Fast Pickup & Delivery
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
            {tenant.heroTitle || tenant.name}
          </h2>

          <p className="mt-4 text-base md:text-lg text-white/80 max-w-xl mx-auto">
            {tenant.heroSubtitle || tenant.tagline || 'Authentic flavors, made with love.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#menu"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-red-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
            >
              <span>Explore Menu</span>
              <span>✨</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main id="menu" className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-12 space-y-8 md:space-y-12 pb-24 md:pb-12">
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-20 right-4 z-50 rounded-xl bg-green-500/95 px-4 py-2.5 text-sm font-medium text-white shadow-xl shadow-green-500/30 animate-in slide-in-from-right fade-in duration-300">
            {notification}
          </div>
        )}

        {/* Featured Carousel */}
        {carouselItems.length > 0 && (
          <FeaturedCarousel
            items={carouselItems}
            onAddToCart={handleCarouselAddToCart}
          />
        )}

        {/* Menu Sections */}
        {enrichedSections.map((section) => {
          const isBakery = section.type === 'BAKERY' || section.name.toLowerCase().includes('panad');

          return (
            <section
              key={section.id}
              id={`section-${section.id}`}
              ref={(el) => { sectionRefs.current[section.id] = el; }}
              className={`scroll-mt-36 rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 transition-all ${
                isBakery
                  ? 'bg-gradient-to-br from-amber-950/30 via-neutral-900/50 to-amber-950/30 border border-amber-500/20'
                  : 'bg-white/[0.02] border border-white/[0.06]'
              }`}
            >
              {/* Section Header */}
              <header className="mb-6 md:mb-8">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2">
                  <span>{section.icon}</span>
                  <span>{section.type}</span>
                  <span className="text-white/20">•</span>
                  <span>{section.items.length} items</span>
                </div>
                <h2 className={`text-2xl md:text-3xl lg:text-4xl font-black ${
                  isBakery ? 'text-amber-100' : 'text-white'
                }`}>
                  {section.name}
                </h2>
                {section.description && (
                  <p className="mt-2 text-sm text-white/50 max-w-2xl">{section.description}</p>
                )}
              </header>

              {/* Items Grid */}
              <div className={`grid gap-4 md:gap-6 ${
                activeLayout === 'list'
                  ? 'grid-cols-1'
                  : activeLayout === 'cards'
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
                {section.items.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    sectionType={section.type}
                    sectionName={section.name}
                    onAddToCart={handleAddToCart}
                    onCustomize={handleCustomize}
                    variant={activeLayout === 'list' ? 'compact' : 'default'}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Empty State */}
        {enrichedSections.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-white/80">Menu Coming Soon</h3>
            <p className="mt-2 text-sm text-white/50">We&apos;re preparing something delicious for you.</p>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomBar
        cartItemCount={cartItemCount}
        onCartClick={handleCartClick}
        onCateringClick={handleOpenCatering}
        onRewardsClick={handleOpenRewards}
        onAccessibilityClick={handleToggleAccessibility}
        cateringEnabled={cateringEnabled}
        isAccessibilityOpen={accessibilityOpen}
      />

      {/* Accessibility Panel */}
      {accessibilityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Accessibility Options</h3>
              <button
                onClick={() => setAccessibilityOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-white/80">High Contrast</span>
                <input
                  type="checkbox"
                  checked={accessibilityState.highContrast}
                  onChange={(e) => setAccessibilityState(s => ({ ...s, highContrast: e.target.checked }))}
                  className="w-5 h-5 rounded accent-red-500"
                />
              </label>
              <label className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-white/80">Large Text</span>
                <input
                  type="checkbox"
                  checked={accessibilityState.largeText}
                  onChange={(e) => setAccessibilityState(s => ({ ...s, largeText: e.target.checked }))}
                  className="w-5 h-5 rounded accent-red-500"
                />
              </label>
              <label className="flex items-center justify-between py-3">
                <span className="text-white/80">Reduced Motion</span>
                <input
                  type="checkbox"
                  checked={accessibilityState.reducedMotion}
                  onChange={(e) => setAccessibilityState(s => ({ ...s, reducedMotion: e.target.checked }))}
                  className="w-5 h-5 rounded accent-red-500"
                />
              </label>
            </div>
            <button
              onClick={() => setAccessibilityOpen(false)}
              className="mt-6 w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Catering Slide-In Panel (Full Version from Classic UI) */}
      {cateringPanelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setCateringPanelOpen(false)}
          />
          {/* Side Panel */}
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto bg-gradient-to-br from-[#2D1810] via-[#1A0F08] to-black p-8 shadow-2xl transition-transform">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-black text-amber-100">🎉 Catering Services</h2>
              <button
                onClick={() => setCateringPanelOpen(false)}
                className="rounded-full border-2 border-white/30 bg-white/10 p-2 text-white transition hover:border-white hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            {/* Gallery Carousel */}
            <div className="relative mb-8 overflow-hidden rounded-3xl border-2 border-amber-500/30">
              <div className="relative h-64 w-full sm:h-80">
                <Image
                  src={cateringGallery[cateringGalleryIndex]}
                  alt="Catering spread"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">Authentic Cuisine</p>
                  <h3 className="text-2xl font-black text-white">Catering for Every Occasion</h3>
                </div>
              </div>
              {/* Gallery navigation */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={() => setCateringGalleryIndex((prev) => (prev - 1 + cateringGallery.length) % cateringGallery.length)}
                  className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition hover:bg-black/80"
                >
                  ←
                </button>
                <button
                  onClick={() => setCateringGalleryIndex((prev) => (prev + 1) % cateringGallery.length)}
                  className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition hover:bg-black/80"
                >
                  →
                </button>
              </div>
              {/* Gallery indicators */}
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {cateringGallery.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCateringGalleryIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === cateringGalleryIndex ? 'w-8 bg-amber-400' : 'w-2 bg-white/40'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Popular Catering Options (Database-driven) */}
            {popularPackages.length > 0 && (
              <div className="mb-8 space-y-4 rounded-2xl border-2 border-amber-500/20 bg-gradient-to-br from-amber-400/10 to-orange-500/10 p-6">
                <h4 className="text-xl font-bold text-amber-100">Popular Catering Options</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {popularPackages.map((pkg) => {
                    const displayImage = pkg.image || cycleFallbackImage(40);
                    const priceText = pkg.price
                      ? `$${pkg.price.toFixed(0)}`
                      : `From $${pkg.pricePerGuest.toFixed(0)}/person`;

                    return (
                      <button
                        key={pkg.id}
                        onClick={() => {
                          setCateringPanelOpen(false);
                          setCustomModal({
                            item: {
                              id: pkg.id,
                              name: pkg.name,
                              description: pkg.description,
                              price: pkg.price || pkg.pricePerGuest,
                              category: 'catering',
                              available: pkg.available,
                              displayImage,
                              sectionType: 'CATERING',
                            },
                            config: {
                              removals: pkg.customizationRemovals || [],
                              addons: pkg.customizationAddons || [],
                            },
                          });
                        }}
                        className="rounded-xl border border-amber-400/30 bg-black/30 p-4 text-left transition hover:border-amber-400 hover:bg-black/40"
                      >
                        {pkg.badge && (
                          <div className="mb-2 inline-block rounded-full bg-amber-400/20 px-2 py-1 text-xs font-bold text-amber-300">
                            {pkg.badge}
                          </div>
                        )}
                        <h5 className="font-bold text-amber-200">{pkg.name}</h5>
                        <p className="mt-1 text-sm text-white/70 line-clamp-2">{pkg.description}</p>
                        <p className="mt-2 text-xs text-amber-300">{priceText} · Click to customize</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Holiday & Event Bundles (Database-driven) */}
            {holidayPackages.length > 0 && (
              <div className="mb-8 space-y-4 rounded-2xl border-2 border-red-600/20 bg-gradient-to-br from-red-600/10 to-orange-500/10 p-6">
                <h4 className="text-xl font-bold text-red-200">🎉 Holiday & Event Bundles</h4>
                <p className="text-sm text-white/70">Pre-packaged bundles perfect for celebrations</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {holidayPackages.map((pkg) => {
                    const displayImage = pkg.image || cycleFallbackImage(50);
                    const priceText = pkg.price
                      ? `$${pkg.price.toFixed(0)}`
                      : `From $${pkg.pricePerGuest.toFixed(0)}/person`;

                    return (
                      <button
                        key={pkg.id}
                        onClick={() => {
                          setCateringPanelOpen(false);
                          setCustomModal({
                            item: {
                              id: pkg.id,
                              name: pkg.name,
                              description: pkg.description,
                              price: pkg.price || pkg.pricePerGuest,
                              category: 'catering',
                              available: pkg.available,
                              displayImage,
                              sectionType: 'CATERING',
                            },
                            config: {
                              removals: pkg.customizationRemovals || [],
                              addons: pkg.customizationAddons || [],
                            },
                          });
                        }}
                        className="group relative overflow-hidden rounded-xl border border-red-500/30 bg-black/40 p-5 text-left transition hover:border-red-500 hover:bg-black/50"
                      >
                        {pkg.badge && (
                          <div className="absolute right-3 top-3 rounded-full bg-red-600/80 px-3 py-1 text-xs font-bold text-white">
                            {pkg.badge}
                          </div>
                        )}
                        <h5 className="text-lg font-bold text-red-300">{pkg.name}</h5>
                        <p className="mt-2 text-sm text-white/70 line-clamp-2">{pkg.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-2xl font-black text-red-400">{priceText}</span>
                          <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition group-hover:scale-105">
                            Add →
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Inquiry Form */}
            <form onSubmit={handleCateringSubmit} className="space-y-4 rounded-2xl border-2 border-white/20 bg-white/5 p-6">
              <h4 className="text-xl font-bold text-white">Request a Quote</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/80">Name *</label>
                  <input
                    type="text"
                    required
                    value={cateringName}
                    onChange={(e) => setCateringName(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/80">Email *</label>
                  <input
                    type="email"
                    required
                    value={cateringEmail}
                    onChange={(e) => setCateringEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/80">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={cateringPhone}
                    onChange={(e) => setCateringPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/80">Event Date</label>
                  <input
                    type="date"
                    value={cateringEventDate}
                    onChange={(e) => setCateringEventDate(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-white/80">Guest Count</label>
                  <input
                    type="number"
                    min="1"
                    value={cateringGuestCount}
                    onChange={(e) => setCateringGuestCount(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
                    placeholder="Expected number of guests"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-white/80">Additional Details</label>
                  <textarea
                    value={cateringMessage}
                    onChange={(e) => setCateringMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
                    placeholder="Tell us about your event, dietary restrictions, preferences, etc."
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-600 px-6 py-4 text-lg font-black text-white shadow-2xl shadow-red-600/40 transition-all hover:scale-105 hover:shadow-red-600/60"
              >
                Submit Inquiry
              </button>
              <p className="text-center text-xs text-white/60">
                We&apos;ll respond within 24 hours with a custom quote
              </p>
            </form>
          </div>
        </>
      )}

      {/* Membership Slide-In Panel */}
      {membershipPanelOpen && customerData && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMembershipPanelOpen(false)}
          />
          {/* Side Panel */}
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-gradient-to-br from-black via-gray-900 to-black p-8 shadow-2xl transition-transform sm:w-96">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-amber-100">🎁 Your Rewards</h2>
              <button
                onClick={() => setMembershipPanelOpen(false)}
                className="rounded-full border-2 border-white/30 bg-white/10 p-2 text-white transition hover:border-white hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            {/* Member Info */}
            <div className="mb-6 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-400/20 to-orange-500/10 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-3xl shadow-lg">
                  👤
                </div>
                <div>
                  <p className="font-bold text-white">{customerData.name || 'Valued Member'}</p>
                  <p className="text-sm text-amber-200">{customerData.membershipTier || 'Member'}</p>
                  <p className="text-xs text-white/50">{customerData.email}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-black/30 p-3">
                <span className="text-sm text-white/70">Points Balance</span>
                <span className="text-2xl font-black text-amber-400">{customerData.loyaltyPoints}</span>
              </div>
            </div>

            {/* Rewards Gallery */}
            <div className="relative mb-6 overflow-hidden rounded-2xl border-2 border-amber-500/20">
              <div className="relative h-40 w-full">
                <Image
                  src={rewardsGallery[rewardsGalleryIndex]}
                  alt="Rewards"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 384px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-sm font-semibold text-amber-300">Earn & Redeem</p>
                </div>
              </div>
              <div className="absolute bottom-3 right-3 flex gap-1">
                {rewardsGallery.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setRewardsGalleryIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === rewardsGalleryIndex ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            {customerData.orders && customerData.orders.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-bold text-white">Recent Orders</h3>
                <div className="space-y-3">
                  {customerData.orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/50">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-sm font-bold text-amber-400">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 mb-2">
                        {order.items.length} item(s) · {order.fulfillmentMethod}
                      </p>
                      <button
                        onClick={() => handleReorder(order)}
                        className="w-full rounded-lg bg-amber-500/20 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/30"
                      >
                        Order Again
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setMembershipPanelOpen(false)}
              className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition"
            >
              Close
            </button>
          </div>
        </>
      )}

      {/* Rewards Join Modal */}
      {joinModalOpen && (
        <JoinRewardsModal
          open={joinModalOpen}
          onClose={() => setJoinModalOpen(false)}
          onSuccess={() => {
            setJoinModalOpen(false);
            showNotification('Welcome to the rewards program!');
          }}
          tenantSlug={tenantSlug}
        />
      )}
    </div>
  );
}
