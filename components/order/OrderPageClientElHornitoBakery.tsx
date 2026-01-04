/**
 * OrderPageClientElHornitoBakery - El Hornito Bakery Wonderland Experience
 *
 * A stunning Mexican panaderia wonderland with:
 * - Blue tones matching La Poblanita brand
 * - Abundant sparkle stars throughout
 * - Rotating cake carousel hero
 * - Abstract cake decoration dividers
 * - Pastel color trims and business card aesthetic
 * - Cake ordering with scheduling, deposits, and full customization
 * - Per-piece bundle ordering
 * - Integrated cart with La Poblanita
 */
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
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

// Cake scheduling order
interface CakeOrder {
  size: string;
  layers: number;
  flavor: string;
  filling: string;
  frosting: string;
  message: string;
  decorations: string[];
  pickupDate: string;
  pickupTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  specialInstructions: string;
  depositPaid: boolean;
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

// Cake configuration options
const CAKE_SIZES = [
  { id: 'small', name: '6" Redondo', serves: '6-8', price: 35, icon: '🎂' },
  { id: 'medium', name: '8" Redondo', serves: '10-12', price: 45, icon: '🎂' },
  { id: 'large', name: '10" Redondo', serves: '16-20', price: 60, icon: '🎂' },
  { id: 'xl', name: '12" Redondo', serves: '24-30', price: 80, icon: '🎂' },
  { id: 'sheet-half', name: '1/2 Sheet', serves: '20-25', price: 55, icon: '🍰' },
  { id: 'sheet-full', name: 'Full Sheet', serves: '40-50', price: 95, icon: '🍰' },
];

const CAKE_FLAVORS = [
  { id: 'vanilla', name: 'Vainilla Clasica', price: 0, color: '#FEF3C7' },
  { id: 'chocolate', name: 'Chocolate Mexicano', price: 0, color: '#78350F' },
  { id: 'tres-leches', name: 'Tres Leches', price: 8, color: '#FEF9C3' },
  { id: 'red-velvet', name: 'Red Velvet', price: 8, color: '#DC2626' },
  { id: 'strawberry', name: 'Fresa Natural', price: 5, color: '#FDA4AF' },
  { id: 'coconut', name: 'Coco Tropical', price: 5, color: '#ECFDF5' },
  { id: 'dulce-leche', name: 'Dulce de Leche', price: 8, color: '#D97706' },
  { id: 'horchata', name: 'Horchata', price: 10, color: '#FEF3C7' },
];

const CAKE_FILLINGS = [
  { id: 'none', name: 'Sin Relleno', price: 0 },
  { id: 'strawberry-cream', name: 'Fresas con Crema', price: 12 },
  { id: 'peach-cream', name: 'Duraznos con Crema', price: 12 },
  { id: 'mixed-fruit', name: 'Frutas Mixtas', price: 15 },
  { id: 'cajeta', name: 'Cajeta Artesanal', price: 10 },
  { id: 'nutella', name: 'Nutella', price: 12 },
  { id: 'dulce-leche', name: 'Dulce de Leche', price: 10 },
  { id: 'bavarian', name: 'Crema Bavaresa', price: 8 },
];

const CAKE_FROSTINGS = [
  { id: 'buttercream', name: 'Buttercream Clasico', price: 0 },
  { id: 'whipped', name: 'Crema Batida Fresca', price: 0 },
  { id: 'cream-cheese', name: 'Queso Crema', price: 8 },
  { id: 'chocolate-ganache', name: 'Ganache de Chocolate', price: 12 },
  { id: 'fondant', name: 'Fondant Profesional', price: 25 },
  { id: 'naked', name: 'Naked Cake (Sin Cobertura)', price: 0 },
];

const CAKE_DECORATIONS = [
  { id: 'fresh-flowers', name: 'Flores Frescas', price: 20, icon: '🌸' },
  { id: 'sugar-flowers', name: 'Flores de Azucar', price: 18, icon: '🌺' },
  { id: 'fresh-fruit', name: 'Fruta Fresca', price: 15, icon: '🍓' },
  { id: 'gold-leaf', name: 'Hoja de Oro', price: 30, icon: '✨' },
  { id: 'sprinkles', name: 'Chispas de Colores', price: 5, icon: '🎨' },
  { id: 'macarons', name: 'Macarons', price: 25, icon: '🍬' },
  { id: 'figurine', name: 'Figurita Personalizada', price: 25, icon: '🎭' },
  { id: 'photo', name: 'Foto Comestible', price: 15, icon: '📸' },
  { id: 'candles', name: 'Set de Velitas', price: 5, icon: '🕯️' },
  { id: 'topper', name: 'Cake Topper', price: 12, icon: '🎀' },
];

// Bundle configurations
const BUNDLES = [
  { id: 'half-dozen', name: 'Media Docena', count: 6, discount: 0.10, icon: '🧺' },
  { id: 'dozen', name: 'Docena Completa', count: 12, discount: 0.15, icon: '📦' },
  { id: 'party-pack', name: 'Pack Fiesta', count: 24, discount: 0.20, icon: '🎉' },
  { id: 'catering', name: 'Catering (50+)', count: 50, discount: 0.25, icon: '🏪' },
];

// Pickup time slots
const TIME_SLOTS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
];

// Sparkle Star Component
const SparkleStar = ({ className = '', size = 'md', delay = 0, style = {} }: {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  delay?: number;
  style?: React.CSSProperties;
}) => {
  const sizes = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4', xl: 'w-6 h-6' };
  return (
    <div
      className={`absolute ${sizes[size]} ${className}`}
      style={{ animationDelay: `${delay}s`, ...style }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full animate-sparkle">
        <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
      </svg>
    </div>
  );
};

// Cake Decoration Divider Component
const CakeDecorationDivider = ({ variant = 'swirl' }: { variant?: 'swirl' | 'dots' | 'wave' | 'frosting' }) => {
  if (variant === 'swirl') {
    return (
      <div className="relative w-full h-16 my-8 overflow-hidden">
        <svg viewBox="0 0 1200 80" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="frostingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbcfe8" />
              <stop offset="25%" stopColor="#a5f3fc" />
              <stop offset="50%" stopColor="#fde68a" />
              <stop offset="75%" stopColor="#c4b5fd" />
              <stop offset="100%" stopColor="#fbcfe8" />
            </linearGradient>
          </defs>
          <path
            d="M0,40 Q100,0 200,40 T400,40 T600,40 T800,40 T1000,40 T1200,40"
            stroke="url(#frostingGrad)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M0,50 Q150,80 300,50 T600,50 T900,50 T1200,50"
            stroke="url(#frostingGrad)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
        {/* Decorative dots */}
        <div className="absolute top-1/2 left-1/4 w-3 h-3 rounded-full bg-pink-300 -translate-y-1/2 animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-cyan-300 -translate-y-1/2 animate-bounce" style={{ animationDelay: '0.2s' }} />
        <div className="absolute top-1/2 left-3/4 w-3 h-3 rounded-full bg-amber-300 -translate-y-1/2 animate-bounce" style={{ animationDelay: '0.4s' }} />
      </div>
    );
  }

  if (variant === 'frosting') {
    return (
      <div className="relative w-full h-12 my-6">
        <svg viewBox="0 0 1200 50" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pastelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e3a5f" />
            </linearGradient>
          </defs>
          <path
            d="M0,25 C50,10 100,40 150,25 S250,10 300,25 S400,40 450,25 S550,10 600,25 S700,40 750,25 S850,10 900,25 S1000,40 1050,25 S1150,10 1200,25"
            stroke="url(#pastelGrad)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 my-8">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
      <div className="flex gap-2">
        <span className="text-pink-400 animate-bounce" style={{ animationDelay: '0s' }}>🧁</span>
        <span className="text-cyan-400 animate-bounce" style={{ animationDelay: '0.1s' }}>🎂</span>
        <span className="text-amber-400 animate-bounce" style={{ animationDelay: '0.2s' }}>🍰</span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
    </div>
  );
};

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
  const [activeView, setActiveView] = useState<'menu' | 'cakes' | 'bundles'>('menu');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BakeryMenuItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemQuantity, setItemQuantity] = useState(1);

  // Carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Cake builder state
  const [showCakeBuilder, setShowCakeBuilder] = useState(false);
  const [cakeStep, setCakeStep] = useState(0);
  const [cakeHeaderCollapsed, setCakeHeaderCollapsed] = useState(false);
  const [cakeOrder, setCakeOrder] = useState<CakeOrder>({
    size: 'medium',
    layers: 2,
    flavor: 'vanilla',
    filling: 'strawberry-cream',
    frosting: 'whipped',
    message: '',
    decorations: [],
    pickupDate: '',
    pickupTime: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    specialInstructions: '',
    depositPaid: false,
  });

  // Bundle builder state
  const [showBundleBuilder, setShowBundleBuilder] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<typeof BUNDLES[0] | null>(null);
  const [bundleItems, setBundleItems] = useState<{ item: BakeryMenuItem; quantity: number }[]>([]);

  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const router = useRouter();
  const cart = useCart();
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const heroRef = useRef<HTMLElement | null>(null);

  // Get all pan dulce items for bundles
  const panDulceItems = useMemo(() => {
    return sections
      .filter(s => s.name.toLowerCase().includes('pan dulce') || s.type === 'BAKERY')
      .flatMap(s => s.items.filter(i => i.available && i.price < 5));
  }, [sections]);

  // Get cake items for carousel
  const cakeItems = useMemo(() => {
    return sections
      .filter(s => s.name.toLowerCase().includes('pastel') || s.type === 'SPECIAL')
      .flatMap(s => s.items.filter(i => i.available));
  }, [sections]);

  // Auto-rotate carousel
  useEffect(() => {
    if (cakeItems.length === 0) return;
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % Math.max(1, cakeItems.length));
    }, 4000);
    return () => clearInterval(interval);
  }, [cakeItems.length]);

  useEffect(() => {
    setMounted(true);
    // Set minimum pickup date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2); // 2 days advance for cakes
    setCakeOrder(prev => ({
      ...prev,
      pickupDate: tomorrow.toISOString().split('T')[0],
    }));
  }, []);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderScrolled(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate cake total
  const calculateCakeTotal = useCallback(() => {
    const size = CAKE_SIZES.find(s => s.id === cakeOrder.size);
    const flavor = CAKE_FLAVORS.find(f => f.id === cakeOrder.flavor);
    const filling = CAKE_FILLINGS.find(f => f.id === cakeOrder.filling);
    const frosting = CAKE_FROSTINGS.find(f => f.id === cakeOrder.frosting);

    let total = size?.price || 0;
    total += flavor?.price || 0;
    total += filling?.price || 0;
    total += frosting?.price || 0;
    if (cakeOrder.layers > 2) total += (cakeOrder.layers - 2) * 20;

    cakeOrder.decorations.forEach(decId => {
      const dec = CAKE_DECORATIONS.find(d => d.id === decId);
      if (dec) total += dec.price;
    });

    return total;
  }, [cakeOrder]);

  // Calculate deposit (50%)
  const cakeDeposit = useMemo(() => calculateCakeTotal() * 0.5, [calculateCakeTotal]);

  // Calculate bundle total
  const calculateBundleTotal = useCallback(() => {
    if (!selectedBundle) return 0;
    const subtotal = bundleItems.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0);
    return subtotal * (1 - selectedBundle.discount);
  }, [bundleItems, selectedBundle]);

  const bundleItemCount = useMemo(() =>
    bundleItems.reduce((sum, { quantity }) => sum + quantity, 0),
  [bundleItems]);

  // Add item to cart - bakery always accepts orders (items are made fresh daily or scheduled)
  const handleAddToCart = useCallback((item: BakeryMenuItem, quantity: number = 1) => {
    // Bakery items can always be added (pan dulce is baked fresh, cakes are scheduled)
    cart.addItem({
      id: `${item.id}-${Date.now()}`,
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
    setItemQuantity(1);
  }, [cart, isOpen]);

  // Add cake order to cart - cakes are always scheduled in advance
  const handleAddCakeToCart = useCallback(() => {

    const size = CAKE_SIZES.find(s => s.id === cakeOrder.size);
    const flavor = CAKE_FLAVORS.find(f => f.id === cakeOrder.flavor);
    const filling = CAKE_FILLINGS.find(f => f.id === cakeOrder.filling);
    const frosting = CAKE_FROSTINGS.find(f => f.id === cakeOrder.frosting);
    const total = calculateCakeTotal();

    const customizations = [
      `Tamano: ${size?.name} (${size?.serves} personas)`,
      `${cakeOrder.layers} capas`,
      `Sabor: ${flavor?.name}`,
      `Relleno: ${filling?.name}`,
      `Cobertura: ${frosting?.name}`,
      `Fecha: ${new Date(cakeOrder.pickupDate).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      `Hora: ${cakeOrder.pickupTime}`,
      `Cliente: ${cakeOrder.customerName}`,
      `Tel: ${cakeOrder.customerPhone}`,
    ];

    if (cakeOrder.message) customizations.push(`Mensaje: "${cakeOrder.message}"`);
    if (cakeOrder.specialInstructions) customizations.push(`Notas: ${cakeOrder.specialInstructions}`);

    cakeOrder.decorations.forEach(decId => {
      const dec = CAKE_DECORATIONS.find(d => d.id === decId);
      if (dec) customizations.push(`${dec.icon} ${dec.name}`);
    });

    cart.addItem({
      id: `cake-custom-${Date.now()}`,
      menuItemId: 'custom-cake',
      name: `Pastel Personalizado - ${size?.name}`,
      price: total,
      quantity: 1,
      customizations,
      removals: [],
      addons: [],
      itemType: 'bakery',
    });

    setShowCakeBuilder(false);
    setCakeStep(0);
  }, [cart, isOpen, cakeOrder, calculateCakeTotal]);

  // Add bundle to cart - bundles are available anytime
  const handleAddBundleToCart = useCallback(() => {
    if (!selectedBundle) return;

    const total = calculateBundleTotal();
    const itemNames = bundleItems.map(({ item, quantity }) => `${quantity}x ${item.name}`).join(', ');

    cart.addItem({
      id: `bundle-${selectedBundle.id}-${Date.now()}`,
      menuItemId: 'bundle',
      name: `${selectedBundle.icon} ${selectedBundle.name}`,
      price: total,
      quantity: 1,
      customizations: [itemNames, `${Math.round(selectedBundle.discount * 100)}% descuento aplicado`],
      removals: [],
      addons: [],
      itemType: 'bakery',
    });

    setShowBundleBuilder(false);
    setSelectedBundle(null);
    setBundleItems([]);
  }, [cart, isOpen, selectedBundle, bundleItems, calculateBundleTotal]);

  // Scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const el = sectionRefs.current[sectionId];
    if (el) {
      const headerOffset = 200;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setSelectedSection(sectionId);
  }, []);

  // Check if item is a cake
  const isCakeItem = useCallback((item: BakeryMenuItem) => {
    const cakeKeywords = ['pastel', 'cake', 'torta', 'tres leches'];
    const name = item.name.toLowerCase();
    const category = item.category?.toLowerCase() || '';
    return cakeKeywords.some(kw => name.includes(kw) || category.includes(kw));
  }, []);

  // Get min date for cake orders (2 days advance)
  const minCakeDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toISOString().split('T')[0];
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 30%, #1e40af 50%, #1e3a5f 70%, #0f172a 100%)',
      }}>
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center">
              <span className="text-4xl animate-bounce">🥐</span>
            </div>
          </div>
          <p className="text-blue-100 text-xl font-medium">Preparando la panaderia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden" style={{
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    }}>
      {/* === ANIMATED BACKGROUND WITH STARS === */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Blue ambient glows - matching La Poblanita */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[180px] animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)', animationDuration: '4s' }} />
        <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] rounded-full blur-[150px] animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.3) 0%, transparent 70%)', animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[500px] rounded-full blur-[200px] animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', animationDuration: '6s', animationDelay: '2s' }} />

        {/* Pastel accent glows */}
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] rounded-full blur-[120px] animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)', animationDuration: '7s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[150px] animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', animationDuration: '8s', animationDelay: '3s' }} />

        {/* Floating particles */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(59,130,246,0.2) 1px, transparent 1px),
                           radial-gradient(circle at 80% 70%, rgba(14,165,233,0.2) 1px, transparent 1px),
                           radial-gradient(circle at 40% 80%, rgba(99,102,241,0.15) 1px, transparent 1px),
                           radial-gradient(circle at 60% 20%, rgba(251,191,36,0.1) 1px, transparent 1px)`,
          backgroundSize: '100px 100px, 80px 80px, 120px 120px, 90px 90px',
          animation: 'float 20s ease-in-out infinite',
        }} />

        {/* === ABUNDANT SPARKLE STARS === */}
        {/* Top area stars */}
        <SparkleStar className="text-yellow-300 top-[5%] left-[10%]" size="lg" delay={0} />
        <SparkleStar className="text-cyan-300 top-[8%] left-[25%]" size="md" delay={0.3} />
        <SparkleStar className="text-pink-300 top-[3%] left-[40%]" size="sm" delay={0.6} />
        <SparkleStar className="text-blue-300 top-[10%] left-[55%]" size="lg" delay={0.9} />
        <SparkleStar className="text-amber-300 top-[5%] left-[70%]" size="md" delay={1.2} />
        <SparkleStar className="text-purple-300 top-[8%] left-[85%]" size="sm" delay={1.5} />
        <SparkleStar className="text-white top-[12%] left-[95%]" size="lg" delay={0.2} />

        {/* Upper-middle stars */}
        <SparkleStar className="text-yellow-200 top-[20%] left-[5%]" size="md" delay={0.4} />
        <SparkleStar className="text-cyan-200 top-[18%] left-[20%]" size="lg" delay={0.7} />
        <SparkleStar className="text-pink-200 top-[22%] left-[35%]" size="sm" delay={1.0} />
        <SparkleStar className="text-blue-200 top-[15%] left-[50%]" size="xl" delay={1.3} />
        <SparkleStar className="text-amber-200 top-[25%] left-[65%]" size="md" delay={1.6} />
        <SparkleStar className="text-purple-200 top-[20%] left-[80%]" size="lg" delay={0.1} />
        <SparkleStar className="text-white top-[18%] left-[92%]" size="sm" delay={0.5} />

        {/* Middle stars */}
        <SparkleStar className="text-yellow-300 top-[35%] left-[8%]" size="sm" delay={0.8} />
        <SparkleStar className="text-cyan-300 top-[40%] left-[18%]" size="lg" delay={1.1} />
        <SparkleStar className="text-pink-300 top-[38%] left-[30%]" size="md" delay={1.4} />
        <SparkleStar className="text-blue-300 top-[32%] left-[45%]" size="sm" delay={1.7} />
        <SparkleStar className="text-amber-300 top-[42%] left-[60%]" size="xl" delay={0} />
        <SparkleStar className="text-purple-300 top-[35%] left-[75%]" size="md" delay={0.3} />
        <SparkleStar className="text-white top-[40%] left-[88%]" size="lg" delay={0.6} />

        {/* Lower-middle stars */}
        <SparkleStar className="text-yellow-200 top-[55%] left-[3%]" size="lg" delay={0.9} />
        <SparkleStar className="text-cyan-200 top-[52%] left-[15%]" size="sm" delay={1.2} />
        <SparkleStar className="text-pink-200 top-[58%] left-[28%]" size="md" delay={1.5} />
        <SparkleStar className="text-blue-200 top-[50%] left-[42%]" size="lg" delay={0.2} />
        <SparkleStar className="text-amber-200 top-[60%] left-[58%]" size="sm" delay={0.5} />
        <SparkleStar className="text-purple-200 top-[55%] left-[72%]" size="xl" delay={0.8} />
        <SparkleStar className="text-white top-[52%] left-[85%]" size="md" delay={1.1} />

        {/* Bottom stars */}
        <SparkleStar className="text-yellow-300 top-[70%] left-[12%]" size="md" delay={1.4} />
        <SparkleStar className="text-cyan-300 top-[75%] left-[25%]" size="lg" delay={1.7} />
        <SparkleStar className="text-pink-300 top-[68%] left-[38%]" size="sm" delay={0} />
        <SparkleStar className="text-blue-300 top-[78%] left-[52%]" size="md" delay={0.3} />
        <SparkleStar className="text-amber-300 top-[72%] left-[68%]" size="lg" delay={0.6} />
        <SparkleStar className="text-purple-300 top-[80%] left-[82%]" size="sm" delay={0.9} />
        <SparkleStar className="text-white top-[75%] left-[95%]" size="xl" delay={1.2} />

        {/* Extra floating stars */}
        <SparkleStar className="text-yellow-100 top-[85%] left-[5%]" size="sm" delay={1.5} />
        <SparkleStar className="text-cyan-100 top-[90%] left-[22%]" size="md" delay={0.2} />
        <SparkleStar className="text-pink-100 top-[88%] left-[45%]" size="lg" delay={0.5} />
        <SparkleStar className="text-blue-100 top-[92%] left-[62%]" size="sm" delay={0.8} />
        <SparkleStar className="text-amber-100 top-[85%] left-[78%]" size="md" delay={1.1} />
        <SparkleStar className="text-purple-100 top-[95%] left-[90%]" size="lg" delay={1.4} />
      </div>

      {/* === HERO SECTION WITH CAKE CAROUSEL === */}
      <section ref={heroRef} className="relative pt-safe-top">
        {/* Hero Background with Blue Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 25%, #1e40af 50%, #1e3a5f 75%, #0f172a 100%)',
          }} />
          {/* Pastel overlay pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-900 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-4 pt-4 sm:pt-8 pb-8">
          {/* Mobile Header Bar */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setShowMobileNav(true)}
              className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Subtle Back Link - Center (hidden on very small screens) */}
            <Link
              href="/order"
              className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 text-blue-200/60 hover:text-blue-100 transition-colors text-xs font-medium bg-white/5 backdrop-blur-sm rounded-full border border-white/10 hover:bg-white/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>La Poblanita</span>
            </Link>

            {/* Cart Launcher */}
            <CartLauncher />
          </div>

          {/* Logo and Title with Stars */}
          <div className="text-center max-w-3xl mx-auto relative">
            {/* Decorative stars around logo */}
            <SparkleStar className="text-yellow-300 -top-4 left-1/4" size="lg" delay={0} />
            <SparkleStar className="text-cyan-300 -top-2 right-1/4" size="md" delay={0.3} />
            <SparkleStar className="text-pink-300 top-8 left-[15%]" size="sm" delay={0.6} />
            <SparkleStar className="text-blue-300 top-12 right-[15%]" size="lg" delay={0.9} />

            {/* Large Logo */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/40 to-cyan-400/40 blur-3xl scale-150 animate-pulse" />
              <div className="relative">
                {elHornitoTenant.logoUrl ? (
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-500 p-1.5 shadow-2xl shadow-blue-500/50 mx-auto ring-4 ring-white/20">
                    <Image
                      src={elHornitoTenant.logoUrl}
                      alt={elHornitoTenant.name}
                      width={176}
                      height={176}
                      className="rounded-full object-cover w-full h-full"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-500 flex items-center justify-center shadow-2xl shadow-blue-500/50 mx-auto ring-4 ring-white/20">
                    <span className="text-7xl sm:text-8xl">🥐</span>
                  </div>
                )}
                {/* Sparkle decorations around logo */}
                <SparkleStar className="text-yellow-300 -top-3 -right-3" size="xl" delay={0} />
                <SparkleStar className="text-cyan-300 -bottom-2 -left-4" size="lg" delay={0.5} />
                <SparkleStar className="text-pink-300 top-1/2 -right-6" size="md" delay={1} />
                <SparkleStar className="text-white -top-1 left-1/4" size="sm" delay={1.5} />
              </div>
            </div>

            {/* Title with gradient */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-3">
              <span className="bg-gradient-to-r from-blue-200 via-cyan-100 to-blue-200 bg-clip-text text-transparent drop-shadow-lg">
                El Hornito
              </span>
            </h1>
            <p className="text-cyan-300/90 text-lg sm:text-xl font-medium tracking-widest uppercase mb-4">
              Panaderia Mexicana Artesanal
            </p>

            {/* Tagline */}
            <p className="text-blue-100/70 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Tradicion familiar horneada con amor desde hace generaciones.
              Pan dulce autentico, pasteles personalizados y el sabor de Mexico en cada bocado.
            </p>

            {/* Community badge with pastel trim */}
            <div className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-pink-500/20 via-cyan-500/20 to-amber-500/20 backdrop-blur-sm rounded-full border-2 border-gradient-to-r from-pink-400/50 via-cyan-400/50 to-amber-400/50 shadow-lg">
              <span className="text-xl">🏆</span>
              <span className="text-white text-sm font-semibold">Orgullo de nuestra comunidad desde 1995</span>
              <SparkleStar className="text-yellow-300 relative" size="sm" delay={0} style={{ position: 'relative' }} />
            </div>
          </div>
        </div>

        {/* === CAKE CAROUSEL SECTION - Elegant Gallery Style === */}
        <div className="relative z-10 px-3 sm:px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            {/* Section title with stars */}
            <div className="text-center mb-4 sm:mb-6 relative">
              <SparkleStar className="text-pink-300 -left-4 top-0" size="md" delay={0} />
              <SparkleStar className="text-amber-300 -right-4 top-0" size="md" delay={0.5} />
              <h2 className="text-xl sm:text-3xl font-bold text-white inline-flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl">🎂</span>
                <span className="bg-gradient-to-r from-pink-300 via-amber-200 to-cyan-300 bg-clip-text text-transparent">
                  Nuestros Pasteles Artesanales
                </span>
                <span className="text-2xl sm:text-3xl">🎂</span>
              </h2>
              <p className="text-blue-200/60 mt-1 sm:mt-2 text-sm sm:text-base">Hechos con amor para tu celebracion especial</p>
            </div>

            {/* Elegant Cake Frame Gallery */}
            <div className="relative">
              {/* Decorative Corner Elements */}
              <div className="absolute -top-3 -left-3 w-12 h-12 border-t-4 border-l-4 border-pink-400/60 rounded-tl-2xl" />
              <div className="absolute -top-3 -right-3 w-12 h-12 border-t-4 border-r-4 border-cyan-400/60 rounded-tr-2xl" />
              <div className="absolute -bottom-3 -left-3 w-12 h-12 border-b-4 border-l-4 border-amber-400/60 rounded-bl-2xl" />
              <div className="absolute -bottom-3 -right-3 w-12 h-12 border-b-4 border-r-4 border-pink-400/60 rounded-br-2xl" />

              {/* Main Gallery Container */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800/90 to-slate-900 p-3 sm:p-4"
                style={{
                  boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}>

                {/* Featured Image - Square/Portrait with Object-Contain */}
                <div className="relative aspect-square sm:aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                  {cakeItems.length > 0 && cakeItems[carouselIndex]?.image ? (
                    <>
                      {/* Subtle Pattern Background */}
                      <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbcfe8' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      }} />

                      {/* Main Image - Object Contain for full cake display */}
                      <Image
                        src={cakeItems[carouselIndex].image!}
                        alt={cakeItems[carouselIndex].name}
                        fill
                        className="object-contain p-2 sm:p-4 drop-shadow-2xl"
                        sizes="(max-width: 640px) 100vw, 800px"
                        priority
                        unoptimized
                      />

                      {/* Soft Edge Glow */}
                      <div className="absolute inset-0 pointer-events-none" style={{
                        boxShadow: 'inset 0 0 60px rgba(251,207,232,0.1), inset 0 0 120px rgba(165,243,252,0.05)'
                      }} />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <span className="text-8xl mb-4 animate-bounce">🎂</span>
                      <p className="text-blue-200/60 text-lg">Pasteles disponibles</p>
                    </div>
                  )}

                  {/* Minimal Navigation - Side Arrows Only */}
                  {cakeItems.length > 1 && (
                    <>
                      <button
                        onClick={() => setCarouselIndex(prev => prev === 0 ? cakeItems.length - 1 : prev - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-700 text-lg hover:bg-white hover:scale-110 active:scale-95 transition-all shadow-xl"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setCarouselIndex(prev => (prev + 1) % cakeItems.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-700 text-lg hover:bg-white hover:scale-110 active:scale-95 transition-all shadow-xl"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                {/* Info Bar Below Image */}
                {cakeItems.length > 0 && (
                  <div className="mt-3 sm:mt-4 px-1">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                          {cakeItems[carouselIndex]?.name || 'Pastel Artesanal'}
                        </h3>
                        <p className="text-blue-200/60 text-xs sm:text-sm line-clamp-1">
                          {cakeItems[carouselIndex]?.description || 'Delicioso pastel artesanal'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-[10px] sm:text-xs text-pink-300 font-medium uppercase tracking-wide">Desde</div>
                        <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-400 via-cyan-400 to-amber-400 bg-clip-text text-transparent">
                          ${cakeItems[carouselIndex]?.price?.toFixed(2) || '35.00'}
                        </div>
                      </div>
                    </div>

                    {/* Dot Navigation */}
                    {cakeItems.length > 1 && (
                      <div className="flex justify-center gap-1.5 mt-3">
                        {cakeItems.slice(0, 8).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCarouselIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              idx === carouselIndex
                                ? 'bg-gradient-to-r from-pink-400 to-cyan-400 w-6'
                                : 'bg-white/30 w-1.5 hover:bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Mini Thumbnail Preview */}
                {cakeItems.length > 1 && (
                  <div className="flex justify-center gap-2 mt-3 pt-3 border-t border-white/10">
                    {cakeItems.slice(0, 5).map((cake, idx) => (
                      <button
                        key={cake.id}
                        onClick={() => setCarouselIndex(idx)}
                        className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden transition-all duration-300 ${
                          idx === carouselIndex
                            ? 'ring-2 ring-pink-400 scale-110 shadow-lg shadow-pink-500/30'
                            : 'opacity-50 hover:opacity-80 grayscale hover:grayscale-0'
                        }`}
                      >
                        {cake.image ? (
                          <Image src={cake.image} alt={cake.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-800/50 to-rose-900/50 flex items-center justify-center text-xl">🎂</div>
                        )}
                      </button>
                    ))}
                    {cakeItems.length > 5 && (
                      <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-white/10 flex items-center justify-center text-white/60 text-xs font-medium">
                        +{cakeItems.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center mt-6">
              <button
                onClick={() => { setActiveView('cakes'); setShowCakeBuilder(true); }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white font-bold text-lg rounded-full hover:shadow-2xl hover:shadow-pink-500/40 transition-all hover:scale-105"
              >
                <span className="text-2xl">🎂</span>
                Crea Tu Pastel Personalizado
                <SparkleStar className="text-yellow-300 relative" size="sm" delay={0} style={{ position: 'relative' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Cake Decoration Divider */}
        <CakeDecorationDivider variant="swirl" />
      </section>

      {/* === QUICK ACTION CARDS === */}
      <section className="relative z-10 px-4 pb-8 -mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {/* Pan Dulce Card - Pastel Pink */}
          <button
            onClick={() => { setActiveView('menu'); scrollToSection(sections[0]?.id || ''); }}
            className="group relative p-6 rounded-3xl overflow-hidden transition-all hover:scale-[1.03] hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(251,207,232,0.2) 0%, rgba(244,114,182,0.15) 100%)',
              border: '2px solid rgba(251,207,232,0.4)',
              boxShadow: '0 10px 40px rgba(251,207,232,0.2)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <SparkleStar className="text-pink-300 top-2 right-2" size="sm" delay={0} />
            <span className="text-5xl mb-4 block">🥐</span>
            <h3 className="text-xl font-bold text-white mb-1">Pan Dulce</h3>
            <p className="text-pink-200/70 text-sm">Conchas, cuernos, orejas y mas favoritos</p>
            <div className="mt-3 text-pink-300 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              Ver menu <span>→</span>
            </div>
          </button>

          {/* Custom Cakes Card - Pastel Cyan */}
          <button
            onClick={() => { setActiveView('cakes'); setShowCakeBuilder(true); }}
            className="group relative p-6 rounded-3xl overflow-hidden transition-all hover:scale-[1.03] hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(165,243,252,0.2) 0%, rgba(34,211,238,0.15) 100%)',
              border: '2px solid rgba(165,243,252,0.4)',
              boxShadow: '0 10px 40px rgba(165,243,252,0.2)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <SparkleStar className="text-cyan-300 top-2 right-2" size="sm" delay={0.3} />
            <span className="text-5xl mb-4 block">🎂</span>
            <h3 className="text-xl font-bold text-white mb-1">Pasteles</h3>
            <p className="text-cyan-200/70 text-sm">Disena tu pastel perfecto con nuestro creador</p>
            <div className="mt-3 text-cyan-300 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              Crear pastel <span>→</span>
            </div>
          </button>

          {/* Bundles Card - Pastel Amber */}
          <button
            onClick={() => { setActiveView('bundles'); setShowBundleBuilder(true); }}
            className="group relative p-6 rounded-3xl overflow-hidden transition-all hover:scale-[1.03] hover:shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(253,230,138,0.2) 0%, rgba(251,191,36,0.15) 100%)',
              border: '2px solid rgba(253,230,138,0.4)',
              boxShadow: '0 10px 40px rgba(253,230,138,0.2)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <SparkleStar className="text-amber-300 top-2 right-2" size="sm" delay={0.6} />
            <span className="text-5xl mb-4 block">📦</span>
            <h3 className="text-xl font-bold text-white mb-1">Por Docena</h3>
            <p className="text-amber-200/70 text-sm">Arma tu caja con descuentos especiales</p>
            <div className="mt-3 text-amber-300 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              Crear paquete <span>→</span>
            </div>
          </button>
        </div>
      </section>

      {/* Frosting Divider */}
      <CakeDecorationDivider variant="frosting" />

      {/* Sticky Header */}
      <header
        className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isHeaderScrolled ? 'backdrop-blur-xl shadow-2xl shadow-black/20' : ''
        }`}
        style={{
          paddingTop: isHeaderScrolled ? '0' : 'env(safe-area-inset-top, 0px)',
          background: isHeaderScrolled
            ? 'linear-gradient(to bottom, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))'
            : 'transparent',
        }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className={`flex items-center justify-between transition-all ${isHeaderScrolled ? 'py-3' : 'py-2'}`}>
            {/* Left - Hamburger Menu + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileNav(true)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all active:scale-95 ${
                  isHeaderScrolled
                    ? 'bg-white/10 border border-white/20 hover:bg-white/20'
                    : 'bg-transparent'
                }`}
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {isHeaderScrolled && (
                <>
                  {elHornitoTenant.logoUrl ? (
                    <Image
                      src={elHornitoTenant.logoUrl}
                      alt={elHornitoTenant.name}
                      width={36}
                      height={36}
                      className="rounded-full ring-2 ring-blue-400/50 hidden sm:block"
                      unoptimized
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 items-center justify-center text-lg hidden sm:flex">
                      🥐
                    </div>
                  )}
                  <span className="font-bold text-white hidden md:block">El Hornito</span>
                </>
              )}
            </div>

            {/* Center - View Tabs with Pastel Accents (hide on mobile when not scrolled) */}
            <div className={`flex gap-1 bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/10 ${
              !isHeaderScrolled ? 'hidden sm:flex' : 'flex'
            }`}>
              <button
                onClick={() => setActiveView('menu')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  activeView === 'menu'
                    ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg shadow-pink-500/30'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="hidden sm:inline">🥐 </span>Menu
              </button>
              <button
                onClick={() => { setActiveView('cakes'); setShowCakeBuilder(true); }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  activeView === 'cakes'
                    ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="hidden sm:inline">🎂 </span>Pasteles
              </button>
              <button
                onClick={() => { setActiveView('bundles'); setShowBundleBuilder(true); }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  activeView === 'bundles'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/30'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="hidden sm:inline">📦 </span>Docenas
              </button>
            </div>

            {/* Right - Cart */}
            <CartLauncher />
          </div>

          {/* Section Pills (only show for menu view) */}
          {activeView === 'menu' && sections.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedSection === section.id
                      ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white/10 text-blue-100 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {section.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Closed Banner - Blue theme matching La Poblanita */}
        {!isOpen && (
          <div className="bg-gradient-to-r from-blue-900/90 via-slate-800/90 to-blue-900/90 backdrop-blur-sm border-t border-blue-500/20">
            <div className="mx-auto max-w-7xl px-4 py-2 text-center">
              <span className="text-blue-100 font-medium text-sm">
                🕐 {closedMessage || 'La panaderia esta cerrada en este momento'}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-32">
        {/* Featured Items Banner */}
        {featuredItems.length > 0 && activeView === 'menu' && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6 relative">
              <SparkleStar className="text-amber-300 -left-2 top-0" size="md" delay={0} />
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-amber-400">⭐</span> Lo Mas Pedido
                </h2>
                <p className="text-blue-200/60 text-sm mt-1">Los favoritos de nuestros clientes</p>
              </div>
              <SparkleStar className="text-pink-300 right-0 top-0" size="sm" delay={0.5} />
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {featuredItems.slice(0, 6).map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => { setSelectedItem(item); setShowItemModal(true); }}
                  className="flex-shrink-0 w-44 group cursor-pointer relative"
                >
                  {idx === 0 && <SparkleStar className="text-yellow-300 -top-2 -right-2" size="sm" delay={0} />}
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-gradient-to-br from-slate-800/50 to-slate-900 border-2 border-white/10 group-hover:border-cyan-400/50 transition-all">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🥐</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold rounded-lg shadow-lg">
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                  <h3 className="font-semibold text-white text-sm line-clamp-1">{item.name}</h3>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Menu Sections */}
        {activeView === 'menu' && sections.map((section, sectionIdx) => (
          <section
            key={section.id}
            ref={(el) => { sectionRefs.current[section.id] = el; }}
            className="mb-16"
          >
            {/* Divider between sections */}
            {sectionIdx > 0 && <CakeDecorationDivider variant="dots" />}

            {/* Section Header with Stars */}
            <div className="mb-8 relative">
              <SparkleStar className="text-cyan-300 -left-4 top-0" size="md" delay={0} />
              <SparkleStar className="text-pink-300 right-0 top-2" size="sm" delay={0.3} />
              <h2 className="text-3xl font-bold text-white mb-2">{section.name}</h2>
              {section.description && (
                <p className="text-blue-200/60 text-lg">{section.description}</p>
              )}
              <div className="mt-4 h-1 w-24 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 rounded-full" />
            </div>

            {/* Items Grid with Pastel Borders */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {section.items.filter(item => item.available).map((item, itemIdx) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    if (isCakeItem(item)) {
                      setShowCakeBuilder(true);
                      setActiveView('cakes');
                    } else {
                      setShowItemModal(true);
                    }
                  }}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.03] transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20"
                  style={{
                    background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.9) 100%)',
                    border: '2px solid rgba(148,163,184,0.2)',
                  }}
                >
                  {/* Pastel border on hover */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      border: '2px solid transparent',
                      borderImage: 'linear-gradient(135deg, #fbcfe8, #a5f3fc, #fde68a) 1',
                    }}
                  />

                  {/* Featured star */}
                  {item.isFeatured && itemIdx < 3 && (
                    <SparkleStar className="text-yellow-300 -top-1 -right-1 z-10" size="sm" delay={itemIdx * 0.2} />
                  )}

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
                      <div className="w-full h-full bg-gradient-to-br from-blue-800/30 to-cyan-900/30 flex items-center justify-center">
                        <span className="text-5xl group-hover:scale-110 transition-transform">🥐</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Badges */}
                    {item.isFeatured && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                        ⭐ Popular
                      </div>
                    )}
                    {isCakeItem(item) && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-pink-400 to-rose-400 text-white text-xs font-bold rounded-full shadow-lg">
                        🎂 Personaliza
                      </div>
                    )}

                    {/* Quick Add - Always enabled for bakery */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isCakeItem(item)) handleAddToCart(item, 1);
                      }}
                      className="absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg transition-all bg-gradient-to-r from-blue-400 to-cyan-400 text-white hover:scale-110 hover:shadow-cyan-500/50 active:scale-95"
                    >
                      +
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">{item.name}</h3>
                    <p className="text-blue-200/50 text-xs line-clamp-2 mb-2 min-h-[2rem]">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {section.items.filter(item => item.available).length === 0 && (
              <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-5xl mb-4 block">🥐</span>
                <p className="text-blue-200/60 text-lg">Proximamente mas productos...</p>
              </div>
            )}
          </section>
        ))}

        {/* Empty Menu State */}
        {sections.length === 0 && activeView === 'menu' && (
          <div className="text-center py-24 relative">
            <SparkleStar className="text-cyan-300 top-0 left-1/4" size="lg" delay={0} />
            <SparkleStar className="text-pink-300 top-4 right-1/4" size="md" delay={0.5} />
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center ring-4 ring-white/10">
              <span className="text-6xl">🥐</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Preparando el Menu</h2>
            <p className="text-blue-200/70 max-w-md mx-auto text-lg">
              Estamos horneando nuestros productos frescos. Vuelve pronto para ver nuestro menu completo.
            </p>
            <Link
              href="/order"
              className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-blue-500/30 transition-all text-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Ver Menu de La Poblanita
            </Link>
          </div>
        )}
      </main>

      {/* Footer with Pastel Accents */}
      <footer className="relative z-10 border-t border-blue-900/30 bg-gradient-to-b from-slate-900/80 to-slate-950 py-12">
        <CakeDecorationDivider variant="dots" />
        <div className="mx-auto max-w-6xl px-6 text-center relative">
          <SparkleStar className="text-cyan-300 left-1/4 top-0" size="md" delay={0} />
          <SparkleStar className="text-pink-300 right-1/4 top-4" size="sm" delay={0.5} />

          <div className="flex items-center justify-center gap-3 mb-4">
            {elHornitoTenant.logoUrl ? (
              <Image
                src={elHornitoTenant.logoUrl}
                alt={elHornitoTenant.name}
                width={48}
                height={48}
                className="rounded-full ring-2 ring-blue-400/50"
                unoptimized
              />
            ) : (
              <span className="text-3xl">🥐</span>
            )}
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 bg-clip-text text-transparent">
              El Hornito
            </span>
          </div>
          <p className="text-blue-200/50 text-sm mb-2">
            Panaderia Mexicana Artesanal
          </p>
          <p className="text-blue-200/30 text-xs mb-6">
            Parte de La Poblanita Mexican Food
          </p>
          <Link href="/order" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
            ← Regresar al menu principal
          </Link>
        </div>
      </footer>

      {/* Item Modal */}
      {showItemModal && selectedItem && mounted && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          onClick={() => { setShowItemModal(false); setItemQuantity(1); }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '2px solid rgba(148,163,184,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative h-56 sm:h-72">
              {selectedItem.image ? (
                <Image
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-800/50 to-cyan-900/50 flex items-center justify-center text-8xl">
                  🥐
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              <button
                onClick={() => { setShowItemModal(false); setItemQuantity(1); }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-all"
              >
                ✕
              </button>
              {selectedItem.isFeatured && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-sm font-bold rounded-full shadow-lg">
                  ⭐ Popular
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-2xl font-bold text-white mb-2">{selectedItem.name}</h3>
              <p className="text-blue-200/70 mb-6">{selectedItem.description}</p>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-blue-200/60">Cantidad:</span>
                <div className="flex items-center gap-4 bg-white/10 rounded-full px-2 py-1">
                  <button
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-xl text-white transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold text-white w-8 text-center">{itemQuantity}</span>
                  <button
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-xl text-white transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-200/60 text-sm">Total:</span>
                  <span className="text-3xl font-bold text-cyan-400 ml-2">
                    ${(selectedItem.price * itemQuantity).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => handleAddToCart(selectedItem, itemQuantity)}
                  className="px-8 py-4 rounded-full font-bold text-lg transition-all bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-cyan-500/40 hover:scale-105 active:scale-95"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Cake Builder Modal - iPhone Optimized with full-bleed gradient */}
      {showCakeBuilder && mounted && createPortal(
        <div
          className="fixed inset-0 z-[200] overflow-hidden"
          style={{ touchAction: 'none' }}
          onClick={() => { setShowCakeBuilder(false); setCakeStep(0); setCakeHeaderCollapsed(false); }}
        >
          {/* Background - gradient at top, dark below - blocks all touch events */}
          <div className="absolute inset-0" style={{ touchAction: 'none' }}>
            {/* Gradient extends from top through header area on mobile */}
            <div
              className="absolute inset-x-0 top-0 sm:hidden transition-all duration-300"
              style={{
                height: cakeHeaderCollapsed ? 'calc(env(safe-area-inset-top, 47px) + 80px)' : 'calc(env(safe-area-inset-top, 47px) + 160px)',
                background: 'linear-gradient(to right, #ec4899, #06b6d4, #f59e0b)',
              }}
            />
            {/* Dark background for rest */}
            <div className="absolute inset-0 bg-slate-950" />
          </div>

          {/* Modal Container - respects safe areas, isolates scroll */}
          <div
            className="relative flex flex-col w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:mx-auto sm:my-auto sm:rounded-3xl overflow-hidden shadow-2xl"
            style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Pastel border effect on desktop */}
            <div className="hidden sm:block absolute inset-0 rounded-3xl pointer-events-none" style={{
              border: '3px solid transparent',
              background: 'linear-gradient(135deg, #1e293b, #0f172a) padding-box, linear-gradient(135deg, #fbcfe8, #a5f3fc, #fde68a) border-box',
            }} />

            {/* Header - Compact gradient bar with collapse animation */}
            <div
              className="relative flex-shrink-0 text-center transition-all duration-300"
              style={{
                background: 'linear-gradient(to right, #ec4899, #06b6d4, #f59e0b)',
                paddingTop: 'env(safe-area-inset-top, 0px)',
              }}
            >
              <div className={`px-4 transition-all duration-300 ${cakeHeaderCollapsed ? 'py-2' : 'py-3'} sm:p-4`}>
                {/* Close button */}
                <button
                  onClick={() => { setShowCakeBuilder(false); setCakeStep(0); setCakeHeaderCollapsed(false); }}
                  className="absolute right-3 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white text-lg font-bold hover:bg-black/60 active:scale-95 transition-all z-10"
                  style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
                >
                  ✕
                </button>

                {/* Collapsible title area */}
                <div className={`transition-all duration-300 overflow-hidden ${cakeHeaderCollapsed ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
                  <span className="text-2xl mb-1 block">🎂</span>
                  <h3 className="text-lg font-bold text-white">Crea Tu Pastel</h3>
                </div>

                {/* Progress Steps - Always visible, compact */}
                <div className={`flex justify-center gap-1.5 overflow-x-auto scrollbar-hide transition-all duration-300 ${cakeHeaderCollapsed ? 'mt-0' : 'mt-2'}`}>
                  {['Tamano', 'Sabor', 'Deco', 'Agenda'].map((step, idx) => (
                    <button
                      key={step}
                      onClick={() => setCakeStep(idx)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 min-h-[36px] ${
                        cakeStep === idx
                          ? 'bg-white text-pink-600 shadow-lg'
                          : cakeStep > idx
                          ? 'bg-white/40 text-white'
                          : 'bg-white/20 text-white/70'
                      }`}
                    >
                      {idx + 1}. {step}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable Content Area - Isolated scroll container */}
            <div
              className="flex-1 overflow-y-auto p-4 sm:p-6 pb-6"
              onScroll={(e) => {
                const scrollTop = (e.target as HTMLDivElement).scrollTop;
                setCakeHeaderCollapsed(scrollTop > 30);
              }}
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              }}
            >
              {/* Step 1: Size & Layers */}
              {cakeStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-3 text-lg">Tamano del Pastel</label>
                    <div className="grid grid-cols-2 gap-3">
                      {CAKE_SIZES.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setCakeOrder(prev => ({ ...prev, size: size.id }))}
                          className={`p-4 rounded-2xl text-left transition-all active:scale-[0.97] min-h-[100px] ${
                            cakeOrder.size === size.id
                              ? 'text-white shadow-lg shadow-pink-500/30 ring-2 ring-white/30'
                              : 'bg-white/10 text-blue-100 hover:bg-white/20 border border-white/20'
                          }`}
                          style={cakeOrder.size === size.id ? {
                            background: 'linear-gradient(135deg, #ec4899, #f97316)',
                          } : {}}
                        >
                          <div className="text-2xl mb-1">{size.icon}</div>
                          <div className="font-bold text-base">{size.name}</div>
                          <div className="text-sm opacity-80">{size.serves} personas</div>
                          <div className="text-base font-bold mt-1">${size.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3 text-lg">Numero de Capas</label>
                    <div className="flex items-center gap-5 bg-white/10 rounded-2xl p-4">
                      <button
                        onClick={() => setCakeOrder(prev => ({ ...prev, layers: Math.max(1, prev.layers - 1) }))}
                        className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 active:scale-95 text-white text-3xl font-bold transition-all flex items-center justify-center"
                      >
                        −
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-4xl font-bold text-white">{cakeOrder.layers}</span>
                        <span className="text-blue-200/60 ml-2 text-base">capas</span>
                      </div>
                      <button
                        onClick={() => setCakeOrder(prev => ({ ...prev, layers: Math.min(5, prev.layers + 1) }))}
                        className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 active:scale-95 text-white text-3xl font-bold transition-all flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    {cakeOrder.layers > 2 && (
                      <p className="text-pink-400 text-sm mt-3">+${(cakeOrder.layers - 2) * 20} por capas adicionales</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Flavor, Filling, Frosting */}
              {cakeStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-3 text-lg">Sabor del Bizcocho</label>
                    <div className="grid grid-cols-2 gap-3">
                      {CAKE_FLAVORS.map((flavor) => (
                        <button
                          key={flavor.id}
                          onClick={() => setCakeOrder(prev => ({ ...prev, flavor: flavor.id }))}
                          className={`p-4 rounded-2xl text-left transition-all flex items-center gap-3 min-h-[60px] active:scale-[0.97] ${
                            cakeOrder.flavor === flavor.id
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg ring-2 ring-white/30'
                              : 'bg-white/10 text-blue-100 hover:bg-white/20 border border-white/20'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full border-2 border-white/30 flex-shrink-0" style={{ backgroundColor: flavor.color }} />
                          <div className="flex-1">
                            <div className="font-semibold text-base">{flavor.name}</div>
                            {flavor.price > 0 && <div className="text-sm opacity-80">+${flavor.price}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3 text-lg">Relleno</label>
                    <div className="grid grid-cols-2 gap-3">
                      {CAKE_FILLINGS.map((filling) => (
                        <button
                          key={filling.id}
                          onClick={() => setCakeOrder(prev => ({ ...prev, filling: filling.id }))}
                          className={`p-4 rounded-2xl text-left transition-all min-h-[60px] active:scale-[0.97] ${
                            cakeOrder.filling === filling.id
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg ring-2 ring-white/30'
                              : 'bg-white/10 text-blue-100 hover:bg-white/20 border border-white/20'
                          }`}
                        >
                          <div className="font-semibold text-base">{filling.name}</div>
                          {filling.price > 0 && <div className="text-sm opacity-80">+${filling.price}</div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3 text-lg">Cobertura</label>
                    <div className="grid grid-cols-2 gap-3">
                      {CAKE_FROSTINGS.map((frosting) => (
                        <button
                          key={frosting.id}
                          onClick={() => setCakeOrder(prev => ({ ...prev, frosting: frosting.id }))}
                          className={`p-4 rounded-2xl text-left transition-all min-h-[60px] active:scale-[0.97] ${
                            cakeOrder.frosting === frosting.id
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg ring-2 ring-white/30'
                              : 'bg-white/10 text-blue-100 hover:bg-white/20 border border-white/20'
                          }`}
                        >
                          <div className="font-semibold text-base">{frosting.name}</div>
                          {frosting.price > 0 && <div className="text-sm opacity-80">+${frosting.price}</div>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Decorations & Message */}
              {cakeStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-3 text-lg">Decoraciones (opcional)</label>
                    <div className="grid grid-cols-2 gap-3">
                      {CAKE_DECORATIONS.map((dec) => (
                        <button
                          key={dec.id}
                          onClick={() => {
                            setCakeOrder(prev => ({
                              ...prev,
                              decorations: prev.decorations.includes(dec.id)
                                ? prev.decorations.filter(d => d !== dec.id)
                                : [...prev.decorations, dec.id]
                            }));
                          }}
                          className={`p-4 rounded-2xl text-left transition-all flex items-center gap-3 min-h-[60px] active:scale-[0.97] ${
                            cakeOrder.decorations.includes(dec.id)
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg ring-2 ring-white/30'
                              : 'bg-white/10 text-blue-100 hover:bg-white/20 border border-white/20'
                          }`}
                        >
                          <span className="text-2xl">{dec.icon}</span>
                          <div className="flex-1">
                            <div className="font-semibold text-base">{dec.name}</div>
                            <div className="text-sm opacity-80">+${dec.price}</div>
                          </div>
                          {cakeOrder.decorations.includes(dec.id) && <span className="text-xl">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3 text-lg">Mensaje en el Pastel</label>
                    <input
                      type="text"
                      value={cakeOrder.message}
                      onChange={(e) => setCakeOrder(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Ej: Feliz Cumpleanos Maria!"
                      maxLength={50}
                      className="w-full px-4 py-4 rounded-2xl bg-white/10 text-white text-base placeholder-white/40 border border-white/20 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                    />
                    <p className="text-white/40 text-sm mt-2">{cakeOrder.message.length}/50 caracteres</p>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3 text-lg">Instrucciones Especiales</label>
                    <textarea
                      value={cakeOrder.specialInstructions}
                      onChange={(e) => setCakeOrder(prev => ({ ...prev, specialInstructions: e.target.value }))}
                      placeholder="Alergias, preferencias especiales, etc."
                      rows={3}
                      className="w-full px-4 py-4 rounded-2xl bg-white/10 text-white text-base placeholder-white/40 border border-white/20 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Scheduling & Contact */}
              {cakeStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-pink-500/10 border border-pink-500/30 rounded-2xl p-4">
                    <p className="text-pink-200 text-base">
                      <strong>Importante:</strong> Los pasteles personalizados requieren minimo 2 dias de anticipacion.
                      Se requiere un deposito del 50% para confirmar el pedido.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-3 text-base">Fecha de Recogida</label>
                      <input
                        type="date"
                        value={cakeOrder.pickupDate}
                        min={minCakeDate}
                        onChange={(e) => setCakeOrder(prev => ({ ...prev, pickupDate: e.target.value }))}
                        className="w-full px-4 py-4 rounded-2xl bg-white/10 text-white text-base border border-white/20 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-3 text-base">Hora de Recogida</label>
                      <select
                        value={cakeOrder.pickupTime}
                        onChange={(e) => setCakeOrder(prev => ({ ...prev, pickupTime: e.target.value }))}
                        className="w-full px-4 py-4 rounded-2xl bg-white/10 text-white text-base border border-white/20 focus:border-cyan-400 focus:outline-none"
                      >
                        <option value="">Seleccionar hora</option>
                        {TIME_SLOTS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3 text-base">Tu Nombre</label>
                    <input
                      type="text"
                      value={cakeOrder.customerName}
                      onChange={(e) => setCakeOrder(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Nombre completo"
                      className="w-full px-4 py-4 rounded-2xl bg-white/10 text-white text-base placeholder-white/40 border border-white/20 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-3 text-base">Telefono</label>
                      <input
                        type="tel"
                        value={cakeOrder.customerPhone}
                        onChange={(e) => setCakeOrder(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-4 rounded-2xl bg-white/10 text-white text-base placeholder-white/40 border border-white/20 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-3 text-base">Email</label>
                      <input
                        type="email"
                        value={cakeOrder.customerEmail}
                        onChange={(e) => setCakeOrder(prev => ({ ...prev, customerEmail: e.target.value }))}
                        placeholder="tu@email.com"
                        className="w-full px-4 py-4 rounded-2xl bg-white/10 text-white text-base placeholder-white/40 border border-white/20 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Total & Actions - Fixed at bottom with safe area */}
            <div
              className="flex-shrink-0 border-t border-white/10 bg-slate-900"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-blue-200/60 text-sm">Total del Pastel:</span>
                    <div className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-cyan-400 to-amber-400 bg-clip-text text-transparent">${calculateCakeTotal().toFixed(2)}</div>
                    <span className="text-pink-300/60 text-sm">Deposito requerido: ${cakeDeposit.toFixed(2)} (50%)</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {cakeStep > 0 && (
                    <button
                      onClick={() => setCakeStep(prev => prev - 1)}
                      className="flex-1 py-4 rounded-2xl font-bold text-base bg-white/15 text-white hover:bg-white/25 active:scale-[0.97] transition-all min-h-[56px]"
                    >
                      ← Anterior
                    </button>
                  )}
                  {cakeStep < 3 ? (
                    <button
                      onClick={() => setCakeStep(prev => prev + 1)}
                      className="flex-1 py-4 rounded-2xl font-bold text-lg text-white hover:shadow-lg active:scale-[0.97] transition-all min-h-[56px]"
                      style={{ background: 'linear-gradient(135deg, #ec4899, #06b6d4, #f59e0b)' }}
                    >
                      Siguiente →
                    </button>
                  ) : (
                    <button
                      onClick={handleAddCakeToCart}
                      disabled={!cakeOrder.pickupDate || !cakeOrder.pickupTime || !cakeOrder.customerName || !cakeOrder.customerPhone}
                      className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.97] min-h-[56px] ${
                        cakeOrder.pickupDate && cakeOrder.pickupTime && cakeOrder.customerName && cakeOrder.customerPhone
                          ? 'text-white hover:shadow-lg shadow-pink-500/30'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                      style={cakeOrder.pickupDate && cakeOrder.pickupTime && cakeOrder.customerName && cakeOrder.customerPhone ? {
                        background: 'linear-gradient(135deg, #ec4899, #06b6d4, #f59e0b)',
                      } : {}}
                    >
                      🎂 Agregar al Carrito
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bundle Builder Modal */}
      {showBundleBuilder && mounted && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto py-4"
          onClick={() => { setShowBundleBuilder(false); setSelectedBundle(null); setBundleItems([]); }}
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          <div
            className="relative w-full max-w-2xl max-h-[95vh] rounded-3xl overflow-hidden shadow-2xl mx-4"
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '3px solid',
              borderImage: 'linear-gradient(135deg, #a5f3fc, #fde68a, #a5f3fc) 1',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-cyan-500 via-amber-400 to-cyan-500 p-6 text-center">
              <button
                onClick={() => { setShowBundleBuilder(false); setSelectedBundle(null); setBundleItems([]); }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-all"
              >
                ✕
              </button>
              <span className="text-5xl mb-2 block">📦</span>
              <h3 className="text-2xl font-bold text-white">Arma Tu Caja</h3>
              <p className="text-white/80 text-sm mt-1">Escoge tu paquete y llena con tus favoritos</p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[55vh]">
              {/* Bundle Selection */}
              {!selectedBundle ? (
                <div className="space-y-4">
                  <label className="block text-white font-semibold mb-3 text-lg">Selecciona tu Paquete</label>
                  <div className="grid grid-cols-2 gap-4">
                    {BUNDLES.map((bundle) => (
                      <button
                        key={bundle.id}
                        onClick={() => setSelectedBundle(bundle)}
                        className="p-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-cyan-400/50 transition-all text-left group"
                      >
                        <span className="text-4xl mb-3 block">{bundle.icon}</span>
                        <h4 className="text-xl font-bold text-white mb-1">{bundle.name}</h4>
                        <p className="text-cyan-200/70 text-sm mb-2">{bundle.count} piezas</p>
                        <div className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm font-bold rounded-full">
                          {Math.round(bundle.discount * 100)}% descuento
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Bundle Info */}
                  <div className="flex items-center justify-between bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/30">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{selectedBundle.icon}</span>
                      <div>
                        <h4 className="font-bold text-white">{selectedBundle.name}</h4>
                        <p className="text-cyan-200/70 text-sm">{bundleItemCount}/{selectedBundle.count} seleccionados</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedBundle(null); setBundleItems([]); }}
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                    >
                      Cambiar
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, (bundleItemCount / selectedBundle.count) * 100)}%` }}
                    />
                  </div>

                  {/* Item Selection Grid */}
                  <label className="block text-white font-semibold mb-2 text-lg">Escoge tus piezas</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto">
                    {panDulceItems.map((item) => {
                      const existing = bundleItems.find(b => b.item.id === item.id);
                      const qty = existing?.quantity || 0;

                      return (
                        <div key={item.id} className="relative">
                          <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900 mb-2">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl">🥐</div>
                            )}
                          </div>
                          <p className="text-white text-xs font-medium line-clamp-1 mb-1">{item.name}</p>
                          <p className="text-cyan-400 text-xs font-bold">${item.price.toFixed(2)}</p>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-center gap-1 mt-2">
                            <button
                              onClick={() => {
                                if (qty > 0) {
                                  if (qty === 1) {
                                    setBundleItems(prev => prev.filter(b => b.item.id !== item.id));
                                  } else {
                                    setBundleItems(prev => prev.map(b =>
                                      b.item.id === item.id ? { ...b, quantity: b.quantity - 1 } : b
                                    ));
                                  }
                                }
                              }}
                              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-white font-bold text-sm">{qty}</span>
                            <button
                              onClick={() => {
                                if (bundleItemCount < selectedBundle.count) {
                                  if (existing) {
                                    setBundleItems(prev => prev.map(b =>
                                      b.item.id === item.id ? { ...b, quantity: b.quantity + 1 } : b
                                    ));
                                  } else {
                                    setBundleItems(prev => [...prev, { item, quantity: 1 }]);
                                  }
                                }
                              }}
                              disabled={bundleItemCount >= selectedBundle.count}
                              className={`w-7 h-7 rounded-full text-sm transition-colors ${
                                bundleItemCount >= selectedBundle.count
                                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                  : 'bg-cyan-500 hover:bg-cyan-400 text-white'
                              }`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedBundle && (
              <div className="p-6 border-t border-white/10 bg-slate-900/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-blue-200/60 text-sm">Total con {Math.round(selectedBundle.discount * 100)}% desc:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-200/40 line-through text-lg">
                        ${bundleItems.reduce((sum, { item, quantity }) => sum + item.price * quantity, 0).toFixed(2)}
                      </span>
                      <span className="text-3xl font-bold text-cyan-400">${calculateBundleTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddBundleToCart}
                  disabled={!isOpen || bundleItemCount !== selectedBundle.count}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    isOpen && bundleItemCount === selectedBundle.count
                      ? 'bg-gradient-to-r from-cyan-500 to-amber-400 text-white hover:shadow-lg hover:shadow-cyan-500/40'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {bundleItemCount !== selectedBundle.count
                    ? `Faltan ${selectedBundle.count - bundleItemCount} piezas`
                    : '📦 Agregar al Carrito'
                  }
                </button>
              </div>
            )}
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
        className="fixed bottom-6 right-4 z-50 sm:hidden w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #3b82f6 100%)',
          boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4)',
        }}
      >
        <span className="text-2xl">🛒</span>
        {cart.items.length > 0 && (
          <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-rose-500 text-white text-sm font-bold flex items-center justify-center shadow-lg">
            {cart.items.length}
          </span>
        )}
      </button>

      {/* === UNIFIED MOBILE NAVIGATION DRAWER === */}
      {showMobileNav && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] animate-fade-in"
            onClick={() => setShowMobileNav(false)}
          />

          {/* Drawer Panel */}
          <div
            className="fixed top-0 left-0 bottom-0 w-[300px] max-w-[85vw] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-white/10 shadow-2xl z-[9999] animate-slide-in-left overflow-y-auto"
          >
            {/* Header with Gradient */}
            <div className="relative p-5 border-b border-white/10" style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(6,182,212,0.15) 50%, transparent 100%)',
            }}>
              {/* Close Button */}
              <button
                onClick={() => setShowMobileNav(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"
              >
                ✕
              </button>

              {/* Current Business Logo */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-500 p-1 shadow-lg shadow-cyan-500/30">
                  {elHornitoTenant.logoUrl ? (
                    <Image
                      src={elHornitoTenant.logoUrl}
                      alt={elHornitoTenant.name}
                      width={52}
                      height={52}
                      className="rounded-full object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-2xl">
                      🥐
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-lg text-white">El Hornito</h2>
                  <p className="text-xs text-cyan-300/70">Panaderia Mexicana</p>
                </div>
              </div>

              {/* Sparkle decoration */}
              <div className="absolute top-3 left-1/2 text-yellow-300 text-sm animate-pulse">✦</div>
            </div>

            {/* Bakery Navigation */}
            <div className="p-4 space-y-2">
              <p className="text-xs uppercase tracking-widest text-cyan-300/50 mb-3 flex items-center gap-2">
                <span>🥐</span> Panaderia
              </p>

              <button
                onClick={() => { setShowMobileNav(false); setActiveView('menu'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white border border-transparent hover:bg-white/5 hover:border-pink-500/30 transition-all"
              >
                <span className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-xl">🥐</span>
                <div>
                  <span className="font-medium">Pan Dulce</span>
                  <p className="text-xs text-white/50">Ver todo el menu</p>
                </div>
              </button>

              <button
                onClick={() => { setShowMobileNav(false); setActiveView('cakes'); setShowCakeBuilder(true); }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white border border-transparent hover:bg-white/5 hover:border-cyan-500/30 transition-all"
              >
                <span className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-xl">🎂</span>
                <div>
                  <span className="font-medium">Pasteles Custom</span>
                  <p className="text-xs text-white/50">Crea tu pastel perfecto</p>
                </div>
              </button>

              <button
                onClick={() => { setShowMobileNav(false); setActiveView('bundles'); setShowBundleBuilder(true); }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white border border-transparent hover:bg-white/5 hover:border-amber-500/30 transition-all"
              >
                <span className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl">📦</span>
                <div>
                  <span className="font-medium">Por Docena</span>
                  <p className="text-xs text-white/50">Descuentos especiales</p>
                </div>
              </button>
            </div>

            {/* Divider with stars */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="text-yellow-300 text-sm animate-pulse">✦</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* La Poblanita Restaurant Link */}
            <div className="p-4">
              <p className="text-xs uppercase tracking-widest text-red-400/50 mb-3 flex items-center gap-2">
                <span>🍽️</span> Restaurante
              </p>

              <a
                href="/order"
                onClick={(e) => {
                  e.preventDefault();
                  setShowMobileNav(false);
                  router.push('/order');
                }}
                className="block w-full rounded-2xl overflow-hidden border-2 border-red-500/30 hover:border-red-400/50 transition-all relative group"
                style={{
                  background: 'linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(15,23,42,0.95) 50%, rgba(220,38,38,0.1) 100%)',
                }}
              >
                {/* Sparkle */}
                <div className="absolute top-2 right-3 text-amber-300 text-xs animate-pulse">✦</div>

                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 via-amber-500 to-red-500 p-1 shadow-lg shadow-red-500/30">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-2xl">
                        🍽️
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">La Poblanita</h3>
                      <p className="text-xs text-red-300/60">Mexican Food</p>
                      <div className="flex gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 text-[9px] font-medium bg-red-500/20 text-red-300 rounded-full">🌮 Tacos</span>
                        <span className="px-2 py-0.5 text-[9px] font-medium bg-amber-500/20 text-amber-300 rounded-full">🍲 Platos</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-amber-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      →
                    </div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-red-500 via-amber-400 to-red-500" />
              </a>

              {/* Shared Cart Indicator */}
              {cart.items.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛒</span>
                      <span className="text-sm text-white/70">Carrito compartido</span>
                    </div>
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-full">
                      {cart.items.length} items
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">El mismo carrito funciona en ambos negocios</p>
                </div>
              )}
            </div>

            {/* Menu Sections Quick Links */}
            {sections.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs uppercase tracking-widest text-white/30 mb-3">Secciones</p>
                <div className="grid grid-cols-2 gap-2">
                  {sections.slice(0, 6).map((section) => (
                    <button
                      key={section.id}
                      onClick={() => { setShowMobileNav(false); scrollToSection(section.id); }}
                      className="px-3 py-2 rounded-lg text-xs font-medium text-white/70 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400/30 transition-all text-left truncate"
                    >
                      {section.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom padding */}
            <div className="h-20" />
          </div>
        </>,
        document.body
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          25% { opacity: 0.8; transform: scale(1.2) rotate(5deg); }
          50% { opacity: 0.6; transform: scale(0.9) rotate(-5deg); }
          75% { opacity: 0.9; transform: scale(1.1) rotate(3deg); }
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// Re-export types
export type { BakeryMenuSection as OrderMenuSection, BakeryMenuItem as OrderMenuItem };
