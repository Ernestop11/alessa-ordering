/**
 * OrderPageClientTaqueriaRosita - Modern Hip Taqueria Design
 *
 * DESIGN PHILOSOPHY (2026):
 * - Ultra-modern noir aesthetic with hot pink accents
 * - Bold typography with gradient text
 * - Glassmorphism cards
 * - Smooth animations and hover effects
 * - Mobile-first responsive design
 */
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { getStockImageForCategory, cycleFallbackImage } from '../../lib/menu-imagery';
import { useCart } from '../../lib/store/cart';
import { getTenantAssets } from '../../lib/tenant-assets';
import { useTenantTheme } from '../TenantThemeProvider';
import CartLauncher from '../CartLauncher';
import MenuSectionGrid from './MenuSectionGrid';
import MobileNavDrawer from './MobileNavDrawer';
import { isTimeSpecificActive, getTimeSpecificPrice, shouldShowItem } from '../../lib/menu-time-specific';

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

interface OrderPageClientProps {
  sections: OrderMenuSection[];
  featuredItems?: OrderMenuItem[];
  tenantSlug: string;
  cateringTabConfig?: any;
  cateringPackages?: any[];
  rewardsData?: any;
  customerRewardsData?: any;
  isOpen?: boolean;
  closedMessage?: string;
  frontendConfig?: any;
  frontendUISections?: any[];
  enabledAddOns?: string[];
  templateSettings?: any;
  isPreview?: boolean;
}

export default function OrderPageClientTaqueriaRosita({
  sections,
  featuredItems = [],
  tenantSlug,
  isOpen = true,
  closedMessage = '',
}: OrderPageClientProps) {
  const theme = useTenantTheme();
  const { items: cartItems, addToCart, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrderMenuItem | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [restaurantIsOpen, setRestaurantIsOpen] = useState(isOpen);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const headerRef = useRef<HTMLElement>(null);

  // Poll restaurant status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/restaurant-status');
        const data = await res.json();
        setRestaurantIsOpen(data.isOpen);
      } catch (e) {
        // Keep current state on error
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Set first section as active on mount
  useEffect(() => {
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].id);
    }
  }, [sections, activeSection]);

  // Handle scroll to detect active section
  useEffect(() => {
    const handleScroll = () => {
      const headerHeight = headerRef.current?.offsetHeight || 180;
      let currentSection = activeSection;

      for (const section of sections) {
        const element = sectionRefs.current[section.id];
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= headerHeight + 100) {
            currentSection = section.id;
          }
        }
      }

      if (currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections, activeSection]);

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    const headerHeight = headerRef.current?.offsetHeight || 180;
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setActiveSection(sectionId);
    setIsMobileNavOpen(false);
  };

  const handleAddToCart = useCallback((item: OrderMenuItem) => {
    if (!restaurantIsOpen) return;

    const price = isTimeSpecificActive(item as any)
      ? getTimeSpecificPrice(item as any)
      : item.price;

    addToCart({
      id: item.id,
      menuItemId: item.id,
      name: item.name,
      price: price,
      quantity: 1,
      image: item.image || undefined,
      modifiers: [],
    });
  }, [addToCart, restaurantIsOpen]);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Custom styles for Taqueria Rosita */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

        .tr-gradient-text {
          background: linear-gradient(135deg, #ff3366 0%, #ff6b9d 50%, #ffaa00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .tr-glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .tr-hover-card:hover {
          background: rgba(255, 51, 102, 0.08);
          border-color: rgba(255, 51, 102, 0.3);
          transform: translateY(-2px);
        }

        .tr-glow {
          box-shadow: 0 0 40px rgba(255, 51, 102, 0.15);
        }

        .tr-button {
          background: linear-gradient(135deg, #ff3366 0%, #ff6b9d 100%);
          transition: all 0.3s ease;
        }

        .tr-button:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 30px rgba(255, 51, 102, 0.4);
        }

        .tr-nav-item {
          transition: all 0.2s ease;
        }

        .tr-nav-item:hover {
          color: #ff3366;
        }

        .tr-nav-item.active {
          color: #ff3366;
          border-bottom: 2px solid #ff3366;
        }

        .tr-scrollbar::-webkit-scrollbar {
          height: 4px;
        }

        .tr-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .tr-scrollbar::-webkit-scrollbar-thumb {
          background: #ff3366;
          border-radius: 2px;
        }
      `}</style>

      {/* Header */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-xl border-b border-white/5"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 md:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 md:w-12 md:h-12">
              <Image
                src="/tenant/taqueriarosita/logo-white.png"
                alt="Taqueria Rosita"
                fill
                className="object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <span className="tr-gradient-text">TAQUERIA</span>
                <span className="text-white ml-2">ROSITA</span>
              </h1>
              <p className="text-[10px] md:text-xs text-white/40 tracking-widest uppercase">Authentic • Fresh • Bold</p>
            </div>
          </Link>

          {/* Status & Cart */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full tr-glass-card">
              <div className={`w-2 h-2 rounded-full ${restaurantIsOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs font-medium text-white/70">
                {restaurantIsOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>

            {/* Cart */}
            <button
              onClick={() => {/* Open cart */}}
              className="relative p-2.5 rounded-xl tr-glass-card tr-hover-card transition-all duration-300"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff3366] rounded-full text-[10px] font-bold flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Navigation */}
        <nav className="px-4 md:px-8 overflow-x-auto tr-scrollbar">
          <div className="flex gap-1 md:gap-2 pb-3">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-[#ff3366] text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {section.name}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-32 md:pt-36 pb-24 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Hero Banner */}
        <div className="mb-8 md:mb-12 rounded-2xl overflow-hidden tr-glass-card tr-glow">
          <div className="relative h-48 md:h-64 lg:h-80">
            <Image
              src="/tenant/taqueriarosita/images/hero/burrito-hero.jpg"
              alt="Fresh Mexican Food"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12">
              <span className="text-[#ff3366] text-xs md:text-sm font-semibold tracking-widest uppercase mb-2">
                Napa Valley&apos;s Favorite
              </span>
              <h2
                className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                <span className="tr-gradient-text">BOLD</span>
                <span className="text-white"> FLAVORS</span>
              </h2>
              <p className="text-white/60 text-sm md:text-base max-w-md">
                Authentic Mexican cuisine crafted with passion. Fresh ingredients, family recipes.
              </p>
              {featuredItems.length > 0 && (
                <button
                  onClick={() => sections[0] && scrollToSection(sections[0].id)}
                  className="mt-4 px-6 py-2.5 tr-button rounded-lg text-white font-semibold text-sm w-fit"
                >
                  Order Now →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Closed Notice */}
        {!restaurantIsOpen && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
            <p className="text-red-400 font-medium">
              {closedMessage || "We're currently closed. Check back during business hours!"}
            </p>
          </div>
        )}

        {/* Menu Sections */}
        {sections.map((section) => {
          const visibleItems = section.items.filter(item => shouldShowItem(item as any));
          if (visibleItems.length === 0) return null;

          return (
            <section
              key={section.id}
              ref={(el) => { sectionRefs.current[section.id] = el; }}
              className="mb-12 md:mb-16"
            >
              {/* Section Header */}
              <div className="mb-6 md:mb-8">
                <h3
                  className="text-2xl md:text-3xl font-bold mb-1"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  <span className="tr-gradient-text">{section.name}</span>
                </h3>
                {section.description && (
                  <p className="text-white/50 text-sm md:text-base">{section.description}</p>
                )}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {visibleItems.map((item) => {
                  const price = isTimeSpecificActive(item as any)
                    ? getTimeSpecificPrice(item as any)
                    : item.price;
                  const cartItem = cartItems.find(ci => ci.id === item.id);
                  const quantity = cartItem?.quantity || 0;

                  return (
                    <div
                      key={item.id}
                      className="group tr-glass-card tr-hover-card rounded-xl overflow-hidden transition-all duration-300"
                    >
                      {/* Item Image */}
                      <div className="relative h-40 md:h-48 overflow-hidden">
                        <Image
                          src={item.image || getStockImageForCategory(item.category)}
                          alt={item.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                        {/* Price Badge */}
                        <div className="absolute bottom-3 left-3">
                          <span className="px-3 py-1 bg-[#ff3366] rounded-full text-sm font-bold">
                            ${price.toFixed(2)}
                          </span>
                        </div>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="absolute top-3 left-3 flex gap-1">
                            {item.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-black/50 backdrop-blur text-[10px] rounded-full text-white/80">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Item Info */}
                      <div className="p-4">
                        <h4 className="font-semibold text-white mb-1 line-clamp-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {item.name}
                        </h4>
                        <p className="text-white/50 text-sm line-clamp-2 mb-4">
                          {item.description || 'Delicious Mexican favorite'}
                        </p>

                        {/* Add to Cart */}
                        {quantity > 0 ? (
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                              <span className="text-xl">−</span>
                            </button>
                            <span className="font-bold text-lg">{quantity}</span>
                            <button
                              onClick={() => handleAddToCart(item)}
                              disabled={!restaurantIsOpen}
                              className="w-10 h-10 rounded-lg tr-button flex items-center justify-center disabled:opacity-50"
                            >
                              <span className="text-xl">+</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={!restaurantIsOpen}
                            className="w-full py-2.5 tr-button rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {restaurantIsOpen ? 'Add to Order' : 'Closed'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* Floating Cart */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50">
          <Link
            href="/checkout"
            className="flex items-center justify-between w-full px-6 py-4 tr-button rounded-2xl tr-glow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="font-bold">{cartItemCount}</span>
              </div>
              <span className="font-semibold">View Cart</span>
            </div>
            <span className="font-bold text-lg">${total().toFixed(2)}</span>
          </Link>
        </div>
      )}

      {/* Cart Launcher (uses existing component for full cart functionality) */}
      <CartLauncher />
    </div>
  );
}
