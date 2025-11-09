"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStockImageForCategory, cycleFallbackImage } from '../../lib/menu-imagery';
import { useCart } from '../../lib/store/cart';
import { getTenantAssets } from '../../lib/tenant-assets';
import { useTenantTheme } from '../TenantThemeProvider';
import FeaturedCarousel from './FeaturedCarousel';

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

interface CustomizationOption {
  id: string;
  label: string;
  price: number;
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

export default function OrderPageClient({ sections, featuredItems = [], tenantSlug }: OrderPageClientProps) {
  const tenant = useTenantTheme();
  const assets = getTenantAssets(tenantSlug || tenant.slug);
  const { addToCart } = useCart();

  const navSections = useMemo(() => sections.filter((section) => section.items.length > 0), [sections]);
  const [activeLayout, setActiveLayout] = useState<LayoutView>(() => {
    if (typeof window === 'undefined') return 'grid';
    return window.innerWidth < 768 ? 'cards' : 'grid';
  });
  const [activeSectionId, setActiveSectionId] = useState(navSections[0]?.id ?? '');
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const body = document.body;
    body.classList.toggle('high-contrast', accessibilityState.highContrast);
    body.classList.toggle('large-text', accessibilityState.largeText);
    body.classList.toggle('reduced-motion', accessibilityState.reducedMotion);
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
    window.localStorage.setItem(accessibilityStorageKey, JSON.stringify(accessibilityState));
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

  const flattenedMenuItems = useMemo(() =>
    sections.flatMap((section) =>
      section.items.map((item) => ({
        section,
        item,
      })),
    ),
  [sections]);

  const membershipProgram = tenant.membershipProgram;
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

  const membershipEnabled = membershipProgram?.enabled !== false && membershipTiers.length > 0;
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
    [findCustomizationConfig],
  );

  const closeCustomization = useCallback(() => {
    setCustomModal(null);
    setCustomRemovals([]);
    setCustomAddons([]);
    setCustomNote('');
    setCustomQuantity(1);
  }, []);

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

  const highlightData = useMemo(() => {
    const flattened = sections.flatMap((section) =>
      section.items.map((item, index) => ({
        sectionType: section.type,
        sectionName: section.name,
        item,
        image: item.image || getStockImageForCategory(item.category || section.type, index),
      })),
    );

    const combos: HighlightCard[] = flattened.slice(0, 6).map((entry, index) => ({
      id: `${entry.item.id}-bundle`,
      title: `${entry.item.name} Bundle`,
      description: `Includes ${entry.item.name}, a craft beverage, and a sweet treat.`,
      price: Number((entry.item.price + 6.5).toFixed(2)),
      originalPrice: Number((entry.item.price + 9.5).toFixed(2)),
      badge: index === 0 ? 'Chef Pick' : index === 1 ? 'Save $3' : 'Popular',
      image: entry.image,
      category: entry.item.category || entry.sectionType,
    }));

    const specials = flattened
      .filter((entry) => entry.sectionType === 'SPECIAL' || entry.item.tags?.includes('special'))
      .slice(0, 5);
    const sweets = flattened
      .filter((entry) => entry.sectionType === 'BAKERY' || entry.item.category?.toLowerCase().includes('dessert'))
      .slice(0, 5);

    const fallbackSpecials = combos.slice(0, 4);
    const fallbackSweets = combos.slice(2, 6);

    return {
      combos,
      specials: specials.length > 0
        ? specials.map((entry, index) => ({
            id: `${entry.item.id}-special`,
            title: entry.item.name,
            description: entry.item.description,
            price: entry.item.price,
            badge: index === 0 ? 'Limited' : 'Signature',
            image: entry.image,
            category: entry.item.category || entry.sectionType,
          }))
        : fallbackSpecials,
      sweets: sweets.length > 0
        ? sweets.map((entry, index) => ({
            id: `${entry.item.id}-sweet`,
            title: entry.item.name,
            description: entry.item.description,
            price: entry.item.price,
            badge: index === 0 ? 'Just Baked' : 'Sweet Pick',
            image: entry.image,
            category: entry.item.category || entry.sectionType,
          }))
        : fallbackSweets,
    };
  }, [sections]);

  const combosRef = useRef<HTMLDivElement | null>(null);
  const specialsRef = useRef<HTMLDivElement | null>(null);
  const sweetsRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollHorizontal = useCallback((ref: React.RefObject<HTMLDivElement>, offset: number) => {
    ref.current?.scrollBy({ left: offset, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const sectionsToObserve = Object.entries(sectionRefs.current)
      .map(([id, el]) => ({ id, el }))
      .filter((entry) => entry.el);

    if (sectionsToObserve.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleSection) {
          const targetId = sectionsToObserve.find((section) => section.el === visibleSection.target)?.id;
          if (targetId) {
            setActiveSectionId(targetId);
          }
        }
      },
      {
        rootMargin: '-120px 0px -50%',
        threshold: [0.25, 0.5, 0.75],
      },
    );

    sectionsToObserve.forEach((section) => {
      if (section.el) observer.observe(section.el);
    });

    return () => observer.disconnect();
  }, [navSections.length, sections]);

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
    // Use featured items from database if available, otherwise fall back to branding config
    if (featuredItems.length > 0) {
      return featuredItems.map((item) => {
        // Find the section for this item
        const matchingSection = sections.find(section =>
          section.items.some(sectionItem => sectionItem.id === item.id)
        );
        return {
          name: item.name,
          section: matchingSection,
          item,
        };
      });
    }

    // Fallback to branding config
    const names = tenant.branding?.recommendedItems ?? [];
    if (names.length === 0) return [] as Array<{ name: string; section?: (typeof sections)[number]; item?: (typeof flattenedMenuItems[number]['item']) }>;
    const lookup = new Map<string, { section: (typeof sections)[number]; item: (typeof flattenedMenuItems[number]['item']) }>();
    flattenedMenuItems.forEach(({ section, item }) => {
      lookup.set(item.name.toLowerCase(), { section, item });
    });
    return names.map((name) => ({
      name,
      section: lookup.get(name.toLowerCase())?.section,
      item: lookup.get(name.toLowerCase())?.item,
    }));
  }, [featuredItems, sections, flattenedMenuItems, tenant.branding?.recommendedItems]);

  // Prepare featured items for carousel
  const carouselItems = useMemo(() => {
    return recommendedItems
      .filter((entry) => entry.item)
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
    const fromBranding = tenant.branding?.heroImages?.filter(Boolean);
    if (fromBranding && fromBranding.length > 0) {
      return fromBranding as string[];
    }
    const unique = new Set<string>();
    [heroImage, assets.membership, '/stock/hero1.jpg', '/stock/hero2.jpg']
      .filter(Boolean)
      .forEach((url) => unique.add(url as string));
    return Array.from(unique);
  }, [assets.membership, heroImage, tenant.branding?.heroImages]);
  const membershipImage = assets.membership;
  const [heroBackgroundIndex, setHeroBackgroundIndex] = useState(0);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 2200);
  }, []);

  const handleAddToCart = useCallback(
    (item: OrderMenuItem, image: string) => {
      if (!item.available) return;

      addToCart({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        quantity: 1,
        image,
      });

      showNotification(`Added ${item.name} to cart`);
    },
    [addToCart, showNotification],
  );

  const handleAddHighlight = useCallback(
    (card: HighlightCard) => {
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
    [addToCart, showNotification],
  );

  const handleCarouselAddToCart = useCallback(
    (item: { id: string; name: string; description: string; price: number; image?: string | null; displayImage?: string }) => {
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
    [addToCart, showNotification],
  );

  const enrichedSections = useMemo(() => {
    return sections.map((section, sectionIndex) => ({
      ...section,
      icon: SECTION_ICONS[section.type] || '🍽️',
      items: section.items.map((item, itemIndex) => {
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
        return { ...item, displayImage: image, displayGallery, emoji };
      }),
    }));
  }, [sections]);

  const [isHeroTransitioning, setIsHeroTransitioning] = useState(false);
  const [showMembershipPanel, setShowMembershipPanel] = useState(false);
  const [showCateringPanel, setShowCateringPanel] = useState(false);
  const [cateringName, setCateringName] = useState('');
  const [cateringEmail, setCateringEmail] = useState('');
  const [cateringPhone, setCateringPhone] = useState('');
  const [cateringEventDate, setCateringEventDate] = useState('');
  const [cateringGuestCount, setCateringGuestCount] = useState('');
  const [cateringMessage, setCateringMessage] = useState('');
  const [cateringGalleryIndex, setCateringGalleryIndex] = useState(0);

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

  // Catering gallery - Puebla/Atlixco themed imagery
  const cateringGallery = useMemo(() => [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80', // Food buffet spread
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1920&q=80', // Mexican party spread
    'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=1920&q=80', // Catering table
    'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=1920&q=80', // Tacos platter
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1920&q=80', // Restaurant table setting
  ], []);

  const cateringEnabled = tenant.featureFlags?.includes('catering') ?? false;

  const handleCateringSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to an API endpoint
    console.log('Catering inquiry submitted:', {
      name: cateringName,
      email: cateringEmail,
      phone: cateringPhone,
      eventDate: cateringEventDate,
      guestCount: cateringGuestCount,
      message: cateringMessage,
    });
    showNotification('Catering inquiry submitted! We\'ll contact you soon.');
    setShowCateringPanel(false);
    // Reset form
    setCateringName('');
    setCateringEmail('');
    setCateringPhone('');
    setCateringEventDate('');
    setCateringGuestCount('');
    setCateringMessage('');
  }, [cateringName, cateringEmail, cateringPhone, cateringEventDate, cateringGuestCount, cateringMessage, showNotification]);

  const renderSectionItems = useCallback(
    (section: (typeof enrichedSections)[number]) => {
      if (activeLayout === 'list') {
        return (
          <div className="space-y-4">
            {section.items.map((item) => (
              <article key={item.id} className="flex gap-4 rounded-2xl bg-white/8 p-4 shadow-xl shadow-black/10 backdrop-blur-md">
                <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl">
                  <Image src={item.displayImage} alt={item.name} fill className="object-cover" sizes="(min-width: 768px) 120px, 96px" />
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 text-lg">{item.emoji}</span>
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">${item.price.toFixed(2)}</span>
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
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-rose-500/30 transition-all hover:scale-105 hover:shadow-rose-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => openCustomization(item, section.type)}
                      disabled={!item.available}
                    >
                      <span className="flex items-center justify-center gap-2">
                        ✨ {item.available ? 'Customize & Add' : 'Sold Out'}
                      </span>
                    </button>
                    <button
                      className="rounded-xl border-2 border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-all hover:border-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="relative h-48 w-full overflow-hidden">
                  <Image src={item.displayImage} alt={item.name} fill className="object-cover transition duration-500 group-hover:scale-110" sizes="(min-width: 1024px) 480px, 100vw" />
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
                        Customize
                      </button>
                      <button
                        className="rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-4 py-2 text-sm font-semibold text-black transition hover:scale-105 hover:shadow-lg"
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
                ? 'border-amber-400/30 bg-gradient-to-br from-amber-500/20 via-rose-500/15 to-yellow-400/20 hover:border-amber-400/50 hover:shadow-amber-500/40'
                : 'border-white/10 bg-white/10 hover:border-white/30 hover:shadow-rose-500/30'
            }`}>
              <div className="relative h-56 w-full overflow-hidden sm:h-64">
                <Image src={item.displayImage} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="(min-width: 1280px) 360px, (min-width: 768px) 280px, 100vw" />
                <div className={`absolute inset-0 bg-gradient-to-t ${
                  isBakery ? 'from-amber-900/90 via-rose-900/30 to-transparent' : 'from-black/90 via-black/30 to-transparent'
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
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                        : 'bg-gradient-to-r from-rose-500 to-amber-500'
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
                    isBakery ? 'text-amber-200' : 'text-rose-200'
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
                      className={`flex-1 rounded-xl px-5 py-3 text-sm font-bold shadow-2xl transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${
                        isBakery
                          ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 text-black shadow-amber-500/50 hover:shadow-amber-500/70'
                          : 'bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 text-white shadow-rose-500/40 hover:shadow-rose-500/60'
                      }`}
                      onClick={() => openCustomization(item, section.type)}
                      disabled={!item.available}
                    >
                      ✨ {item.available ? 'Customize & Add' : 'Sold Out'}
                    </button>
                    <button
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${
                        isBakery
                          ? 'border-amber-300/40 bg-amber-500/10 text-amber-100 hover:border-amber-300 hover:bg-amber-500/20'
                          : 'border-white/30 bg-white/5 text-white hover:border-white hover:bg-white/15'
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

  const activeSection = useMemo(
    () => navSections.find((section) => section.id === activeSectionId),
    [activeSectionId, navSections],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050A1C] via-[#0A1C2F] to-[#041326] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {tenant.logoUrl ? (
              <Image
                src={tenant.logoUrl}
                alt={`${tenant.name} logo`}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full border border-white/20 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-2xl">🍽️</div>
            )}
          <div>
            <h1 className="text-2xl font-semibold text-white">{tenant.name}</h1>
            {tenant.tagline && <p className="text-sm text-white/60">{tenant.tagline}</p>}
          </div>
          </div>
          {navSections.length > 0 && (
            <nav className="flex max-w-full items-center gap-2 overflow-x-auto text-sm font-medium text-white/80 scrollbar-hide pb-2">
              {navSections.map((section) => {
                const isActive = activeSectionId === section.id;
                const isBakery = section.type === 'BAKERY' || section.name.toLowerCase().includes('panad') || section.name.toLowerCase().includes('bakery');
                const baseClass = isBakery
                  ? 'border-transparent bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-300 text-black shadow-lg shadow-rose-500/40 font-bold'
                  : 'border-white/70 bg-white/10 text-white font-semibold';
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSectionId(section.id);
                      const element = document.getElementById(`section-${section.id}`);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`flex-shrink-0 rounded-full border px-4 py-2.5 text-sm transition-all hover:scale-105 ${
                      isActive ? baseClass : 'border-white/20 hover:border-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-base">{SECTION_ICONS[section.type] || '🍽️'}</span>
                    <span className="ml-1.5">{section.name}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden text-white">
        {/* Background Images/Videos with Smooth Transitions */}
        <div className="absolute inset-0">
          {heroMedia.map((media, index) => {
            const isVideo = media.endsWith('.mp4') || media.endsWith('.webm') || media.endsWith('.mov') || media.includes('video');
            const isGif = media.endsWith('.gif') || media.includes('gif');
            const isActive = index === heroBackgroundIndex;
            
            if (isVideo) {
              return (
                <video
                  key={`hero-media-${index}`}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  src={media}
                />
              );
            }
            
            return (
              <div
                key={`hero-media-${index}`}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
                style={{
                  backgroundImage: isGif ? `url(${media})` : `url(${media})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {isGif && (
                  <img
                    src={media}
                    alt="Hero background"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            );
          })}
          {/* Gradient Overlay */}
          <div
            className={`absolute inset-0 z-20 bg-gradient-to-br transition-opacity duration-700 ${
              activeSection?.type === 'BAKERY'
                ? 'from-rose-500/80 via-amber-400/50 to-black/40'
                : 'from-black/75 via-black/50 to-black/30'
            }`}
          />
          {/* Animated Gradient Overlay for Depth */}
          <div className="absolute inset-0 z-30 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {/* Image Indicators */}
          {!motionReduced && heroMedia.length > 1 && (
            <div className="absolute bottom-8 left-1/2 z-40 flex -translate-x-1/2 gap-2">
              {heroMedia.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setHeroBackgroundIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === heroBackgroundIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="relative z-40 mx-auto max-w-5xl px-6 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400"></span>
            Order Now - Fast Delivery Available
          </div>
          <h2 className="text-6xl font-black tracking-tight text-white sm:text-7xl md:text-8xl lg:text-9xl">
            {personality.heroTitle}
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-2xl leading-relaxed text-white/90 md:text-3xl">
            {tenant.heroSubtitle || tenant.tagline || 'Experience flavors that tell a story.'}
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#menu"
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-10 py-5 text-lg font-bold text-black shadow-2xl shadow-amber-400/40 transition-all hover:scale-105 hover:shadow-amber-400/60"
            >
              <span className="relative z-10">Explore Menu ✨</span>
              <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-rose-500 opacity-0 transition-opacity group-hover:opacity-100"></span>
            </a>
            <Link
              href={`/customer/login?tenant=${tenant.slug}`}
              className="rounded-full border-2 border-white/50 bg-white/10 px-8 py-5 text-base font-bold text-white backdrop-blur-md transition-all hover:border-white hover:bg-white/20 hover:scale-105"
            >
              View Order History →
            </Link>
          </div>
          {/* Stats moved to bottom of hero - less prominent */}
          <div className="mt-12 grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm sm:grid-cols-2 md:grid-cols-4">
            <div className="text-center text-sm text-white/70">
              <p className="text-xl font-bold text-white">{personality.totalItems}</p>
              <p className="text-xs">Menu Items</p>
            </div>
            <div className="text-center text-sm text-white/70">
              <p className="text-xl font-bold text-white">{personality.bestSeller}</p>
              <p className="text-xs">Popular Today</p>
            </div>
            <div className="text-center text-sm text-white/70">
              <p className="text-xl font-bold text-white">{hoursDisplay || hoursSummary || 'Open'}</p>
              <p className="text-xs">Hours</p>
            </div>
            <div className="text-center text-sm text-white/70">
              <p className="text-xl font-bold text-white">{locationDisplay || locationSummary || 'Here'}</p>
              <p className="text-xs">Location</p>
            </div>
          </div>
          {brandingHighlights.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs uppercase tracking-wide text-white/60">
              {brandingHighlights.map((highlight) => (
                <span key={highlight} className="rounded-full border border-white/20 px-3 py-1">
                  {highlight}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <main id="menu" className="mx-auto max-w-6xl space-y-12 px-6 py-12">
        {notification && (
          <div className="fixed right-6 top-20 z-50 rounded-2xl bg-green-500/95 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/40">
            {notification}
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Customize your view</h3>
              <p className="text-sm text-white/60">Switch layouts to browse how you like and jump into categories instantly.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setActiveLayout(layout.id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    activeLayout === layout.id
                      ? 'border-white/70 bg-white/10 text-white'
                      : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'
                  }`}
                >
                  <span>{layout.icon}</span>
                  {layout.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Membership Button - Desktop (stacked above accessibility) */}
        {membershipEnabled && (
          <div className="fixed bottom-20 left-5 z-50 hidden sm:block">
            <button
              onClick={() => setShowMembershipPanel(true)}
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-4 py-3 text-sm font-bold text-black shadow-2xl shadow-amber-500/40 transition-all hover:scale-110 hover:shadow-amber-500/60 sm:gap-3 sm:px-6 sm:py-4 sm:text-base"
            >
              <span className="text-xl sm:text-2xl">⭐</span>
              <span className="hidden sm:inline">Join Rewards</span>
              <span className="sm:hidden">Rewards</span>
            </button>
          </div>
        )}

        {/* Mobile Membership Button - Stacked above cart on mobile */}
        {membershipEnabled && (
          <div className="fixed bottom-20 right-5 z-50 block sm:hidden">
            <button
              onClick={() => setShowMembershipPanel(true)}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-4 py-3 text-sm font-bold text-black shadow-2xl shadow-amber-500/40 transition-all hover:scale-110 hover:shadow-amber-500/60"
            >
              <span className="text-xl">⭐</span>
              <span>Rewards</span>
            </button>
          </div>
        )}

        {/* Catering Button - Desktop (stacked above membership/accessibility) */}
        {cateringEnabled && (
          <div className={`fixed left-5 z-50 hidden sm:block ${membershipEnabled ? 'bottom-36' : 'bottom-20'}`}>
            <button
              onClick={() => setShowCateringPanel(true)}
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-600 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-rose-500/40 transition-all hover:scale-110 hover:shadow-rose-500/60 sm:gap-3 sm:px-6 sm:py-4 sm:text-base"
            >
              <span className="text-xl sm:text-2xl">🎉</span>
              <span className="hidden sm:inline">Catering</span>
              <span className="sm:hidden">Catering</span>
            </button>
          </div>
        )}

        {/* Mobile Catering Button - Stacked above other buttons */}
        {cateringEnabled && (
          <div className={`fixed right-5 z-50 block sm:hidden ${membershipEnabled ? 'bottom-36' : 'bottom-20'}`}>
            <button
              onClick={() => setShowCateringPanel(true)}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-600 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-rose-500/40 transition-all hover:scale-110 hover:shadow-rose-500/60"
            >
              <span className="text-xl">🎉</span>
              <span>Catering</span>
            </button>
          </div>
        )}

        {carouselItems.length > 0 && (
          <FeaturedCarousel
            items={carouselItems}
            onAddToCart={handleCarouselAddToCart}
          />
        )}

        {menuUpsells.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-white">✨ Add-on Bundles</h3>
                <p className="text-sm text-white/60">Chef-curated extras to level up your order.</p>
              </div>
            </header>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {menuUpsells.map((bundle, index) => (
                <article key={bundle.id ?? index} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/8 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-white/20">
                  <div className="relative h-36 w-full">
                    <Image src={bundle.image || cycleFallbackImage(index + 20)} alt={bundle.name} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(min-width: 768px) 320px, 100vw" />
                    {bundle.tag && (
                      <span className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                        {bundle.tag}
                      </span>
                    )}
                  </div>
                  <div className="space-y-3 p-5">
                    <h4 className="text-lg font-semibold text-white">{bundle.name}</h4>
                    <p className="text-sm text-white/70 line-clamp-3">{bundle.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-amber-200">${Number(bundle.price).toFixed(2)}</div>
                      <button
                        className="rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-black/25 transition hover:scale-105"
                        onClick={() =>
                          handleAddHighlight({
                            id: bundle.id || `upsell-${index}`,
                            title: bundle.name,
                            description: bundle.description,
                            price: Number(bundle.price ?? 0),
                            image: bundle.image || cycleFallbackImage(index + 20),
                            badge: bundle.tag || undefined,
                            category: 'upsell',
                          })
                        }
                      >
                        {(bundle.cta || 'Add to order')}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-white">🔥 Combos Populares</h3>
              <p className="text-sm text-white/60">Perfect pairings curated by our chefs.</p>
            </div>
            <div className="flex gap-3">
              <button className="rounded-full border border-white/20 px-3 py-2 hover:border-white/40" onClick={() => scrollHorizontal(combosRef, -320)}>
                ←
              </button>
              <button className="rounded-full border border-white/20 px-3 py-2 hover:border-white/40" onClick={() => scrollHorizontal(combosRef, 320)}>
                →
              </button>
            </div>
          </header>
          <div ref={combosRef} className="mt-4 flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
            {highlightData.combos.map((card, index) => (
              <article
                key={card.id}
                className="relative w-[280px] flex-shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/8 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-white/20"
                style={motionReduced ? undefined : { transitionDuration: '300ms' }}
              >
                {card.badge && (
                  <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    {card.badge}
                  </span>
                )}
                <div className="relative h-36 w-full">
                  <Image src={card.image || cycleFallbackImage(index)} alt={card.title} fill className="object-cover" sizes="280px" />
                </div>
                <div className="space-y-3 p-5">
                  <h4 className="text-lg font-semibold text-white">{card.title}</h4>
                  <p className="text-sm text-white/70 line-clamp-3">{card.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-rose-200">
                      ${card.price.toFixed(2)}{' '}
                      {card.originalPrice && (
                        <span className="text-xs font-medium text-white/50 line-through">${card.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <button
                      className="rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-black/25 transition hover:scale-105"
                      onClick={() => handleAddHighlight(card)}
                    >
                      Add Combo
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-white">👨‍🍳 Especialidades del Chef</h3>
              <p className="text-sm text-white/60">Signature dishes crafted with love.</p>
            </div>
            <div className="flex gap-3">
              <button className="rounded-full border border-white/20 px-3 py-2 hover:border-white/40" onClick={() => scrollHorizontal(specialsRef, -320)}>
                ←
              </button>
              <button className="rounded-full border border-white/20 px-3 py-2 hover:border-white/40" onClick={() => scrollHorizontal(specialsRef, 320)}>
                →
              </button>
            </div>
          </header>
          <div ref={specialsRef} className="mt-4 flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
            {highlightData.specials.map((card, index) => (
              <article
                key={card.id}
                className="relative w-[280px] flex-shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/8 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-white/20"
                style={motionReduced ? undefined : { transitionDuration: '300ms' }}
              >
                {card.badge && (
                  <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    {card.badge}
                  </span>
                )}
                <div className="relative h-36 w-full">
                  <Image src={card.image || cycleFallbackImage(index)} alt={card.title} fill className="object-cover" sizes="280px" />
                </div>
                <div className="space-y-3 p-5">
                  <h4 className="text-lg font-semibold text-white">{card.title}</h4>
                  <p className="text-sm text-white/70 line-clamp-3">{card.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-sky-200">${card.price.toFixed(2)}</div>
                    <button
                      className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-black/25 transition hover:scale-105"
                      onClick={() => handleAddHighlight({ ...card, title: `${card.title} Chef Special` })}
                    >
                      Add Special
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-white">🍰 Dulces Tradicionales</h3>
              <p className="text-sm text-white/60">Authentic sweets to close out your meal.</p>
            </div>
            <div className="flex gap-3">
              <button className="rounded-full border border-white/20 px-3 py-2 hover:border-white/40" onClick={() => scrollHorizontal(sweetsRef, -320)}>
                ←
              </button>
              <button className="rounded-full border border-white/20 px-3 py-2 hover:border-white/40" onClick={() => scrollHorizontal(sweetsRef, 320)}>
                →
              </button>
            </div>
          </header>
          <div ref={sweetsRef} className="mt-4 flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
            {highlightData.sweets.map((card, index) => (
              <article
                key={card.id}
                className="relative w-[280px] flex-shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/8 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-white/20"
                style={motionReduced ? undefined : { transitionDuration: '300ms' }}
              >
                {card.badge && (
                  <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                    {card.badge}
                  </span>
                )}
                <div className="relative h-36 w-full">
                  <Image src={card.image || cycleFallbackImage(index)} alt={card.title} fill className="object-cover" sizes="280px" />
                </div>
                <div className="space-y-3 p-5">
                  <h4 className="text-lg font-semibold text-white">{card.title}</h4>
                  <p className="text-sm text-white/70 line-clamp-3">{card.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-pink-200">${card.price.toFixed(2)}</div>
                    <button
                      className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-black/25 transition hover:scale-105"
                      onClick={() => handleAddHighlight({ ...card, title: `${card.title} Dessert` })}
                    >
                      Add Dessert
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {enrichedSections.map((section) => {
          const isBakery = section.type === 'BAKERY' || section.name.toLowerCase().includes('panad') || section.name.toLowerCase().includes('bakery');
          return (
            <section
              key={section.id}
              id={`section-${section.id}`}
              ref={(el) => {
                sectionRefs.current[section.id] = el;
              }}
              className={`scroll-mt-32 space-y-8 rounded-3xl p-8 transition-all mb-8 ${
                isBakery
                  ? 'bg-gradient-to-br from-amber-500/15 via-rose-500/12 to-yellow-400/15 border-2 border-amber-400/30 shadow-2xl shadow-amber-500/20'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className={`text-xs uppercase tracking-[0.4em] mb-2 ${
                    isBakery ? 'text-amber-300 font-bold' : 'text-white/50'
                  }`}>
                    {section.icon} {section.type}
                  </p>
                  <h2 className={`text-4xl font-black mb-2 ${
                    isBakery 
                      ? 'bg-gradient-to-r from-amber-300 via-rose-300 to-yellow-300 bg-clip-text text-transparent drop-shadow-lg' 
                      : 'text-white'
                  }`}>
                    {section.name}
                  </h2>
                  {section.description && (
                    <p className={`mt-2 max-w-2xl text-base leading-relaxed ${
                      isBakery ? 'text-amber-100 font-medium' : 'text-white/60'
                    }`}>
                      {section.description}
                    </p>
                  )}
                </div>
                <span className={`rounded-full border-2 px-5 py-2.5 text-sm font-black shadow-lg ${
                  isBakery
                    ? 'border-amber-400/60 bg-gradient-to-r from-amber-500/30 to-yellow-400/30 text-amber-100 shadow-amber-500/30'
                    : 'border-white/10 bg-white/5 text-white/70'
                }`}>
                  {section.items.length} item{section.items.length === 1 ? '' : 's'}
                </span>
              </header>
              {renderSectionItems(section)}
            </section>
          );
        })}
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
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto bg-gradient-to-br from-[#2D1810] via-[#1A0F08] to-black p-8 shadow-2xl transition-transform">
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
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">Authentic Puebla Cuisine</p>
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

            {/* Menu Highlights - Clickable Catering Options */}
            <div className="mb-8 space-y-4 rounded-2xl border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6">
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

            {/* Upsell Bundles - Holiday & Event Packages */}
            <div className="mb-8 space-y-4 rounded-2xl border-2 border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-orange-500/10 p-6">
              <h4 className="text-xl font-bold text-rose-100">🎉 Holiday & Event Bundles</h4>
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
                  className="group relative overflow-hidden rounded-xl border border-rose-400/30 bg-black/40 p-5 text-left transition hover:border-rose-400 hover:bg-black/50"
                >
                  <div className="absolute right-3 top-3 rounded-full bg-rose-500/80 px-3 py-1 text-xs font-bold text-white">
                    Popular
                  </div>
                  <h5 className="text-lg font-bold text-rose-200">Thanksgiving Dinner Bundle</h5>
                  <p className="mt-2 text-sm text-white/70">Complete feast for 8-10 people</p>
                  <p className="mt-1 text-xs text-white/50">Turkey, mole, sides, desserts</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-black text-rose-300">$280</span>
                    <span className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition group-hover:scale-105">
                      Customize →
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
                  className="group overflow-hidden rounded-xl border border-rose-400/30 bg-black/40 p-5 text-left transition hover:border-rose-400 hover:bg-black/50"
                >
                  <h5 className="text-lg font-bold text-rose-200">Christmas Fiesta Bundle</h5>
                  <p className="mt-2 text-sm text-white/70">Traditional holiday celebration</p>
                  <p className="mt-1 text-xs text-white/50">Tamales, pozole, pan dulce</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-black text-rose-300">$180</span>
                    <span className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition group-hover:scale-105">
                      Customize →
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
                  className="group overflow-hidden rounded-xl border border-rose-400/30 bg-black/40 p-5 text-left transition hover:border-rose-400 hover:bg-black/50"
                >
                  <h5 className="text-lg font-bold text-rose-200">Birthday Party Bundle</h5>
                  <p className="mt-2 text-sm text-white/70">Perfect for celebrations</p>
                  <p className="mt-1 text-xs text-white/50">Taco bar, cake, drinks for 15</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-black text-rose-300">$220</span>
                    <span className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition group-hover:scale-105">
                      Customize →
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
                  className="group overflow-hidden rounded-xl border border-rose-400/30 bg-black/40 p-5 text-left transition hover:border-rose-400 hover:bg-black/50"
                >
                  <h5 className="text-lg font-bold text-rose-200">Office Lunch Bundle</h5>
                  <p className="mt-2 text-sm text-white/70">Team meals made easy</p>
                  <p className="mt-1 text-xs text-white/50">Burrito bar, sides for 20</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-black text-rose-300">$240</span>
                    <span className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition group-hover:scale-105">
                      Customize →
                    </span>
                  </div>
                </button>
              </div>
            </div>

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
                className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-600 px-6 py-4 text-lg font-black text-white shadow-2xl shadow-rose-500/40 transition-all hover:scale-105 hover:shadow-rose-500/60"
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
                <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-yellow-400/20 p-6">
                  <Image src={membershipImage} alt="Membership" fill className="object-cover opacity-20" sizes="400px" />
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

                <button className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-6 py-4 text-lg font-black text-black shadow-2xl shadow-amber-500/40 transition-all hover:scale-105 hover:shadow-amber-500/60">
                  Join Rewards Program
                </button>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur" onClick={closeCustomization}>
          <div
            className="w-full max-w-lg translate-y-0 rounded-t-3xl border border-white/10 bg-[#0B142B] p-6 text-white shadow-2xl transition"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/40">Customize</p>
                <h3 className="text-2xl font-semibold text-white">{customModal.item.name}</h3>
                <p className="text-sm text-white/60">Base ${customModal.item.price.toFixed(2)} · Section {customModal.item.sectionType.toLowerCase()}</p>
              </div>
              <button onClick={closeCustomization} className="rounded-full border border-white/20 px-2 py-1 text-xs text-white/60 hover:border-white hover:text-white">Close</button>
            </div>
            {customModal.item.displayGallery && customModal.item.displayGallery.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {customModal.item.displayGallery.map((url, index) => (
                  <div key={`${customModal.item.id}-modal-${index}`} className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-white/15">
                    <Image src={url} alt={`${customModal.item.name} preview ${index + 1}`} fill className="object-cover" sizes="128px" />
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
                          active ? 'border-rose-400 bg-rose-500/30 text-white' : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'
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
                    return (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                          active ? 'border-amber-400 bg-amber-500/20 text-white' : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        <span className="text-left">{addon.label}</span>
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

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleConfirmCustomization}
                className="flex-1 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-500/30 transition hover:-translate-y-0.5"
              >
                Add to Cart · ${totalCustomizedPrice.toFixed(2)}
              </button>
              <button
                onClick={closeCustomization}
                className="flex-1 rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white/70 transition hover:border-white hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Button - Hidden on mobile to avoid overlap */}
      <div className="fixed bottom-5 left-5 z-50 hidden sm:block">
        <button
          onClick={() => setAccessibilityOpen((prev) => !prev)}
          className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 px-3 py-2 text-xs font-semibold text-white shadow-xl shadow-blue-500/30 transition hover:scale-105"
        >
          ♿ Accessibility
        </button>
        {isAccessibilityOpen && (
          <div className="mt-3 w-64 rounded-2xl border border-white/20 bg-black/80 p-4 text-sm text-white/80 shadow-xl backdrop-blur">
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
      </div>
    </div>
  );
}
