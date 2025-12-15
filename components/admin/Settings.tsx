'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StripeConnectButton from './StripeConnectButton';
import DoorDashConnectButton from './DoorDashConnectButton';
import UberDirectConnectButton from './UberDirectConnectButton';
import TaxRemittance from './TaxRemittance';
import SwitchMenuProSync from './SwitchMenuProSync';
import { TEMPLATES, getTemplateGradient, type TemplateType } from '@/lib/templates/registry';

interface SettingsForm {
  restaurantName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  logoUrl: string;
  heroImageUrl: string;
  socialInstagram: string;
  socialFacebook: string;
  socialTikTok: string;
  socialYouTube: string;
  deliveryRadiusMi: string;
  minimumOrderValue: string;
  currency: string;
  timeZone: string;
  platformPercentFee: string;
  platformFlatFee: string;
  defaultTaxRate: string;
  deliveryBaseFee: string;
  stripeAccountId: string;
  autoPrintOrders: boolean;
  printerType: string;
  printerEndpoint: string;
  taxProvider: string;
  taxConfig: string;
}

interface MembershipTierForm {
  id: string;
  name: string;
  threshold: number;
  rewardDescription: string;
  perks: string[];
  badgeColor: string;
}

interface MembershipProgramForm {
  enabled: boolean;
  pointsPerDollar: number;
  heroCopy: string;
  featuredMemberName: string;
  tiers: MembershipTierForm[];
}

interface UpsellBundleForm {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tag: string;
  cta: string;
  surfaces: {
    cart: boolean;
    checkout: boolean;
    menu: boolean;
  };
}

interface AccessibilityDefaultsForm {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
}

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface OperatingHoursForm {
  timezone: string;
  storeHours: Record<string, DayHours>;
  kitchenHours: Record<string, DayHours>;
  useKitchenHours: boolean;
  winterMode: boolean;
  winterStartDate: string;
  winterEndDate: string;
  winterHours: Record<string, DayHours>;
  temporarilyClosed: boolean;
  closedMessage: string;
  serviceMode: {
    pickup: boolean;
    delivery: boolean;
    dineIn: boolean;
  };
  holidays: Array<{
    id: string;
    date: string;
    name: string;
  }>;
}

const defaultFormState: SettingsForm = {
  restaurantName: '',
  tagline: '',
  heroTitle: '',
  heroSubtitle: '',
  primaryColor: '#38c4ff',
  secondaryColor: '#071836',
  contactEmail: '',
  contactPhone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  logoUrl: '',
  heroImageUrl: '',
  socialInstagram: '',
  socialFacebook: '',
  socialTikTok: '',
  socialYouTube: '',
  deliveryRadiusMi: '',
  minimumOrderValue: '',
  currency: 'USD',
  timeZone: 'America/Los_Angeles',
  platformPercentFee: '0.029',
  platformFlatFee: '0.30',
  defaultTaxRate: '0.0825',
  deliveryBaseFee: '4.99',
  stripeAccountId: '',
  autoPrintOrders: false,
  printerType: 'bluetooth',
  printerEndpoint: '',
  taxProvider: 'builtin',
  taxConfig: '',
};

const NUMERIC_FIELDS: Array<keyof SettingsForm> = [
  'deliveryRadiusMi',
  'minimumOrderValue',
  'platformPercentFee',
  'platformFlatFee',
  'defaultTaxRate',
  'deliveryBaseFee',
];

function generateId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const defaultMembershipProgram: MembershipProgramForm = {
  enabled: true,
  pointsPerDollar: 10,
  heroCopy: 'Earn puntos with every order and unlock sweet rewards.',
  featuredMemberName: 'Gold Member',
  tiers: [
    {
      id: generateId('tier'),
      name: 'Bronze',
      threshold: 0,
      rewardDescription: 'Welcome to the club!',
      perks: ['Earn points on every purchase', 'Monthly chef tips'],
      badgeColor: '#b45309',
    },
    {
      id: generateId('tier'),
      name: 'Gold',
      threshold: 500,
      rewardDescription: 'Sweet treats and exclusive drops.',
      perks: ['Free dessert on birthdays', 'Priority support', 'Exclusive tastings'],
      badgeColor: '#d97706',
    },
  ],
};

const defaultAccessibilityDefaults: AccessibilityDefaultsForm = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
};

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const createDefaultDayHours = (): DayHours => ({
  open: '09:00',
  close: '21:00',
  closed: false,
});

const defaultOperatingHours: OperatingHoursForm = {
  timezone: 'America/Los_Angeles',
  storeHours: {
    monday: createDefaultDayHours(),
    tuesday: createDefaultDayHours(),
    wednesday: createDefaultDayHours(),
    thursday: createDefaultDayHours(),
    friday: createDefaultDayHours(),
    saturday: createDefaultDayHours(),
    sunday: createDefaultDayHours(),
  },
  kitchenHours: {
    monday: { ...createDefaultDayHours(), close: '20:30' },
    tuesday: { ...createDefaultDayHours(), close: '20:30' },
    wednesday: { ...createDefaultDayHours(), close: '20:30' },
    thursday: { ...createDefaultDayHours(), close: '20:30' },
    friday: { ...createDefaultDayHours(), close: '20:30' },
    saturday: { ...createDefaultDayHours(), close: '20:30' },
    sunday: { ...createDefaultDayHours(), close: '20:30' },
  },
  useKitchenHours: false,
  winterMode: false,
  winterStartDate: '',
  winterEndDate: '',
  winterHours: {
    monday: createDefaultDayHours(),
    tuesday: createDefaultDayHours(),
    wednesday: createDefaultDayHours(),
    thursday: createDefaultDayHours(),
    friday: createDefaultDayHours(),
    saturday: createDefaultDayHours(),
    sunday: createDefaultDayHours(),
  },
  temporarilyClosed: false,
  closedMessage: 'We are temporarily closed. Check back soon!',
  serviceMode: {
    pickup: true,
    delivery: true,
    dineIn: false,
  },
  holidays: [],
};

function createEmptyUpsellBundle(): UpsellBundleForm {
  return {
    id: generateId('upsell'),
    name: '',
    description: '',
    price: 0,
    image: '',
    tag: '',
    cta: 'Add to order',
    surfaces: {
      cart: true,
      checkout: false,
      menu: false,
    },
  };
}

export default function Settings() {
  const router = useRouter();
  const [form, setForm] = useState<SettingsForm>(defaultFormState);
  const [membershipProgram, setMembershipProgram] = useState<MembershipProgramForm>(defaultMembershipProgram);
  const [upsellBundles, setUpsellBundles] = useState<UpsellBundleForm[]>([]);
  const [accessibilityDefaults, setAccessibilityDefaults] = useState<AccessibilityDefaultsForm>(defaultAccessibilityDefaults);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [heroGallery, setHeroGallery] = useState<string[]>([]);
  const [heroGalleryInput, setHeroGalleryInput] = useState<string>('');
  const [operatingHours, setOperatingHours] = useState<OperatingHoursForm>(defaultOperatingHours);
  const [templateType, setTemplateType] = useState<TemplateType>('restaurant');
  const [gradientFrom, setGradientFrom] = useState<string>('#dc2626');
  const [gradientVia, setGradientVia] = useState<string>('#ea580c');
  const [gradientTo, setGradientTo] = useState<string>('#facc15');
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  const handleHoursChange = (type: 'storeHours' | 'kitchenHours' | 'winterHours', day: string, field: keyof DayHours, value: string | boolean) => {
    setOperatingHours((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [day]: {
          ...prev[type][day],
          [field]: value,
        },
      },
    }));
  };

  const addHoliday = () => {
    setOperatingHours((prev) => ({
      ...prev,
      holidays: [
        ...prev.holidays,
        {
          id: generateId('holiday'),
          date: '',
          name: '',
        },
      ],
    }));
  };

  const removeHoliday = (holidayId: string) => {
    setOperatingHours((prev) => ({
      ...prev,
      holidays: prev.holidays.filter((h) => h.id !== holidayId),
    }));
  };

  const handleHolidayChange = (holidayId: string, field: 'date' | 'name', value: string) => {
    setOperatingHours((prev) => ({
      ...prev,
      holidays: prev.holidays.map((h) => (h.id === holidayId ? { ...h, [field]: value } : h)),
    }));
  };

  const handleTierFieldChange = <K extends keyof MembershipTierForm>(tierId: string, field: K, value: MembershipTierForm[K]) => {
    setMembershipProgram((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => (tier.id === tierId ? { ...tier, [field]: value } : tier)),
    }));
  };

  const handleTierPerksChange = (tierId: string, value: string) => {
    const perks = value
      .split('\n')
      .map((perk) => perk.trim())
      .filter(Boolean);
    handleTierFieldChange(tierId, 'perks', perks);
  };

  const addTier = () => {
    setMembershipProgram((prev) => ({
      ...prev,
      tiers: [
        ...prev.tiers,
        {
          id: generateId('tier'),
          name: '',
          threshold: prev.tiers.length > 0 ? prev.tiers[prev.tiers.length - 1].threshold + 250 : 0,
          rewardDescription: '',
          perks: [],
          badgeColor: '#d97706',
        },
      ],
    }));
  };

  const removeTier = (tierId: string) => {
    setMembershipProgram((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((tier) => tier.id !== tierId),
    }));
  };

  const handleUpsellChange = <K extends keyof UpsellBundleForm>(bundleId: string, field: K, value: UpsellBundleForm[K]) => {
    setUpsellBundles((prev) =>
      prev.map((bundle) => (bundle.id === bundleId ? { ...bundle, [field]: value } : bundle)),
    );
  };

  const toggleUpsellSurface = (bundleId: string, surface: keyof UpsellBundleForm['surfaces']) => {
    setUpsellBundles((prev) =>
      prev.map((bundle) =>
        bundle.id === bundleId
          ? {
              ...bundle,
              surfaces: {
                ...bundle.surfaces,
                [surface]: !bundle.surfaces[surface],
              },
            }
          : bundle,
      ),
    );
  };

  const addUpsell = () => {
    setUpsellBundles((prev) => [...prev, createEmptyUpsellBundle()]);
  };

  const removeUpsell = (bundleId: string) => {
    setUpsellBundles((prev) => prev.filter((bundle) => bundle.id !== bundleId));
  };

  const addHeroGalleryUrl = () => {
    const value = heroGalleryInput.trim();
    if (!value) return;
    setHeroGallery((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setHeroGalleryInput('');
    setMessage('Hero image added to gallery.');
  };

  const removeHeroGalleryUrl = (index: number) => {
    setHeroGallery((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/tenant-settings', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data = await res.json();
        if (!active) return;

        const tenant = data.tenant ?? {};
        const settings = data.settings ?? {};
        const integrations = data.integrations ?? {};

        const taxConfigString =
          integrations.taxConfig && typeof integrations.taxConfig === 'object'
            ? JSON.stringify(integrations.taxConfig, null, 2)
            : '';

        setForm({
          restaurantName: tenant.name || '',
          tagline: settings.tagline || '',
          heroTitle: tenant.heroTitle || tenant.name || '',
          heroSubtitle: tenant.heroSubtitle || '',
          primaryColor: tenant.primaryColor || '#38c4ff',
          secondaryColor: tenant.secondaryColor || '#071836',
          contactEmail: tenant.contactEmail || '',
          contactPhone: tenant.contactPhone || '',
          addressLine1: tenant.addressLine1 || '',
          addressLine2: tenant.addressLine2 || '',
          city: tenant.city || '',
          state: tenant.state || '',
          postalCode: tenant.postalCode || '',
          logoUrl: tenant.logoUrl || '',
          heroImageUrl: tenant.heroImageUrl || '',
          socialInstagram: settings.socialInstagram || '',
          socialFacebook: settings.socialFacebook || '',
          socialTikTok: settings.socialTikTok || '',
          socialYouTube: settings.socialYouTube || '',
          deliveryRadiusMi: settings.deliveryRadiusMi?.toString() || '',
          minimumOrderValue: settings.minimumOrderValue?.toString() || '',
          currency: settings.currency || 'USD',
          timeZone: settings.timeZone || 'America/Los_Angeles',
          platformPercentFee: integrations.platformPercentFee?.toString() || '0.029',
          platformFlatFee: integrations.platformFlatFee?.toString() || '0.30',
          defaultTaxRate: integrations.defaultTaxRate?.toString() || '0.0825',
          deliveryBaseFee: integrations.deliveryBaseFee?.toString() || '4.99',
          stripeAccountId: integrations.stripeAccountId || '',
          autoPrintOrders: Boolean(integrations.autoPrintOrders),
          printerType: integrations.printerType || 'bluetooth',
          printerEndpoint: integrations.printerEndpoint || '',
          taxProvider: integrations.taxProvider || 'builtin',
          taxConfig: taxConfigString,
        });

        const brandingHeroImages = Array.isArray(settings.branding?.heroImages)
          ? settings.branding.heroImages.filter((url: unknown): url is string => typeof url === 'string' && url.length > 0)
          : [];
        setHeroGallery(brandingHeroImages);
        setHeroGalleryInput('');

        const programPayload = settings.membershipProgram;
        if (programPayload && typeof programPayload === 'object') {
          const tiers: MembershipTierForm[] = Array.isArray(programPayload.tiers)
            ? programPayload.tiers.map((tier: any, index: number) => ({
                id: tier?.id || generateId('tier'),
                name: tier?.name || `Tier ${index + 1}`,
                threshold: Number(tier?.threshold ?? 0),
                rewardDescription: tier?.rewardDescription || '',
                perks: Array.isArray(tier?.perks) ? tier.perks.filter(Boolean) : [],
                badgeColor: tier?.badgeColor || '#d97706',
              }))
            : [];

          setMembershipProgram({
            enabled: programPayload.enabled !== false,
            pointsPerDollar: Number(programPayload.pointsPerDollar ?? 10),
            heroCopy: programPayload.heroCopy || defaultMembershipProgram.heroCopy,
            featuredMemberName: programPayload.featuredMemberName || defaultMembershipProgram.featuredMemberName,
            tiers: tiers.length > 0 ? tiers : defaultMembershipProgram.tiers,
          });
        } else {
          setMembershipProgram(defaultMembershipProgram);
        }

        const upsellPayload = Array.isArray(settings.upsellBundles) ? settings.upsellBundles : [];
        if (upsellPayload.length > 0) {
          setUpsellBundles(
            upsellPayload.map((bundle: any) => ({
              id: bundle?.id || generateId('upsell'),
              name: bundle?.name || '',
              description: bundle?.description || '',
              price: Number(bundle?.price ?? 0),
              image: bundle?.image || '',
              tag: bundle?.tag || '',
              cta: bundle?.cta || 'Add to order',
              surfaces: {
                cart: bundle?.surfaces ? bundle.surfaces.includes('cart') : true,
                checkout: bundle?.surfaces ? bundle.surfaces.includes('checkout') : false,
                menu: bundle?.surfaces ? bundle.surfaces.includes('menu') : false,
              },
            })),
          );
        } else {
          setUpsellBundles([]);
        }

        if (settings.accessibilityDefaults && typeof settings.accessibilityDefaults === 'object') {
          setAccessibilityDefaults({
            highContrast: Boolean(settings.accessibilityDefaults.highContrast),
            largeText: Boolean(settings.accessibilityDefaults.largeText),
            reducedMotion: Boolean(settings.accessibilityDefaults.reducedMotion),
          });
        } else {
          setAccessibilityDefaults(defaultAccessibilityDefaults);
        }

        // Load operating hours
        if (settings.operatingHours && typeof settings.operatingHours === 'object') {
          const loadedHours = settings.operatingHours as any;
          setOperatingHours({
            timezone: loadedHours.timezone || defaultOperatingHours.timezone,
            storeHours: loadedHours.storeHours || defaultOperatingHours.storeHours,
            kitchenHours: loadedHours.kitchenHours || defaultOperatingHours.kitchenHours,
            useKitchenHours: Boolean(loadedHours.useKitchenHours),
            winterMode: Boolean(loadedHours.winterMode),
            winterStartDate: loadedHours.winterStartDate || '',
            winterEndDate: loadedHours.winterEndDate || '',
            winterHours: loadedHours.winterHours || defaultOperatingHours.winterHours,
            temporarilyClosed: Boolean(loadedHours.temporarilyClosed),
            closedMessage: loadedHours.closedMessage || defaultOperatingHours.closedMessage,
            serviceMode: loadedHours.serviceMode || defaultOperatingHours.serviceMode,
            holidays: Array.isArray(loadedHours.holidays)
              ? loadedHours.holidays.map((h: any) => ({
                  id: h.id || generateId('holiday'),
                  date: h.date || '',
                  name: h.name || '',
                }))
              : [],
          });
        } else {
          setOperatingHours(defaultOperatingHours);
        }

        // Load theme settings
        const loadedTemplateType = (settings.templateType || 'restaurant') as TemplateType;
        const defaultGradient = getTemplateGradient(loadedTemplateType);
        setTemplateType(loadedTemplateType);
        setGradientFrom(settings.gradientFrom || defaultGradient.from);
        setGradientVia(settings.gradientVia || defaultGradient.via);
        setGradientTo(settings.gradientTo || defaultGradient.to);
      } catch (err) {
        console.error('Failed to load tenant settings', err);
        if (active) {
          setError('Failed to load settings. Try refreshing.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!message && !error && !assetError) return;
    const timeout = setTimeout(() => {
      setMessage(null);
      setError(null);
      setAssetError(null);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [message, error, assetError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAssetUpload = async (field: 'logoUrl' | 'heroImageUrl' | 'heroGallery', file?: File | null) => {
    if (!file) return;
    setAssetError(null);
    setUploadingField(field);
    try {
      const payload = new FormData();
      payload.append('file', file);

      const res = await fetch('/api/admin/assets/upload', {
        method: 'POST',
        body: payload,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      if (field === 'heroGallery') {
        setHeroGallery((prev) => (prev.includes(data.url) ? prev : [...prev, data.url]));
        setMessage('Hero gallery updated.');
      } else {
        setForm((prev) => ({
          ...prev,
          [field]: data.url,
        }));
        setMessage(field === 'logoUrl' ? 'Logo updated.' : 'Hero image updated.');
      }
    } catch (err) {
      console.error(err);
      setAssetError('Failed to upload image. Please try again.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload: Record<string, unknown> = { ...form };

      for (const field of NUMERIC_FIELDS) {
        const value = form[field as keyof SettingsForm];
        payload[field] = value ? Number(value) : null;
      }

      payload.autoPrintOrders = form.autoPrintOrders;
      payload.printerType = form.printerType || 'bluetooth';
      payload.printerEndpoint = form.printerEndpoint.trim() ? form.printerEndpoint.trim() : null;
      payload.taxProvider = form.taxProvider || 'builtin';

      try {
        payload.taxConfig = form.taxConfig.trim() ? JSON.parse(form.taxConfig) : null;
      } catch (err) {
        setError('Tax configuration must be valid JSON.');
        setIsSaving(false);
        return;
      }

      payload.membershipProgram = {
        enabled: membershipProgram.enabled,
        pointsPerDollar: Number(membershipProgram.pointsPerDollar ?? 0),
        heroCopy: membershipProgram.heroCopy,
        featuredMemberName: membershipProgram.featuredMemberName,
        tiers: membershipProgram.tiers.map((tier, index) => ({
          id: tier.id || generateId('tier'),
          name: tier.name || `Tier ${index + 1}`,
          threshold: Number(tier.threshold ?? 0),
          rewardDescription: tier.rewardDescription,
          perks: tier.perks.filter(Boolean),
          badgeColor: tier.badgeColor,
          sortOrder: index,
        })),
      };

      const cleanedHeroGallery = heroGallery
        .map((url) => url.trim())
        .filter((url) => url.length > 0);
      payload.branding = {
        heroImages: cleanedHeroGallery,
      };

      payload.upsellBundles = upsellBundles
        .filter((bundle) => bundle.name.trim() !== '')
        .map((bundle) => ({
          id: bundle.id || generateId('upsell'),
          name: bundle.name,
          description: bundle.description,
          price: Number(bundle.price ?? 0),
          image: bundle.image || null,
          tag: bundle.tag || null,
          cta: bundle.cta || 'Add to order',
          surfaces: (['cart', 'checkout', 'menu'] as const).filter((surface) => bundle.surfaces[surface]),
        }));

      payload.accessibilityDefaults = {
        highContrast: Boolean(accessibilityDefaults.highContrast),
        largeText: Boolean(accessibilityDefaults.largeText),
        reducedMotion: Boolean(accessibilityDefaults.reducedMotion),
      };

      payload.operatingHours = {
        timezone: operatingHours.timezone,
        storeHours: operatingHours.storeHours,
        kitchenHours: operatingHours.kitchenHours,
        useKitchenHours: Boolean(operatingHours.useKitchenHours),
        winterMode: Boolean(operatingHours.winterMode),
        winterStartDate: operatingHours.winterStartDate,
        winterEndDate: operatingHours.winterEndDate,
        winterHours: operatingHours.winterHours,
        temporarilyClosed: Boolean(operatingHours.temporarilyClosed),
        closedMessage: operatingHours.closedMessage,
        serviceMode: operatingHours.serviceMode,
        holidays: operatingHours.holidays.filter((h) => h.date && h.name),
      };

      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      setMessage('Settings saved successfully. Frontend will reflect changes on next page load.');
      // Refresh the admin dashboard to show updated data
      router.refresh();
      
      // If operating hours were updated, trigger a custom event to notify other components
      if (payload.operatingHours !== undefined) {
        window.dispatchEvent(new CustomEvent('operatingHoursUpdated'));
      }
    } catch (err) {
      console.error('Failed to save settings', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow px-4 py-10 sm:rounded-lg sm:p-10 text-center text-gray-500">
        Loading tenant settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
      <div className="flex flex-col gap-2">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Brand & Restaurant Settings</h2>
          <p className="mt-1 text-sm text-gray-500">
            Update the information customers see across your ordering experience.
          </p>
        </div>
        {message && <p className="text-sm text-green-600">{message}</p>}
        {assetError && <p className="text-sm text-red-600">{assetError}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Brand Basics</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700">
                Restaurant Name
              </label>
              <input
                type="text"
                name="restaurantName"
                id="restaurantName"
                value={form.restaurantName}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="tagline" className="block text-sm font-medium text-gray-700">
                Tagline
              </label>
              <input
                type="text"
                name="tagline"
                id="tagline"
                value={form.tagline}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="heroTitle" className="block text-sm font-medium text-gray-700">
                Hero Title
              </label>
              <input
                type="text"
                name="heroTitle"
                id="heroTitle"
                value={form.heroTitle}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="heroSubtitle" className="block text-sm font-medium text-gray-700">
                Hero Subtitle
              </label>
              <input
                type="text"
                name="heroSubtitle"
                id="heroSubtitle"
                value={form.heroSubtitle}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
                Primary Color
              </label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="color"
                  name="primaryColor"
                  id="primaryColor"
                  value={form.primaryColor}
                  onChange={handleChange}
                  className="h-10 w-16 cursor-pointer border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={handleChange}
                  name="primaryColor"
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700">
                Secondary Color
              </label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="color"
                  name="secondaryColor"
                  id="secondaryColor"
                  value={form.secondaryColor}
                  onChange={handleChange}
                  className="h-10 w-16 cursor-pointer border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={form.secondaryColor}
                  onChange={handleChange}
                  name="secondaryColor"
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                Logo
              </label>
              <input
                type="text"
                name="logoUrl"
                id="logoUrl"
                value={form.logoUrl}
                onChange={handleChange}
                placeholder="https://... or /uploads/filename.png"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="logoUploadInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    void handleAssetUpload('logoUrl', file);
                    event.target.value = '';
                  }}
                />
                <label
                  htmlFor="logoUploadInput"
                  className={`inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition ${
                    uploadingField === 'logoUrl'
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer hover:border-gray-400 hover:text-gray-900'
                  }`}
                >
                  {uploadingField === 'logoUrl' ? 'Uploading…' : 'Upload file'}
                </label>
                {form.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="h-12 w-12 rounded border border-gray-200 object-contain"
                  />
                )}
              </div>
            </div>

            <div>
              <label htmlFor="heroImageUrl" className="block text-sm font-medium text-gray-700">
                Hero Background Image
              </label>
              <input
                type="text"
                name="heroImageUrl"
                id="heroImageUrl"
                value={form.heroImageUrl}
                onChange={handleChange}
                placeholder="https://... or /uploads/hero.jpg"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <input
                    id="heroUploadInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      void handleAssetUpload('heroImageUrl', file);
                      event.target.value = '';
                    }}
                  />
                <label
                  htmlFor="heroUploadInput"
                  className={`inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition ${
                    uploadingField === 'heroImageUrl'
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer hover:border-gray-400 hover:text-gray-900'
                  }`}
                >
                  {uploadingField === 'heroImageUrl' ? 'Uploading…' : 'Upload file'}
                </label>
                </div>
                {form.heroImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.heroImageUrl}
                    alt="Hero preview"
                    className="h-16 w-full max-w-xs rounded border border-gray-200 object-cover"
                  />
                )}
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700">Hero Gallery</label>
              <p className="mt-1 text-xs text-gray-500">
                Add multiple images to rotate through the storefront hero background.
              </p>
              {heroGallery.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {heroGallery.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Hero ${index + 1}`}
                        className="h-16 w-28 rounded-lg border border-gray-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeHeroGalleryUrl(index)}
                        className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-gray-600 shadow hover:bg-gray-100"
                        aria-label="Remove hero image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={heroGalleryInput}
                    onChange={(event) => setHeroGalleryInput(event.target.value)}
                    placeholder="https://... or /uploads/hero-2.jpg"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addHeroGalleryUrl}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="heroGalleryUploadInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      void handleAssetUpload('heroGallery', file);
                      event.target.value = '';
                    }}
                  />
                  <label
                    htmlFor="heroGalleryUploadInput"
                    className={`inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition ${
                      uploadingField === 'heroGallery'
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer hover:border-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {uploadingField === 'heroGallery' ? 'Uploading…' : 'Upload'}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Theme & Branding Section */}
        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Theme & Branding</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            {/* Template Selector */}
            <div className="mb-6">
              <label htmlFor="templateType" className="block text-sm font-medium text-gray-700 mb-2">
                Template Type
              </label>
              <select
                id="templateType"
                value={templateType}
                onChange={(e) => {
                  const newTemplate = e.target.value as TemplateType;
                  setTemplateType(newTemplate);
                  // Optionally apply default gradient
                  const defaultGradient = getTemplateGradient(newTemplate);
                  setGradientFrom(defaultGradient.from);
                  setGradientVia(defaultGradient.via);
                  setGradientTo(defaultGradient.to);
                }}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {Object.values(TEMPLATES).map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.icon} {template.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {TEMPLATES[templateType].description}
              </p>
            </div>

            {/* Gradient Editor */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Custom Gradient Colors
              </label>
              <div className="space-y-4">
                {/* From */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={gradientFrom}
                      onChange={(e) => setGradientFrom(e.target.value)}
                      className="h-10 w-16 cursor-pointer border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={gradientFrom}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow typing, validate format
                        if (value === '' || /^#[0-9A-Fa-f]{0,6}$/i.test(value)) {
                          setGradientFrom(value || '#');
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure valid hex on blur
                        const value = e.target.value.trim();
                        if (!/^#[0-9A-Fa-f]{6}$/i.test(value)) {
                          // If invalid, try to fix or use default
                          if (value.startsWith('#') && /^[0-9A-Fa-f]{1,6}$/i.test(value.slice(1))) {
                            // Pad with zeros if needed
                            const hex = value.slice(1).padEnd(6, '0');
                            setGradientFrom(`#${hex}`);
                          } else {
                            setGradientFrom('#dc2626');
                          }
                        }
                      }}
                      placeholder="#dc2626"
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Via */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Via</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={gradientVia}
                      onChange={(e) => setGradientVia(e.target.value)}
                      className="h-10 w-16 cursor-pointer border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={gradientVia}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow typing, validate format
                        if (value === '' || /^#[0-9A-Fa-f]{0,6}$/i.test(value)) {
                          setGradientVia(value || '#');
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure valid hex on blur
                        const value = e.target.value.trim();
                        if (!/^#[0-9A-Fa-f]{6}$/i.test(value)) {
                          // If invalid, try to fix or use default
                          if (value.startsWith('#') && /^[0-9A-Fa-f]{1,6}$/i.test(value.slice(1))) {
                            // Pad with zeros if needed
                            const hex = value.slice(1).padEnd(6, '0');
                            setGradientVia(`#${hex}`);
                          } else {
                            setGradientVia('#ea580c');
                          }
                        }
                      }}
                      placeholder="#ea580c"
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* To */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={gradientTo}
                      onChange={(e) => setGradientTo(e.target.value)}
                      className="h-10 w-16 cursor-pointer border border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={gradientTo}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow typing, validate format
                        if (value === '' || /^#[0-9A-Fa-f]{0,6}$/i.test(value)) {
                          setGradientTo(value || '#');
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure valid hex on blur
                        const value = e.target.value.trim();
                        if (!/^#[0-9A-Fa-f]{6}$/i.test(value)) {
                          // If invalid, try to fix or use default
                          if (value.startsWith('#') && /^[0-9A-Fa-f]{1,6}$/i.test(value.slice(1))) {
                            // Pad with zeros if needed
                            const hex = value.slice(1).padEnd(6, '0');
                            setGradientTo(`#${hex}`);
                          } else {
                            setGradientTo('#facc15');
                          }
                        }
                      }}
                      placeholder="#facc15"
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Live Preview</label>
              <div
                className="h-20 rounded-xl border border-gray-300 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${gradientFrom}, ${gradientVia}, ${gradientTo})`,
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const defaultGradient = getTemplateGradient(templateType);
                  setGradientFrom(defaultGradient.from);
                  setGradientVia(defaultGradient.via);
                  setGradientTo(defaultGradient.to);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset to Template Default
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsSavingTheme(true);
                  setError(null);
                  setMessage(null);
                  try {
                    const res = await fetch('/api/admin/tenant-settings', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        templateType,
                        gradientFrom,
                        gradientVia,
                        gradientTo,
                      }),
                    });

                    if (!res.ok) {
                      throw new Error(await res.text());
                    }

                    setMessage('Theme settings saved successfully. Frontend will reflect changes on next page load.');
                    router.refresh();
                  } catch (err) {
                    console.error('Failed to save theme settings', err);
                    setError('Failed to save theme settings. Please try again.');
                  } finally {
                    setIsSavingTheme(false);
                  }
                }}
                disabled={isSavingTheme}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSavingTheme ? 'Saving...' : 'Save Theme'}
              </button>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Contact & Location</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="contactEmail"
                id="contactEmail"
                value={form.contactEmail}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                name="contactPhone"
                id="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
                Address Line 1
              </label>
              <input
                type="text"
                name="addressLine1"
                id="addressLine1"
                value={form.addressLine1}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">
                Address Line 2
              </label>
              <input
                type="text"
                name="addressLine2"
                id="addressLine2"
                value={form.addressLine2}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                name="city"
                id="city"
                value={form.city}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State / Region
              </label>
              <input
                type="text"
                name="state"
                id="state"
                value={form.state}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                name="postalCode"
                id="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="deliveryRadiusMi" className="block text-sm font-medium text-gray-700">
                  Delivery Radius (mi)
                </label>
                <input
                  type="number"
                  min="0"
                  name="deliveryRadiusMi"
                  id="deliveryRadiusMi"
                  value={form.deliveryRadiusMi}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="minimumOrderValue" className="block text-sm font-medium text-gray-700">
                  Minimum Order ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="minimumOrderValue"
                  id="minimumOrderValue"
                  value={form.minimumOrderValue}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <input
                type="text"
                name="currency"
                id="currency"
                value={form.currency}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700">
                Time Zone
              </label>
              <input
                type="text"
                name="timeZone"
                id="timeZone"
                value={form.timeZone}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g. America/Los_Angeles"
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Business Hours & Operations</h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure store hours, kitchen hours, seasonal schedules, and service modes. Control when customers can place orders.
          </p>

          {/* Temporary Closure Toggle */}
          <div className="mb-6 rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-900">Temporarily Closed</p>
                <p className="text-xs text-amber-700 mt-1">
                  Enable this to immediately close online ordering. Customers will see your custom message.
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                checked={operatingHours.temporarilyClosed}
                onChange={(e) =>
                  setOperatingHours((prev) => ({
                    ...prev,
                    temporarilyClosed: e.target.checked,
                  }))
                }
              />
            </label>
            {operatingHours.temporarilyClosed && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-amber-900">Closure Message</label>
                <input
                  type="text"
                  value={operatingHours.closedMessage}
                  onChange={(e) =>
                    setOperatingHours((prev) => ({
                      ...prev,
                      closedMessage: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                  placeholder="We are temporarily closed. Check back soon!"
                />
              </div>
            )}
          </div>

          {/* Service Modes */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Service Modes</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={operatingHours.serviceMode.pickup}
                  onChange={(e) =>
                    setOperatingHours((prev) => ({
                      ...prev,
                      serviceMode: {
                        ...prev.serviceMode,
                        pickup: e.target.checked,
                      },
                    }))
                  }
                />
                <span className="text-sm font-medium text-gray-700">Pickup</span>
              </label>
              <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={operatingHours.serviceMode.delivery}
                  onChange={(e) =>
                    setOperatingHours((prev) => ({
                      ...prev,
                      serviceMode: {
                        ...prev.serviceMode,
                        delivery: e.target.checked,
                      },
                    }))
                  }
                />
                <span className="text-sm font-medium text-gray-700">Delivery</span>
              </label>
              <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={operatingHours.serviceMode.dineIn}
                  onChange={(e) =>
                    setOperatingHours((prev) => ({
                      ...prev,
                      serviceMode: {
                        ...prev.serviceMode,
                        dineIn: e.target.checked,
                      },
                    }))
                  }
                />
                <span className="text-sm font-medium text-gray-700">Dine-in</span>
              </label>
            </div>
          </div>

          {/* Store Hours */}
          <div className="mb-6 rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Store Hours</h4>
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-3">
                    <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="time"
                      value={operatingHours.storeHours[day]?.open || '09:00'}
                      onChange={(e) => handleHoursChange('storeHours', day, 'open', e.target.value)}
                      disabled={operatingHours.storeHours[day]?.closed}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="time"
                      value={operatingHours.storeHours[day]?.close || '21:00'}
                      onChange={(e) => handleHoursChange('storeHours', day, 'close', e.target.value)}
                      disabled={operatingHours.storeHours[day]?.closed}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={operatingHours.storeHours[day]?.closed || false}
                        onChange={(e) => handleHoursChange('storeHours', day, 'closed', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600">Closed</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kitchen Hours Toggle */}
          <div className="mb-6">
            <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Separate Kitchen Hours</p>
                <p className="text-xs text-gray-500 mt-1">
                  Enable if your kitchen closes earlier than your store (e.g., no orders 30min before close)
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={operatingHours.useKitchenHours}
                onChange={(e) =>
                  setOperatingHours((prev) => ({
                    ...prev,
                    useKitchenHours: e.target.checked,
                  }))
                }
              />
            </label>
          </div>

          {/* Kitchen Hours (conditional) */}
          {operatingHours.useKitchenHours && (
            <div className="mb-6 rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Kitchen Hours</h4>
              <p className="text-xs text-gray-500 mb-3">Last call for orders. Should be earlier than store closing time.</p>
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-3">
                      <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="time"
                        value={operatingHours.kitchenHours[day]?.open || '09:00'}
                        onChange={(e) => handleHoursChange('kitchenHours', day, 'open', e.target.value)}
                        disabled={operatingHours.kitchenHours[day]?.closed}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="time"
                        value={operatingHours.kitchenHours[day]?.close || '20:30'}
                        onChange={(e) => handleHoursChange('kitchenHours', day, 'close', e.target.value)}
                        disabled={operatingHours.kitchenHours[day]?.closed}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={operatingHours.kitchenHours[day]?.closed || false}
                          onChange={(e) => handleHoursChange('kitchenHours', day, 'closed', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600">Closed</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Winter/Seasonal Hours */}
          <div className="mb-6">
            <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Winter/Seasonal Hours</p>
                <p className="text-xs text-gray-500 mt-1">
                  Enable different hours during winter or off-season months
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={operatingHours.winterMode}
                onChange={(e) =>
                  setOperatingHours((prev) => ({
                    ...prev,
                    winterMode: e.target.checked,
                  }))
                }
              />
            </label>
          </div>

          {operatingHours.winterMode && (
            <div className="mb-6 rounded-lg border border-gray-200 p-4">
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Winter Start Date</label>
                  <input
                    type="date"
                    value={operatingHours.winterStartDate}
                    onChange={(e) =>
                      setOperatingHours((prev) => ({
                        ...prev,
                        winterStartDate: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Winter End Date</label>
                  <input
                    type="date"
                    value={operatingHours.winterEndDate}
                    onChange={(e) =>
                      setOperatingHours((prev) => ({
                        ...prev,
                        winterEndDate: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Winter Hours</h4>
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-3">
                      <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="time"
                        value={operatingHours.winterHours[day]?.open || '09:00'}
                        onChange={(e) => handleHoursChange('winterHours', day, 'open', e.target.value)}
                        disabled={operatingHours.winterHours[day]?.closed}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="time"
                        value={operatingHours.winterHours[day]?.close || '21:00'}
                        onChange={(e) => handleHoursChange('winterHours', day, 'close', e.target.value)}
                        disabled={operatingHours.winterHours[day]?.closed}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={operatingHours.winterHours[day]?.closed || false}
                          onChange={(e) => handleHoursChange('winterHours', day, 'closed', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600">Closed</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holiday Closures */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Holiday Closures</h4>
              <button
                type="button"
                onClick={addHoliday}
                className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Add Holiday
              </button>
            </div>
            {operatingHours.holidays.length === 0 && (
              <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                No holidays configured. Add specific dates when your business will be closed.
              </p>
            )}
            {operatingHours.holidays.length > 0 && (
              <div className="space-y-3">
                {operatingHours.holidays.map((holiday) => (
                  <div key={holiday.id} className="flex items-center gap-3">
                    <input
                      type="date"
                      value={holiday.date}
                      onChange={(e) => handleHolidayChange(holiday.id, 'date', e.target.value)}
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <input
                      type="text"
                      value={holiday.name}
                      onChange={(e) => handleHolidayChange(holiday.id, 'name', e.target.value)}
                      placeholder="Holiday name"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeHoliday(holiday.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Integrations Section */}
        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Integrations</h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect your payment processor, delivery service, and printer to enable order fulfillment.
          </p>

          {/* Stripe Connect */}
          <div className="mb-6">
            <StripeConnectButton />
          </div>

          {/* Apple Pay Configuration */}
          <div className="mb-6 rounded-lg border-2 border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Apple Pay</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Configure Apple Pay merchant ID and certificate for live payments
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apple Pay Merchant ID
                </label>
                <input
                  type="text"
                  placeholder="merchant.com.example"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={form.stripeAccountId || ''} // Reuse field or add new one
                  onChange={(e) => {
                    // Store in tenant integration
                    // This would need to be added to the form state
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Get your Merchant ID from{' '}
                  <a
                    href="https://developer.apple.com/account/resources/identifiers/list/merchant"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Apple Developer Portal
                  </a>
                </p>
              </div>
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Apple Pay requires:
                  <br />• Merchant ID registered in Apple Developer
                  <br />• Domain registered in Apple Pay Merchant Identity
                  <br />• Payment Processing Certificate (.pem file)
                  <br />• Private key for the certificate
                  <br />
                  <br />
                  Set <code>APPLE_PAY_MERCHANT_ID</code>, <code>APPLE_PAY_CERTIFICATE_PATH</code>, and{' '}
                  <code>APPLE_PAY_KEY_PATH</code> in environment variables, or configure via tenant integration settings.
                </p>
              </div>
            </div>
          </div>

          {/* DoorDash Integration */}
          <div className="mb-6">
            <DoorDashConnectButton />
          </div>

          {/* Uber Direct Integration */}
          <div className="mb-6">
            <UberDirectConnectButton />
          </div>

          {/* Switch Menu Pro Sync */}
          <div className="mb-6">
            <SwitchMenuProSync />
          </div>

          {/* Printer Integration */}
          <div className="mb-6 rounded-lg border-2 border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                  <span className="text-2xl">🖨️</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Receipt Printer</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Connect Bluetooth printer for automatic order printing
                  </p>
                  <p className="text-xs text-amber-600 mt-1 font-medium">⚠ Not Connected</p>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Discover Printers
              </button>
            </div>

            {/* Auto-print Toggle */}
            <div className="mt-4 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-Print Orders</p>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically print new orders when they arrive
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.autoPrintOrders}
                onChange={(e) => setForm((prev) => ({ ...prev, autoPrintOrders: e.target.checked }))}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Membership Program</h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure loyalty tiers, copy, and point earning rules that power the customer rewards card.
          </p>
          <div className="space-y-5 rounded-lg border border-gray-200 p-4">
            <label className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="text-sm font-medium text-gray-700">Enable loyalty program</span>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={membershipProgram.enabled}
                onChange={(e) =>
                  setMembershipProgram((prev) => ({
                    ...prev,
                    enabled: e.target.checked,
                  }))
                }
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Points per $1 spent</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={membershipProgram.pointsPerDollar}
                  onChange={(e) =>
                    setMembershipProgram((prev) => ({
                      ...prev,
                      pointsPerDollar: Number(e.target.value),
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Used to calculate reward points earned at checkout.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Featured member name</label>
                <input
                  type="text"
                  value={membershipProgram.featuredMemberName}
                  onChange={(e) =>
                    setMembershipProgram((prev) => ({
                      ...prev,
                      featuredMemberName: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Maria Rodriguez"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hero copy</label>
              <textarea
                value={membershipProgram.heroCopy}
                onChange={(e) =>
                  setMembershipProgram((prev) => ({
                    ...prev,
                    heroCopy: e.target.value,
                  }))
                }
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Tiers</h4>
                <button
                  type="button"
                  onClick={addTier}
                  className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Add tier
                </button>
              </div>
              {membershipProgram.tiers.map((tier, index) => (
                <div key={tier.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      Tier {index + 1}
                    </span>
                    {membershipProgram.tiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTier(tier.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                        Name
                      </label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => handleTierFieldChange(tier.id, 'name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                        Threshold (points)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={tier.threshold}
                        onChange={(e) =>
                          handleTierFieldChange(tier.id, 'threshold', Number(e.target.value))
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                        Badge color
                      </label>
                      <input
                        type="color"
                        value={tier.badgeColor}
                        onChange={(e) => handleTierFieldChange(tier.id, 'badgeColor', e.target.value)}
                        className="mt-1 h-10 w-16 cursor-pointer rounded border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                        Reward summary
                      </label>
                      <input
                        type="text"
                        value={tier.rewardDescription}
                        onChange={(e) => handleTierFieldChange(tier.id, 'rewardDescription', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Free dessert every month"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Perks (one per line)
                    </label>
                    <textarea
                      value={tier.perks.join('\n')}
                      onChange={(e) => handleTierPerksChange(tier.id, e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Upsell Bundles</h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure cart and checkout upsells with imagery, pricing, and surfaces to boost average order value.
          </p>
          <div className="space-y-4">
            {upsellBundles.length === 0 && (
              <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                No upsells yet. Add your first bundle to highlight recommended add-ons.
              </p>
            )}
            {upsellBundles.map((bundle) => (
              <div key={bundle.id} className="space-y-3 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Upsell</span>
                  <button
                    type="button"
                    onClick={() => removeUpsell(bundle.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Name
                    </label>
                    <input
                      type="text"
                      value={bundle.name}
                      onChange={(e) => handleUpsellChange(bundle.id, 'name', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bundle.price}
                      onChange={(e) => handleUpsellChange(bundle.id, 'price', Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={bundle.image}
                      onChange={(e) => handleUpsellChange(bundle.id, 'image', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Tag (optional)
                    </label>
                    <input
                      type="text"
                      value={bundle.tag}
                      onChange={(e) => handleUpsellChange(bundle.id, 'tag', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Dessert"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Description
                  </label>
                  <textarea
                    value={bundle.description}
                    onChange={(e) => handleUpsellChange(bundle.id, 'description', e.target.value)}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Call to action
                  </label>
                  <input
                    type="text"
                    value={bundle.cta}
                    onChange={(e) => handleUpsellChange(bundle.id, 'cta', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Add to order"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Surfaces
                  </span>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {(['cart', 'checkout', 'menu'] as const).map((surface) => (
                      <label key={surface} className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={bundle.surfaces[surface]}
                          onChange={() => toggleUpsellSurface(bundle.id, surface)}
                        />
                        {surface.charAt(0).toUpperCase() + surface.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addUpsell}
              className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Add upsell bundle
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Accessibility Defaults</h3>
          <p className="text-sm text-gray-500 mb-4">
            Choose which accessibility aids are enabled by default on the ordering experience. Customers can still override these preferences.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={accessibilityDefaults.highContrast}
                onChange={(e) =>
                  setAccessibilityDefaults((prev) => ({ ...prev, highContrast: e.target.checked }))
                }
              />
              <span className="text-sm text-gray-700">High contrast</span>
            </label>
            <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={accessibilityDefaults.largeText}
                onChange={(e) =>
                  setAccessibilityDefaults((prev) => ({ ...prev, largeText: e.target.checked }))
                }
              />
              <span className="text-sm text-gray-700">Large text</span>
            </label>
            <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={accessibilityDefaults.reducedMotion}
                onChange={(e) =>
                  setAccessibilityDefaults((prev) => ({ ...prev, reducedMotion: e.target.checked }))
                }
              />
              <span className="text-sm text-gray-700">Reduced motion</span>
            </label>
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Payments</h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <StripeConnectButton />
            </div>
            <div className="sm:col-span-2 space-y-4">
              <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Auto-print new orders</p>
                  <p className="text-xs text-gray-500">
                    Send confirmed orders to your configured printer endpoint. Supports Bluetooth print bridges and Clover.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={form.autoPrintOrders}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      autoPrintOrders: event.target.checked,
                    }))
                  }
                />
              </label>
              {form.autoPrintOrders && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="printerType" className="block text-sm font-medium text-gray-700">
                      Printer type
                    </label>
                    <select
                      id="printerType"
                      name="printerType"
                      value={form.printerType}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="bluetooth">Bluetooth bridge</option>
                      <option value="clover">Clover</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Choose <span className="font-medium">Bluetooth</span> for generic receipt printers via a bridge service.
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="printerEndpoint" className="block text-sm font-medium text-gray-700">
                      Printer endpoint or config
                    </label>
                    <textarea
                      id="printerEndpoint"
                      name="printerEndpoint"
                      value={form.printerEndpoint}
                      onChange={handleChange}
                      rows={3}
                      placeholder='https://bridge.local/print or {"endpoint":"https://bridge.local/print","apiKey":"secret"}'
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Provide a URL for your print service. JSON is supported to include <code>apiKey</code> and <code>profile</code>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Taxes</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
            <div>
              <label htmlFor="taxProvider" className="block text-sm font-medium text-gray-700">
                Tax provider
              </label>
              <select
                id="taxProvider"
                name="taxProvider"
                value={form.taxProvider}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="builtin">Built-in rate</option>
                <option value="taxjar">TaxJar</option>
                <option value="avalara">Avalara (Davo)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Use the built-in rate for simple calculations or connect to an external provider for automatic rates.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="taxConfig" className="block text-sm font-medium text-gray-700">
                Tax configuration (JSON)
              </label>
              <textarea
                id="taxConfig"
                name="taxConfig"
                value={form.taxConfig}
                onChange={handleChange}
                rows={5}
                placeholder='{"apiKey":"taxjar_live_..."} or {"accountId":"...","licenseKey":"...","companyCode":"..."} for Avalara'
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                <strong>TaxJar:</strong> <code>apiKey</code>, <code>nexusAddresses</code>, <code>defaultProductTaxCode</code>, <code>shippingTaxable</code>, <code>surchargeTaxable</code>, <code>fallbackRate</code>.<br />
                <strong>Avalara:</strong> <code>accountId</code>, <code>licenseKey</code>, <code>companyCode</code>, <code>environment</code> (sandbox/production), <code>defaultProductTaxCode</code>, <code>shippingTaxable</code>, <code>surchargeTaxable</code>, <code>fallbackRate</code>.
              </p>
            </div>
          </div>

          {/* Tax Remittance Section */}
          <div className="mt-6">
            <TaxRemittance />
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Social Links</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="socialInstagram" className="block text-sm font-medium text-gray-700">
                Instagram
              </label>
              <input
                type="text"
                name="socialInstagram"
                id="socialInstagram"
                value={form.socialInstagram}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="@handle"
              />
            </div>
            <div>
              <label htmlFor="socialFacebook" className="block text-sm font-medium text-gray-700">
                Facebook
              </label>
              <input
                type="text"
                name="socialFacebook"
                id="socialFacebook"
                value={form.socialFacebook}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="facebook.com/yourpage"
              />
            </div>
            <div>
              <label htmlFor="socialTikTok" className="block text-sm font-medium text-gray-700">
                TikTok
              </label>
              <input
                type="text"
                name="socialTikTok"
                id="socialTikTok"
                value={form.socialTikTok}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="@handle"
              />
            </div>
            <div>
              <label htmlFor="socialYouTube" className="block text-sm font-medium text-gray-700">
                YouTube
              </label>
              <input
                type="text"
                name="socialYouTube"
                id="socialYouTube"
                value={form.socialYouTube}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="youtube.com/yourchannel"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
