/**
 * OrderPageClientElHornitoBakery - El Hornito Bakery Dedicated Page
 *
 * A glamorous Mexican panaderia experience with:
 * - Warm amber/gold/brown color scheme
 * - Bakery-specific sections (Pan Dulce, Pasteles, etc.)
 * - Cake customization tools
 * - Shared cart with La Poblanita parent tenant
 *
 * This is a STANDALONE component, not a wrapper.
 * Design shares DNA with La Poblanita but is bakery-focused.
 */
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../../lib/store/cart';
import CartLauncher from '../CartLauncher';

interface CustomizationOption {
  id: string;
  label: string;
  price: number;
}

export interface BakeryMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: string | null;
  gallery?: string[];
  tags?: string[];
  customizationRemovals?: string[];
  customizationAddons?: CustomizationOption[];
  isFeatured?: boolean;
}

export interface BakeryMenuSection {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  items: BakeryMenuItem[];
}

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
  orders: any[];
}

interface CakeCustomization {
  size: 'small' | 'medium' | 'large' | 'xl';
  layers: number;
  flavor: string;
  filling: string;
  frosting: string;
  message?: string;
  decorations: string[];
}

interface OrderPageClientElHornitoBakeryProps {
  sections: BakeryMenuSection[];
  featuredItems?: BakeryMenuItem[];
  tenantSlug: string;
  elHornitoTenant: ElHornitoTenant;
  rewardsData?: RewardsData;
  customerRewardsData?: CustomerRewardsData | null;
  isOpen?: boolean;
  closedMessage?: string;
}

// Cake size options
const CAKE_SIZES = [
  { id: 'small', name: '6" Round', serves: '6-8', price: 0 },
  { id: 'medium', name: '8" Round', serves: '10-12', price: 15 },
  { id: 'large', name: '10" Round', serves: '16-20', price: 30 },
  { id: 'xl', name: '12" Round', serves: '24-30', price: 50 },
];

const CAKE_FLAVORS = [
  { id: 'vanilla', name: 'Vainilla', price: 0 },
  { id: 'chocolate', name: 'Chocolate', price: 0 },
  { id: 'tres-leches', name: 'Tres Leches', price: 5 },
  { id: 'red-velvet', name: 'Red Velvet', price: 5 },
  { id: 'strawberry', name: 'Fresa', price: 3 },
  { id: 'coconut', name: 'Coco', price: 3 },
];

const CAKE_FILLINGS = [
  { id: 'none', name: 'Sin Relleno', price: 0 },
  { id: 'strawberry', name: 'Fresas con Crema', price: 8 },
  { id: 'peach', name: 'Duraznos con Crema', price: 8 },
  { id: 'cajeta', name: 'Cajeta', price: 6 },
  { id: 'nutella', name: 'Nutella', price: 10 },
  { id: 'dulce-leche', name: 'Dulce de Leche', price: 8 },
];

const CAKE_FROSTINGS = [
  { id: 'buttercream', name: 'Buttercream', price: 0 },
  { id: 'whipped', name: 'Crema Batida', price: 0 },
  { id: 'cream-cheese', name: 'Cream Cheese', price: 5 },
  { id: 'chocolate', name: 'Chocolate Ganache', price: 8 },
  { id: 'fondant', name: 'Fondant', price: 20 },
];

const CAKE_DECORATIONS = [
  { id: 'flowers', name: 'Flores de Azucar', price: 15 },
  { id: 'fruit', name: 'Fruta Fresca', price: 12 },
  { id: 'sprinkles', name: 'Chispas de Colores', price: 3 },
  { id: 'gold-leaf', name: 'Hoja de Oro', price: 25 },
  { id: 'figurine', name: 'Figurita', price: 20 },
  { id: 'candles', name: 'Velitas', price: 5 },
];

export default function OrderPageClientElHornitoBakery({
  sections,
  featuredItems = [],
  tenantSlug,
  elHornitoTenant,
  rewardsData,
  customerRewardsData,
  isOpen = true,
  closedMessage,
}: OrderPageClientElHornitoBakeryProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BakeryMenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCakeBuilder, setShowCakeBuilder] = useState(false);
  const [cakeCustomization, setCakeCustomization] = useState<CakeCustomization>({
    size: 'medium',
    layers: 2,
    flavor: 'vanilla',
    filling: 'strawberry',
    frosting: 'buttercream',
    message: '',
    decorations: [],
  });
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const cart = useCart();
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Theme colors
  const primaryColor = elHornitoTenant.primaryColor || '#d97706';
  const secondaryColor = elHornitoTenant.secondaryColor || '#fbbf24';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll handling for header
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate cake total price
  const calculateCakePrice = useCallback((basePrice: number) => {
    let total = basePrice;
    const size = CAKE_SIZES.find(s => s.id === cakeCustomization.size);
    const flavor = CAKE_FLAVORS.find(f => f.id === cakeCustomization.flavor);
    const filling = CAKE_FILLINGS.find(f => f.id === cakeCustomization.filling);
    const frosting = CAKE_FROSTINGS.find(f => f.id === cakeCustomization.frosting);

    if (size) total += size.price;
    if (flavor) total += flavor.price;
    if (filling) total += filling.price;
    if (frosting) total += frosting.price;
    if (cakeCustomization.layers > 2) total += (cakeCustomization.layers - 2) * 15;

    cakeCustomization.decorations.forEach(decId => {
      const dec = CAKE_DECORATIONS.find(d => d.id === decId);
      if (dec) total += dec.price;
    });

    return total;
  }, [cakeCustomization]);

  // Add item to cart
  const handleAddToCart = useCallback((item: BakeryMenuItem, quantity: number = 1) => {
    if (!isOpen) return;

    cart.addItem({
      id: item.id,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity,
      customizations: [],
      removals: [],
      addons: [],
      itemType: 'bakery',
    });
    setShowItemModal(false);
  }, [cart, isOpen]);

  // Add custom cake to cart
  const handleAddCakeToCart = useCallback((baseItem: BakeryMenuItem) => {
    if (!isOpen) return;

    const totalPrice = calculateCakePrice(baseItem.price);
    const size = CAKE_SIZES.find(s => s.id === cakeCustomization.size);
    const flavor = CAKE_FLAVORS.find(f => f.id === cakeCustomization.flavor);
    const filling = CAKE_FILLINGS.find(f => f.id === cakeCustomization.filling);
    const frosting = CAKE_FROSTINGS.find(f => f.id === cakeCustomization.frosting);

    const customizations = [
      `${size?.name} (${size?.serves} personas)`,
      `${cakeCustomization.layers} capas`,
      `Sabor: ${flavor?.name}`,
      `Relleno: ${filling?.name}`,
      `Cobertura: ${frosting?.name}`,
    ];

    if (cakeCustomization.message) {
      customizations.push(`Mensaje: "${cakeCustomization.message}"`);
    }

    cakeCustomization.decorations.forEach(decId => {
      const dec = CAKE_DECORATIONS.find(d => d.id === decId);
      if (dec) customizations.push(`+ ${dec.name}`);
    });

    cart.addItem({
      id: `${baseItem.id}-${Date.now()}`,
      menuItemId: baseItem.id,
      name: `${baseItem.name} - Personalizado`,
      price: totalPrice,
      quantity: 1,
      customizations,
      removals: [],
      addons: [],
      itemType: 'bakery',
    });

    setShowCakeBuilder(false);
    setSelectedItem(null);
  }, [cart, isOpen, cakeCustomization, calculateCakePrice]);

  // Scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const el = sectionRefs.current[sectionId];
    if (el) {
      const headerOffset = 180;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setSelectedSection(sectionId);
    setShowMobileNav(false);
  }, []);

  // Check if item is a cake (for showing cake builder)
  const isCakeItem = useCallback((item: BakeryMenuItem) => {
    const cakeKeywords = ['pastel', 'cake', 'torta', 'tres leches'];
    const name = item.name.toLowerCase();
    const category = item.category?.toLowerCase() || '';
    return cakeKeywords.some(kw => name.includes(kw) || category.includes(kw));
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-amber-100 text-lg">Cargando panaderia...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white relative overflow-x-hidden"
      style={{
        '--bakery-primary': primaryColor,
        '--bakery-secondary': secondaryColor,
        background: 'linear-gradient(135deg, #1c1917 0%, #292524 25%, #44403c 50%, #292524 75%, #1c1917 100%)',
      } as React.CSSProperties}
    >
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Warm amber glow - top left */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30 blur-[120px] animate-pulse"
          style={{ backgroundColor: '#d97706', animationDuration: '4s' }}
        />
        {/* Golden glow - top right */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-25 blur-[100px] animate-pulse"
          style={{ backgroundColor: '#fbbf24', animationDuration: '5s', animationDelay: '1s' }}
        />
        {/* Warm brown glow - bottom */}
        <div
          className="absolute bottom-0 left-1/4 w-96 h-64 rounded-full opacity-20 blur-[150px] animate-pulse"
          style={{ backgroundColor: '#92400e', animationDuration: '6s', animationDelay: '2s' }}
        />
        {/* Central radial glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(ellipse, rgba(217, 119, 6, 0.1), transparent)' }}
        />
        {/* Subtle sparkle pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(251, 191, 36, 0.3) 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, rgba(217, 119, 6, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isHeaderScrolled ? 'backdrop-blur-xl shadow-2xl' : ''
        }`}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          background: isHeaderScrolled
            ? 'linear-gradient(to bottom, rgba(41, 37, 36, 0.98), rgba(28, 25, 23, 0.95))'
            : 'linear-gradient(to bottom, rgba(41, 37, 36, 0.9), transparent)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between py-3">
            {/* Left - Back to La Poblanita */}
            <Link
              href="/order"
              className="flex items-center gap-2 text-amber-200 hover:text-amber-100 transition-all group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline font-medium">La Poblanita</span>
            </Link>

            {/* Center - Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {elHornitoTenant.logoUrl ? (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/30">
                    <Image
                      src={elHornitoTenant.logoUrl}
                      alt={elHornitoTenant.name}
                      width={44}
                      height={44}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 text-2xl">
                    🥐
                  </div>
                )}
                {/* Sparkle */}
                <div className="absolute -top-1 -right-1 w-4 h-4 text-amber-300 animate-pulse">✨</div>
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent">
                  El Hornito
                </h1>
                <p className="text-xs text-amber-300/80 font-medium tracking-wider">PANADERIA MEXICANA</p>
              </div>
            </div>

            {/* Right - Cart */}
            <CartLauncher />
          </div>

          {/* Section Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedSection === section.id
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-white/10 text-amber-100 hover:bg-white/20'
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>

        {/* Closed Banner */}
        {!isOpen && (
          <div className="bg-gradient-to-r from-red-900/90 to-red-800/90 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 py-2 text-center">
              <span className="text-red-100 font-medium text-sm">
                🚫 {closedMessage || 'La panaderia esta cerrada'}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Header Spacer */}
      <div className="h-[140px]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />

      {/* Hero Banner */}
      <section className="relative mx-4 mb-8 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/90 via-amber-800/80 to-amber-900/90" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23fbbf24" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        <div className="relative px-6 py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
            <span className="text-lg">🔥</span>
            <span className="text-amber-100 text-sm font-medium">Horneado Fresco Diario</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Pan Dulce Autentico
          </h2>
          <p className="text-amber-200/90 max-w-md mx-auto">
            Conchas, cuernos, orejas y mas. Tradicion mexicana horneada con amor cada manana.
          </p>
          {featuredItems.length > 0 && (
            <div className="mt-6 flex justify-center gap-3 flex-wrap">
              {featuredItems.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedItem(item); setShowItemModal(true); }}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full px-4 py-2 transition-all"
                >
                  <span className="text-white font-medium text-sm">{item.name}</span>
                  <span className="text-amber-200 text-sm">${item.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Menu Sections */}
      <main className="mx-auto max-w-7xl px-4 pb-32">
        {sections.map((section) => (
          <section
            key={section.id}
            ref={(el) => { sectionRefs.current[section.id] = el; }}
            className="mb-12"
          >
            {/* Section Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">{section.name}</h2>
              {section.description && (
                <p className="text-amber-200/70">{section.description}</p>
              )}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {section.items.filter(item => item.available).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    if (isCakeItem(item)) {
                      setShowCakeBuilder(true);
                    } else {
                      setShowItemModal(true);
                    }
                  }}
                  className="group relative bg-gradient-to-br from-stone-800/80 to-stone-900/80 rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20"
                >
                  {/* Image */}
                  <div className="aspect-square relative overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-800/50 to-amber-900/50 flex items-center justify-center text-5xl">
                        🥐
                      </div>
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Featured Badge */}
                    {item.isFeatured && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        ⭐ Popular
                      </div>
                    )}

                    {/* Cake Badge */}
                    {isCakeItem(item) && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        🎂 Personalizable
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold">${item.price.toFixed(2)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isCakeItem(item)) {
                            handleAddToCart(item, 1);
                          }
                        }}
                        disabled={!isOpen}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all ${
                          isOpen
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-lg hover:shadow-amber-500/40'
                            : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {section.items.filter(item => item.available).length === 0 && (
              <div className="text-center py-12 bg-white/5 rounded-2xl">
                <span className="text-4xl mb-4 block">🥐</span>
                <p className="text-amber-200/60">Proximamente mas productos...</p>
              </div>
            )}
          </section>
        ))}

        {/* Empty Menu State */}
        {sections.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
              <span className="text-5xl">🥐</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Preparando el Menu</h2>
            <p className="text-amber-200/70 max-w-md mx-auto">
              Estamos horneando nuestros productos frescos. Vuelve pronto para ver nuestro menu completo.
            </p>
            <Link
              href="/order"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Ver Menu de La Poblanita
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-900/30 bg-stone-950/80 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-2xl">🥐</span>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              El Hornito
            </span>
          </div>
          <p className="text-amber-200/50 text-sm mb-4">
            Parte de La Poblanita Mexican Food
          </p>
          <Link href="/order" className="text-amber-400 hover:text-amber-300 text-sm font-medium">
            ← Regresar al menu principal
          </Link>
        </div>
      </footer>

      {/* Item Modal */}
      {showItemModal && selectedItem && mounted && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          onClick={() => setShowItemModal(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[90vh] bg-gradient-to-br from-stone-800 to-stone-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative h-48 sm:h-64">
              {selectedItem.image ? (
                <Image
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-800/50 to-amber-900/50 flex items-center justify-center text-7xl">
                  🥐
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
              <button
                onClick={() => setShowItemModal(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-2xl font-bold text-white mb-2">{selectedItem.name}</h3>
              <p className="text-amber-200/70 mb-4">{selectedItem.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-amber-400">${selectedItem.price.toFixed(2)}</span>
                <button
                  onClick={() => handleAddToCart(selectedItem, 1)}
                  disabled={!isOpen}
                  className={`px-6 py-3 rounded-full font-semibold transition-all ${
                    isOpen
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-lg hover:shadow-amber-500/40'
                      : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {isOpen ? 'Agregar al Carrito' : 'Cerrado'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Cake Builder Modal */}
      {showCakeBuilder && selectedItem && mounted && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          onClick={() => setShowCakeBuilder(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[95vh] bg-gradient-to-br from-stone-800 to-stone-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-pink-600 to-rose-600 p-6 text-center">
              <button
                onClick={() => setShowCakeBuilder(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-all"
              >
                ✕
              </button>
              <span className="text-4xl mb-2 block">🎂</span>
              <h3 className="text-2xl font-bold text-white">{selectedItem.name}</h3>
              <p className="text-pink-100/80 text-sm mt-1">Personaliza tu pastel perfecto</p>
            </div>

            {/* Options */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Size */}
              <div>
                <label className="block text-white font-semibold mb-3">Tamano</label>
                <div className="grid grid-cols-2 gap-3">
                  {CAKE_SIZES.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setCakeCustomization(prev => ({ ...prev, size: size.id as any }))}
                      className={`p-3 rounded-xl text-left transition-all ${
                        cakeCustomization.size === size.id
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                          : 'bg-white/10 text-amber-100 hover:bg-white/20'
                      }`}
                    >
                      <div className="font-semibold">{size.name}</div>
                      <div className="text-sm opacity-80">{size.serves} personas</div>
                      {size.price > 0 && <div className="text-xs mt-1">+${size.price}</div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layers */}
              <div>
                <label className="block text-white font-semibold mb-3">Capas</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCakeCustomization(prev => ({ ...prev, layers: Math.max(1, prev.layers - 1) }))}
                    className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-white min-w-[3rem] text-center">{cakeCustomization.layers}</span>
                  <button
                    onClick={() => setCakeCustomization(prev => ({ ...prev, layers: Math.min(5, prev.layers + 1) }))}
                    className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                  >
                    +
                  </button>
                  {cakeCustomization.layers > 2 && (
                    <span className="text-amber-400 text-sm">+${(cakeCustomization.layers - 2) * 15}</span>
                  )}
                </div>
              </div>

              {/* Flavor */}
              <div>
                <label className="block text-white font-semibold mb-3">Sabor</label>
                <div className="flex flex-wrap gap-2">
                  {CAKE_FLAVORS.map((flavor) => (
                    <button
                      key={flavor.id}
                      onClick={() => setCakeCustomization(prev => ({ ...prev, flavor: flavor.id }))}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        cakeCustomization.flavor === flavor.id
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                          : 'bg-white/10 text-amber-100 hover:bg-white/20'
                      }`}
                    >
                      {flavor.name} {flavor.price > 0 && `+$${flavor.price}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filling */}
              <div>
                <label className="block text-white font-semibold mb-3">Relleno</label>
                <div className="flex flex-wrap gap-2">
                  {CAKE_FILLINGS.map((filling) => (
                    <button
                      key={filling.id}
                      onClick={() => setCakeCustomization(prev => ({ ...prev, filling: filling.id }))}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        cakeCustomization.filling === filling.id
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                          : 'bg-white/10 text-amber-100 hover:bg-white/20'
                      }`}
                    >
                      {filling.name} {filling.price > 0 && `+$${filling.price}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frosting */}
              <div>
                <label className="block text-white font-semibold mb-3">Cobertura</label>
                <div className="flex flex-wrap gap-2">
                  {CAKE_FROSTINGS.map((frosting) => (
                    <button
                      key={frosting.id}
                      onClick={() => setCakeCustomization(prev => ({ ...prev, frosting: frosting.id }))}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        cakeCustomization.frosting === frosting.id
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                          : 'bg-white/10 text-amber-100 hover:bg-white/20'
                      }`}
                    >
                      {frosting.name} {frosting.price > 0 && `+$${frosting.price}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-white font-semibold mb-3">Mensaje en el Pastel (opcional)</label>
                <input
                  type="text"
                  value={cakeCustomization.message}
                  onChange={(e) => setCakeCustomization(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Feliz Cumpleanos..."
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Decorations */}
              <div>
                <label className="block text-white font-semibold mb-3">Decoraciones Extras</label>
                <div className="flex flex-wrap gap-2">
                  {CAKE_DECORATIONS.map((dec) => (
                    <button
                      key={dec.id}
                      onClick={() => {
                        setCakeCustomization(prev => ({
                          ...prev,
                          decorations: prev.decorations.includes(dec.id)
                            ? prev.decorations.filter(d => d !== dec.id)
                            : [...prev.decorations, dec.id]
                        }));
                      }}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        cakeCustomization.decorations.includes(dec.id)
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                          : 'bg-white/10 text-amber-100 hover:bg-white/20'
                      }`}
                    >
                      {dec.name} +${dec.price}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer with Total */}
            <div className="p-6 border-t border-white/10 bg-stone-900/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-amber-200">Total:</span>
                <span className="text-3xl font-bold text-amber-400">
                  ${calculateCakePrice(selectedItem.price).toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => handleAddCakeToCart(selectedItem)}
                disabled={!isOpen}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  isOpen
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:shadow-pink-500/40'
                    : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                }`}
              >
                {isOpen ? '🎂 Ordenar Pastel Personalizado' : 'Cerrado'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Cart FAB */}
      <button
        onClick={() => {
          const cartBtn = document.querySelector('[data-cart-launcher]') as HTMLButtonElement;
          cartBtn?.click();
        }}
        className="fixed bottom-6 right-4 z-50 sm:hidden w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-xl shadow-amber-500/50 flex items-center justify-center transition-all active:scale-95"
      >
        <span className="text-2xl">🛒</span>
        {cart.items.length > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
            {cart.items.length}
          </span>
        )}
      </button>
    </div>
  );
}

// Re-export types
export type { BakeryMenuSection as OrderMenuSection, BakeryMenuItem as OrderMenuItem };
