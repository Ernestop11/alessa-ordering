/**
 * OrderPageClient - Main Order Page Component
 *
 * REAL-TIME RESTAURANT STATUS SYSTEM (2025-12-14)
 * ================================================
 * This component implements real-time sync between the admin "Accepting Orders"
 * toggle and the frontend ordering UI.
 *
 * HOW IT WORKS:
 * 1. Frontend polls /api/restaurant-status every 10 seconds
 * 2. API checks both `isOpen` flag AND operating hours schedule
 * 3. API uses lib/hours-validator.ts for timezone-aware validation
 *    (VPS runs UTC, restaurant uses America/Los_Angeles)
 * 4. When closed, both "Add to Cart" buttons are disabled with notification
 *
 * KEY STATE:
 * - restaurantIsOpen: boolean - Current open/closed status
 * - restaurantClosedMessage: string - Message to show when closed
 *
 * CART BUTTON PROTECTION:
 * - handleAddToCart: Quick add (+) button and "Quick Add" text button
 * - openCustomization: "ADD TO ORDER" button that opens customization modal
 * Both check restaurantIsOpen before proceeding.
 *
 * RELATED FILES:
 * - /api/restaurant-status/route.ts - Status polling endpoint
 * - /lib/hours-validator.ts - Timezone-aware hours validation
 * - TenantSettings.operatingHours - Store hours configuration
 * - TenantSettings.isOpen - Manual toggle flag
 * - TenantSettings.timeZone - Restaurant timezone (default: America/Los_Angeles)
 */
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getStockImageForCategory, cycleFallbackImage } from '../../lib/menu-imagery';
import { useCart } from '../../lib/store/cart';
import { getTenantAssets } from '../../lib/tenant-assets';
import { useTenantTheme } from '../TenantThemeProvider';
import FeaturedCarousel from './FeaturedCarousel';
import CartLauncher from '../CartLauncher';
import RewardsModal from './RewardsModal';
import JoinRewardsModal from './JoinRewardsModal';
import ReorderModal from './ReorderModal';
import MenuSectionGrid from './MenuSectionGrid';
import MobileNavDrawer from './MobileNavDrawer';
import { isTimeSpecificActive, getTimeSpecificPrice, getTimeSpecificLabel, shouldShowItem } from '../../lib/menu-time-specific';
import { generateCSSVariables, generatePageStyles, generatePatternStyles, getAnimationClass, type TemplateSettings } from '@/lib/template-renderer';

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

interface CateringTabConfig {
  enabled: boolean;
  label: string;
  icon?: string;
  description?: string;
  modalTagline?: string;
  modalHeading?: string;
}

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
  customizationAddons?: CustomizationOption[];
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

interface FrontendUISection {
  id: string;
  name: string;
  type: 'hero' | 'quickInfo' | 'featuredCarousel' | 'menuSections' | 'promoBanner1' | 'groceryBanner' | 'panaderiaBanner' | 'weCookBanner' | 'dealStrip' | 'qualityBanner' | 'reviewsStrip' | 'weekendSpecials' | 'bundles' | 'aisles' | 'dailyFresh' | 'boxBuilder' | 'categories';
  position: number;
  enabled: boolean;
  content: {
    title?: string;
    subtitle?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    image?: string;
    badge?: string;
    backgroundColor?: string;
    textColor?: string;
    gradientFrom?: string;
    gradientTo?: string;
  };
}

interface OrderPageClientProps {
  sections: OrderMenuSection[];
  featuredItems?: OrderMenuItem[];
  tenantSlug: string;
  cateringTabConfig?: CateringTabConfig;
  cateringPackages?: CateringPackage[];
  rewardsData?: RewardsData;
  customerRewardsData?: CustomerRewardsData | null;
  isOpen?: boolean;
  closedMessage?: string;
  frontendConfig?: {
    featuredCarousel?: {
      title?: string;
      subtitle?: string;
    };
  };
  frontendUISections?: FrontendUISection[];
  enabledAddOns?: string[];
  templateSettings?: TemplateSettings;
  isPreview?: boolean;
}

type LayoutView = 'grid' | 'list' | 'cards';

interface HighlightCard {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  image: string;
  category: string;
}

interface CustomizationConfig {
  removals: string[];
  addons: CustomizationOption[];
}

type CustomModalState = {
  item: OrderMenuItem & { displayImage: string; sectionType: string };
  config: CustomizationConfig;
};

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

const DEFAULT_ACCESSIBILITY_STATE = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
};

const DEFAULT_CUSTOMIZATION: CustomizationConfig = {
  removals: ['No cilantro', 'No onions', 'No salsa'],
  addons: [
    { id: 'extra_guac', label: 'Extra guacamole (+$0.75)', price: 0.75 },
    { id: 'extra_cheese', label: 'Extra cheese (+$0.50)', price: 0.5 },
    { id: 'extra_salsa', label: 'Side of salsa (+$0.35)', price: 0.35 },
  ],
};

const CUSTOMIZATION_LIBRARY: Record<string, CustomizationConfig> = {
  tacos: DEFAULT_CUSTOMIZATION,
  plates: {
    removals: ['No rice', 'No beans', 'No onions'],
    addons: [
      { id: 'extra_tortillas', label: 'Extra tortillas (+$0.60)', price: 0.6 },
      { id: 'side_guac', label: 'Side of guacamole (+$1.25)', price: 1.25 },
    ],
  },
  bakery: {
    removals: ['No powdered sugar', 'No cinnamon'],
    addons: [
      { id: 'cajeta_drizzle', label: 'Cajeta drizzle (+$0.50)', price: 0.5 },
      { id: 'vanilla_icecream', label: 'Vanilla ice cream (+$1.50)', price: 1.5 },
    ],
  },
  beverages: {
    removals: ['Less ice', 'No sugar'],
    addons: [
      { id: 'chamoy_rim', label: 'Chamoy rim (+$0.75)', price: 0.75 },
      { id: 'extra_cinnamon', label: 'Extra cinnamon (+$0.25)', price: 0.25 },
    ],
  },
  breakfast: {
    removals: ['No eggs', 'No crema'],
    addons: [
      { id: 'side_bacon', label: 'Side of bacon (+$1.80)', price: 1.8 },
      { id: 'extra_salsa_verde', label: 'Extra salsa verde (+$0.40)', price: 0.4 },
    ],
  },
};

function getEmojiForItem(item: OrderMenuItem, sectionType: string) {
  const key = item.category?.toLowerCase?.() || sectionType.toLowerCase();
  const match = Object.entries(CATEGORY_TO_EMOJI).find(([category]) => key.includes(category));
  if (match) return match[1];
  return SECTION_ICONS[sectionType] || '🍽️';
}

export default function OrderPageClient({
  sections,
  featuredItems = [],
  tenantSlug,
  cateringTabConfig = { enabled: false, label: 'Catering', icon: 'ChefHat', description: 'Full-service events, delivered' },
  cateringPackages: initialCateringPackages = [],
  rewardsData,
  customerRewardsData,
  isOpen = false, // Default to closed - server should always pass explicit value
  closedMessage,
  frontendConfig,
  frontendUISections: initialFrontendUISections = [],
  enabledAddOns: initialEnabledAddOns = [],
  templateSettings: initialTemplateSettings,
  isPreview = false,
}: OrderPageClientProps) {
  const searchParams = useSearchParams();
  const [templateSettings, setTemplateSettings] = useState<TemplateSettings | undefined>(initialTemplateSettings);
  const router = useRouter();
  const tenant = useTenantTheme();
  const assets = getTenantAssets(tenantSlug || tenant.slug);
  const { addToCart, items: cartItems } = useCart();
  const cartItemCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  // Client-side state for frontendUISections with polling (same pattern as Accept Orders)
  const [frontendUISections, setFrontendUISections] = useState<FrontendUISection[]>(initialFrontendUISections);

  // Client-side state for enabledAddOns (grocery, panaderia, catering, etc.)
  const [enabledAddOns, setEnabledAddOns] = useState<string[]>(initialEnabledAddOns);

  // Poll for frontend sections and enabledAddOns updates (every 10 seconds, like Accept Orders polls every 30s)
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch(`/api/frontend-ui-sections?format=full&t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
        if (res.ok) {
          const data = await res.json();
          // Handle full format response with sections and enabledAddOns
          if (data.sections && Array.isArray(data.sections)) {
            setFrontendUISections(data.sections);
          }
          if (data.enabledAddOns && Array.isArray(data.enabledAddOns)) {
            setEnabledAddOns(data.enabledAddOns);
          }
        }
      } catch (err) {
        // Silently fail - don't spam console
      }
    };

    // Initial fetch after mount
    const timeout = setTimeout(fetchSections, 2000);

    // Poll every 10 seconds
    const interval = setInterval(fetchSections, 10000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  // Poll for template settings updates in preview mode (every 3 seconds)
  useEffect(() => {
    if (!isPreview || !tenantSlug) return;

    const fetchTemplateSettings = async () => {
      try {
        const res = await fetch(`/api/preview/${tenantSlug}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setTemplateSettings(data.data);
          }
        }
      } catch (err) {
        // Silently fail in preview mode
      }
    };

    // Initial fetch immediately
    fetchTemplateSettings();

    // Poll every 3 seconds in preview mode
    const interval = setInterval(fetchTemplateSettings, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [isPreview, tenantSlug]);

  // Menu sections with real-time availability updates
  const [currentSections, setCurrentSections] = useState<OrderMenuSection[]>(sections);
  const safeSections = useMemo(() => Array.isArray(currentSections) ? currentSections : [], [currentSections]);
  const navSections = useMemo(() => {
    if (!Array.isArray(safeSections)) return [];
    return safeSections.filter((section) => section && Array.isArray(section.items) && section.items.length > 0);
  }, [safeSections]);
  // Initialize with a consistent default for SSR to prevent hydration mismatch
  // Client-side layout preference will be applied in useEffect after mount
  const [activeLayout, setActiveLayout] = useState<LayoutView>('grid');
  const [hasHydratedLayout, setHasHydratedLayout] = useState(false);

  // Apply stored/URL layout preference after hydration
  useEffect(() => {
    if (hasHydratedLayout) return;
    const paramView = searchParams.get('view') as LayoutView | null;
    let storedView: LayoutView | null = null;
    try {
      storedView = window.localStorage.getItem('alessa_view_mode') as LayoutView | null;
    } catch {
      // localStorage may be unavailable in private mode
    }
    let newLayout: LayoutView = 'grid';
    if (paramView && ['grid', 'list', 'cards'].includes(paramView)) {
      newLayout = paramView;
    } else if (storedView && ['grid', 'list', 'cards'].includes(storedView)) {
      newLayout = storedView;
    } else if (window.innerWidth < 768) {
      newLayout = 'cards';
    }
    setActiveLayout(newLayout);
    setHasHydratedLayout(true);
  }, [searchParams, hasHydratedLayout]);
  
  const [notification, setNotification] = useState('');

  const [isAccessibilityOpen, setAccessibilityOpen] = useState(false);
  const [accessibilityState, setAccessibilityState] = useState(DEFAULT_ACCESSIBILITY_STATE);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const motionReduced = prefersReducedMotion || accessibilityState.reducedMotion;
  const accessibilityStorageKey = useMemo(() => `alessa-accessibility-${tenant.slug}`, [tenant.slug]);
  const [hasHydratedAccessibility, setHasHydratedAccessibility] = useState(false);
  const skipPersistAccessibilityRef = useRef(false);
  const [customModal, setCustomModal] = useState<CustomModalState | null>(null);
  const [customRemovals, setCustomRemovals] = useState<string[]>([]);
  const [customAddons, setCustomAddons] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');
  const [customQuantity, setCustomQuantity] = useState(1);
  const [isRewardsOpen, setRewardsOpen] = useState(false);
  
  // Use server-side data as initial state, with client-side refresh for real-time updates
  // Declare this early so it can be used in useMemo hooks below
  const [cateringPackages, setCateringPackages] = useState<CateringPackage[]>(initialCateringPackages);

  // Restaurant open/closed status - can be updated in real-time
  const [restaurantIsOpen, setRestaurantIsOpen] = useState(isOpen);
  const [restaurantClosedMessage, setRestaurantClosedMessage] = useState(closedMessage || '');

  // Scroll state for sticky header shrinking
  const [isScrolled, setIsScrolled] = useState(false);

  // Featured items state - polls for real-time updates when admin changes carousel
  const [currentFeaturedItems, setCurrentFeaturedItems] = useState<OrderMenuItem[]>(featuredItems);

  // Hero images state - polls for real-time updates when admin changes hero section
  const [currentHeroImages, setCurrentHeroImages] = useState<string[]>(
    tenant.branding?.heroImages?.filter(Boolean) as string[] || []
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  // Scroll listener for sticky header shrinking
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('ada-contrast', accessibilityState.highContrast);
    root.classList.toggle('ada-mode', accessibilityState.largeText);
    root.classList.toggle('ada-reduced-motion', accessibilityState.reducedMotion);
  }, [accessibilityState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const defaults = tenant.accessibilityDefaults || {};
    try {
      const stored = window.localStorage.getItem(accessibilityStorageKey);
      const parsed = stored ? JSON.parse(stored) : {};
      setAccessibilityState((prev) => ({
        ...prev,
        ...defaults,
        ...parsed,
      }));
    } catch {
      setAccessibilityState((prev) => ({ ...prev, ...defaults }));
    } finally {
      setHasHydratedAccessibility(true);
    }
  }, [accessibilityStorageKey, tenant.accessibilityDefaults]);

  // Debounced URL update to prevent flashing in Safari
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateUrl = () => {
      const params = new URLSearchParams(window.location.search);
      if (activeLayout !== 'grid') {
        params.set('view', activeLayout);
      } else {
        params.delete('view');
      }
      // Remove category param since navigation bar was removed
      params.delete('category');
      if (tenantSlug) {
        params.set('tenant', tenantSlug);
      } else {
        params.delete('tenant');
      }
      const query = params.toString();
      const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;

      // Only update if URL actually changed to prevent unnecessary navigation
      if (newUrl !== window.location.pathname + window.location.search) {
        router.replace(newUrl, { scroll: false });
      }
    };

    // Debounce URL updates to prevent rapid changes that cause flashing
    const timeoutId = setTimeout(updateUrl, 300);
    return () => clearTimeout(timeoutId);
  }, [activeLayout, tenantSlug, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('alessa_view_mode', activeLayout);
    } catch {
      // localStorage may be unavailable in private mode - ignore
    }
  }, [activeLayout]);

  // Detect Safari for scroll optimization
  const isSafariBrowser = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  useEffect(() => {
    let canceled = false;
    const hydrateFromServer = async () => {
      try {
        const res = await fetch('/api/customer/preferences', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.accessibility || canceled) return;
        skipPersistAccessibilityRef.current = true;
        setAccessibilityState((prev) => ({
          ...prev,
          ...data.accessibility,
        }));
      } catch {
        // ignore
      }
    };

    hydrateFromServer();
    return () => {
      canceled = true;
    };
  }, [tenant.slug]);

  useEffect(() => {
    if (!hasHydratedAccessibility || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(accessibilityStorageKey, JSON.stringify(accessibilityState));
    } catch {
      // localStorage may be unavailable in private mode - ignore
    }
    if (skipPersistAccessibilityRef.current) {
      skipPersistAccessibilityRef.current = false;
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch('/api/customer/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessibility: accessibilityState }),
        signal: controller.signal,
      }).catch(() => undefined);
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [accessibilityState, accessibilityStorageKey, hasHydratedAccessibility]);

  const personality = useMemo(() => {
    const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);
    const heroTitle = tenant.heroTitle || tenant.name;
    const bestSeller = sections.flatMap((section) => section.items).at(0)?.name || 'House Favorite';

    return {
      totalItems,
      heroTitle,
      bestSeller,
    };
  }, [sections, tenant.heroTitle, tenant.name]);

  const flattenedMenuItems = useMemo(() => {
    if (!Array.isArray(sections)) return [];
    return sections.flatMap((section) => {
      if (!section || !Array.isArray(section.items)) return [];
      return section.items.map((item) => ({
        section,
        item,
      }));
    });
  }, [sections]);

  // Use server-side rewards data if available, otherwise fall back to tenant data or default
  const membershipProgram = rewardsData?.membershipProgram || tenant.membershipProgram || {
    enabled: true,
    pointsPerDollar: 10,
    heroCopy: 'Earn puntos with every order and unlock sweet rewards.',
    featuredMemberName: 'Gold Member',
    tiers: [
      {
        id: 'tier-1',
        name: 'Bronze',
        threshold: 0,
        rewardDescription: 'Welcome to the club!',
        perks: ['Earn points on every purchase', 'Monthly chef tips'],
        badgeColor: '#b45309',
      },
      {
        id: 'tier-2',
        name: 'Gold',
        threshold: 500,
        rewardDescription: 'Sweet treats and exclusive drops.',
        perks: ['Free dessert on birthdays', 'Priority support', 'Exclusive tastings'],
        badgeColor: '#d97706',
      },
    ],
  };
  const membershipTiers = useMemo(() => {
    if (!membershipProgram || !Array.isArray(membershipProgram.tiers)) return [];

    const extractOrderValue = (tier: any) => {
      if (tier && typeof tier.sortOrder === 'number') return tier.sortOrder;
      if (tier && typeof tier.threshold === 'number') return tier.threshold;
      return 0;
    };

    return [...membershipProgram.tiers].sort(
      (a, b) => extractOrderValue(a) - extractOrderValue(b),
    );
  }, [membershipProgram]);

  const membershipEnabled = membershipProgram?.enabled !== false; // Show even if no tiers yet
  const featuredTier = membershipTiers[membershipTiers.length - 1] ?? null;
  const upcomingTier = useMemo(() => {
    return membershipTiers.filter((tier) => (tier.threshold ?? 0) > 0)[0] ?? null;
  }, [membershipTiers]);
  const membershipPerks = useMemo(() => {
    const perks = membershipTiers.flatMap((tier) => tier.perks || []);
    if (perks.length === 0) {
      return [
        'Earn points on every order',
        'Unlock exclusive chef specials',
        'Celebrate with birthday treats',
        'Surprise drops for loyal members',
      ];
    }
    return perks.slice(0, 6);
  }, [membershipTiers]);

  const pointsPerDollar = Number(membershipProgram?.pointsPerDollar ?? 0);
  const menuUpsells = useMemo(() => {
    if (!Array.isArray(tenant.upsellBundles)) return [];
    return tenant.upsellBundles
      .filter((bundle) => !bundle.surfaces || bundle.surfaces.includes('menu'))
      .map((bundle, index) => ({
        ...bundle,
        price: Number(bundle.price ?? 0),
        image: bundle.image || cycleFallbackImage(index + 12),
      }));
  }, [tenant.upsellBundles]);

  const findCustomizationConfig = useCallback(
    (item: OrderMenuItem, sectionType: string): CustomizationConfig => {
      // If item has database-defined customization, use it
      if (item.customizationRemovals || item.customizationAddons) {
        return {
          removals: item.customizationRemovals || [],
          addons: item.customizationAddons || [],
        };
      }

      // Otherwise, fall back to hardcoded library
      const categoryKey = item.category?.toLowerCase?.() || '';
      const sectionKey = sectionType.toLowerCase();
      const sources: CustomizationConfig[] = [];
      if (CUSTOMIZATION_LIBRARY[categoryKey]) sources.push(CUSTOMIZATION_LIBRARY[categoryKey]);
      if (CUSTOMIZATION_LIBRARY[sectionKey]) sources.push(CUSTOMIZATION_LIBRARY[sectionKey]);
      if (sources.length === 0) sources.push(DEFAULT_CUSTOMIZATION);

      const removals = Array.from(new Set(sources.flatMap((cfg) => cfg.removals)));
      const seenAddonIds = new Set<string>();
      const addons: CustomizationOption[] = [];
      sources.forEach((cfg) => {
        cfg.addons.forEach((addon) => {
          if (!seenAddonIds.has(addon.id)) {
            seenAddonIds.add(addon.id);
            addons.push(addon);
          }
        });
      });

      return { removals, addons };
    },
    [],
  );

  const openCustomization = useCallback(
    (item: OrderMenuItem & { displayImage: string }, sectionType: string) => {
      // Check if restaurant is open before allowing customization
      if (!restaurantIsOpen) {
        // Use setNotification directly since showNotification is defined later
        setNotification(restaurantClosedMessage || 'We are currently closed. Please check back during our operating hours.');
        setTimeout(() => setNotification(''), 2200);
        return;
      }
      const config = findCustomizationConfig(item, sectionType);
      setCustomModal({
        item: { ...item, sectionType },
        config,
      });
      setCustomRemovals([]);
      setCustomAddons([]);
      setCustomNote('');
      setCustomQuantity(1);
    },
    [findCustomizationConfig, restaurantIsOpen, restaurantClosedMessage],
  );

  const closeCustomization = useCallback(() => {
    setCustomModal(null);
    setCustomRemovals([]);
    setCustomAddons([]);
    setCustomNote('');
    setCustomQuantity(1);
  }, []);

  const openHighlightCustomization = useCallback(
    (card: HighlightCard, sectionType: string = 'SPECIAL') => {
      // Convert HighlightCard to OrderMenuItem format
      const menuItem: OrderMenuItem & { displayImage: string } = {
        id: card.id,
        name: card.title,
        description: card.description,
        price: card.price,
        category: card.category || 'special',
        available: true,
        image: card.image,
        displayImage: card.image || '',
        tags: card.badge ? [card.badge] : [],
      };
      openCustomization(menuItem, sectionType);
    },
    [openCustomization],
  );

  const toggleRemoval = useCallback((removal: string) => {
    setCustomRemovals((prev) =>
      prev.includes(removal) ? prev.filter((item) => item !== removal) : [...prev, removal],
    );
  }, []);

  const toggleAddon = useCallback((addonId: string) => {
    setCustomAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId],
    );
  }, []);

  const selectedAddonObjects = useMemo(() => {
    if (!customModal) return [] as CustomizationOption[];
    return customModal.config.addons.filter((addon) => customAddons.includes(addon.id));
  }, [customAddons, customModal]);

  const addonUpcharge = useMemo(() => {
    return selectedAddonObjects.reduce((sum, addon) => sum + addon.price, 0);
  }, [selectedAddonObjects]);

  const perItemCustomizedPrice = customModal ? customModal.item.price + addonUpcharge : 0;
  const totalCustomizedPrice = perItemCustomizedPrice * customQuantity;

  const handleConfirmCustomization = useCallback(() => {
    if (!customModal) return;
    const addonPayload = selectedAddonObjects.map((addon) => ({
      id: addon.id,
      name: addon.label.replace(/\s*\(.*\)$/, ''),
      price: addon.price,
    }));

    const perItemRounded = Math.round(perItemCustomizedPrice * 100) / 100;

    addToCart({
      id: `${customModal.item.id}-${Date.now()}`,
      name: customModal.item.name,
      description: customModal.item.description,
      price: perItemRounded,
      quantity: customQuantity,
      image: customModal.item.displayImage,
      modifiers: customRemovals,
      addons: addonPayload,
      note: customNote || undefined,
    });

    setNotification(`Customized ${customModal.item.name} added to cart`);
    setTimeout(() => setNotification(''), 2200);
    closeCustomization();
  }, [addToCart, closeCustomization, customModal, customNote, customQuantity, customRemovals, perItemCustomizedPrice, selectedAddonObjects]);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const addressParts = useMemo(() => {
    const parts = [
      tenant.addressLine1,
      tenant.addressLine2,
      [tenant.city, tenant.state].filter(Boolean).join(', '),
      tenant.postalCode,
    ];
    return parts.filter(Boolean).join('\n');
  }, [tenant.addressLine1, tenant.addressLine2, tenant.city, tenant.state, tenant.postalCode]);

  const brandingHighlights = useMemo(() => tenant.branding?.highlights ?? [], [tenant.branding?.highlights]);
  const recommendedItems = useMemo(() => {
    // Use featured items from database if available (via real-time state), otherwise fall back to branding config
    if (Array.isArray(currentFeaturedItems) && currentFeaturedItems.length > 0) {
      return currentFeaturedItems.map((item) => {
        // Find the section for this item
        const matchingSection = safeSections.find(section =>
          section && Array.isArray(section.items) && section.items.some(sectionItem => sectionItem.id === item.id)
        );
        return {
          name: item.name,
          section: matchingSection,
          item,
        };
      });
    }

    // Fallback to branding config
    const names = Array.isArray(tenant.branding?.recommendedItems) ? tenant.branding.recommendedItems : [];
    if (names.length === 0) return [] as Array<{ name: string; section?: (typeof sections)[number]; item?: (typeof flattenedMenuItems[number]['item']) }>;
    if (!Array.isArray(flattenedMenuItems)) return [];
    const lookup = new Map<string, { section: (typeof sections)[number]; item: (typeof flattenedMenuItems[number]['item']) }>();
    flattenedMenuItems.forEach(({ section, item }) => {
      if (item && item.name) {
        lookup.set(item.name.toLowerCase(), { section, item });
      }
    });
    return names.map((name) => ({
      name,
      section: lookup.get(String(name).toLowerCase())?.section,
      item: lookup.get(String(name).toLowerCase())?.item,
    }));
  }, [currentFeaturedItems, safeSections, flattenedMenuItems, tenant.branding?.recommendedItems]);

  // Prepare featured items for carousel
  const carouselItems = useMemo(() => {
    if (!Array.isArray(recommendedItems)) return [];
    return recommendedItems
      .filter((entry) => entry && entry.item)
      .map((entry) => {
        const item = entry.item!;
        const section = entry.section;
        const fallback = getStockImageForCategory(item.category || section?.type || 'general', 0);
        const displayImage = item.image || fallback;

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          displayImage,
          sectionName: section?.name,
        };
      });
  }, [recommendedItems]);

  const locationSummary = tenant.branding?.location || addressParts || null;
  const hoursSummary = tenant.branding?.hours || null;
  const locationDisplay = useMemo(() => (locationSummary ? locationSummary.split('\n')[0] : null), [locationSummary]);
  const hoursDisplay = useMemo(() => (hoursSummary ? hoursSummary.split('\n')[0] : null), [hoursSummary]);
  const hoursLines = useMemo(() => (hoursSummary ? hoursSummary.split('\n') : null), [hoursSummary]);

  const heroImage = tenant.heroImageUrl || assets.hero;
  const heroGallery = useMemo(() => {
    // Use currentHeroImages (from polling) for real-time updates
    if (currentHeroImages && currentHeroImages.length > 0) {
      return currentHeroImages;
    }
    const unique = new Set<string>();
    [heroImage, assets.membership, '/stock/hero1.jpg', '/stock/hero2.jpg']
      .filter(Boolean)
      .forEach((url) => unique.add(url as string));
    return Array.from(unique);
  }, [assets.membership, heroImage, currentHeroImages]);
  const membershipImage = assets.membership;
  const [heroBackgroundIndex, setHeroBackgroundIndex] = useState(0);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 2200);
  }, []);

  const handleAddToCart = useCallback(
    (item: OrderMenuItem, image?: string | null) => {
      if (!restaurantIsOpen) {
        showNotification(restaurantClosedMessage || 'We are currently closed. Please check back during our operating hours.');
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
    [addToCart, showNotification, restaurantIsOpen, restaurantClosedMessage],
  );

  const handleAddHighlight = useCallback(
    (card: HighlightCard) => {
      if (!restaurantIsOpen) {
        showNotification(restaurantClosedMessage || 'We are currently closed. Please check back during our operating hours.');
        return;
      }
      addToCart({
        id: `${card.id}-${Date.now()}`,
        name: card.title,
        description: card.description,
        price: card.price,
        quantity: 1,
        image: card.image,
        modifiers: ['Upsell bundle'],
        isUpsell: true,
      });
      showNotification(`Bundle added: ${card.title}`);
    },
    [addToCart, showNotification, restaurantIsOpen, restaurantClosedMessage],
  );

  const handleCarouselAddToCart = useCallback(
    (item: { id: string; name: string; description: string; price: number; image?: string | null; displayImage?: string }) => {
      if (!restaurantIsOpen) {
        showNotification(restaurantClosedMessage || 'We are currently closed. Please check back during our operating hours.');
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
    [addToCart, showNotification, restaurantIsOpen, restaurantClosedMessage],
  );

  const enrichedSections = useMemo(() => {
    return safeSections.map((section, sectionIndex) => ({
      ...section,
      icon: SECTION_ICONS[section.type] || '🍽️',
      items: section.items
        .map((item, itemIndex) => {
          // Check if time-specific is active
          const timeSpecificConfig = {
            timeSpecificEnabled: (item as any).timeSpecificEnabled || false,
            timeSpecificDays: (item as any).timeSpecificDays || [],
            timeSpecificStartTime: (item as any).timeSpecificStartTime,
            timeSpecificEndTime: (item as any).timeSpecificEndTime,
            timeSpecificPrice: (item as any).timeSpecificPrice,
            timeSpecificLabel: (item as any).timeSpecificLabel,
            regularPrice: item.price,
          };
          
          // Filter out items that shouldn't be shown
          if (!shouldShowItem(timeSpecificConfig)) return null;
          
          const isTimeActive = isTimeSpecificActive(timeSpecificConfig);
          const displayPrice = getTimeSpecificPrice(timeSpecificConfig);
          const timeLabel = getTimeSpecificLabel(timeSpecificConfig);
          
          const fallback = getStockImageForCategory(item.category || section.type, itemIndex + sectionIndex);
          const baseGallery = Array.isArray(item.gallery) ? item.gallery.filter((url) => typeof url === 'string' && url.length > 0) : [];
          const displayGallery = [...baseGallery];
          if (item.image && !displayGallery.includes(item.image)) {
            displayGallery.unshift(item.image);
          }
          if (displayGallery.length === 0) {
            displayGallery.push(fallback);
          }
          const image = displayGallery[0] ?? fallback;
          const emoji = getEmojiForItem(item, section.type);
          
          return {
            ...item,
            price: displayPrice, // Use time-specific price if active
            displayPrice,
            isTimeSpecific: isTimeActive,
            timeSpecificLabel: timeLabel,
            displayImage: image,
            displayGallery,
            emoji,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null), // Remove nulls
    }));
  }, [safeSections]);

  // Build ordered render queue based on frontendUISections configuration
  // This determines the order and which promotional banners to show
  const getSectionConfig = useCallback((type: string) => {
    if (!frontendUISections || frontendUISections.length === 0) return null;
    return frontendUISections.find(s => s.type === type && s.enabled) || null;
  }, [frontendUISections]);

  const [isHeroTransitioning, setIsHeroTransitioning] = useState(false);
  const [showMembershipPanel, setShowMembershipPanel] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinModalMode, setJoinModalMode] = useState<'join' | 'login'>('join');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showCateringPanel, setShowCateringPanel] = useState(false);
  const [cateringName, setCateringName] = useState('');
  const [cateringEmail, setCateringEmail] = useState('');
  const [cateringPhone, setCateringPhone] = useState('');
  const [cateringEventDate, setCateringEventDate] = useState('');
  const [cateringGuestCount, setCateringGuestCount] = useState('');
  const [cateringMessage, setCateringMessage] = useState('');
  const [cateringGalleryIndex, setCateringGalleryIndex] = useState(0);
  const [rewardsGalleryIndex, setRewardsGalleryIndex] = useState(0);
  const [rewardsGalleryImages, setRewardsGalleryImages] = useState<string[]>(rewardsData?.rewardsGallery || []);
  const [customerData, setCustomerData] = useState<CustomerRewardsData | null>(customerRewardsData || null);
  const [activeRewards, setActiveRewards] = useState<any[]>([]);
  const [emailOffers, setEmailOffers] = useState<any[]>([]);

  // Refresh catering packages periodically for real-time updates (optional)
  useEffect(() => {
    const fetchCateringPackages = async () => {
      try {
        const timestamp = Date.now();
        const res = await fetch(`/api/catering-packages?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok) {
          const data = await res.json();
          // API now returns { sections: [...], gallery: [...] }
          // Extract packages from sections and flatten into array
          if (data.sections && Array.isArray(data.sections)) {
            const allPackages = data.sections.flatMap((section: { packages: CateringPackage[] }) => section.packages || []);
            setCateringPackages(allPackages);
          } else if (Array.isArray(data)) {
            // Fallback for old API format (flat array)
            setCateringPackages(data);
          }
          // Also update gallery from the same API response
          if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
            setCateringGalleryImages(data.gallery);
          }
        }
      } catch (err) {
        console.error('Failed to refresh catering packages', err);
      }
    };
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchCateringPackages, 30000);
    return () => clearInterval(interval);
  }, []);

  // Poll restaurant status every 10 seconds for real-time open/closed updates
  useEffect(() => {
    const fetchRestaurantStatus = async () => {
      try {
        const timestamp = Date.now();
        const res = await fetch(`/api/restaurant-status?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.isOpen === 'boolean') {
            setRestaurantIsOpen(data.isOpen);
            setRestaurantClosedMessage(data.message || '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch restaurant status', err);
      }
    };

    // Fetch immediately on mount
    fetchRestaurantStatus();

    // Then poll every 10 seconds for quick updates when admin toggles
    const interval = setInterval(fetchRestaurantStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Poll featured items every 5 seconds for quick updates when admin changes carousel
  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        const timestamp = Date.now();
        const res = await fetch(`/api/featured-items?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items)) {
            // Only update if the items have actually changed
            setCurrentFeaturedItems(prev => {
              const newIds = data.items.map((i: { id: string }) => i.id).sort().join(',');
              const oldIds = prev.map(i => i.id).sort().join(',');
              if (newIds !== oldIds) {
                return data.items;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // Silent fail - don't disrupt user experience
      }
    };

    // Poll every 5 seconds for quick updates
    const interval = setInterval(fetchFeaturedItems, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll hero images every 5 seconds for quick updates when admin changes hero section
  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const timestamp = Date.now();
        const res = await fetch(`/api/hero-images?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.heroImages) && data.heroImages.length > 0) {
            // Only update if the images have actually changed
            setCurrentHeroImages(prev => {
              const newImages = data.heroImages.join(',');
              const oldImages = prev.join(',');
              if (newImages !== oldImages) {
                return data.heroImages;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // Silent fail - don't disrupt user experience
      }
    };

    // Poll every 5 seconds for quick updates
    const interval = setInterval(fetchHeroImages, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll menu availability every 15 seconds for real-time sold out / price updates
  useEffect(() => {
    const fetchMenuAvailability = async () => {
      try {
        const timestamp = Date.now();
        const res = await fetch(`/api/menu-availability?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items)) {
            // Create a map of item updates for quick lookup
            const updates = new Map(data.items.map((item: { id: string; available: boolean; price: number }) => [item.id, item]));

            // Merge availability updates into current sections
            setCurrentSections(prevSections => {
              let hasChanges = false;
              const newSections = prevSections.map(section => ({
                ...section,
                items: section.items.map(item => {
                  const update = updates.get(item.id);
                  if (update && (item.available !== update.available || item.price !== update.price)) {
                    hasChanges = true;
                    console.log(`[MenuAvailability] ${item.name}: available=${update.available}, price=$${update.price}`);
                    return { ...item, available: update.available, price: update.price };
                  }
                  return item;
                }),
              }));
              return hasChanges ? newSections : prevSections;
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch menu availability', err);
      }
    };

    // Poll every 15 seconds (slightly less frequent than status checks)
    const interval = setInterval(fetchMenuAvailability, 15000);
    return () => clearInterval(interval);
  }, []);

  // Refresh server components when page becomes visible or gets focus
  // Debounced to prevent excessive refreshes that cause flashing
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;
    let lastRefresh = 0;
    const minRefreshInterval = 5000; // Minimum 5 seconds between refreshes

    const refreshGallery = () => {
      const timestamp = Date.now();
      fetch(`/api/catering-packages/gallery?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })
        .then(res => res.json())
        .then(data => {
          setCateringGalleryImages(Array.isArray(data.gallery) ? data.gallery : []);
        })
        .catch(() => {
          // Silently fail - don't spam console
        });
    };

    // Refresh server components when page becomes visible (user returns to tab)
    // Disabled router.refresh to prevent URL flashing in Safari - only refresh gallery
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Only refresh gallery, skip router.refresh to prevent URL flashing
        if (now - lastRefresh >= minRefreshInterval) {
          // Just refresh gallery without router.refresh to avoid URL flashing
          refreshGallery();
          lastRefresh = Date.now();
        } else {
          refreshGallery();
        }
      }
    };

    // Refresh on page focus (user clicks back into the window)
    // Disabled router.refresh to prevent URL flashing in Safari - only refresh gallery
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastRefresh >= minRefreshInterval) {
        // Just refresh gallery without router.refresh to avoid URL flashing
        refreshGallery();
        lastRefresh = Date.now();
      } else {
        refreshGallery();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router]);

  // Group packages by category
  const popularPackages = useMemo(() => {
    if (!Array.isArray(cateringPackages)) {
      return [];
    }
    const popular = cateringPackages.filter(pkg => {
      if (!pkg) return false;
      // Accept 'popular' category or default to popular if category is missing/empty
      const category = (pkg.category && pkg.category.trim()) || 'popular';
      return category === 'popular';
    });
    return popular;
  }, [cateringPackages]);
  
  const holidayPackages = useMemo(() => {
    if (!Array.isArray(cateringPackages)) return [];
    return cateringPackages.filter(pkg => pkg && pkg.category === 'holiday');
  }, [cateringPackages]);

  // Rewards gallery - use server-side data, with client-side refresh for real-time updates
  useEffect(() => {
    const fetchRewardsGallery = async () => {
      try {
        const timestamp = Date.now();
        const res = await fetch(`/api/rewards/gallery?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setRewardsGalleryImages(Array.isArray(data.gallery) ? data.gallery : []);
        }
      } catch (err) {
        console.error('Failed to refresh rewards gallery', err);
      }
    };
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchRewardsGallery, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh customer data periodically
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const timestamp = Date.now();
        const res = await fetch(`/api/rewards/customer?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setCustomerData(data || null);
        }
      } catch (err) {
        console.error('Failed to refresh customer data', err);
      }
    };
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchCustomerData, 30000);
    return () => clearInterval(interval);
  }, []);

  const rewardsGallery = useMemo(() => {
    if (rewardsGalleryImages.length > 0) return rewardsGalleryImages;
    // Fallback to default images if no gallery
    return [
      cycleFallbackImage(50),
      cycleFallbackImage(51),
      cycleFallbackImage(52),
    ];
  }, [rewardsGalleryImages]);

  // Handle re-order
  const handleReorder = useCallback(async (order: CustomerRewardsData['orders'][0]) => {
    if (!order.items || order.items.length === 0) {
      showNotification('This order has no items to reorder');
      return;
    }

    // Add all items from the order to cart
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
    setShowMembershipPanel(false);
    
    // If member has stored payment, open quick checkout
    if (customerData) {
      // Small delay to ensure cart is updated
      setTimeout(() => {
        const cartButton = document.querySelector('[data-cart-launcher]') as HTMLElement;
        cartButton?.click();
      }, 300);
    }
  }, [addToCart, showNotification, customerData]);

  // Handle reward claiming
  const handleClaimReward = useCallback(async (reward: any) => {
    try {
      // First, redeem the reward (deducts points if needed)
      const redeemRes = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: reward.id,
          pointsCost: reward.pointsCost || 0,
        }),
      });

      if (!redeemRes.ok) {
        const error = await redeemRes.json();
        showNotification(error.error || 'Failed to claim reward');
        return;
      }

      const redeemData = await redeemRes.json();

      // Handle different reward types
      if (reward.type === 'free_item' && reward.menuItemId) {
        // Fetch menu item details
        const menuRes = await fetch(`/api/menu/${reward.menuItemId}`);
        if (menuRes.ok) {
          const menuItem = await menuRes.json();
          // Add to cart with price 0
          addToCart({
            id: menuItem.id,
            name: menuItem.name,
            price: 0, // Free!
            quantity: 1,
            image: menuItem.image || '',
            description: menuItem.description || null,
            note: `Free reward: ${reward.name}`,
          });
          showNotification(`🎉 ${reward.name} added to cart!`);
        } else {
          showNotification('Menu item not found');
        }
      } else if (reward.type === 'discount') {
        // Store discount in localStorage for checkout
        const discount = {
          rewardId: reward.id,
          type: reward.discountPercent ? 'percent' : 'amount',
          value: reward.discountPercent || reward.discountAmount || 0,
          name: reward.name,
        };
        try {
          localStorage.setItem('activeRewardDiscount', JSON.stringify(discount));
        } catch {
          // localStorage may be unavailable in private mode - ignore
        }
        showNotification(`🎉 ${reward.name} discount applied! Will be applied at checkout.`);
      } else if (reward.type === 'free_shipping') {
        // Store free shipping flag
        try {
          localStorage.setItem('activeRewardFreeShipping', 'true');
        } catch {
          // localStorage may be unavailable in private mode - ignore
        }
        showNotification(`🎉 ${reward.name} - Free shipping will be applied at checkout!`);
      } else if (reward.type === 'points_bonus') {
        // Points bonus is handled server-side on order completion
        showNotification(`🎉 ${reward.name} - Bonus points will be added on your next order!`);
      }

      // Refresh customer data to update points
      const customerRes = await fetch('/api/rewards/customer');
      if (customerRes.ok) {
        const customerData = await customerRes.json();
        setCustomerData(customerData);
      }

      // Refresh active rewards
      const rewardsRes = await fetch('/api/rewards/active');
      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json();
        setActiveRewards(Array.isArray(rewardsData.rewards) ? rewardsData.rewards : []);
      }

      setShowMembershipPanel(false);
    } catch (err) {
      console.error('Failed to claim reward', err);
      showNotification('Failed to claim reward. Please try again.');
    }
  }, [addToCart, showNotification]);

  // Sample Puebla Mexico themed media - can be replaced with actual tenant media
  const heroMedia = useMemo(() => {
    const images = heroGallery;
    // Add sample Puebla Mexico themed images/videos
    const pueblaMedia = [
      'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=1920&q=80', // Mexican food spread
      'https://images.unsplash.com/photo-1599974177422-591977d8d1f4?w=1920&q=80', // Tacos platter
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1920&q=80', // Restaurant interior
      'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?w=1920&q=80', // Mexican cuisine prep
    ];
    return [...images, ...pueblaMedia].slice(0, 6); // Limit to 6 items
  }, [heroGallery]);

  useEffect(() => {
    setHeroBackgroundIndex(0);
  }, [heroMedia]);

  useEffect(() => {
    if (heroMedia.length <= 1 || motionReduced) return;
    const interval = window.setInterval(() => {
      setIsHeroTransitioning(true);
      setTimeout(() => {
        setHeroBackgroundIndex((prev) => (prev + 1) % heroMedia.length);
        setTimeout(() => setIsHeroTransitioning(false), 300);
      }, 300);
    }, 6000); // 6 seconds for faster rotation
    return () => window.clearInterval(interval);
  }, [heroMedia, motionReduced]);

  const currentHeroBackground = heroMedia[heroBackgroundIndex] || heroImage;
  const nextHeroBackground = heroMedia[(heroBackgroundIndex + 1) % heroMedia.length] || heroImage;

  // Catering gallery - fetch from main catering API, fallback to defaults
  const [cateringGalleryImages, setCateringGalleryImages] = useState<string[]>([]);
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        // Add cache-busting timestamp - use main catering API which has proper tenant resolution
        const timestamp = Date.now();
        const res = await fetch(`/api/catering-packages?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok) {
          const data = await res.json();
          // API returns { sections: [...], gallery: [...] }
          if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
            setCateringGalleryImages(data.gallery);
          }
        } else {
          console.error('Failed to fetch catering gallery:', res.status, res.statusText);
        }
      } catch (err) {
        console.error('Failed to fetch catering gallery:', err);
      }
    };
    fetchGallery();
  }, []);
  const cateringGallery = useMemo(() => {
    if (cateringGalleryImages.length > 0) return cateringGalleryImages;
    // Fallback to defaults if no gallery images set
    return [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1920&q=80',
      'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=1920&q=80',
      'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=1920&q=80',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1920&q=80',
    ];
  }, [cateringGalleryImages]);

  // Catering is enabled if:
  // 1. 'catering' is in enabledAddOns (primary control from menu editor), OR
  // 2. Catering tab config explicitly says it's enabled, OR
  // 3. Feature flag is set AND not explicitly disabled
  // Note: The enabledAddOns is the primary control from the menu editor
  const cateringEnabled =
    enabledAddOns.includes('catering') ||
    cateringTabConfig?.enabled === true ||
    (
      (tenant.featureFlags?.includes('catering') ?? false) &&
      cateringTabConfig?.enabled !== false
    );

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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit inquiry');
      }

      showNotification('Catering inquiry submitted! We\'ll contact you soon.');
      setShowCateringPanel(false);
      // Reset form
      setCateringName('');
      setCateringEmail('');
      setCateringPhone('');
      setCateringEventDate('');
      setCateringGuestCount('');
      setCateringMessage('');
    } catch (error) {
      console.error('Failed to submit catering inquiry:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to submit inquiry. Please try again.');
    }
  }, [cateringName, cateringEmail, cateringPhone, cateringEventDate, cateringGuestCount, cateringMessage, showNotification]);

  const renderSectionItems = useCallback(
    (section: (typeof enrichedSections)[number]) => {
      if (activeLayout === 'list') {
        return (
          <div className="space-y-4">
            {section.items.map((item) => (
              <article key={item.id} className="group flex gap-4 rounded-2xl bg-white/8 p-4 shadow-xl shadow-black/10 backdrop-blur-md transition hover:bg-white/12 hover:shadow-xl hover:shadow-red-600/20">
                <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800 to-gray-900">
                  {item.displayImage && item.displayImage.startsWith('http') ? (
                    <img 
                      src={item.displayImage || getStockImageForCategory(item.category || section.type, 0)} 
                      alt={item.name} 
                      className="h-full w-full object-cover transition-transform group-hover:scale-110" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getStockImageForCategory(item.category || section.type, 0);
                      }}
                    />
                  ) : (
                    <Image 
                      src={item.displayImage || getStockImageForCategory(item.category || section.type, 0)} 
                      alt={item.name} 
                      fill 
                      className="object-cover transition-transform group-hover:scale-110" 
                      sizes="(min-width: 768px) 120px, 96px"
                      unoptimized={item.displayImage?.startsWith('http') || item.displayImage?.startsWith('/tenant/')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getStockImageForCategory(item.category || section.type, 0);
                      }}
                    />
                  )}
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 text-lg">{item.emoji}</span>
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                        {(item as any).timeSpecificLabel && (
                          <span className="mt-1 inline-block rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] px-2 py-0.5 text-xs font-bold text-black">
                            {(item as any).timeSpecificLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        {(item as any).isTimeSpecific && (item as any).timeSpecificPrice && (item as any).timeSpecificPrice !== item.price && (
                          <span className="text-xs text-white/50 line-through">${((item as any).displayPrice || item.price).toFixed(2)}</span>
                        )}
                        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">${((item as any).displayPrice || item.price).toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-white/70">{item.description}</p>
                    {item.displayGallery && item.displayGallery.length > 1 && (
                      <div className="mt-3 flex gap-2">
                        {item.displayGallery.slice(1, 4).map((url, index) => (
                          <div key={`${item.id}-thumb-${index}`} className="relative h-10 w-10 overflow-hidden rounded-lg border border-white/10">
                            <Image src={url} alt={`${item.name} alt ${index + 1}`} fill className="object-cover" sizes="40px" />
                          </div>
                        ))}
                      </div>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-white/60">
                        {item.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-white/20 px-2 py-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      className="flex-1 rounded-lg bg-[#ff0000] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-[#ff0000]/30 transition-all hover:scale-[1.02] hover:shadow-[#ff0000]/50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => openCustomization(item, section.type)}
                      disabled={!item.available}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        {item.available ? (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                          </>
                        ) : 'Sold Out'}
                      </span>
                    </button>
                    <button
                      className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur-sm transition-all hover:border-[#ff0000]/40 hover:bg-[#ff0000]/10 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => handleAddToCart(item, item.displayImage)}
                      disabled={!item.available}
                    >
                      Quick Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        );
      }

      if (activeLayout === 'cards') {
        return (
          <div className="grid gap-6 sm:grid-cols-2">
            {section.items.map((item) => (
              <article
                key={item.id}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/8 shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-white/20"
              >
                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                  {item.displayImage && item.displayImage.startsWith('http') ? (
                    <img 
                      src={item.displayImage} 
                      alt={item.name} 
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getStockImageForCategory(item.category || section.type, 0);
                      }}
                    />
                  ) : (
                    <Image 
                      src={item.displayImage || getStockImageForCategory(item.category || section.type, 0)} 
                      alt={item.name} 
                      fill 
                      className="object-cover transition duration-500 group-hover:scale-110" 
                      sizes="(min-width: 1024px) 480px, 100vw"
                      unoptimized={item.displayImage?.startsWith('http') || item.displayImage?.startsWith('/tenant/')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getStockImageForCategory(item.category || section.type, 0);
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    <span className="text-3xl">{item.emoji}</span>
                    <div className="rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
                      {section.name}
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-semibold text-white">{item.name}</h3>
                    <span className="rounded-full bg-white/10 px-4 py-1 text-lg font-bold text-white">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-white/70">{item.description}</p>
                  {item.displayGallery && item.displayGallery.length > 1 && (
                    <div className="flex gap-2">
                      {item.displayGallery.slice(1, 4).map((url, index) => (
                        <div key={`${item.id}-card-thumb-${index}`} className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/15">
                          <Image src={url} alt={`${item.name} alternate ${index + 1}`} fill className="object-cover" sizes="48px" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2 text-xs text-white/60">
                      <span className="rounded-full bg-black/30 px-2 py-1">{section.icon} {section.type.toLowerCase()}</span>
                      {item.tags?.map((tag) => (
                        <span key={tag} className="rounded-full bg-white/10 px-2 py-1 uppercase tracking-wide">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30"
                        onClick={() => openCustomization(item, section.type)}
                        disabled={!item.available}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Add to Cart
                        </span>
                      </button>
                      <button
                        className="rounded-full bg-gradient-to-r from-red-600 via-amber-400 to-yellow-400 px-4 py-2 text-sm font-semibold text-black transition hover:scale-105 hover:shadow-lg"
                        onClick={() => handleAddToCart(item, item.displayImage)}
                        disabled={!item.available}
                      >
                        {item.available ? 'Add Bundle' : 'Sold Out'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        );
      }

      const isBakery = section.type === 'BAKERY' || section.name.toLowerCase().includes('panad') || section.name.toLowerCase().includes('bakery');
      
      return (
        <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {section.items.map((item) => (
            <article key={item.id} className={`group relative overflow-hidden rounded-3xl border-2 backdrop-blur-xl transition-all hover:scale-105 hover:shadow-2xl ${
              isBakery
                ? 'border-amber-400/30 bg-gradient-to-br from-amber-400/20 via-red-600/15 to-yellow-400/20 hover:border-amber-400/50 hover:shadow-amber-500/40'
                : 'border-white/10 bg-white/10 hover:border-white/30 hover:shadow-red-600/30'
            }`}>
              <div className="relative h-56 w-full overflow-hidden sm:h-64 bg-gradient-to-br from-gray-800 to-gray-900">
                {item.displayImage && item.displayImage.startsWith('http') ? (
                  <img 
                    src={item.displayImage || getStockImageForCategory(item.category || section.type, 0)} 
                    alt={item.name} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getStockImageForCategory(item.category || section.type, 0);
                    }}
                  />
                ) : (
                  <Image 
                    src={item.displayImage || getStockImageForCategory(item.category || section.type, 0)} 
                    alt={item.name} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-110" 
                    sizes="(min-width: 1280px) 360px, (min-width: 768px) 280px, 100vw"
                    unoptimized={item.displayImage?.startsWith('http') || item.displayImage?.startsWith('/tenant/')}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getStockImageForCategory(item.category || section.type, 0);
                    }}
                  />
                )}
                <div className={`absolute inset-0 bg-gradient-to-t ${
                  isBakery ? 'from-amber-900/90 via-red-900/30 to-transparent' : 'from-black/90 via-black/30 to-transparent'
                }`} />
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <span className="text-3xl drop-shadow-lg">{item.emoji}</span>
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-sm ${
                    isBakery
                      ? 'border-amber-300/50 bg-amber-500/40 text-amber-100'
                      : 'border-white/30 bg-black/60 text-white'
                  }`}>
                    {section.name}
                  </span>
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="absolute top-4 right-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg ${
                      isBakery
                        ? 'bg-gradient-to-r from-amber-400 to-red-600'
                        : 'bg-gradient-to-r from-red-600 to-amber-400'
                    }`}>
                      {item.tags[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-5 p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className={`text-xl font-bold ${
                    isBakery ? 'text-amber-100' : 'text-white'
                  }`}>
                    {item.name}
                  </h3>
                  <span className={`text-2xl font-black ${
                    isBakery ? 'text-amber-200' : 'text-red-300'
                  }`}>
                    ${item.price.toFixed(2)}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed line-clamp-3 ${
                  isBakery ? 'text-amber-100/80' : 'text-white/80'
                }`}>
                  {item.description}
                </p>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
                    {item.tags?.slice(0, 2).map((tag) => (
                      <span key={tag} className={`rounded-full border px-3 py-1 backdrop-blur-sm ${
                        isBakery
                          ? 'border-amber-300/30 bg-amber-500/20 text-amber-200'
                          : 'border-white/20 bg-white/10 text-white/60'
                      }`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold shadow-lg transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 ${
                        isBakery
                          ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 text-black shadow-amber-500/20 hover:shadow-amber-500/40'
                          : 'bg-[#ff0000] text-white shadow-[#ff0000]/30 hover:shadow-[#ff0000]/50'
                      }`}
                      onClick={() => openCustomization(item, section.type)}
                      disabled={!item.available}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        {item.available ? (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                          </>
                        ) : (
                          'Sold Out'
                        )}
                      </span>
                    </button>
                    <button
                      className={`rounded-lg border px-3 py-2 text-xs font-medium backdrop-blur-sm transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 ${
                        isBakery
                          ? 'border-amber-300/20 bg-amber-500/5 text-amber-100/90 hover:border-amber-300/40 hover:bg-amber-500/10'
                          : 'border-white/20 bg-white/5 text-white/90 hover:border-white/40 hover:bg-white/10'
                      }`}
                      onClick={() => handleAddToCart(item, item.displayImage)}
                      disabled={!item.available}
                    >
                      Quick Add
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      );
    },
    [activeLayout, handleAddToCart, openCustomization],
  );

  // Profile menu state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ===========================================
  // POSITION-BASED SECTION RENDERING
  // ===========================================
  // Get sorted sections by position for dynamic rendering
  const sortedSections = useMemo(() => {
    if (!frontendUISections || frontendUISections.length === 0) return [];
    return [...frontendUISections]
      .filter(s => s.enabled)
      .sort((a, b) => a.position - b.position);
  }, [frontendUISections]);

  // Render Hero Section
  const renderHeroSection = () => {
    const heroConfig = frontendUISections.find(s => s.type === 'hero');
    if (heroConfig && !heroConfig.enabled) return null;

    return (
      <section key="hero-section" className="relative overflow-hidden min-h-[500px] md:min-h-[600px]">
        {/* Rich Holiday Red Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B0000] via-[#B22222] to-[#6B0F0F]" />

        {/* Animated Fire/Glow Texture Overlay */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay'
        }} />

        {/* LED Glow Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.15)_0%,transparent_50%)]" />
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#FF4444]/50 via-[#FF1744]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#FF4444]/50 via-[#FF1744]/30 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col justify-center text-center md:text-left">
              <div className="inline-flex items-center gap-2 mb-6 justify-center md:justify-start">
                <span className="relative px-5 py-2 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#8B0000] text-xs font-black uppercase tracking-wide shadow-xl overflow-hidden">
                  <span className="relative z-10">✨ Holiday Special ✨</span>
                </span>
              </div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-[0.9] drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                {personality.heroTitle}
              </h2>
              <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-lg mx-auto md:mx-0 drop-shadow-lg">
                {tenant.heroSubtitle || tenant.tagline || 'Authentic flavors crafted with passion'}
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <button
                  onClick={() => {
                    const firstSection = navSections[0];
                    if (firstSection) {
                      const element = document.getElementById(`section-${firstSection.id}`);
                      if (element) {
                        const offset = 100;
                        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
                        window.scrollTo({ top: elementPosition - offset, behavior: isSafariBrowser ? 'auto' : 'smooth' });
                      }
                    }
                  }}
                  className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] px-10 py-5 text-lg font-black text-[#8B0000] shadow-2xl shadow-[#FFD700]/40 hover:shadow-[#FFD700]/60 transition-all hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10">ORDER NOW</span>
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const menuEl = document.getElementById('menu');
                    if (menuEl) menuEl.scrollIntoView({ behavior: isSafariBrowser ? 'auto' : 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-white/60 bg-white/10 backdrop-blur-md px-10 py-5 text-lg font-bold text-white hover:bg-white/25 hover:border-white transition-all"
                >
                  VIEW MENU
                </button>
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-md mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFD700]/60 to-[#FF6B6B]/40 blur-[80px] scale-125 animate-pulse" style={{ animationDuration: '2s' }} />
                <div className="relative aspect-square rounded-[40px] overflow-hidden border-4 border-[#FFD700]/50 shadow-[0_0_60px_rgba(255,215,0,0.3)] bg-[#2a2a2a]">
                  {carouselItems[0]?.displayImage ? (
                    <Image
                      src={carouselItems[0].displayImage}
                      alt="Featured dish"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 450px"
                      unoptimized={carouselItems[0].displayImage.startsWith('/tenant/')}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-8xl">🍽️</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#8B0000]/60 via-transparent to-transparent" />
                  <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-gradient-to-r from-[#FF4444] to-[#FF6B00] text-white text-sm font-black shadow-lg animate-pulse flex items-center gap-1.5">
                    🔥 HOT
                  </div>
                </div>
                {carouselItems[0]?.price && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#8B0000] font-black text-xl shadow-2xl shadow-[#FFD700]/40">
                    From ${carouselItems[0].price.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#0d0d0d]" style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }} />
      </section>
    );
  };

  // Render Quick Info Bar
  const renderQuickInfoBar = () => {
    const quickInfoConfig = frontendUISections.find(s => s.type === 'quickInfo');
    if (quickInfoConfig && !quickInfoConfig.enabled) return null;

    return (
      <div key="quick-info-bar" className="bg-[#2a2a2a] py-4 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div className="px-4">
              <p className="text-2xl font-bold text-white">{personality.totalItems}</p>
              <p className="text-xs text-white/40 uppercase tracking-wide">Items</p>
            </div>
            <div className="h-10 w-px bg-white/10 hidden sm:block" />
            <div className="px-4">
              <p className="text-2xl font-bold text-white">{hoursDisplay || hoursSummary || 'Open'}</p>
              <p className="text-xs text-white/40 uppercase tracking-wide">Hours</p>
            </div>
            <div className="h-10 w-px bg-white/10 hidden sm:block" />
            <div className="px-4">
              <p className="text-2xl font-bold text-white">{locationDisplay || locationSummary || 'Local'}</p>
              <p className="text-xs text-white/40 uppercase tracking-wide">Location</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Featured Carousel
  const renderFeaturedCarousel = () => {
    if (carouselItems.length === 0) return null;

    const featuredCarouselConfig = getSectionConfig('featuredCarousel');
    const carouselTitle = featuredCarouselConfig?.content?.title || frontendConfig?.featuredCarousel?.title || 'Chef Recommends';
    const carouselSubtitle = featuredCarouselConfig?.content?.subtitle || frontendConfig?.featuredCarousel?.subtitle || 'Handpicked favorites from our kitchen';

    if (featuredCarouselConfig && !featuredCarouselConfig.enabled) return null;

    return (
      <div key="featured-carousel">
        <FeaturedCarousel
          items={carouselItems}
          onAddToCart={handleCarouselAddToCart}
          title={carouselTitle}
          subtitle={carouselSubtitle}
        />
      </div>
    );
  };

  // Render a promotional banner by type
  const renderPromoBanner = (section: FrontendUISection) => {
    const config = section.content;
    const type = section.type;

    // Grocery Banner
    if (type === 'groceryBanner') {
      return (
        <div
          key={section.id}
          className="mb-10 relative overflow-hidden rounded-3xl p-1"
          style={{ background: config.gradientFrom && config.gradientTo ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})` : 'linear-gradient(to right, #065f46, #059669, #047857)' }}
        >
          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-green-950 to-green-900 p-6 md:p-8">
            <div className="relative grid md:grid-cols-2 gap-6 items-center">
              <div>
                {config.badge && (
                  <div className="inline-block px-4 py-1.5 rounded-full bg-green-400/20 text-green-300 text-xs font-bold uppercase tracking-wider mb-3">
                    {config.badge}
                  </div>
                )}
                <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                  {config.title || 'Visit Our Grocery Store'}
                </h3>
                <p className="text-white/70 mb-4">{config.subtitle || config.description}</p>
                {config.buttonText && config.buttonLink && (
                  <a href={config.buttonLink} className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-green-500 text-white font-black text-lg shadow-xl hover:bg-green-400 transition-colors">
                    {config.buttonText}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                )}
              </div>
              {config.image && (
                <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden">
                  <img src={config.image} alt={config.title || 'Grocery'} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Panaderia Banner
    if (type === 'panaderiaBanner') {
      return (
        <div
          key={section.id}
          className="mb-10 relative overflow-hidden rounded-3xl p-1"
          style={{ background: config.gradientFrom && config.gradientTo ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})` : 'linear-gradient(to right, #d97706, #f59e0b, #fbbf24)' }}
        >
          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-amber-950 to-amber-900 p-6 md:p-8">
            <div className="relative grid md:grid-cols-2 gap-6 items-center">
              <div>
                {config.badge && (
                  <div className="inline-block px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
                    {config.badge}
                  </div>
                )}
                <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                  {config.title || 'Fresh Bakery'}
                </h3>
                <p className="text-white/70 mb-4">{config.subtitle || config.description}</p>
                {config.buttonText && config.buttonLink && (
                  <a href={config.buttonLink} className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-amber-500 text-white font-black text-lg shadow-xl hover:bg-amber-400 transition-colors">
                    {config.buttonText}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                )}
              </div>
              {config.image && (
                <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden">
                  <img src={config.image} alt={config.title || 'Bakery'} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // WeCookBanner
    if (type === 'weCookBanner') {
      return (
        <div
          key={section.id}
          className="mb-10 relative overflow-hidden rounded-3xl"
          style={{
            background: config.gradientFrom && config.gradientTo
              ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
              : config.backgroundColor || 'linear-gradient(to right, #1a1a1a, #2a2a2a, #1a1a1a)',
          }}
        >
          <div className="relative p-8 md:p-12">
            <div className="relative text-center">
              {config.title && (
                <h3 className="text-4xl md:text-6xl font-black mb-4 tracking-tight" style={{ color: config.textColor || '#ffffff' }}>
                  {config.title}
                </h3>
              )}
              {(config.description || config.subtitle) && (
                <p className="text-xl mb-6 max-w-2xl mx-auto" style={{ color: config.textColor ? `${config.textColor}CC` : 'rgba(255,255,255,0.7)' }}>
                  {config.description || config.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Deal Strip
    if (type === 'dealStrip') {
      return (
        <div
          key={section.id}
          className="mb-10 relative overflow-hidden rounded-2xl"
          style={{
            background: config.gradientFrom && config.gradientTo
              ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
              : config.backgroundColor || 'linear-gradient(to right, #FFD700, #FFA500)',
          }}
        >
          <div className="relative px-6 py-4 flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {config.title && (
              <span className="text-lg md:text-2xl font-black" style={{ color: config.textColor || '#8B0000' }}>
                {config.title}
              </span>
            )}
            {config.subtitle && (
              <span className="text-sm md:text-lg" style={{ color: config.textColor ? `${config.textColor}DD` : '#8B0000CC' }}>
                {config.subtitle}
              </span>
            )}
            {config.buttonText && (
              <button className="px-6 py-2 rounded-full bg-[#8B0000] text-white font-bold hover:bg-[#6B0000] transition-colors">
                {config.buttonText}
              </button>
            )}
          </div>
        </div>
      );
    }

    // Quality Banner
    if (type === 'qualityBanner') {
      return (
        <div
          key={section.id}
          className="mb-10 relative overflow-hidden rounded-3xl p-8 md:p-10 border"
          style={{
            background: config.gradientFrom && config.gradientTo
              ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
              : config.backgroundColor || 'linear-gradient(to right, rgba(6,78,59,0.8), rgba(5,150,105,0.8), rgba(4,120,87,0.8))',
            borderColor: config.textColor ? `${config.textColor}33` : 'rgba(16,185,129,0.2)',
          }}
        >
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              {config.badge && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ backgroundColor: config.textColor ? `${config.textColor}20` : 'rgba(16,185,129,0.2)', color: config.textColor || '#10b981' }}>
                  {config.badge}
                </div>
              )}
              {config.title && (
                <h3 className="text-2xl md:text-3xl font-black mb-2" style={{ color: config.textColor || '#ffffff' }}>
                  {config.title}
                </h3>
              )}
              {config.subtitle && (
                <p className="text-lg" style={{ color: config.textColor ? `${config.textColor}99` : 'rgba(255,255,255,0.6)' }}>
                  {config.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Reviews Strip
    if (type === 'reviewsStrip') {
      return (
        <div
          key={section.id}
          className="mb-10 relative overflow-hidden rounded-2xl border p-6 md:p-8"
          style={{
            background: config.gradientFrom && config.gradientTo
              ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
              : config.backgroundColor || 'linear-gradient(to right, rgba(88,28,135,0.5), rgba(190,24,93,0.5), rgba(88,28,135,0.5))',
            borderColor: config.textColor ? `${config.textColor}33` : 'rgba(168,85,247,0.2)',
          }}
        >
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
                {'⭐'.repeat(5)}
              </div>
              {config.title && (
                <p className="text-lg font-medium mb-2" style={{ color: config.textColor ? `${config.textColor}CC` : 'rgba(255,255,255,0.8)' }}>
                  &ldquo;{config.title}&rdquo;
                </p>
              )}
              {config.subtitle && (
                <p className="text-sm" style={{ color: config.textColor ? `${config.textColor}80` : 'rgba(255,255,255,0.5)' }}>
                  {config.subtitle}
                </p>
              )}
            </div>
            {config.buttonText && (
              <button className="px-6 py-2 rounded-full font-bold transition-colors"
                style={{ backgroundColor: config.textColor || '#a855f7', color: '#ffffff' }}>
                {config.buttonText}
              </button>
            )}
          </div>
        </div>
      );
    }

    // Promo Banner 1
    if (type === 'promoBanner1') {
      const featuredBundle = popularPackages.find(pkg =>
        (pkg.category === 'bundle' || pkg.category === 'popular') && pkg.available
      ) || popularPackages[0];

      if (!featuredBundle && !config.title) return null;

      const displayImage = config.image || featuredBundle?.image || cycleFallbackImage(40);
      const title = config.title || featuredBundle?.name || '';
      const description = config.description || config.subtitle || featuredBundle?.description || '';
      const buttonText = config.buttonText || 'Order Bundle';
      const badge = config.badge || featuredBundle?.badge;

      return (
        <div
          key={section.id}
          className="mb-10 relative overflow-hidden rounded-3xl p-1"
          style={{
            background: config.gradientFrom && config.gradientTo
              ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
              : config.backgroundColor || 'linear-gradient(to right, #8B0000, #B22222, #6B0F0F)',
          }}
        >
          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1a0a0a] to-[#2a1515] p-6 md:p-8">
            <div className="relative grid md:grid-cols-2 gap-6 items-center">
              <div>
                {badge && (
                  <span className="inline-block px-4 py-1.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold uppercase tracking-wider mb-4">
                    {badge}
                  </span>
                )}
                {title && (
                  <h3 className="text-3xl md:text-4xl font-black text-white mb-3">{title}</h3>
                )}
                {description && (
                  <p className="text-white/70 mb-4">{description}</p>
                )}
                {buttonText && (
                  <button
                    onClick={() => {
                      if (config.buttonLink) {
                        window.location.href = config.buttonLink;
                      } else if (featuredBundle) {
                        setShowCateringPanel(false);
                        setCustomModal({
                          item: {
                            id: featuredBundle.id,
                            name: featuredBundle.name,
                            description: featuredBundle.description,
                            price: featuredBundle.price || featuredBundle.pricePerGuest,
                            category: 'bundle',
                            available: featuredBundle.available,
                            displayImage: displayImage,
                            sectionType: 'SPECIAL',
                            displayGallery: featuredBundle.gallery && featuredBundle.gallery.length > 0 ? featuredBundle.gallery : [displayImage],
                          },
                          config: {
                            removals: featuredBundle.customizationRemovals || [],
                            addons: featuredBundle.customizationAddons || [],
                          },
                        });
                      }
                    }}
                    className="mt-6 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#8B0000] font-black text-lg shadow-xl hover:scale-105 transition-transform"
                  >
                    {buttonText}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                )}
              </div>
              {displayImage && (
                <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-[#2a1515] to-[#1a0a0a]">
                  <img src={displayImage} alt={title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = cycleFallbackImage(40); }} />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Get the position of menuSections for splitting render
  const menuSectionsPosition = useMemo(() => {
    const menuSection = frontendUISections.find(s => s.type === 'menuSections');
    return menuSection?.position ?? 4; // Default position if not found
  }, [frontendUISections]);

  // Banner types for position-based rendering
  const bannerTypes = useMemo(() => ['promoBanner1', 'groceryBanner', 'panaderiaBanner', 'weCookBanner', 'dealStrip', 'qualityBanner', 'reviewsStrip'], []);

  // Render sections BEFORE the menu (hero, quickInfo, featuredCarousel, and banners with position < menuSections)
  const renderSectionsBeforeMenu = () => {
    const elements: JSX.Element[] = [];
    const sectionsBeforeMenu = sortedSections.filter(s => s.position < menuSectionsPosition);

    for (const section of sectionsBeforeMenu) {
      if (section.type === 'hero') {
        const heroEl = renderHeroSection();
        if (heroEl) elements.push(heroEl);
      } else if (section.type === 'quickInfo') {
        const quickInfoEl = renderQuickInfoBar();
        if (quickInfoEl) elements.push(quickInfoEl);
      } else if (section.type === 'featuredCarousel') {
        const carouselEl = renderFeaturedCarousel();
        if (carouselEl) elements.push(carouselEl);
      } else if (bannerTypes.includes(section.type)) {
        const bannerEl = renderPromoBanner(section);
        if (bannerEl) elements.push(bannerEl);
      }
    }

    return elements;
  };

  // Render sections AFTER the menu (all section types with position > menuSections)
  const renderSectionsAfterMenu = () => {
    const elements: JSX.Element[] = [];
    const sectionsAfterMenu = sortedSections.filter(s => s.position > menuSectionsPosition);

    for (const section of sectionsAfterMenu) {
      if (section.type === 'hero') {
        const heroEl = renderHeroSection();
        if (heroEl) elements.push(heroEl);
      } else if (section.type === 'quickInfo') {
        const quickInfoEl = renderQuickInfoBar();
        if (quickInfoEl) elements.push(quickInfoEl);
      } else if (section.type === 'featuredCarousel') {
        const carouselEl = renderFeaturedCarousel();
        if (carouselEl) elements.push(carouselEl);
      } else if (bannerTypes.includes(section.type)) {
        const bannerEl = renderPromoBanner(section);
        if (bannerEl) elements.push(bannerEl);
      }
    }

    return elements;
  };

  // Master renderer: renders ALL sections in position order (for debugging/full page control)
  const renderSectionsByPosition = () => {
    const renderedSections: JSX.Element[] = [];

    for (const section of sortedSections) {
      if (section.type === 'hero') {
        const heroEl = renderHeroSection();
        if (heroEl) renderedSections.push(heroEl);
      } else if (section.type === 'quickInfo') {
        const quickInfoEl = renderQuickInfoBar();
        if (quickInfoEl) renderedSections.push(quickInfoEl);
      } else if (section.type === 'featuredCarousel') {
        const carouselEl = renderFeaturedCarousel();
        if (carouselEl) renderedSections.push(carouselEl);
      } else if (section.type === 'menuSections') {
        // Menu sections placeholder - actual content rendered separately
        renderedSections.push(<div key="menu-placeholder" id="menu-sections-placeholder" />);
      } else if (bannerTypes.includes(section.type)) {
        const bannerEl = renderPromoBanner(section);
        if (bannerEl) renderedSections.push(bannerEl);
      }
    }

    return renderedSections;
  };

  // Apply template styles
  const pageStyles = templateSettings ? generatePageStyles(templateSettings) : {}
  const patternStyles = templateSettings ? generatePatternStyles(templateSettings) : null
  const cssVars = templateSettings ? generateCSSVariables(templateSettings) : ''
  const animationClass = templateSettings ? getAnimationClass(templateSettings.animation) : ''

  return (
    <div
      className={`min-h-screen text-white relative overflow-hidden ${animationClass}`}
      style={{
        ...pageStyles,
        ...(cssVars ? { ['--template-vars' as any]: cssVars } : {}),
      }}
    >
      {/* Pattern Overlay */}
      {patternStyles && (
        <div style={patternStyles} />
      )}

      {/* Ambient LED Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Top-left red glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#C41E3A] rounded-full opacity-20 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        {/* Top-right amber glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#8B2323] rounded-full opacity-15 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        {/* Bottom-left glow */}
        <div className="absolute bottom-0 left-1/4 w-96 h-64 bg-[#C41E3A] rounded-full opacity-10 blur-[150px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        {/* Center subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-[#C41E3A]/5 to-transparent rounded-full blur-[100px]" />
        {/* Bottom-right glow */}
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-[#8B2323] rounded-full opacity-15 blur-[80px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '3s' }} />
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMTExIi8+PC9zdmc+')] opacity-30" />
      </div>

      {/* Main content wrapper */}
      <div className="relative z-10">
      {/* Warm Header - Sticky with safe area support for iPhone notch/Dynamic Island */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 shadow-lg transition-all duration-300`}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          background: 'linear-gradient(to bottom, #5C1515 0%, #7A1E1E 30%, #8B2323 60%, #9A2828 100%)'
        }}
      >
        <div className="mx-auto max-w-7xl px-4">
          {/* Top Row - Logo & Actions */}
          <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'py-1.5' : 'py-2'}`}>
            {/* Left Side - Hamburger Menu (Mobile) / Logo + Nav (Desktop) */}
            <div className="flex items-center gap-3">
              {/* Hamburger Menu - Mobile Only */}
              <button
                onClick={() => setShowMobileNav(true)}
                className={`md:hidden flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 ${isScrolled ? 'w-9 h-9' : 'w-10 h-10'}`}
                aria-label="Open menu"
              >
                <svg className={`text-white transition-all duration-300 ${isScrolled ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo - Desktop Only (left side) */}
              <div className="relative flex-shrink-0 group hidden md:block">
                <div className={`absolute bg-gradient-to-r from-amber-400 via-red-500 to-amber-400 rounded-full opacity-75 group-hover:opacity-100 blur-sm animate-pulse transition-all duration-300 ${isScrolled ? '-inset-0.5' : '-inset-1'}`} />
                <div className={`relative rounded-full bg-white shadow-xl ring-2 ring-white/50 transition-all duration-300 ${isScrolled ? 'p-0.5' : 'p-1.5'}`}>
                  {tenant.logoUrl ? (
                    <Image
                      src={tenant.logoUrl}
                      alt={`${tenant.name} logo`}
                      width={64}
                      height={64}
                      className={`rounded-full object-contain transition-all duration-300 group-hover:scale-110 ${isScrolled ? 'h-8 w-8' : 'h-12 w-12'}`}
                      unoptimized={tenant.logoUrl.startsWith('/tenant/')}
                    />
                  ) : (
                    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-amber-500 transition-all duration-300 ${isScrolled ? 'h-8 w-8 text-lg' : 'h-12 w-12 text-2xl'}`}>🍽️</div>
                  )}
                </div>
              </div>

              {/* Navigation Links - Desktop Only */}
              <nav className="hidden md:flex items-center gap-1">
                <span className="px-3 py-2 text-sm font-semibold text-white/90 hover:text-white cursor-pointer">Our Food</span>
                <span className="text-white/30">|</span>
                {cateringEnabled && (
                  <>
                    <button onClick={() => setShowCateringPanel(true)} className="px-3 py-2 text-sm font-semibold text-white/90 hover:text-white">Catering</button>
                    <span className="text-white/30">|</span>
                  </>
                )}
                <button
                  onClick={() => customerData ? setShowMembershipPanel(true) : setShowJoinModal(true)}
                  className="px-3 py-2 text-sm font-semibold text-white/90 hover:text-white"
                >
                  Our Rewards
                </button>
                <span className="text-white/30">|</span>
                <button onClick={() => setAccessibilityOpen((prev) => !prev)} className="px-3 py-2 text-sm font-semibold text-white/90 hover:text-white">Accessibility</button>
              </nav>
            </div>

            {/* Right Side - Logo (Mobile) & Location & Cart */}
            <div className="flex items-center gap-3">
              {/* Logo - Mobile Only (right side) */}
              <div className="relative flex-shrink-0 group md:hidden">
                <div className={`absolute bg-gradient-to-r from-amber-400 via-red-500 to-amber-400 rounded-full opacity-75 group-hover:opacity-100 blur-sm animate-pulse transition-all duration-300 ${isScrolled ? '-inset-0.5' : '-inset-1'}`} />
                <div className={`relative rounded-full bg-white shadow-xl ring-2 ring-white/50 transition-all duration-300 ${isScrolled ? 'p-0.5' : 'p-1'}`}>
                  {tenant.logoUrl ? (
                    <Image
                      src={tenant.logoUrl}
                      alt={`${tenant.name} logo`}
                      width={48}
                      height={48}
                      className={`rounded-full object-contain transition-all duration-300 ${isScrolled ? 'h-8 w-8' : 'h-10 w-10'}`}
                      unoptimized={tenant.logoUrl.startsWith('/tenant/')}
                    />
                  ) : (
                    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-amber-500 transition-all duration-300 ${isScrolled ? 'h-8 w-8 text-lg' : 'h-10 w-10 text-xl'}`}>🍽️</div>
                  )}
                </div>
              </div>

              {/* Location Selector */}
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-[#6B1C1C] px-3 py-2">
                <span className="text-xs text-white/60">Pickup at</span>
                <span className="text-sm font-semibold text-white">{locationDisplay || 'Select Location'}</span>
                <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Profile Icon with Dropdown */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    customerData
                      ? 'border-amber-400 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                      : 'border-white/30 text-white/80 hover:border-white hover:text-white'
                  }`}
                >
                  {customerData ? (
                    <span className="text-lg">👤</span>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
                      {customerData ? (
                        /* Member View */
                        <div className="p-4">
                          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl">
                              👤
                            </div>
                            <div>
                              <p className="font-bold text-white">{customerData.name || 'Member'}</p>
                              <p className="text-xs text-amber-300">{customerData.loyaltyPoints} points</p>
                            </div>
                          </div>

                          <button
                            onClick={() => { setShowProfileMenu(false); setShowMembershipPanel(true); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-white/80 hover:bg-white/5 transition-all"
                          >
                            <span className="text-lg">🎁</span>
                            <span className="text-sm font-medium">My Rewards</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              if (customerData?.orders && customerData.orders.length > 0) {
                                setShowReorderModal(true);
                              } else {
                                setShowMembershipPanel(true);
                              }
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-white/80 hover:bg-white/5 transition-all"
                          >
                            <span className="text-lg">🔄</span>
                            <span className="text-sm font-medium">Quick Reorder</span>
                            {customerData?.orders && customerData.orders.length > 0 && (
                              <span className="ml-auto text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold">
                                {customerData.orders.length}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => { setShowProfileMenu(false); setShowMembershipPanel(true); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-white/80 hover:bg-white/5 transition-all"
                          >
                            <span className="text-lg">📋</span>
                            <span className="text-sm font-medium">Order History</span>
                          </button>

                          <div className="border-t border-white/10 my-2"></div>

                          <button
                            onClick={async () => {
                              setShowProfileMenu(false);
                              try {
                                await fetch('/api/rewards/logout', { method: 'POST' });
                                setCustomerData(null);
                                showNotification('Signed out successfully');
                              } catch (err) {
                                console.error('Logout failed:', err);
                              }
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <span className="text-lg">🚪</span>
                            <span className="text-sm font-medium">Sign Out</span>
                          </button>
                        </div>
                      ) : (
                        /* Non-Member Onboarding View */
                        <div className="p-4">
                          <div className="text-center mb-4">
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#C41E3A] to-[#8B2323] flex items-center justify-center">
                              <span className="text-3xl">🎁</span>
                            </div>
                            <h3 className="text-lg font-bold text-white">Join Our Rewards!</h3>
                            <p className="text-sm text-white/60 mt-1">Earn points, get free food</p>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <span className="text-green-400">✓</span>
                              <span>Earn 10 points per $1 spent</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <span className="text-green-400">✓</span>
                              <span>Free birthday treat</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <span className="text-green-400">✓</span>
                              <span>Exclusive member deals</span>
                            </div>
                          </div>

                          <button
                            onClick={() => { setShowProfileMenu(false); setJoinModalMode('join'); setShowJoinModal(true); }}
                            className="w-full py-3 rounded-xl bg-[#C41E3A] text-white font-bold hover:bg-[#A01830] transition-all"
                          >
                            Join Now - It&apos;s Free!
                          </button>

                          <button
                            onClick={() => { setShowProfileMenu(false); setJoinModalMode('login'); setShowJoinModal(true); }}
                            className="w-full mt-2 py-2 text-sm text-white/60 hover:text-white transition-all"
                          >
                            Already a member? Sign In
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Promotional Banner */}
        <div className={`border-t border-white/10 ${restaurantIsOpen ? 'bg-[#6B1C1C]' : 'bg-red-900'}`}>
          <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-4">
            {restaurantIsOpen ? (
              <>
                <span className="text-amber-300 font-semibold text-sm">🎉 Order online for pickup or delivery</span>
                <span className="text-white/50">•</span>
                <span className="text-white/80 text-sm">{hoursDisplay || 'Open Daily'}</span>
              </>
            ) : (
              <>
                <span className="text-red-200 font-semibold text-sm">🚫 {restaurantClosedMessage || 'Ordering is currently closed'}</span>
                {hoursDisplay && (
                  <>
                    <span className="text-white/50">•</span>
                    <span className="text-white/80 text-sm">{hoursDisplay}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Spacer for fixed header - accounts for safe area on iPhone */}
      <div
        className="w-full"
        style={{
          height: isScrolled ? 'calc(env(safe-area-inset-top, 0px) + 56px)' : 'calc(env(safe-area-inset-top, 0px) + 72px)',
          transition: 'height 0.3s ease'
        }}
      />

      {/* Position-based sections BEFORE menu (hero, quickInfo, featuredCarousel, and early banners) */}
      {renderSectionsBeforeMenu()}

      <main id="menu" className="mx-auto max-w-7xl space-y-10 px-4 py-8">
        {notification && (
          <div className="fixed right-6 top-20 z-50 rounded-2xl bg-green-500/95 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/40">
            {notification}
          </div>
        )}


        {/* Mobile Section Navigation Shortcuts */}
        <div
          className="sticky z-30 sm:hidden bg-gradient-to-b from-[#1a0a0a] to-transparent pb-2"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 60px)' }}
        >
          <div className="flex gap-2 overflow-x-auto px-3 py-2 scrollbar-hide">
            {navSections.slice(0, 6).map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  const el = document.getElementById(`section-${section.id}`);
                  if (el) {
                    const yOffset = -160;
                    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/10 hover:bg-white/20 hover:text-white transition-all"
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Cart Button (FAB) - Mobile Only - Golden/Amber theme */}
        <button
          onClick={() => {
            const cartButton = document.querySelector('[data-cart-launcher]') as HTMLElement;
            cartButton?.click();
          }}
          className="fixed bottom-6 right-4 z-50 sm:hidden flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 shadow-xl shadow-amber-500/50 border-2 border-white/30 transition-all active:scale-95 hover:shadow-2xl hover:shadow-amber-400/60"
        >
          <span className="text-2xl">🛒</span>
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#C41E3A] text-sm font-black text-white shadow-lg ring-2 ring-white">
              {cartItemCount > 9 ? '9+' : cartItemCount}
            </span>
          )}
        </button>
        
        {/* Cart Launcher - Only rendered in root layout, header buttons trigger it */}

        {/* FeaturedCarousel is now rendered by renderSectionsBeforeMenu() based on position */}

        {/* Menu Sections with Promotional Banners Between */}
        {/* Only render sections that are in navSections to ensure category buttons match */}
        {(() => {
          // Helper: Check if a section type is enabled
          // Returns false if the section exists and is disabled, true otherwise (for backward compat)
          const isSectionEnabled = (sectionType: string): boolean => {
            const section = frontendUISections.find(s => s.type === sectionType);
            // If section doesn't exist in config, default depends on the type:
            // - Grocery/Panaderia: check enabledAddOns
            // - Others: show by default for backward compatibility
            if (!section) {
              if (sectionType === 'groceryBanner') return enabledAddOns.includes('grocery');
              if (sectionType === 'panaderiaBanner') return enabledAddOns.includes('panaderia');
              return true; // Default: show if no config exists
            }
            return section.enabled !== false;
          };

          // DISABLED: Old banner slot system - banners are now rendered by renderSectionsAfterMenu()
          // The position-based system handles all banner rendering to avoid duplicates

          // Helper returns null - banners are rendered after menu by renderSectionsAfterMenu()
          const getPromoBannerForIndex = (index: number): FrontendUISection | null => {
            return null; // Disabled - using position-based rendering instead
          };

          // DISABLED: Old slot-based banner helper
          const shouldRenderBannerAtSlot = (slotIndex: number, targetTypes: string[]): FrontendUISection | null => {
            return null; // Disabled - using position-based rendering instead
          };

          // Universal banner renderer helper
          const renderUniversalBanner = (banner: FrontendUISection): JSX.Element | null => {
            const config = banner.content;
            const type = banner.type;

            // For grocery/panaderia banners - simple CTA banner
            if (type === 'groceryBanner' || type === 'panaderiaBanner') {
              const bgColor = type === 'groceryBanner'
                ? (config.gradientFrom && config.gradientTo ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})` : 'linear-gradient(to right, #059669, #10b981, #34d399)')
                : (config.gradientFrom && config.gradientTo ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})` : 'linear-gradient(to right, #d97706, #f59e0b, #fbbf24)');

              return (
                <div
                  className="mb-10 relative overflow-hidden rounded-3xl p-1"
                  style={{ background: config.backgroundColor || bgColor }}
                >
                  <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-6 md:p-8">
                    <div className="relative flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 text-center md:text-left">
                        {config.badge && (
                          <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-4">
                            {config.badge}
                          </span>
                        )}
                        <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                          {config.title || (type === 'groceryBanner' ? 'Visit Our Grocery Store' : 'Fresh Bakery')}
                        </h3>
                        <p className="text-white/70 mb-4">
                          {config.subtitle || config.description}
                        </p>
                        {config.buttonText && config.buttonLink && (
                          <a
                            href={config.buttonLink}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-gray-900 font-black text-lg shadow-xl hover:scale-105 transition-transform"
                          >
                            {config.buttonText}
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </a>
                        )}
                      </div>
                      {config.image && (
                        <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden">
                          <img src={config.image} alt={config.title || ''} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // For weCookBanner - centered text banner
            if (type === 'weCookBanner') {
              return (
                <div
                  className="mb-10 relative overflow-hidden rounded-3xl"
                  style={{
                    background: config.gradientFrom && config.gradientTo
                      ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
                      : config.backgroundColor || 'linear-gradient(to right, #1a1a1a, #2a2a2a, #1a1a1a)',
                  }}
                >
                  <div className="relative p-8 md:p-12">
                    <div className="relative text-center">
                      {config.title && (
                        <h3
                          className="text-4xl md:text-6xl font-black mb-4 tracking-tight"
                          style={{ color: config.textColor || '#ffffff' }}
                        >
                          {config.title}
                        </h3>
                      )}
                      {(config.description || config.subtitle) && (
                        <p
                          className="text-xl mb-6 max-w-2xl mx-auto"
                          style={{ color: config.textColor ? `${config.textColor}CC` : 'rgba(255,255,255,0.7)' }}
                        >
                          {config.description || config.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // For dealStrip - compact strip banner
            if (type === 'dealStrip') {
              return (
                <div
                  className="mb-10 relative overflow-hidden rounded-2xl"
                  style={{
                    background: config.gradientFrom && config.gradientTo
                      ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
                      : config.backgroundColor || 'linear-gradient(to right, #FFD700, #FFA500)',
                  }}
                >
                  <div className="relative px-6 py-4 flex flex-wrap items-center justify-center gap-4 md:gap-8">
                    {config.title && (
                      <span className="text-lg md:text-2xl font-black" style={{ color: config.textColor || '#8B0000' }}>
                        {config.title}
                      </span>
                    )}
                    {config.subtitle && (
                      <span className="text-sm md:text-lg" style={{ color: config.textColor ? `${config.textColor}DD` : '#8B0000CC' }}>
                        {config.subtitle}
                      </span>
                    )}
                    {config.buttonText && (
                      <button className="px-6 py-2 rounded-full bg-[#8B0000] text-white font-bold hover:bg-[#6B0000] transition-colors">
                        {config.buttonText}
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            // For qualityBanner - image-heavy quality banner
            if (type === 'qualityBanner') {
              return (
                <div
                  className="mb-10 relative overflow-hidden rounded-3xl"
                  style={{
                    background: config.gradientFrom && config.gradientTo
                      ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
                      : config.backgroundColor || 'linear-gradient(to br, #1a1a1a, #2a2a2a)',
                  }}
                >
                  <div className="relative p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 text-center md:text-left">
                        {config.badge && (
                          <span className="inline-block px-4 py-1.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold uppercase tracking-wider mb-4">
                            {config.badge}
                          </span>
                        )}
                        {config.title && (
                          <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                            {config.title}
                          </h3>
                        )}
                        {config.subtitle && (
                          <p className="text-white/70">
                            {config.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // For reviewsStrip - testimonial strip
            if (type === 'reviewsStrip') {
              return (
                <div
                  className="mb-10 relative overflow-hidden rounded-2xl"
                  style={{
                    background: config.gradientFrom && config.gradientTo
                      ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
                      : config.backgroundColor || 'linear-gradient(to right, #2a2a2a, #1a1a1a)',
                  }}
                >
                  <div className="relative px-6 py-6 text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {'⭐'.repeat(5)}
                    </div>
                    {config.title && (
                      <p className="text-lg md:text-xl font-semibold text-white italic mb-2">
                        &ldquo;{config.title}&rdquo;
                      </p>
                    )}
                    {config.subtitle && (
                      <p className="text-sm text-white/60">
                        {config.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            // For promoBanner1 - return null (handled separately with bundle logic)
            return null;
          };
          
          return enrichedSections
            .filter((section) => navSections.some((navSection) => navSection.id === section.id))
            .map((section) => {
              // Find the original index in enrichedSections for banner placement
              const originalIndex = enrichedSections.findIndex((s) => s.id === section.id);

          return (
          <div key={section.id}>
            {/* DISABLED: All slot-based banner rendering has been removed.
                Banners are now ONLY rendered by renderSectionsBeforeMenu() and renderSectionsAfterMenu()
                based on their position in frontendUISections.

                This gives full control via the Menu Editor - drag sections to reorder,
                toggle enabled/disabled, and everything syncs instantly. */}

            {/* OLD SLOT 1 - REMOVED: promoBanner1 now renders via position system */}
            {false && originalIndex === 1 && (() => {
              // If a non-promoBanner1 type is assigned to this slot, use universal renderer
              if (promoBanner && promoBanner.type !== 'promoBanner1') {
                return renderUniversalBanner(promoBanner);
              }
              // For promoBanner1, use the bundle-aware logic
              if (promoBanner && promoBanner.type === 'promoBanner1') {
                const config = promoBanner.content;
                // Get first bundle for fallback
                const featuredBundle = popularPackages.find(pkg =>
                  (pkg.category === 'bundle' || pkg.category === 'popular') && pkg.available
                ) || popularPackages[0];

                if (!featuredBundle && !config.title) return null;

                const displayImage = config.image || featuredBundle?.image || cycleFallbackImage(40);
                const title = config.title || featuredBundle?.name || '';
                const description = config.description || config.subtitle || featuredBundle?.description || '';
                const buttonText = config.buttonText || 'Order Bundle';
                const badge = config.badge || featuredBundle?.badge;

                return (
                  <div 
                    className="mb-10 relative overflow-hidden rounded-3xl p-1"
                    style={{
                      background: config.gradientFrom && config.gradientTo
                        ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
                        : config.backgroundColor || 'linear-gradient(to right, #8B0000, #B22222, #6B0F0F)',
                    }}
                  >
                    <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1a0a0a] to-[#2a1515] p-6 md:p-8">
                      <div className="relative grid md:grid-cols-2 gap-6 items-center">
                        <div>
                          {badge && (
                            <span className="inline-block px-4 py-1.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold uppercase tracking-wider mb-4">
                              {badge}
                            </span>
                          )}
                          {title && (
                            <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                              {title}
                            </h3>
                          )}
                          {description && (
                            <p className="text-white/70 mb-4">{description}</p>
                          )}
                          {buttonText && (
                            <button
                              onClick={() => {
                                if (config.buttonLink) {
                                  window.location.href = config.buttonLink;
                                } else if (featuredBundle) {
                                  setShowCateringPanel(false);
                                  setCustomModal({
                                    item: {
                                      id: featuredBundle.id,
                                      name: featuredBundle.name,
                                      description: featuredBundle.description,
                                      price: featuredBundle.price || featuredBundle.pricePerGuest,
                                      category: 'bundle',
                                      available: featuredBundle.available,
                                      displayImage: displayImage,
                                      sectionType: 'SPECIAL',
                                      displayGallery: featuredBundle.gallery && featuredBundle.gallery.length > 0
                                        ? featuredBundle.gallery
                                        : [displayImage],
                                    },
                                    config: {
                                      removals: featuredBundle.customizationRemovals || [],
                                      addons: featuredBundle.customizationAddons || [],
                                    },
                                  });
                                }
                              }}
                              className="mt-6 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#8B0000] font-black text-lg shadow-xl hover:scale-105 transition-transform"
                            >
                              {buttonText}
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {displayImage && (
                          <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-[#2a1515] to-[#1a0a0a]">
                            <img
                              src={displayImage}
                              alt={title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = cycleFallbackImage(40);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Fallback to original bundle logic
              // Check if promoBanner1 is enabled before showing fallback
              if (!isSectionEnabled('promoBanner1')) return null;

              const featuredBundle = popularPackages.find(pkg =>
                (pkg.category === 'bundle' || pkg.category === 'popular') && pkg.available
              ) || popularPackages[0];

              if (!featuredBundle) return null;

              const displayImage = featuredBundle.image || cycleFallbackImage(40);
              const originalPrice = (featuredBundle as any).originalPrice || null;
              const savings = originalPrice && featuredBundle.price
                ? originalPrice - featuredBundle.price
                : null;

              return (
                <div className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8B0000] via-[#B22222] to-[#6B0F0F] p-1">
                  <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1a0a0a] to-[#2a1515] p-6 md:p-8">
                    {/* Texture overlay */}
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }} />

                    {/* Sparkle decorations */}
                    <div className="absolute top-4 left-4 text-2xl animate-pulse">✨</div>
                    <div className="absolute top-6 right-8 text-xl animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
                    <div className="absolute bottom-4 right-4 text-2xl animate-pulse" style={{ animationDelay: '1s' }}>✨</div>

                    <div className="relative grid md:grid-cols-2 gap-6 items-center">
                      <div>
                        {featuredBundle.badge && (
                          <span className="inline-block px-4 py-1.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold uppercase tracking-wider mb-4">
                            {featuredBundle.badge}
                          </span>
                        )}
                        <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                          {featuredBundle.name}
                        </h3>
                        <p className="text-white/70 mb-4">
                          {featuredBundle.description}
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="text-4xl font-black text-[#FFD700]">
                            ${featuredBundle.price ? featuredBundle.price.toFixed(2) : featuredBundle.pricePerGuest.toFixed(2)}
                          </span>
                          {originalPrice && (
                            <>
                              <span className="text-lg text-white/50 line-through">
                                ${originalPrice.toFixed(2)}
                              </span>
                              {savings && savings > 0 && (
                                <span className="px-3 py-1 rounded-full bg-[#FF4444] text-white text-sm font-bold">
                                  Save ${savings.toFixed(2)}!
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setShowCateringPanel(false);
                            setCustomModal({
                              item: {
                                id: featuredBundle.id,
                                name: featuredBundle.name,
                                description: featuredBundle.description,
                                price: featuredBundle.price || featuredBundle.pricePerGuest,
                                category: 'bundle',
                                available: featuredBundle.available,
                                displayImage: displayImage,
                                sectionType: 'SPECIAL',
                                displayGallery: featuredBundle.gallery && featuredBundle.gallery.length > 0
                                  ? featuredBundle.gallery
                                  : [displayImage],
                              },
                              config: {
                                removals: featuredBundle.customizationRemovals || [],
                                addons: featuredBundle.customizationAddons || [],
                              },
                            });
                          }}
                          className="mt-6 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#8B0000] font-black text-lg shadow-xl hover:scale-105 transition-transform"
                        >
                          Order Bundle
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </div>
                      <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-[#2a1515] to-[#1a0a0a]">
                        <img
                          src={displayImage}
                          alt={featuredBundle.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = cycleFallbackImage(40);
                          }}
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.15)_0%,transparent_70%)]" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* OLD SLOT 3 - REMOVED: weCookBanner now renders via position system */}
            {false && originalIndex === 3 && (() => {
              const slotBanner = getPromoBannerForIndex(3);
              // Use universal renderer for any banner type assigned to this slot
              if (slotBanner && slotBanner.type !== 'weCookBanner') {
                return renderUniversalBanner(slotBanner);
              }
              // Original weCookBanner logic
              if (slotBanner && slotBanner.type === 'weCookBanner') {
                const config = slotBanner.content;
                return (
                  <div 
                    className="mb-10 relative overflow-hidden rounded-3xl"
                    style={{
                      background: config.gradientFrom && config.gradientTo
                        ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
                        : config.backgroundColor || 'linear-gradient(to right, #1a1a1a, #2a2a2a, #1a1a1a)',
                    }}
                  >
                    <div className="relative p-8 md:p-12">
                      <div className="relative text-center">
                        {config.title && (
                          <h3 
                            className="text-4xl md:text-6xl font-black mb-4 tracking-tight"
                            style={{ color: config.textColor || '#ffffff' }}
                          >
                            {config.title}
                          </h3>
                        )}
                        {(config.description || config.subtitle) && (
                          <p 
                            className="text-xl mb-6 max-w-2xl mx-auto"
                            style={{ color: config.textColor ? `${config.textColor}CC` : 'rgba(255,255,255,0.7)' }}
                          >
                            {config.description || config.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Fallback to original
              // Check if weCookBanner is enabled before showing fallback
              if (!isSectionEnabled('weCookBanner')) return null;

              // Get first bundle with category='bundle' or 'popular' that should be featured
              const featuredBundle = popularPackages.find(pkg =>
                (pkg.category === 'bundle' || pkg.category === 'popular') && pkg.available
              ) || popularPackages[0];

              if (!featuredBundle) return null;

              // Use fallback image pattern like other sections
              const displayImage = featuredBundle.image || cycleFallbackImage(40);

              const originalPrice = (featuredBundle as any).originalPrice || null;
              const savings = originalPrice && featuredBundle.price
                ? originalPrice - featuredBundle.price
                : null;

              return (
                <div className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8B0000] via-[#B22222] to-[#6B0F0F] p-1">
                  <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1a0a0a] to-[#2a1515] p-6 md:p-8">
                    {/* Texture overlay */}
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }} />

                    {/* Sparkle decorations */}
                    <div className="absolute top-4 left-4 text-2xl animate-pulse">✨</div>
                    <div className="absolute top-6 right-8 text-xl animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
                    <div className="absolute bottom-4 right-4 text-2xl animate-pulse" style={{ animationDelay: '1s' }}>✨</div>

                    <div className="relative grid md:grid-cols-2 gap-6 items-center">
                      <div>
                        {featuredBundle.badge && (
                          <span className="inline-block px-4 py-1.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold uppercase tracking-wider mb-4">
                            {featuredBundle.badge}
                          </span>
                        )}
                        <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                          {featuredBundle.name}
                        </h3>
                        <p className="text-white/70 mb-4">
                          {featuredBundle.description}
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="text-4xl font-black text-[#FFD700]">
                            ${featuredBundle.price ? featuredBundle.price.toFixed(2) : featuredBundle.pricePerGuest.toFixed(2)}
                          </span>
                          {originalPrice && (
                            <>
                              <span className="text-lg text-white/50 line-through">
                                ${originalPrice.toFixed(2)}
                              </span>
                              {savings && savings > 0 && (
                                <span className="px-3 py-1 rounded-full bg-[#FF4444] text-white text-sm font-bold">
                                  Save ${savings.toFixed(2)}!
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setShowCateringPanel(false);
                            setCustomModal({
                              item: {
                                id: featuredBundle.id,
                                name: featuredBundle.name,
                                description: featuredBundle.description,
                                price: featuredBundle.price || featuredBundle.pricePerGuest,
                                category: 'bundle',
                                available: featuredBundle.available,
                                displayImage: displayImage,
                                sectionType: 'SPECIAL',
                                displayGallery: featuredBundle.gallery && featuredBundle.gallery.length > 0
                                  ? featuredBundle.gallery
                                  : [displayImage],
                              },
                              config: {
                                removals: featuredBundle.customizationRemovals || [],
                                addons: featuredBundle.customizationAddons || [],
                              },
                            });
                          }}
                          className="mt-6 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#8B0000] font-black text-lg shadow-xl hover:scale-105 transition-transform"
                        >
                          Order Bundle
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </div>
                      <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-[#2a1515] to-[#1a0a0a]">
                        <img
                          src={displayImage}
                          alt={featuredBundle.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = cycleFallbackImage(40);
                          }}
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.15)_0%,transparent_70%)]" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* OLD SLOT 5 - REMOVED: dealStrip now renders via position system */}
            {false && originalIndex === 5 && (() => {
              const slotBanner = getPromoBannerForIndex(5);
              // Use universal renderer for any banner type assigned to this slot
              if (slotBanner && slotBanner.type !== 'dealStrip') {
                return renderUniversalBanner(slotBanner);
              }
              // Original dealStrip logic
              if (slotBanner && slotBanner.type === 'dealStrip') {
                const config = slotBanner.content;
                return (
                  <div 
                    className="mb-10 relative overflow-hidden rounded-2xl p-0.5"
                    style={{
                      background: config.gradientFrom && config.gradientTo
                        ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
                        : config.backgroundColor || 'linear-gradient(to right, #FFD700, #FFA500, #FFD700)',
                    }}
                  >
                    <div className="bg-[#1a1a1a] rounded-[14px] px-6 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-10 h-10">
                            <div className="absolute inset-0 bg-[#FFD700] rounded-full animate-ping opacity-30" />
                            <div className="absolute inset-2 bg-gradient-to-br from-[#FFD700] to-[#FF6B00] rounded-full animate-pulse" />
                            <svg className="absolute inset-0 w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L9 9H2l5.5 4.5L5 22l7-5 7 5-2.5-8.5L22 9h-7L12 2z" />
                            </svg>
                          </div>
                          <div>
                            {config.title && (
                              <p 
                                className="font-black text-lg"
                                style={{ color: config.textColor || '#FFD700' }}
                              >
                                {config.title}
                              </p>
                            )}
                            {(config.subtitle || config.description) && (
                              <p 
                                className="text-sm"
                                style={{ color: config.textColor ? `${config.textColor}99` : 'rgba(255,255,255,0.6)' }}
                              >
                                {config.subtitle || config.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {config.buttonText && (
                          <button
                            onClick={() => {
                              if (config.buttonLink) {
                                window.location.href = config.buttonLink;
                              } else {
                                const firstSection = enrichedSections.find(s => s.name.toLowerCase().includes('taco'));
                                if (firstSection) {
                                  const element = document.getElementById(`section-${firstSection.id}`);
                                  element?.scrollIntoView({ behavior: isSafariBrowser ? 'auto' : 'smooth' });
                                }
                              }
                            }}
                            className="px-6 py-2.5 rounded-full bg-[#FFD700] text-[#8B0000] font-bold hover:bg-white transition-colors"
                          >
                            {config.buttonText}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Fallback to original
              // Check if dealStrip is enabled before showing fallback
              if (!isSectionEnabled('dealStrip')) return null;

              return (
                <div className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] p-0.5">
                  <div className="bg-[#1a1a1a] rounded-[14px] px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-10 h-10">
                          <div className="absolute inset-0 bg-[#FFD700] rounded-full animate-ping opacity-30" />
                          <div className="absolute inset-2 bg-gradient-to-br from-[#FFD700] to-[#FF6B00] rounded-full animate-pulse" />
                          <svg className="absolute inset-0 w-full h-full text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L9 9H2l5.5 4.5L5 22l7-5 7 5-2.5-8.5L22 9h-7L12 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[#FFD700] font-black text-lg">LUNCH SPECIAL</p>
                          <p className="text-white/60 text-sm">Any 2 tacos + drink for $8.99</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white/40 text-sm">11am - 3pm Daily</span>
                        <button
                          onClick={() => {
                            const firstSection = enrichedSections.find(s => s.name.toLowerCase().includes('taco'));
                            if (firstSection) {
                              const element = document.getElementById(`section-${firstSection.id}`);
                              element?.scrollIntoView({ behavior: isSafariBrowser ? 'auto' : 'smooth' });
                            }
                          }}
                          className="px-6 py-2.5 rounded-full bg-[#FFD700] text-[#8B0000] font-bold hover:bg-white transition-colors"
                        >
                          Get Deal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* OLD SLOT 2 - REMOVED: groceryBanner/panaderiaBanner now renders via position system */}
            {false && originalIndex === 2 && (() => {
              const slotBanner = getPromoBannerForIndex(2);
              // Use universal renderer for any banner type (except groceryBanner/panaderiaBanner which have custom styling)
              if (slotBanner && !['groceryBanner', 'panaderiaBanner'].includes(slotBanner.type)) {
                return renderUniversalBanner(slotBanner);
              }
              // Panaderia Banner (amber/orange theme)
              if (slotBanner && slotBanner.type === 'panaderiaBanner') {
                const config = slotBanner.content;
                return (
                  <div
                    className="mb-10 relative overflow-hidden rounded-3xl p-1"
                    style={{
                      background: config.gradientFrom && config.gradientTo
                        ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
                        : config.backgroundColor || 'linear-gradient(to right, #d97706, #f59e0b, #fbbf24)',
                    }}
                  >
                    <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-amber-950 to-amber-900 p-6 md:p-8">
                      <div className="relative grid md:grid-cols-2 gap-6 items-center">
                        <div>
                          {config.badge && (
                            <div className="inline-block px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
                              {config.badge}
                            </div>
                          )}
                          <div className="text-4xl mb-3">🥐</div>
                          {config.title && (
                            <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                              {config.title}
                            </h3>
                          )}
                          {(config.description || config.subtitle) && (
                            <p className="text-white/80 mb-6 text-lg">
                              {config.description || config.subtitle}
                            </p>
                          )}
                          {config.buttonText && (
                            <Link
                              href={config.buttonLink || '/bakery'}
                              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg hover:scale-105 transition-transform"
                            >
                              {config.buttonText}
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </Link>
                          )}
                        </div>
                        {config.image && (
                          <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden">
                            <img
                              src={config.image}
                              alt={config.title || 'Bakery'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Grocery Banner (green theme)
              if (slotBanner && slotBanner.type === 'groceryBanner') {
                const config = slotBanner.content;
                return (
                  <div
                    className="mb-10 relative overflow-hidden rounded-3xl p-1"
                    style={{
                      background: config.gradientFrom && config.gradientTo
                        ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
                        : config.backgroundColor || 'linear-gradient(to right, #065f46, #059669, #047857)',
                    }}
                  >
                    <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-green-950 to-green-900 p-6 md:p-8">
                      <div className="relative grid md:grid-cols-2 gap-6 items-center">
                        <div>
                          {config.badge && (
                            <div className="inline-block px-4 py-1.5 rounded-full bg-green-400/20 text-green-300 text-xs font-bold uppercase tracking-wider mb-3">
                              {config.badge}
                            </div>
                          )}
                          {config.title && (
                            <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                              {config.title}
                            </h3>
                          )}
                          {(config.description || config.subtitle) && (
                            <p className="text-white/80 mb-6 text-lg">
                              {config.description || config.subtitle}
                            </p>
                          )}
                          {config.buttonText && (
                            <Link
                              href={config.buttonLink || '/grocery'}
                              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-lg hover:scale-105 transition-transform"
                            >
                              {config.buttonText}
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </Link>
                          )}
                        </div>
                        {config.image && (
                          <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden">
                            <img
                              src={config.image}
                              alt={config.title || 'Grocery'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Fallback to original grocery banner if no specific banner configured
              // Only show fallback if 'grocery' is in enabledAddOns
              // This is the primary control - if grocery add-on is disabled, don't show any grocery banner
              const groceryAddOnEnabled = enabledAddOns.includes('grocery');
              if (!groceryAddOnEnabled) return null;

              return (
                <div className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-700 via-green-600 to-green-700 p-1">
                  <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-green-950 to-green-900 p-6 md:p-8">
                    <div className="relative grid md:grid-cols-2 gap-6 items-center">
                      <div>
                        <div className="inline-block px-4 py-1.5 rounded-full bg-green-400/20 text-green-300 text-xs font-bold uppercase tracking-wider mb-3">
                          ✨ Now Available
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                          Order Your <span className="text-green-400">Groceries</span> Too!
                        </h3>
                        <p className="text-white/80 mb-6 text-lg">
                          Fresh produce, pantry staples, and more delivered with your meal order. Save time, shop smart!
                        </p>
                        <Link
                          href="/grocery"
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-lg hover:scale-105 transition-transform"
                        >
                          Browse Grocery Store
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* OLD SLOT 7 - REMOVED: qualityBanner now renders via position system */}
            {false && originalIndex === 7 && (() => {
              const slotBanner = getPromoBannerForIndex(7);
              // Use universal renderer for any banner type assigned to this slot
              if (slotBanner && slotBanner.type !== 'qualityBanner') {
                return renderUniversalBanner(slotBanner);
              }
              // Original qualityBanner logic
              if (slotBanner && slotBanner.type === 'qualityBanner') {
                const config = slotBanner.content;
                return (
                  <div 
                    className="mb-10 relative overflow-hidden rounded-3xl p-8 md:p-10 border"
                    style={{
                      background: config.gradientFrom && config.gradientTo
                        ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
                        : config.backgroundColor || 'linear-gradient(to right, rgba(6,78,59,0.8), rgba(5,150,105,0.8), rgba(4,120,87,0.8))',
                      borderColor: config.textColor ? `${config.textColor}33` : 'rgba(16,185,129,0.2)',
                    }}
                  >
                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left">
                        {config.badge && (
                          <div 
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
                            style={{
                              backgroundColor: config.textColor ? `${config.textColor}20` : 'rgba(16,185,129,0.2)',
                              color: config.textColor || '#6ee7b7',
                            }}
                          >
                            {config.badge}
                          </div>
                        )}
                        {config.title && (
                          <h3 
                            className="text-3xl md:text-4xl font-black mb-2"
                            style={{ color: config.textColor || '#ffffff' }}
                          >
                            {config.title}
                          </h3>
                        )}
                        {(config.description || config.subtitle) && (
                          <p 
                            className="max-w-md"
                            style={{ color: config.textColor ? `${config.textColor}CC` : 'rgba(209,250,229,0.7)' }}
                          >
                            {config.description || config.subtitle}
                          </p>
                        )}
                      </div>
                      {config.image && (
                        <div className="relative h-32 w-32 rounded-xl overflow-hidden">
                          <img
                            src={config.image}
                            alt={config.title || 'Quality'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Fallback to original
              // Check if qualityBanner is enabled before showing fallback
              if (!isSectionEnabled('qualityBanner')) return null;

              return (
                <div className="mb-10 relative overflow-hidden rounded-3xl">
                  <div className="relative bg-gradient-to-r from-emerald-900/80 via-emerald-800/80 to-emerald-900/80 p-8 md:p-10 border border-emerald-500/20">
                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Fresh Guarantee
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black text-white mb-2">
                          Quality You Can <span className="text-emerald-400">Taste</span>
                        </h3>
                        <p className="text-emerald-100/70 max-w-md">
                          All ingredients sourced fresh daily from local suppliers
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                          <div className="text-3xl font-black text-emerald-400">100%</div>
                          <div className="text-xs text-white/60 mt-1">Fresh Daily</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                          <div className="text-3xl font-black text-emerald-400">Local</div>
                          <div className="text-xs text-white/60 mt-1">Sourced</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* OLD SLOT 9 - REMOVED: reviewsStrip now renders via position system */}
            {false && originalIndex === 9 && (() => {
              const slotBanner = getPromoBannerForIndex(9);
              // Use universal renderer for any banner type assigned to this slot
              if (slotBanner && slotBanner.type !== 'reviewsStrip') {
                return renderUniversalBanner(slotBanner);
              }
              // Original reviewsStrip logic
              if (slotBanner && slotBanner.type === 'reviewsStrip') {
                const config = slotBanner.content;
                return (
                  <div 
                    className="mb-10 relative overflow-hidden rounded-2xl border p-6 md:p-8"
                    style={{
                      background: config.gradientFrom && config.gradientTo
                        ? `linear-gradient(to right, ${config.gradientFrom}, ${config.gradientTo})`
                        : config.backgroundColor || 'linear-gradient(to right, rgba(88,28,135,0.5), rgba(190,24,93,0.5), rgba(88,28,135,0.5))',
                      borderColor: config.textColor ? `${config.textColor}33` : 'rgba(168,85,247,0.2)',
                    }}
                  >
                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left">
                        {config.title && (
                          <p 
                            className="text-lg font-medium mb-2"
                            style={{ color: config.textColor ? `${config.textColor}CC` : 'rgba(255,255,255,0.8)' }}
                          >
                            &ldquo;{config.title}&rdquo;
                          </p>
                        )}
                        {(config.subtitle || config.description) && (
                          <p 
                            className="text-sm mt-1"
                            style={{ color: config.textColor ? `${config.textColor}99` : 'rgba(196,181,253,0.6)' }}
                          >
                            — {config.subtitle || config.description}
                          </p>
                        )}
                      </div>
                      {config.buttonText && (
                        <button
                          onClick={() => {
                            if (config.buttonLink) {
                              window.open(config.buttonLink, '_blank');
                            } else {
                              window.open('https://www.google.com/maps', '_blank');
                            }
                          }}
                          className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 font-semibold hover:bg-white/20 transition-all"
                          style={{ color: config.textColor || '#ffffff' }}
                        >
                          {config.buttonText}
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // Fallback to original
              // Check if reviewsStrip is enabled before showing fallback
              if (!isSectionEnabled('reviewsStrip')) return null;

              return (
                <div className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-purple-900/50 border border-purple-500/20 p-6 md:p-8">
                  <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                      <div className="flex items-center gap-1 mb-2 justify-center md:justify-start">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-white font-bold">4.9</span>
                      </div>
                      <p className="text-white/80 text-lg font-medium">&ldquo;Best authentic Mexican food in town!&rdquo;</p>
                      <p className="text-purple-300/60 text-sm mt-1">— Over 500+ 5-star reviews</p>
                    </div>
                    <button
                      onClick={() => window.open('https://www.google.com/maps', '_blank')}
                      className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
                    >
                      Read Reviews
                    </button>
                  </div>
                </div>
              );
            })()}

            <section
              id={`section-${section.id}`}
              ref={(el) => {
                sectionRefs.current[section.id] = el;
              }}
              className="scroll-mt-40 mb-10"
            >
              {/* Section Header with varied styles based on index */}
              <header className="mb-6">
                {originalIndex % 4 === 0 ? (
                  // Style 1: Classic with underline accent
                  <div className="relative pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{SECTION_ICONS[section.type] || '🍽️'}</span>
                      <h2 className="text-3xl font-black text-white">{section.name}</h2>
                    </div>
                    {section.description && (
                      <p className="text-base text-white/60 ml-12">{section.description}</p>
                    )}
                    <div className="absolute bottom-0 left-0 w-24 h-1 rounded-full bg-gradient-to-r from-[#C41E3A] to-[#FF6B6B]" />
                  </div>
                ) : originalIndex % 4 === 1 ? (
                  // Style 2: Centered with badge
                  <div className="text-center mb-8">
                    <span className="inline-block text-4xl mb-2">{SECTION_ICONS[section.type] || '🍽️'}</span>
                    <h2 className="text-3xl font-black text-white mb-2">{section.name}</h2>
                    {section.description && (
                      <p className="text-base text-white/50 max-w-lg mx-auto">{section.description}</p>
                    )}
                    <div className="mt-3 flex justify-center gap-1">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-[#C41E3A]/60" />
                      ))}
                    </div>
                  </div>
                ) : originalIndex % 4 === 2 ? (
                  // Style 3: Card style with background
                  <div className="bg-white/[0.03] rounded-2xl p-4 mb-4 border border-white/[0.08]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#C41E3A] to-[#FF6B6B] flex items-center justify-center text-2xl shadow-lg">
                        {SECTION_ICONS[section.type] || '🍽️'}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{section.name}</h2>
                        {section.description && (
                          <p className="text-sm text-white/50">{section.description}</p>
                        )}
                      </div>
                      <span className="ml-auto text-sm text-white/40 bg-white/5 px-3 py-1 rounded-full">
                        {section.items.length} items
                      </span>
                    </div>
                  </div>
                ) : (
                  // Style 4: Minimal with side accent
                  <div className="flex items-stretch gap-4 mb-4">
                    <div className="w-1 rounded-full bg-gradient-to-b from-[#FFD700] to-[#C41E3A]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{SECTION_ICONS[section.type] || '🍽️'}</span>
                        <h2 className="text-2xl font-bold text-white">{section.name}</h2>
                      </div>
                      {section.description && (
                        <p className="text-sm text-white/50 mt-1">{section.description}</p>
                      )}
                    </div>
                  </div>
                )}
              </header>
              <MenuSectionGrid
                section={section}
                layout={activeLayout}
                onAddToCart={handleAddToCart}
                onCustomize={openCustomization}
              />
            </section>
          </div>
          );
        });
        })()}

        {/* Position-based sections AFTER menu (banners with position > menuSections) */}
        {renderSectionsAfterMenu()}
      </main>

      {/* Catering Slide-In Panel */}
      {showCateringPanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCateringPanel(false)}
          />
          {/* Side Panel */}
          <div className="fixed right-0 top-0 z-[60] h-full w-full max-w-2xl overflow-y-auto bg-gradient-to-br from-[#2D1810] via-[#1A0F08] to-black p-8 shadow-2xl transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-black text-amber-100">🎉 Catering Services</h2>
              <button
                onClick={() => setShowCateringPanel(false)}
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
                  unoptimized={cateringGallery[cateringGalleryIndex]?.startsWith('/tenant/')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">
                    {cateringTabConfig?.modalTagline || tenant.name}
                  </p>
                  <h3 className="text-2xl font-black text-white">
                    {cateringTabConfig?.modalHeading || 'Catering for Every Occasion'}
                  </h3>
                </div>
              </div>
              {/* Gallery navigation */}
              {cateringGallery.length > 1 && (
                <>
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
                  {/* Gallery indicators - only show if more than 1 image */}
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {cateringGallery.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCateringGalleryIndex(index)}
                        className={`h-1.5 rounded-full transition-all ${
                          index === cateringGalleryIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Menu Highlights - Clickable Catering Options (Database-driven) */}
            {popularPackages.length > 0 && (
              <div className="mb-8 space-y-4 rounded-2xl border-2 border-amber-500/20 bg-gradient-to-br from-amber-400/10 to-orange-500/10 p-6">
                <h4 className="text-xl font-bold text-amber-100">Popular Catering Options</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {popularPackages.map((pkg) => {
                    const displayImage = pkg.image || cycleFallbackImage(40);
                    const displayGallery = pkg.gallery && pkg.gallery.length > 0 ? pkg.gallery : [displayImage];
                    const priceText = pkg.price
                      ? `$${pkg.price.toFixed(0)}`
                      : `From $${pkg.pricePerGuest.toFixed(0)}/person`;

                    return (
                      <button
                        key={pkg.id}
                        onClick={() => {
                          setShowCateringPanel(false);
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
                              displayGallery,
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

            {/* Fallback: Original hardcoded Popular Catering Options (shown only if no database packages) */}
            {popularPackages.length === 0 && (
              <div className="mb-8 space-y-4 rounded-2xl border-2 border-amber-500/20 bg-gradient-to-br from-amber-400/10 to-orange-500/10 p-6">
                <h4 className="text-xl font-bold text-amber-100">Popular Catering Options</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => {
                    setShowCateringPanel(false);
                    setCustomModal({
                      item: {
                        id: 'catering-taco-bar',
                        name: 'Taco Bar Catering',
                        description: 'Choice of 3 proteins, fresh toppings, salsas, tortillas. Perfect for events and parties.',
                        price: 12,
                        category: 'catering',
                        available: true,
                        displayImage: cycleFallbackImage(40),
                        sectionType: 'CATERING',
                        displayGallery: [cycleFallbackImage(40), cycleFallbackImage(41)],
                      },
                      config: {
                        removals: ['Onions', 'Cilantro', 'Spicy Salsa'],
                        addons: [
                          { id: 'guac', label: 'Add Guacamole', price: 2 },
                          { id: 'queso', label: 'Add Queso', price: 1.5 },
                          { id: 'churros', label: 'Add Churros Dessert', price: 3 },
                        ],
                      },
                    });
                  }}
                  className="rounded-xl border border-amber-400/30 bg-black/30 p-4 text-left transition hover:border-amber-400 hover:bg-black/40"
                >
                  <h5 className="font-bold text-amber-200">Taco Bar</h5>
                  <p className="mt-1 text-sm text-white/70">Choice of 3 proteins, fresh toppings, salsas</p>
                  <p className="mt-2 text-xs text-amber-300">From $12/person · Click to customize</p>
                </button>
                <button
                  onClick={() => {
                    setShowCateringPanel(false);
                    setCustomModal({
                      item: {
                        id: 'catering-family-platters',
                        name: 'Family Platters Catering',
                        description: 'Enchiladas, rice, beans, salad. Serves 10-15 people.',
                        price: 120,
                        category: 'catering',
                        available: true,
                        displayImage: cycleFallbackImage(41),
                        sectionType: 'CATERING',
                        displayGallery: [cycleFallbackImage(41), cycleFallbackImage(42)],
                      },
                      config: {
                        removals: ['Lettuce', 'Tomatoes', 'Sour Cream'],
                        addons: [
                          { id: 'extra-rice', label: 'Extra Rice & Beans', price: 15 },
                          { id: 'flan', label: 'Add Flan Dessert', price: 20 },
                          { id: 'drinks', label: 'Aguas Frescas (2 gal)', price: 25 },
                        ],
                      },
                    });
                  }}
                  className="rounded-xl border border-amber-400/30 bg-black/30 p-4 text-left transition hover:border-amber-400 hover:bg-black/40"
                >
                  <h5 className="font-bold text-amber-200">Family Platters</h5>
                  <p className="mt-1 text-sm text-white/70">Enchiladas, rice, beans, salad</p>
                  <p className="mt-2 text-xs text-amber-300">Serves 10-15 · Click to customize</p>
                </button>
                <button
                  onClick={() => {
                    setShowCateringPanel(false);
                    setCustomModal({
                      item: {
                        id: 'catering-breakfast',
                        name: 'Breakfast Catering',
                        description: 'Breakfast burritos, chilaquiles, pan dulce. Start your event right!',
                        price: 10,
                        category: 'catering',
                        available: true,
                        displayImage: cycleFallbackImage(42),
                        sectionType: 'CATERING',
                        displayGallery: [cycleFallbackImage(42), cycleFallbackImage(43)],
                      },
                      config: {
                        removals: ['Eggs', 'Cheese', 'Beans'],
                        addons: [
                          { id: 'coffee', label: 'Add Coffee Service', price: 2.5 },
                          { id: 'juice', label: 'Add Orange Juice', price: 1.5 },
                          { id: 'fruit', label: 'Fruit Platter', price: 3 },
                        ],
                      },
                    });
                  }}
                  className="rounded-xl border border-amber-400/30 bg-black/30 p-4 text-left transition hover:border-amber-400 hover:bg-black/40"
                >
                  <h5 className="font-bold text-amber-200">Breakfast Catering</h5>
                  <p className="mt-1 text-sm text-white/70">Breakfast burritos, chilaquiles, pan dulce</p>
                  <p className="mt-2 text-xs text-amber-300">From $10/person · Click to customize</p>
                </button>
                <button
                  onClick={() => {
                    setShowCateringPanel(false);
                    setCustomModal({
                      item: {
                        id: 'catering-dessert',
                        name: 'Dessert Packages',
                        description: 'Tres leches, churros, conchas. Sweet endings for your celebration.',
                        price: 4,
                        category: 'catering',
                        available: true,
                        displayImage: cycleFallbackImage(43),
                        sectionType: 'CATERING',
                        displayGallery: [cycleFallbackImage(43), cycleFallbackImage(44)],
                      },
                      config: {
                        removals: ['Whipped Cream', 'Chocolate Drizzle'],
                        addons: [
                          { id: 'ice-cream', label: 'Add Ice Cream', price: 1.5 },
                          { id: 'coffee-service', label: 'Coffee & Tea Service', price: 2 },
                          { id: 'champurrado', label: 'Hot Champurrado', price: 1 },
                        ],
                      },
                    });
                  }}
                  className="rounded-xl border border-amber-400/30 bg-black/30 p-4 text-left transition hover:border-amber-400 hover:bg-black/40"
                >
                  <h5 className="font-bold text-amber-200">Dessert Packages</h5>
                  <p className="mt-1 text-sm text-white/70">Tres leches, churros, conchas</p>
                  <p className="mt-2 text-xs text-amber-300">From $4/person · Click to customize</p>
                </button>
              </div>
            </div>
            )}

            {/* Upsell Bundles - Holiday & Event Packages (Database-driven) */}
            {holidayPackages.length > 0 && (
              <div className="mb-8 space-y-4 rounded-2xl border-2 border-red-600/20 bg-gradient-to-br from-red-600/10 to-orange-500/10 p-6">
                <h4 className="text-xl font-bold text-red-200">🎉 Holiday & Event Bundles</h4>
                <p className="text-sm text-white/70">Pre-packaged bundles perfect for celebrations</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {holidayPackages.map((pkg) => {
                    const displayImage = pkg.image || cycleFallbackImage(50);
                    const displayGallery = pkg.gallery && pkg.gallery.length > 0 ? pkg.gallery : [displayImage];
                    const priceText = pkg.price
                      ? `$${pkg.price.toFixed(0)}`
                      : `From $${pkg.pricePerGuest.toFixed(0)}/person`;

                    return (
                      <button
                        key={pkg.id}
                        onClick={() => {
                          setShowCateringPanel(false);
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
                              displayGallery,
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
                            <svg className="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add →
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Holiday Packages Fallback - only show if no database packages */}
            {holidayPackages.length === 0 && (
              <div className="mb-8 space-y-4 rounded-2xl border-2 border-red-600/20 bg-gradient-to-br from-red-600/10 to-orange-500/10 p-6">
                <h4 className="text-xl font-bold text-red-200">🎉 Holiday & Event Bundles</h4>
                <p className="text-sm text-white/70">Pre-packaged bundles perfect for celebrations</p>
                <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => {
                    setShowCateringPanel(false);
                    setCustomModal({
                      item: {
                        id: 'bundle-thanksgiving',
                        name: 'Thanksgiving Dinner Bundle',
                        description: 'Complete feast: Roasted turkey, mole, rice, beans, tortillas, salsa verde, dessert tray. Serves 8-10.',
                        price: 280,
                        category: 'catering',
                        available: true,
                        displayImage: cycleFallbackImage(50),
                        sectionType: 'CATERING',
                        displayGallery: [cycleFallbackImage(50), cycleFallbackImage(51)],
                      },
                      config: {
                        removals: ['Mole Sauce', 'Cilantro', 'Turkey Gravy'],
                        addons: [
                          { id: 'extra-turkey', label: 'Extra Turkey (5 lbs)', price: 40 },
                          { id: 'cranberry', label: 'Cranberry Sauce', price: 10 },
                          { id: 'pumpkin-pie', label: 'Pumpkin Pie', price: 25 },
                          { id: 'wine', label: 'Wine Pairing (2 bottles)', price: 50 },
                        ],
                      },
                    });
                  }}
                  className="group relative overflow-hidden rounded-xl border border-red-500/30 bg-black/40 p-5 text-left transition hover:border-red-500 hover:bg-black/50"
                >
                  <div className="absolute right-3 top-3 rounded-full bg-red-600/80 px-3 py-1 text-xs font-bold text-white">
                    Popular
                  </div>
                  <h5 className="text-lg font-bold text-red-300">Thanksgiving Dinner Bundle</h5>
                  <p className="mt-2 text-sm text-white/70">Complete feast for 8-10 people</p>
                  <p className="mt-1 text-xs text-white/50">Turkey, mole, sides, desserts</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-black text-red-400">$280</span>
                    <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition group-hover:scale-105">
                      <svg className="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add →
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowCateringPanel(false);
                    setCustomModal({
                      item: {
                        id: 'bundle-christmas',
                        name: 'Christmas Fiesta Bundle',
                        description: 'Tamales (12), pozole (1 gallon), pan dulce assortment, champurrado. Serves 6-8.',
                        price: 180,
                        category: 'catering',
                        available: true,
                        displayImage: cycleFallbackImage(51),
                        sectionType: 'CATERING',
                        displayGallery: [cycleFallbackImage(51), cycleFallbackImage(52)],
                      },
                      config: {
                        removals: ['Pork Tamales', 'Spicy Pozole'],
                        addons: [
                          { id: 'extra-tamales', label: 'Extra Tamales (6)', price: 25 },
                          { id: 'buñuelos', label: 'Add Buñuelos', price: 15 },
                          { id: 'ponche', label: 'Ponche Navideño (1 gal)', price: 20 },
                        ],
                      },
                    });
                  }}
                  className="group overflow-hidden rounded-xl border border-red-500/30 bg-black/40 p-5 text-left transition hover:border-red-500 hover:bg-black/50"
                >
                  <h5 className="text-lg font-bold text-red-300">Christmas Fiesta Bundle</h5>
                  <p className="mt-2 text-sm text-white/70">Traditional holiday celebration</p>
                  <p className="mt-1 text-xs text-white/50">Tamales, pozole, pan dulce</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-black text-red-400">$180</span>
                    <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition group-hover:scale-105">
                      <svg className="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add →
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowCateringPanel(false);
                    setCustomModal({
                      item: {
                        id: 'bundle-birthday',
                        name: 'Birthday Party Bundle',
                        description: 'Taco bar for 15, chips & salsa, tres leches cake, aguas frescas (2 gallons). Party ready!',
                        price: 220,
                        category: 'catering',
                        available: true,
                        displayImage: cycleFallbackImage(52),
                        sectionType: 'CATERING',
                        displayGallery: [cycleFallbackImage(52), cycleFallbackImage(53)],
                      },
                      config: {
                        removals: ['Spicy Options', 'Dairy', 'Nuts'],
                        addons: [
                          { id: 'decorations', label: 'Party Decorations', price: 30 },
                          { id: 'extra-cake', label: 'Extra Cake (serves 10)', price: 35 },
                          { id: 'balloons', label: 'Balloon Bouquet', price: 20 },
                          { id: 'piñata', label: 'Add Piñata', price: 25 },
                        ],
                      },
                    });
                  }}
                  className="group overflow-hidden rounded-xl border border-red-500/30 bg-black/40 p-5 text-left transition hover:border-red-500 hover:bg-black/50"
                >
                  <h5 className="text-lg font-bold text-red-300">Birthday Party Bundle</h5>
                  <p className="mt-2 text-sm text-white/70">Perfect for celebrations</p>
                  <p className="mt-1 text-xs text-white/50">Taco bar, cake, drinks for 15</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-black text-red-400">$220</span>
                    <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition group-hover:scale-105">
                      <svg className="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add →
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowCateringPanel(false);
                    setCustomModal({
                      item: {
                        id: 'bundle-office',
                        name: 'Office Lunch Bundle',
                        description: 'Burrito bar for 20, chips, guac, salsa, cookies. Individual packaging available.',
                        price: 240,
                        category: 'catering',
                        available: true,
                        displayImage: cycleFallbackImage(53),
                        sectionType: 'CATERING',
                        displayGallery: [cycleFallbackImage(53), cycleFallbackImage(54)],
                      },
                      config: {
                        removals: ['Gluten', 'Dairy', 'Meat'],
                        addons: [
                          { id: 'utensils', label: 'Disposable Utensils & Plates', price: 15 },
                          { id: 'individual-pack', label: 'Individual Packaging', price: 25 },
                          { id: 'beverages', label: 'Soda & Water (20 ct)', price: 30 },
                          { id: 'dessert-box', label: 'Dessert Box (20 cookies)', price: 35 },
                        ],
                      },
                    });
                  }}
                  className="group overflow-hidden rounded-xl border border-red-500/30 bg-black/40 p-5 text-left transition hover:border-red-500 hover:bg-black/50"
                >
                  <h5 className="text-lg font-bold text-red-300">Office Lunch Bundle</h5>
                  <p className="mt-2 text-sm text-white/70">Team meals made easy</p>
                  <p className="mt-1 text-xs text-white/50">Burrito bar, sides for 20</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-black text-red-400">$240</span>
                    <span className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition group-hover:scale-105">
                      <svg className="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add →
                    </span>
                  </div>
                </button>
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

      {/* Membership Slide-In Panel (Costco Style) */}
      {showMembershipPanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMembershipPanel(false)}
          />
          {/* Side Panel */}
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-gradient-to-br from-black via-gray-900 to-black p-8 shadow-2xl transition-transform sm:w-96">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-black text-white">⭐ Rewards Program</h2>
              <button
                onClick={() => setShowMembershipPanel(false)}
                className="rounded-full border-2 border-white/30 bg-white/10 p-2 text-white transition hover:border-white hover:bg-white/20"
              >
                ✕
              </button>
            </div>
            
            {membershipEnabled ? (
              <div className="space-y-6">
                {/* Rewards Header with Animated Icon */}
                <div className="relative mb-6 overflow-hidden rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-400/20 via-yellow-400/20 to-amber-500/20 p-8">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-400 text-6xl animate-pulse">
                      ⭐
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Rewards Program</h3>
                    <p className="text-sm text-white/80">Unlock Exclusive Benefits</p>
                  </div>
                </div>

                {/* Customer Points Display (if logged in) - Enhanced */}
                {customerData && (
                  <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-400/30 via-yellow-400/30 to-amber-500/30 p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-amber-200 font-bold">
                          {customerData.membershipTier || 'Member'} Tier
                        </p>
                        <h3 className="text-2xl font-black text-white mt-1">
                          {customerData.name || 'Rewards Member'}
                        </h3>
                      </div>
                      <div className="text-right bg-white/10 rounded-xl px-4 py-3 border border-amber-400/30">
                        <div className="text-3xl font-black text-amber-300">
                          {customerData.loyaltyPoints.toLocaleString()}
                        </div>
                        <div className="text-xs text-white/80 font-semibold">points</div>
                      </div>
                    </div>
                    
                    {/* Points Progress Bar - Enhanced */}
                    {upcomingTier && (
                      <div className="mt-4 bg-white/10 rounded-xl p-3 border border-amber-400/20">
                        <div className="flex items-center justify-between text-xs text-white/90 mb-2 font-semibold">
                          <span>Next tier: <span className="text-amber-300">{upcomingTier.name}</span></span>
                          <span>
                            {customerData.loyaltyPoints} / {upcomingTier.threshold} pts
                          </span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-yellow-400 h-3 rounded-full transition-all shadow-lg"
                            style={{
                              width: `${Math.min(100, (customerData.loyaltyPoints / (upcomingTier.threshold || 1)) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm leading-relaxed text-white/90 mt-4 bg-white/5 rounded-lg p-3 border border-white/10">
                      {membershipProgram?.heroCopy || 'Earn puntos with every order and unlock chef-curated rewards.'}
                    </p>

                    {/* Sign Out Button */}
                    <button
                      onClick={async () => {
                        try {
                          await fetch('/api/rewards/logout', { method: 'POST' });
                          setCustomerData(null);
                          setShowMembershipPanel(false);
                          showNotification('Signed out successfully');
                        } catch (err) {
                          console.error('Logout failed:', err);
                        }
                      }}
                      className="mt-4 w-full rounded-xl border-2 border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                )}

                {/* Guest View (if not logged in) */}
                {!customerData && (
                  <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-400/20 to-yellow-400/20 p-6">
                    <Image src={membershipImage} alt="Membership" fill className="object-cover opacity-20" sizes="400px" unoptimized={membershipImage?.startsWith('/tenant/')} />
                    <div className="relative space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.4em] text-amber-300">{featuredTier?.name || 'Rewards'}</p>
                          <h3 className="text-2xl font-black text-white">{membershipProgram?.featuredMemberName || 'Rewards Member'}</h3>
                        </div>
                        <div className="text-right">
                          {pointsPerDollar > 0 && (
                            <div className="text-2xl font-black text-amber-300">{pointsPerDollar} pts</div>
                          )}
                          <div className="text-xs text-white/70">per $1 spent</div>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-white/90">
                        {membershipProgram?.heroCopy || 'Earn puntos with every order and unlock chef-curated rewards.'}
                      </p>
                    </div>
                  </div>
                )}

                {upcomingTier && (
                  <div className="rounded-2xl border-2 border-white/20 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Next Tier</p>
                    <p className="mt-2 text-xl font-bold text-white">
                      {upcomingTier.name} · {upcomingTier.threshold?.toLocaleString() ?? 0} pts
                    </p>
                    {upcomingTier.rewardDescription && (
                      <p className="mt-2 text-sm text-white/70">{upcomingTier.rewardDescription}</p>
                    )}
                  </div>
                )}

                {membershipTiers.length > 0 && (
                  <div className="rounded-2xl border-2 border-white/20 bg-white/5 p-4">
                    <h4 className="mb-4 text-lg font-bold text-white">Tiers & Rewards</h4>
                    <div className="space-y-3">
                      {membershipTiers.map((tier) => (
                        <div key={tier.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{tier.name}</span>
                            <span className="text-sm text-white/70">{tier.threshold?.toLocaleString() ?? 0} pts</span>
                          </div>
                          {tier.rewardDescription && (
                            <p className="mt-1 text-xs text-white/60">{tier.rewardDescription}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border-2 border-white/20 bg-white/5 p-4">
                  <h4 className="mb-4 text-lg font-bold text-white">Member Perks</h4>
                  <ul className="space-y-2 text-sm text-white/80">
                    {membershipPerks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2">
                        <span className="text-amber-400 text-lg">✓</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Active Rewards - Real Rewards from Admin */}
                {activeRewards.length > 0 && (
                  <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-amber-500/10 p-6 shadow-xl">
                    <h4 className="mb-4 text-xl font-black text-white flex items-center gap-2">
                      <span className="text-2xl">🎁</span>
                      Available Rewards
                    </h4>
                    <div className="space-y-3">
                      {activeRewards.map((reward) => {
                        const canAfford = !customerData || !reward.pointsCost || customerData.loyaltyPoints >= reward.pointsCost;
                        
                        return (
                          <div 
                            key={reward.id} 
                            className={`rounded-xl border-2 p-4 ${
                              canAfford
                                ? 'border-amber-400/50 bg-white/10 hover:bg-white/20' 
                                : 'border-gray-500/30 bg-white/5 opacity-60'
                            } transition-all`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl">
                                    {reward.type === 'free_item' ? '🎁' :
                                     reward.type === 'discount' ? '💰' :
                                     reward.type === 'points_bonus' ? '⭐' :
                                     reward.type === 'free_shipping' ? '🚚' : '🎉'}
                                  </span>
                                  <p className="font-bold text-white">{reward.name}</p>
                                </div>
                                {reward.description && (
                                  <p className="text-xs text-white/70 mb-2">{reward.description}</p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-white/60">
                                  {reward.pointsCost > 0 && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-amber-400">⭐</span>
                                      {reward.pointsCost} pts
                                    </span>
                                  )}
                                  {reward.pointsCost === 0 && (
                                    <span className="text-green-400 font-semibold">FREE</span>
                                  )}
                                  {reward.expirationDate && (
                                    <span>Expires {new Date(reward.expirationDate).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                              {canAfford ? (
                                <button
                                  onClick={() => handleClaimReward(reward)}
                                  className="ml-4 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 px-4 py-2 text-sm font-bold text-black hover:from-amber-500 hover:to-yellow-500 transition shadow-lg"
                                >
                                  Claim
                                </button>
                              ) : (
                                <div className="ml-4 text-xs text-white/50 text-center">
                                  <div>Need</div>
                                  <div className="font-bold">{reward.pointsCost - (customerData?.loyaltyPoints || 0)} more pts</div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Email Offers */}
                {emailOffers.length > 0 && (
                  <div className="rounded-2xl border-2 border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-blue-500/10 p-6 shadow-xl">
                    <h4 className="mb-4 text-xl font-black text-white flex items-center gap-2">
                      <span className="text-2xl">📧</span>
                      Special Offers
                    </h4>
                    <div className="space-y-3">
                      {emailOffers.slice(0, 3).map((offer) => (
                        <div 
                          key={offer.id} 
                          className="rounded-xl border-2 border-blue-400/30 bg-white/10 p-4 hover:bg-white/20 transition"
                        >
                          <p className="font-bold text-white mb-1">{offer.subject}</p>
                          <p className="text-xs text-white/70 line-clamp-2">{offer.body.replace(/{name}/g, customerData?.name || 'there')}</p>
                          {offer.sentAt && (
                            <p className="text-xs text-white/50 mt-2">
                              Sent {new Date(offer.sentAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestone Rewards - Dessert Items (Legacy - can be removed if using real rewards) */}
                {customerData && membershipTiers.length > 0 && activeRewards.length === 0 && (
                  <div className="rounded-2xl border-2 border-white/20 bg-white/5 p-4">
                    <h4 className="mb-4 text-lg font-bold text-white">🎂 Unlock Dessert Rewards</h4>
                    <div className="space-y-3">
                      {membershipTiers.map((tier) => {
                        const isUnlocked = customerData.loyaltyPoints >= (tier.threshold ?? 0);
                        const pointsNeeded = Math.max(0, (tier.threshold ?? 0) - customerData.loyaltyPoints);
                        
                        return (
                          <div 
                            key={tier.id} 
                            className={`rounded-xl border p-3 ${
                              isUnlocked 
                                ? 'border-amber-500/50 bg-amber-500/10' 
                                : 'border-white/10 bg-white/5'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {isUnlocked ? (
                                  <span className="text-2xl">🎉</span>
                                ) : (
                                  <span className="text-2xl">🔒</span>
                                )}
                                <div>
                                  <p className="font-semibold text-white">{tier.name} Tier Reward</p>
                                  <p className="text-xs text-white/60">
                                    {isUnlocked 
                                      ? 'Unlocked! Claim your free dessert' 
                                      : `${pointsNeeded} points to unlock`
                                    }
                                  </p>
                                </div>
                              </div>
                              {isUnlocked && (
                                <button
                                  onClick={() => {
                                    // Add a sample dessert item to cart
                                    // You can customize this to add a specific dessert item
                                    showNotification('Free dessert reward added to cart! Redeem at checkout.');
                                    setShowMembershipPanel(false);
                                  }}
                                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 transition"
                                >
                                  Claim
                                </button>
                              )}
                            </div>
                            {tier.rewardDescription && (
                              <p className="text-xs text-white/70 mt-1">{tier.rewardDescription}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reorder Button - Opens Full ReorderModal */}
                {customerData && customerData.orders && customerData.orders.length > 0 && (
                  <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-amber-500/10 p-6 shadow-xl">
                    <div className="text-center space-y-4">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-400 text-4xl shadow-lg shadow-amber-500/30 animate-bounce">
                        🛒
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-white">Your Favorites</h4>
                        <p className="text-sm text-white/70 mt-1">
                          {customerData.orders.length} previous order{customerData.orders.length !== 1 ? 's' : ''} ready to reorder
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowMembershipPanel(false);
                          setShowReorderModal(true);
                        }}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 px-5 py-4 text-lg font-black text-black shadow-xl shadow-amber-500/50 transition-all hover:scale-105 hover:shadow-amber-500/70 active:scale-95"
                      >
                        🔄 Open Reorder Menu
                      </button>
                    </div>
                  </div>
                )}

                {!customerData && (
                  <button 
                    onClick={() => {
                      setShowMembershipPanel(false);
                      setShowJoinModal(true);
                    }}
                    className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 px-6 py-4 text-lg font-black text-black shadow-2xl shadow-amber-500/40 transition-all hover:scale-105 hover:shadow-amber-500/60"
                  >
                    Join Rewards Program
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-center text-white/80">
                <div className="text-6xl mb-4">⭐</div>
                <h3 className="text-2xl font-bold text-white">Membership Coming Soon</h3>
                <p className="text-sm">
                  Configure loyalty tiers and perks in the dashboard to unlock this section for guests.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <footer className="border-t border-white/10 bg-black/50 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 md:flex-row md:justify-between">
          <div className="max-w-xl space-y-4">
            <h3 className="text-2xl font-semibold text-white">Visit {tenant.name}</h3>
            {tenant.heroSubtitle && <p className="text-white/70">{tenant.heroSubtitle}</p>}
            {(tenant.socials?.instagram || tenant.socials?.facebook || tenant.socials?.tikTok || tenant.socials?.youtube) && (
              <div className="flex flex-wrap gap-3 text-sm text-white/60">
                {tenant.socials?.instagram && (
                  <a href={`https://instagram.com/${tenant.socials.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                    Instagram
                  </a>
                )}
                {tenant.socials?.facebook && (
                  <a href={`https://${tenant.socials.facebook}`} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                    Facebook
                  </a>
                )}
                {tenant.socials?.tikTok && (
                  <a href={`https://tiktok.com/@${tenant.socials.tikTok.replace('@', '')}`} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                    TikTok
                  </a>
                )}
                {tenant.socials?.youtube && (
                  <a href={`https://${tenant.socials.youtube}`} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                    YouTube
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="space-y-4 text-sm text-white/70">
            <div>
              <h4 className="text-xs uppercase tracking-[0.4em] text-white/50">Contact</h4>
              {tenant.contactPhone && <p className="mt-1 text-base font-semibold text-white">{tenant.contactPhone}</p>}
              {tenant.contactEmail && (
                <a href={`mailto:${tenant.contactEmail}`} className="mt-1 block underline-offset-4 hover:underline">
                  {tenant.contactEmail}
                </a>
              )}
            </div>
            {addressParts && (
              <div>
                <h4 className="text-xs uppercase tracking-[0.4em] text-white/50">Location</h4>
                <p className="mt-2 whitespace-pre-line text-sm text-white/70">{addressParts}</p>
              </div>
            )}
            {hoursLines && (
              <div>
                <h4 className="text-xs uppercase tracking-[0.4em] text-white/50">Hours</h4>
                <p className="mt-2 whitespace-pre-line text-sm text-white/70">{hoursLines.join('\n')}</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 py-4 text-center text-xs text-white/40">
          © {new Date().getFullYear()} {tenant.name}. Powered by Alessa Cloud.
        </div>
      </footer>

      {customModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={closeCustomization}>
          <div
            className="w-full max-w-xl rounded-3xl border border-white/20 bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#1a1a1a] p-6 text-white shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-[#C41E3A]/20 text-[#C41E3A] text-xs font-bold">
                    Customize
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white">{customModal.item.name}</h3>
                <p className="text-sm text-white/60 mt-1">
                  Base ${customModal.item.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={closeCustomization}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white/60 hover:text-white hover:bg-white/20 transition-all flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Item Image Gallery - with fallback for broken images */}
            {customModal.item.displayGallery && customModal.item.displayGallery.length > 0 && customModal.item.displayGallery[0] && (
              <div className="mb-5 flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
                {customModal.item.displayGallery.filter(url => url && url.length > 0).map((url, index) => (
                  <div key={`${customModal.item.id}-modal-${index}`} className="relative h-24 w-36 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-white/10 hover:border-[#C41E3A]/50 transition-all bg-white/5">
                    <img
                      src={url}
                      alt={`${customModal.item.name} preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide broken image container
                        const target = e.target as HTMLImageElement;
                        target.parentElement!.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {customModal.config.removals.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-white">Hold the...</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {customModal.config.removals.map((removal) => {
                    const active = customRemovals.includes(removal);
                    return (
                      <button
                        key={removal}
                        onClick={() => toggleRemoval(removal)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          active ? 'border-red-500 bg-red-600/30 text-white' : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        {active ? '✓ ' : ''}{removal}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {customModal.config.addons.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-white">Popular add-ons</h4>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {customModal.config.addons.map((addon) => {
                    const active = customAddons.includes(addon.id);
                    // Format the label with price
                    const displayLabel = addon.price > 0
                      ? `${addon.label} (+$${addon.price.toFixed(2)})`
                      : addon.label;
                    return (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                          active ? 'border-amber-400 bg-amber-500/20 text-white' : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        <span className="text-left">{displayLabel}</span>
                        {active && <span className="text-amber-200">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col text-xs text-white/70">
                Notes for the kitchen
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Sauce on the side"
                  className="mt-2 rounded-xl border border-white/20 bg-black/30 p-3 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                  rows={2}
                />
              </label>
              <div className="flex flex-col gap-2 text-xs text-white/70">
                Quantity
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCustomQuantity((prev) => Math.max(1, prev - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white hover:border-white/40"
                  >
                    −
                  </button>
                  <span className="text-sm font-semibold text-white">{customQuantity}</span>
                  <button
                    onClick={() => setCustomQuantity((prev) => prev + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white hover:border-white/40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2 text-sm text-white/70">
              <div className="flex justify-between">
                <span>Base</span>
                <span>${customModal.item.price.toFixed(2)}</span>
              </div>
              {selectedAddonObjects.length > 0 && (
                <div className="flex justify-between">
                  <span>Add-ons</span>
                  <span>+${addonUpcharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-white">
                <span>Per item</span>
                <span>${perItemCustomizedPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-white">
                <span>Total</span>
                <span>${totalCustomizedPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                onClick={handleConfirmCustomization}
                className="flex-1 rounded-2xl bg-[#C41E3A] px-6 py-4 text-base font-bold text-white shadow-xl shadow-[#C41E3A]/30 transition-all hover:bg-[#A01830] hover:scale-[1.02] active:scale-[0.98]"
              >
                Add to Cart · ${totalCustomizedPrice.toFixed(2)}
              </button>
              <button
                onClick={closeCustomization}
                className="flex-1 rounded-2xl border-2 border-white/20 px-6 py-4 text-base font-semibold text-white/70 transition-all hover:border-white/40 hover:text-white hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Panel - Positioned above button stack on desktop */}
      {isAccessibilityOpen && (
        <div className="fixed bottom-[180px] left-6 z-50 hidden w-64 rounded-2xl border border-white/20 bg-black/90 p-5 text-sm text-white/80 shadow-2xl backdrop-blur-xl sm:block">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Accessibility Controls</p>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between">
                <span>High contrast</span>
                <input
                  type="checkbox"
                  checked={accessibilityState.highContrast}
                  onChange={(e) => setAccessibilityState((prev) => ({ ...prev, highContrast: e.target.checked }))}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Large text</span>
                <input
                  type="checkbox"
                  checked={accessibilityState.largeText}
                  onChange={(e) => setAccessibilityState((prev) => ({ ...prev, largeText: e.target.checked }))}
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Reduce motion</span>
                <input
                  type="checkbox"
                  checked={accessibilityState.reducedMotion}
                  onChange={(e) => setAccessibilityState((prev) => ({ ...prev, reducedMotion: e.target.checked }))}
                />
              </label>
            </div>
            <button
              className="mt-4 w-full rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
              onClick={() =>
                setAccessibilityState({
                  highContrast: false,
                  largeText: false,
                  reducedMotion: false,
                })
              }
            >
              Reset preferences
            </button>
        </div>
      )}

      <RewardsModal open={isRewardsOpen} onClose={() => setRewardsOpen(false)} />
      <JoinRewardsModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        initialMode={joinModalMode}
        onSuccess={async () => {
          // Refresh customer data
          try {
            const res = await fetch('/api/rewards/customer');
            if (res.ok) {
              const data = await res.json();
              setCustomerData(data);
            }
          } catch (err) {
            console.error('Failed to refresh customer data:', err);
          }
        }}
        tenantSlug={tenantSlug}
      />
      <ReorderModal
        open={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        customerData={customerData}
        onAddToCart={(item) => {
          addToCart({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || '',
            description: item.description,
          });
        }}
        onReorderAll={handleReorder}
      />

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={showMobileNav}
        onClose={() => setShowMobileNav(false)}
        onCateringClick={() => setShowCateringPanel(true)}
        onRewardsClick={() => customerData ? setShowMembershipPanel(true) : setShowJoinModal(true)}
        onAccessibilityClick={() => setAccessibilityOpen((prev) => !prev)}
        onReorderClick={customerData?.orders && customerData.orders.length > 0 ? () => setShowReorderModal(true) : undefined}
        onLoginClick={() => setShowJoinModal(true)}
        onSignOut={customerData ? async () => {
          try {
            await fetch('/api/rewards/logout', { method: 'POST' });
            setCustomerData(null);
            showNotification('Signed out successfully');
          } catch (err) {
            console.error('Logout failed:', err);
          }
        } : undefined}
        cateringEnabled={cateringEnabled}
        customerData={customerData}
        isAccessibilityOpen={isAccessibilityOpen}
        menuSections={navSections.map(s => ({ id: s.id, name: s.name }))}
      />
      </div>{/* End main content wrapper */}
    </div>
  );
}
