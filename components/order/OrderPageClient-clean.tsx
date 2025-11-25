"use client";

// This is a CLEAN refactored version of OrderPageClient
// Key improvements:
// 1. Removed hardcoded sections (Combos, Specials, Sweets)
// 2. Simplified layout rendering
// 3. Better organized code structure
// 4. Consistent styling
// 5. Ready for admin configuration

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getStockImageForCategory } from '../../lib/menu-imagery';
import { useCart } from '../../lib/store/cart';
import { getTenantAssets } from '../../lib/tenant-assets';
import { useTenantTheme } from '../TenantThemeProvider';
import FeaturedCarousel from './FeaturedCarousel';
import CartLauncher from '../CartLauncher';
import MenuSectionGrid from './MenuSectionGrid';

// Re-export types from original
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
}

export interface OrderMenuSection {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  items: OrderMenuItem[];
}

interface OrderPageClientProps {
  sections: OrderMenuSection[];
  featuredItems?: OrderMenuItem[];
  tenantSlug: string;
}

type LayoutView = 'grid' | 'list' | 'cards';

const LAYOUTS: Array<{ id: LayoutView; label: string; icon: string }> = [
  { id: 'grid', label: 'Grid', icon: '▦' },
  { id: 'list', label: 'List', icon: '☰' },
  { id: 'cards', label: 'Showcase', icon: '⬚' },
];

const SECTION_ICONS: Record<string, string> = {
  RESTAURANT: '🌮',
  BAKERY: '🥐',
  GROCERY: '🛒',
  BEVERAGE: '🥤',
  SPECIAL: '👨‍🍳',
  OTHER: '🍽️',
};

export default function OrderPageClientClean({ sections, featuredItems = [], tenantSlug }: OrderPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenant = useTenantTheme();
  const assets = getTenantAssets(tenantSlug || tenant.slug);
  const { addToCart, items: cartItems } = useCart();
  const cartItemCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const navSections = useMemo(() => sections.filter((section) => section.items.length > 0), [sections]);
  
  const [activeLayout, setActiveLayout] = useState<LayoutView>(() => {
    const paramView = searchParams.get('view') as LayoutView | null;
    const storedView = typeof window !== 'undefined' 
      ? (window.localStorage.getItem('alessa_view_mode') as LayoutView | null) 
      : null;
    if (paramView && ['grid', 'list', 'cards'].includes(paramView)) return paramView;
    if (storedView && ['grid', 'list', 'cards'].includes(storedView)) return storedView;
    return 'grid';
  });

  const [activeSectionId, setActiveSectionId] = useState(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && navSections.some((section) => section.id === categoryParam)) return categoryParam;
    return navSections[0]?.id ?? '';
  });

  const [notification, setNotification] = useState('');
  const cateringEnabled = tenant.featureFlags?.includes('catering') ?? false;
  const [showCateringPanel, setShowCateringPanel] = useState(false);

  // Enrich sections with display images
  const enrichedSections = useMemo(() => {
    return sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        displayImage: item.image || getStockImageForCategory(item.category || section.type, 0),
        displayGallery: Array.isArray(item.gallery) ? item.gallery : [],
      })),
    }));
  }, [sections]);

  const handleAddToCart = useCallback((item: OrderMenuItem, image?: string) => {
    addToCart({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      quantity: 1,
      image: image || item.image || undefined,
    });
    setNotification(`Added ${item.name} to cart`);
    setTimeout(() => setNotification(''), 2000);
  }, [addToCart]);

  const handleCustomize = useCallback((item: OrderMenuItem, sectionType: string) => {
    // For now, just add to cart - customization modal can be added later
    handleAddToCart(item, item.image || undefined);
  }, [handleAddToCart]);

  const carouselItems = useMemo(() => {
    if (!featuredItems || featuredItems.length === 0) return [];
    return featuredItems.map((item) => ({
      ...item,
      displayImage: item.image || getStockImageForCategory(item.category || 'RESTAURANT', 0),
    }));
  }, [featuredItems]);

  const handleCarouselAddToCart = useCallback((item: OrderMenuItem & { displayImage: string }) => {
    handleAddToCart(item, item.displayImage);
  }, [handleAddToCart]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('alessa_view_mode', activeLayout);
  }, [activeLayout]);

  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050A1C] via-[#0A1C2F] to-[#041326] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              {tenant.logoUrl ? (
                <Image
                  src={tenant.logoUrl}
                  alt={`${tenant.name} logo`}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full border border-white/20 object-cover"
                  unoptimized={tenant.logoUrl?.startsWith('/tenant/')}
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-2xl">
                  🍽️
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
                {tenant.tagline && <p className="text-sm text-white/60">{tenant.tagline}</p>}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {cateringEnabled && (
                <button
                  onClick={() => setShowCateringPanel(true)}
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all hover:border-[#ff0000] hover:bg-[#ff0000]/20"
                >
                  <span>🎉</span>
                  <span>Catering</span>
                </button>
              )}
              <button
                onClick={() => {
                  const cartButton = document.querySelector('[data-cart-launcher]') as HTMLElement;
                  cartButton?.click();
                }}
                className="relative flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all hover:border-[#ff0000] hover:bg-[#ff0000]/20"
              >
                <span>🛒</span>
                <span>Cart</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff0000] text-[10px] font-bold text-white">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Category Navigation & Layout Toggle */}
          <div className="flex flex-col gap-3 pb-4 md:flex-row md:items-center md:justify-between">
            {/* Section Navigation */}
            {navSections.length > 0 && (
              <nav className="flex max-w-full items-center gap-2 overflow-x-auto scrollbar-hide">
                {navSections.map((section) => {
                  const isActive = activeSectionId === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        isActive 
                          ? 'border-[#ff0000] bg-[#ff0000] text-white shadow-lg' 
                          : 'border-white/20 text-white/70 hover:border-white/40 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="mr-1.5">{SECTION_ICONS[section.type] || '🍽️'}</span>
                      <span>{section.name}</span>
                    </button>
                  );
                })}
              </nav>
            )}
            
            {/* Layout Toggle */}
            <div className="flex items-center gap-2">
              {LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setActiveLayout(layout.id)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    activeLayout === layout.id
                      ? 'border-[#ff0000] bg-[#ff0000] text-white shadow-lg'
                      : 'border-white/20 text-white/70 hover:border-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{layout.icon}</span>
                  <span className="hidden sm:inline">{layout.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff0000] via-[#cc0000] to-[#990000]" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl">
            {tenant.heroTitle || tenant.name}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-white/90">
            {tenant.heroSubtitle || tenant.tagline || 'Your favorite Mexican dishes!'}
          </p>
          <a
            href="#menu"
            className="mt-8 inline-block rounded-full bg-white px-8 py-4 text-lg font-bold text-[#ff0000] shadow-2xl transition-all hover:scale-105"
          >
            Explore Menu ✨
          </a>
        </div>
      </section>

      {/* Main Menu */}
      <main id="menu" className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        {notification && (
          <div className="fixed right-6 top-20 z-50 rounded-lg bg-green-500 px-6 py-3 text-sm font-semibold text-white shadow-lg">
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
        {enrichedSections.map((section) => (
          <MenuSectionGrid
            key={section.id}
            section={section}
            layout={activeLayout}
            onAddToCart={handleAddToCart}
            onCustomize={handleCustomize}
          />
        ))}
      </main>

      {/* Cart Launcher */}
      <div style={{ display: 'none' }}>
        <CartLauncher />
      </div>

      {/* Catering Panel (simplified) */}
      {showCateringPanel && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCateringPanel(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto bg-gradient-to-br from-[#2D1810] via-[#1A0F08] to-black p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-black text-amber-100">🎉 Catering Services</h2>
              <button
                onClick={() => setShowCateringPanel(false)}
                className="rounded-full border-2 border-white/30 bg-white/10 p-2 text-white transition hover:border-white hover:bg-white/20"
              >
                ✕
              </button>
            </div>
            <p className="text-white/70">Catering form coming soon...</p>
          </div>
        </>
      )}
    </div>
  );
}

