"use client";

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { OrderMenuItem, OrderMenuSection } from '../order/OrderPageClient';
import { MenuNavigator, type CatalogView } from '../order/MenuNavigator';
import { useCart } from '../../lib/store/cart';
import { useTenantTheme } from '../TenantThemeProvider';
import GridView from './GridView';
import ListView from './ListView';
import ShowcaseView from './ShowcaseView';
import HeroBanner from './HeroBanner';
import FeaturedCarousel from '../order/FeaturedCarousel';
import CateringModal from '../order/CateringModal';
import AccessibilityModal from '../order/AccessibilityModal';
import CartDrawer from '../order/CartDrawer';
import RewardsModal from '../order/RewardsModal';

interface CatalogPageClientProps {
  sections: OrderMenuSection[];
  featuredItems?: OrderMenuItem[];
  tenantSlug: string;
}

const VIEW_ORDER: CatalogView[] = ['grid', 'list', 'showcase'];

export function CatalogPageClient({ sections, featuredItems = [], tenantSlug }: CatalogPageClientProps) {
  const tenant = useTenantTheme();
  const { addToCart } = useCart();
  const searchParams = useSearchParams();
  const router = useRouter();

  const safeSections = useMemo(() => Array.isArray(sections) ? sections : [], [sections]);
  const availableSections = useMemo(() => safeSections.filter((section) => section.items.length > 0), [safeSections]);
  const initialSection = availableSections[0]?.id ?? safeSections[0]?.id ?? '';

  // Initialize from URL params or defaults
  const [activeCategoryId, setActiveCategoryId] = useState(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && availableSections.some((s) => s.id === categoryParam)) {
      return categoryParam;
    }
    return initialSection;
  });

  const [activeView, setActiveView] = useState<CatalogView>(() => {
    const viewParam = searchParams.get('view') as CatalogView;
    if (viewParam && ['grid', 'list', 'showcase'].includes(viewParam)) {
      return viewParam;
    }
    return 'grid';
  });

  const [isCartOpen, setCartOpen] = useState(false);
  const [isCateringOpen, setCateringOpen] = useState(false);
  const [isAccessibilityOpen, setAccessibilityOpen] = useState(false);
  const [isRewardsOpen, setRewardsOpen] = useState(false);
  const [accessibilityState, setAccessibilityState] = useState({
    largeText: false,
    highContrast: false,
    reducedMotion: false,
  });
  const [heroErrored, setHeroErrored] = useState(false);

  // Update URL when state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (activeView !== 'grid') {
      params.set('view', activeView);
    } else {
      params.delete('view');
    }
    if (activeCategoryId && activeCategoryId !== initialSection) {
      params.set('category', activeCategoryId);
    } else {
      params.delete('category');
    }
    if (tenantSlug) {
      params.set('tenant', tenantSlug);
    }
    const query = params.toString();
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [activeView, activeCategoryId, tenantSlug, initialSection, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedView = window.localStorage.getItem('alessa_view_mode') as CatalogView | null;
    const queryView = searchParams.get('view') as CatalogView | null;
    if (!queryView && storedView && ['grid', 'list', 'showcase'].includes(storedView)) {
      setActiveView(storedView);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('alessa_view_mode', activeView);
  }, [activeView]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sectionEl = document.getElementById(`section-${activeCategoryId}`);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeCategoryId]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('ada-mode', accessibilityState.largeText);
    root.classList.toggle('ada-contrast', accessibilityState.highContrast);
    root.classList.toggle('ada-reduced-motion', accessibilityState.reducedMotion);
  }, [accessibilityState]);

  const activeSection = useMemo(
    () => safeSections.find((section) => section.id === activeCategoryId) ?? safeSections[0],
    [safeSections, activeCategoryId],
  );

  const highlightItem = useMemo<OrderMenuItem | null>(() => {
    if (featuredItems.length > 0) return featuredItems[0];
    return activeSection?.items[0] ?? null;
  }, [featuredItems, activeSection]);

  const categories = useMemo(
    () =>
      availableSections.map((section, index) => ({
        id: section.id,
        name: section.name,
        icon: ['🌮', '🥘', '🥗', '🥙', '🍚'][index % 5],
      })),
    [availableSections],
  );

  const handleAddToCart = (item: OrderMenuItem) => {
    addToCart({
      id: `${item.id}-${Date.now()}`,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      description: item.description,
    });
    setCartOpen(true);
  };

  const heroImages = [
    '/tenant/lasreinas/images/hero-banner-1.jpg',
    '/tenant/lasreinas/images/hero-banner-2.jpg',
    '/tenant/lasreinas/images/hero-banner-3.jpg',
    '/tenant/lasreinas/images/hero-banner-4.jpg',
  ];

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-[#050A1C] via-[#0B0F2A] to-[#050A1C] pb-36 ${
        accessibilityState.largeText ? 'text-lg' : ''
      } ${accessibilityState.highContrast ? 'contrast-125' : ''}`}
    >
      {!heroErrored ? (
        <HeroBanner
          images={heroImages}
          title={tenant.heroTitle ?? tenant.name}
          subtitle={
            tenant.heroSubtitle ||
            tenant.tagline ||
            'Order signature quesabirrias, butcher cuts, and pan dulce curated by Las Reinas Colusa.'
          }
          onAddHighlight={highlightItem ? () => handleAddToCart(highlightItem) : undefined}
          onImageError={() => setHeroErrored(true)}
        />
      ) : (
        <FeaturedCarousel items={featuredItems} />
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-8 text-white">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm uppercase tracking-[0.4em] text-white/50">
            View: {VIEW_ORDER.indexOf(activeView) + 1} / {VIEW_ORDER.length}
          </p>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{tenantSlug}</span>
        </div>

        <div className="space-y-10">
          {activeView === 'grid' && <GridView section={activeSection} onAdd={handleAddToCart} />}
          {activeView === 'list' && <ListView section={activeSection} onAdd={handleAddToCart} />}
          {activeView === 'showcase' && (
            <ShowcaseView section={activeSection} featured={featuredItems} onAdd={handleAddToCart} />
          )}
        </div>
      </main>

      <MenuNavigator
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={(categoryId) => {
          setActiveCategoryId(categoryId);
        }}
        activeView={activeView}
        onChangeView={(view) => {
          setActiveView(view);
        }}
        onOpenCatering={() => setCateringOpen(true)}
        onOpenAccessibility={() => setAccessibilityOpen(true)}
        onOpenCart={() => setCartOpen(true)}
        onOpenRewards={() => setRewardsOpen(true)}
        highlightItem={highlightItem}
      />

      <CateringModal open={isCateringOpen} onClose={() => setCateringOpen(false)} />
      <AccessibilityModal
        open={isAccessibilityOpen}
        onClose={() => setAccessibilityOpen(false)}
        onToggleLargeText={() =>
          setAccessibilityState((prev) => ({
            ...prev,
            largeText: !prev.largeText,
          }))
        }
        onToggleHighContrast={() =>
          setAccessibilityState((prev) => ({
            ...prev,
            highContrast: !prev.highContrast,
          }))
        }
        onToggleReducedMotion={() =>
          setAccessibilityState((prev) => ({
            ...prev,
            reducedMotion: !prev.reducedMotion,
          }))
        }
        state={accessibilityState}
      />
      <CartDrawer open={isCartOpen} onClose={() => setCartOpen(false)} />
      <RewardsModal open={isRewardsOpen} onClose={() => setRewardsOpen(false)} />
    </div>
  );
}

export default CatalogPageClient;
