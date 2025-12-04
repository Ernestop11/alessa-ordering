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
  cateringPackages?: any[];
  rewardsData?: any;
  customerRewardsData?: any;
  isOpen?: boolean;
  closedMessage?: string;
  // Existing panels/modals control
  onOpenCatering?: () => void;
  onOpenRewards?: () => void;
  onOpenAccessibility?: () => void;
  showCateringPanel?: boolean;
  showMembershipPanel?: boolean;
  isAccessibilityOpen?: boolean;
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
  cateringPackages = [],
  rewardsData,
  customerRewardsData,
  isOpen = true,
  closedMessage,
  onOpenCatering,
  onOpenRewards,
  onOpenAccessibility,
  showCateringPanel = false,
  showMembershipPanel = false,
  isAccessibilityOpen = false,
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
  const [showCateringPanel, setShowCateringPanel] = useState(false);
  const [showMembershipPanel, setShowMembershipPanel] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [accessibilityState, setAccessibilityState] = useState({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
  });

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

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 2500);
  }, []);

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
  const handleOpenCatering = useCallback(() => setShowCateringPanel(true), []);
  const handleOpenRewards = useCallback(() => {
    if (customerRewardsData) {
      setShowMembershipPanel(true);
    } else {
      setShowJoinModal(true);
    }
  }, [customerRewardsData]);
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
        hasCustomerData={!!customerRewardsData}
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
            <p className="mt-2 text-sm text-white/50">We're preparing something delicious for you.</p>
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

      {/* Catering Panel */}
      {showCateringPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Catering Services</h3>
                <p className="text-sm text-white/50 mt-1">Full-service events, delivered with care</p>
              </div>
              <button
                onClick={() => setShowCateringPanel(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 text-white/70 text-sm">
              <p>We offer catering for events of all sizes. Contact us to discuss your needs!</p>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="font-medium text-white mb-2">Get a Quote</p>
                <p className="text-xs">Email: catering@{tenant.slug || 'restaurant'}.com</p>
                <p className="text-xs">Or call us during business hours</p>
              </div>
            </div>
            <button
              onClick={() => setShowCateringPanel(false)}
              className="mt-6 w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Rewards Join Modal */}
      {showJoinModal && (
        <JoinRewardsModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => {
            setShowJoinModal(false);
            showNotification('Welcome to the rewards program!');
          }}
        />
      )}

      {/* Rewards Modal for existing members */}
      {showMembershipPanel && customerRewardsData && (
        <RewardsModal
          isOpen={showMembershipPanel}
          onClose={() => setShowMembershipPanel(false)}
          customerData={customerRewardsData}
          membershipProgram={rewardsData?.membershipProgram}
        />
      )}
    </div>
  );
}
