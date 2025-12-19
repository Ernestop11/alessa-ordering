"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import OnboardingWizard from './OnboardingWizard';
import MLMAdminPanel from '../mlm/MLMAdminPanel';
import CRMPanel from './CRMPanel';
import TemplateLibrary from './TemplateLibrary';
import TopMetricsBar from './dashboard/TopMetricsBar';
import TenantsServicesPanel from './dashboard/TenantsServicesPanel';
import PipelinePanel from './dashboard/PipelinePanel';
import ProductsEcosystemPanel from './dashboard/ProductsEcosystemPanel';
import RevenueProjection from './dashboard/RevenueProjection';
import MLMCompanyTree from './dashboard/MLMCompanyTree';

type TenantLifecycleStatus =
  | 'PENDING_REVIEW'
  | 'READY_FOR_APPROVAL'
  | 'APPROVED'
  | 'LIVE'
  | 'PAUSED'
  | 'ARCHIVED';

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: TenantLifecycleStatus;
  statusUpdatedAt: string | null;
  statusNotes: string | null;
  subscriptionPlan: string | null;
  subscriptionMonthlyFee: number;
  subscriptionAddons: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  stripeAccountId?: string | null;
  doorDashStoreId?: string | null;
  platformPercentFee?: number | null;
  platformFlatFee?: number | null;
  defaultTaxRate?: number | null;
  deliveryBaseFee?: number | null;
  autoPrintOrders: boolean;
  fulfillmentNotificationsEnabled: boolean;
  cloverMerchantId?: string | null;
  cloverApiKey?: string | null;
  isOpen: boolean;
  deliveryRadiusMi?: number | null;
  minimumOrderValue?: number | null;
  currency?: string | null;
  timeZone?: string | null;
  tagline?: string | null;
  socialInstagram?: string | null;
  socialFacebook?: string | null;
  socialTikTok?: string | null;
  socialYouTube?: string | null;
  createdAt: string;
  updatedAt: string;
  ordersLastSevenDays: number;
  grossLastSevenDays: number;
  totalOrders: number;
  totalGross: number;
  lastOrderAt: string | null;
  lastOrderAmount: number | null;
}

interface SuperMetrics {
  totalOrders: number;
  totalTenants: number;
  sevenDayVolume: Array<{
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    orders: number;
    gross: number;
  }>;
  allTimeVolume: Array<{
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    orders: number;
    gross: number;
  }>;
  tenantActivity: Array<{
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    lastOrderAt: string | null;
    lastOrderAmount: number | null;
  }>;
  estimatedStripeVolume: number;
}

interface Props {
  initialTenants: TenantSummary[];
  initialMetrics: SuperMetrics;
  rootDomain: string;
  initialTemplates?: BusinessTemplate[];
}

interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  status: TenantLifecycleStatus;
  statusUpdatedAt?: string | null;
  statusNotes?: string | null;
  subscriptionPlan?: string | null;
  subscriptionMonthlyFee?: number;
  subscriptionAddons?: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  stripeAccountId?: string | null;
  doorDashStoreId?: string | null;
  platformPercentFee?: number | null;
  platformFlatFee?: number | null;
  defaultTaxRate?: number | null;
  deliveryBaseFee?: number | null;
  autoPrintOrders: boolean;
  fulfillmentNotificationsEnabled: boolean;
  cloverMerchantId?: string | null;
  cloverApiKey?: string | null;
  isOpen: boolean;
  deliveryRadiusMi?: number | null;
  minimumOrderValue?: number | null;
  currency?: string | null;
  timeZone?: string | null;
  tagline?: string | null;
  socialInstagram?: string | null;
  socialFacebook?: string | null;
  socialTikTok?: string | null;
  socialYouTube?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface TenantForm {
  id: string;
  name: string;
  slug: string;
  status: TenantLifecycleStatus;
  statusNotes: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  heroImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  tagline: string;
  deliveryRadiusMi: string;
  minimumOrderValue: string;
  currency: string;
  timeZone: string;
  platformPercentFee: string;
  platformFlatFee: string;
  defaultTaxRate: string;
  deliveryBaseFee: string;
  stripeAccountId: string;
  cloverMerchantId: string;
  cloverApiKey: string;
  subscriptionPlan: string;
  subscriptionMonthlyFee: string;
  subscriptionAddons: string;
  autoPrintOrders: boolean;
  fulfillmentNotificationsEnabled: boolean;
  isOpen: boolean;
  socialInstagram: string;
  socialFacebook: string;
  socialTikTok: string;
  socialYouTube: string;
}

interface StatusAction {
  label: string;
  next: TenantLifecycleStatus;
  icon: string;
  confirm?: string;
}

const defaultCreateForm = {
  name: '',
  slug: '',
  contactEmail: '',
  contactPhone: '',
  heroTitle: '',
  heroSubtitle: '',
  tagline: '',
  primaryColor: '#dc2626',
  secondaryColor: '#f59e0b',
  stripeAccountId: '',
  seedDemo: true,
};

type CreateFormState = typeof defaultCreateForm;

type SuperAdminTab = 'dashboard' | 'tenants' | 'onboarding' | 'templates' | 'mlm' | 'crm';

interface BusinessTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  colors: { primary: string; secondary: string };
  features: string[];
}

const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: 'lasreinas',
    name: 'Las Reinas (Full Template)',
    icon: '👑',
    description: 'Complete template with menu, catering, and all features from Las Reinas',
    colors: { primary: '#dc2626', secondary: '#f59e0b' },
    features: ['Full Menu', 'Catering', 'Rewards', 'Complete Setup'],
  },
  {
    id: 'taqueria',
    name: 'Taqueria',
    icon: '🌮',
    description: 'Mexican restaurant with tacos, burritos, and traditional dishes',
    colors: { primary: '#dc2626', secondary: '#f59e0b' },
    features: ['Tacos', 'Burritos', 'Quesadillas', 'Beverages'],
  },
  {
    id: 'panaderia',
    name: 'Panadería',
    icon: '🥖',
    description: 'Bakery with fresh bread, pastries, and sweet treats',
    colors: { primary: '#f59e0b', secondary: '#fbbf24' },
    features: ['Bread', 'Pastries', 'Desserts', 'Coffee'],
  },
  {
    id: 'coffee',
    name: 'Coffee Shop',
    icon: '☕',
    description: 'Coffee shop with beverages, pastries, and light meals',
    colors: { primary: '#92400e', secondary: '#d97706' },
    features: ['Coffee', 'Tea', 'Pastries', 'Sandwiches'],
  },
  {
    id: 'pizza',
    name: 'Pizza Place',
    icon: '🍕',
    description: 'Pizza restaurant with customizable pies and sides',
    colors: { primary: '#dc2626', secondary: '#ef4444' },
    features: ['Pizza', 'Wings', 'Salads', 'Beverages'],
  },
  {
    id: 'grocery',
    name: 'Grocery Store',
    icon: '🛒',
    description: 'Grocery store with produce, packaged goods, and essentials',
    colors: { primary: '#059669', secondary: '#10b981' },
    features: ['Produce', 'Packaged Goods', 'Dairy', 'Meat'],
  },
];

function formatCurrency(value: number | null | undefined) {
  if (!value || Number.isNaN(value)) return '$0.00';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function formatStatus(status: TenantLifecycleStatus) {
  return STATUS_META[status]?.label ?? status;
}

const BADGE_CLASSES = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
} as const;

const STATUS_META: Record<TenantLifecycleStatus, { label: string; className: string }> = {
  PENDING_REVIEW: { label: 'Pending Review', className: BADGE_CLASSES.warning },
  READY_FOR_APPROVAL: { label: 'Ready for Approval', className: BADGE_CLASSES.info },
  APPROVED: { label: 'Approved', className: BADGE_CLASSES.success },
  LIVE: { label: 'Live', className: BADGE_CLASSES.success },
  PAUSED: { label: 'Paused', className: BADGE_CLASSES.neutral },
  ARCHIVED: { label: 'Archived', className: BADGE_CLASSES.danger },
};

const STATUS_OPTIONS: Array<{ value: TenantLifecycleStatus; label: string; description: string }> = [
  {
    value: 'PENDING_REVIEW',
    label: STATUS_META.PENDING_REVIEW.label,
    description: 'Auto-seeded tenant awaiting internal QA.',
  },
  {
    value: 'READY_FOR_APPROVAL',
    label: STATUS_META.READY_FOR_APPROVAL.label,
    description: 'Preview ready for client walkthrough.',
  },
  {
    value: 'APPROVED',
    label: STATUS_META.APPROVED.label,
    description: 'Client approved; ready for go-live.',
  },
  {
    value: 'LIVE',
    label: STATUS_META.LIVE.label,
    description: 'Tenant is live on production.',
  },
  {
    value: 'PAUSED',
    label: STATUS_META.PAUSED.label,
    description: 'Temporarily paused (billing or operational hold).',
  },
  {
    value: 'ARCHIVED',
    label: STATUS_META.ARCHIVED.label,
    description: 'Offboarded tenant kept for records.',
  },
];

function getTenantBadges(summary: TenantSummary) {
  const badges: Array<{ key: string; label: string; className: string }> = [];

  const statusMeta = STATUS_META[summary.status] ?? STATUS_META.PENDING_REVIEW;
  badges.push({
    key: 'lifecycle',
    label: statusMeta.label,
    className: statusMeta.className,
  });

  badges.push({
    key: 'status',
    label: summary.isOpen ? 'Open' : 'Closed',
    className: summary.isOpen ? BADGE_CLASSES.success : BADGE_CLASSES.danger,
  });

  badges.push({
    key: 'stripe',
    label: summary.stripeAccountId ? 'Stripe connected' : 'Stripe pending',
    className: summary.stripeAccountId ? BADGE_CLASSES.success : BADGE_CLASSES.warning,
  });

  badges.push({
    key: 'doordash',
    label: summary.doorDashStoreId ? 'DoorDash connected' : 'DoorDash pending',
    className: summary.doorDashStoreId ? BADGE_CLASSES.success : BADGE_CLASSES.warning,
  });

  if (summary.autoPrintOrders) {
    badges.push({
      key: 'auto-print',
      label: 'Auto print',
      className: BADGE_CLASSES.info,
    });
  }

  if (!summary.fulfillmentNotificationsEnabled) {
    badges.push({
      key: 'notifications',
      label: 'Notifications off',
      className: BADGE_CLASSES.warning,
    });
  }

  return badges;
}

function toTenantForm(summary: TenantSummary): TenantForm {
  return {
    id: summary.id,
    name: summary.name,
    slug: summary.slug,
    status: summary.status,
    statusNotes: summary.statusNotes ?? '',
    contactEmail: summary.contactEmail ?? '',
    contactPhone: summary.contactPhone ?? '',
    addressLine1: summary.addressLine1 ?? '',
    addressLine2: summary.addressLine2 ?? '',
    city: summary.city ?? '',
    state: summary.state ?? '',
    postalCode: summary.postalCode ?? '',
    primaryColor: summary.primaryColor ?? '#dc2626',
    secondaryColor: summary.secondaryColor ?? '#f59e0b',
    logoUrl: summary.logoUrl ?? '',
    heroImageUrl: summary.heroImageUrl ?? '',
    heroTitle: summary.heroTitle ?? '',
    heroSubtitle: summary.heroSubtitle ?? '',
    tagline: summary.tagline ?? '',
    deliveryRadiusMi: summary.deliveryRadiusMi?.toString() ?? '',
    minimumOrderValue: summary.minimumOrderValue?.toString() ?? '',
    currency: summary.currency ?? 'USD',
    timeZone: summary.timeZone ?? 'America/Los_Angeles',
    platformPercentFee: summary.platformPercentFee?.toString() ?? '',
    platformFlatFee: summary.platformFlatFee?.toString() ?? '',
    defaultTaxRate: summary.defaultTaxRate?.toString() ?? '',
    deliveryBaseFee: summary.deliveryBaseFee?.toString() ?? '',
    stripeAccountId: summary.stripeAccountId ?? '',
    cloverMerchantId: summary.cloverMerchantId ?? '',
    cloverApiKey: summary.cloverApiKey ?? '',
    subscriptionPlan: summary.subscriptionPlan ?? 'alessa-starter',
    subscriptionMonthlyFee: summary.subscriptionMonthlyFee
      ? summary.subscriptionMonthlyFee.toString()
      : '',
    subscriptionAddons: summary.subscriptionAddons.join(', '),
    autoPrintOrders: summary.autoPrintOrders,
    fulfillmentNotificationsEnabled: summary.fulfillmentNotificationsEnabled,
    isOpen: summary.isOpen,
    socialInstagram: summary.socialInstagram ?? '',
    socialFacebook: summary.socialFacebook ?? '',
    socialTikTok: summary.socialTikTok ?? '',
    socialYouTube: summary.socialYouTube ?? '',
  };
}

export default function SuperAdminDashboard({ initialTenants, initialMetrics, rootDomain, initialTemplates }: Props) {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('dashboard');
  const [tenants, setTenants] = useState(initialTenants);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [createForm, setCreateForm] = useState<CreateFormState>(defaultCreateForm);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BusinessTemplate | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(initialTenants[0]?.id ?? null);
  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) ?? null,
    [selectedTenantId, tenants],
  );
  const previewUrl = useMemo(
    () => (selectedTenant ? `https://${selectedTenant.slug}.${rootDomain}` : null),
    [rootDomain, selectedTenant],
  );
  const [editForm, setEditForm] = useState<TenantForm | null>(selectedTenant ? toTenantForm(selectedTenant) : null);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (selectedTenant) {
      setEditForm(toTenantForm(selectedTenant));
      setEditError(null);
      setEditMessage(null);
    } else {
      setEditForm(null);
    }
  }, [selectedTenant?.id]); // Fix: Use selectedTenant.id instead of selectedTenant object

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const res = await fetch('/api/super/dashboard', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab, loadDashboardData]);

  const refreshMetrics = useCallback(async () => {
    const res = await fetch('/api/super/metrics', { cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    const data: SuperMetrics = await res.json();
    setMetrics(data);
    setTenants((prev) =>
      prev.map((tenant) => {
        const sevenDay = data.sevenDayVolume.find((stat) => stat.tenantId === tenant.id) || {
          orders: tenant.ordersLastSevenDays,
          gross: tenant.grossLastSevenDays,
        };
        const allTime = data.allTimeVolume.find((stat) => stat.tenantId === tenant.id) || {
          orders: tenant.totalOrders,
          gross: tenant.totalGross,
        };
        const activity = data.tenantActivity.find((stat) => stat.tenantId === tenant.id) || {
          lastOrderAt: tenant.lastOrderAt,
          lastOrderAmount: tenant.lastOrderAmount,
        };
        return {
          ...tenant,
          ordersLastSevenDays: sevenDay.orders,
          grossLastSevenDays: sevenDay.gross,
          totalOrders: allTime.orders,
          totalGross: allTime.gross,
          lastOrderAt: activity.lastOrderAt,
          lastOrderAmount: activity.lastOrderAmount,
        };
      }),
    );
    return data;
  }, []);

  const refreshTenants = useCallback(async () => {
    const res = await fetch('/api/super/tenants', { cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    const data: TenantListItem[] = await res.json();
    const metricsData = await refreshMetrics();

    const merged: TenantSummary[] = data.map((tenant) => {
      const sevenDay = metricsData.sevenDayVolume.find((stat) => stat.tenantId === tenant.id) || {
        orders: 0,
        gross: 0,
      };
      const allTime = metricsData.allTimeVolume.find((stat) => stat.tenantId === tenant.id) || {
        orders: 0,
        gross: 0,
      };
      const activity = metricsData.tenantActivity.find((stat) => stat.tenantId === tenant.id) || {
        lastOrderAt: null,
        lastOrderAmount: null,
      };

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        statusUpdatedAt: tenant.statusUpdatedAt ?? null,
        statusNotes: tenant.statusNotes ?? null,
        subscriptionPlan: tenant.subscriptionPlan ?? null,
        subscriptionMonthlyFee: tenant.subscriptionMonthlyFee ?? 0,
        subscriptionAddons: tenant.subscriptionAddons ?? [],
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone,
        addressLine1: tenant.addressLine1,
        addressLine2: tenant.addressLine2,
        city: tenant.city,
        state: tenant.state,
        postalCode: tenant.postalCode,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        logoUrl: tenant.logoUrl,
        heroImageUrl: tenant.heroImageUrl,
        heroTitle: tenant.heroTitle,
        heroSubtitle: tenant.heroSubtitle,
        stripeAccountId: tenant.stripeAccountId ?? null,
        platformPercentFee: tenant.platformPercentFee ?? null,
        platformFlatFee: tenant.platformFlatFee ?? null,
        defaultTaxRate: tenant.defaultTaxRate ?? null,
        deliveryBaseFee: tenant.deliveryBaseFee ?? null,
        autoPrintOrders: tenant.autoPrintOrders,
        fulfillmentNotificationsEnabled: tenant.fulfillmentNotificationsEnabled,
        cloverMerchantId: tenant.cloverMerchantId ?? null,
        cloverApiKey: tenant.cloverApiKey ?? null,
        isOpen: tenant.isOpen,
        deliveryRadiusMi: tenant.deliveryRadiusMi ?? null,
        minimumOrderValue: tenant.minimumOrderValue ?? null,
        currency: tenant.currency ?? 'USD',
        timeZone: tenant.timeZone ?? 'America/Los_Angeles',
        tagline: tenant.tagline ?? '',
        socialInstagram: tenant.socialInstagram ?? '',
        socialFacebook: tenant.socialFacebook ?? '',
        socialTikTok: tenant.socialTikTok ?? '',
        socialYouTube: tenant.socialYouTube ?? '',
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt ?? tenant.createdAt,
        ordersLastSevenDays: sevenDay.orders,
        grossLastSevenDays: sevenDay.gross,
        totalOrders: allTime.orders,
        totalGross: allTime.gross,
        lastOrderAt: activity.lastOrderAt,
        lastOrderAmount: activity.lastOrderAmount,
      };
    });

    setTenants(merged);
    if (!selectedTenantId && merged.length > 0) {
      setSelectedTenantId(merged[0].id);
    }
    return merged;
  }, [refreshMetrics, selectedTenantId]);

  const handleCreateChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    const nextValue = type === 'checkbox' && event.target instanceof HTMLInputElement ? event.target.checked : value;
    setCreateForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const handleCreateTenant = async (form: any) => {
    setCreateLoading(true);
    setCreateError(null);
    setCreateMessage(null);
    try {
      // Map template IDs to template files
      const templateFileMap: Record<string, string> = {
        'lasreinas': 'lasreinas-template.json',
        // Add more template mappings here as needed
      };
      
      const templateFile = form.template?.id && templateFileMap[form.template.id] 
        ? templateFileMap[form.template.id] 
        : undefined;

      const payload = {
        name: form.name,
        slug: form.slug,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        heroTitle: form.heroTitle,
        heroSubtitle: form.heroSubtitle,
        tagline: form.tagline,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        logoUrl: form.logoUrl,
        heroImageUrl: form.heroImageUrl,
        stripeAccountId: form.stripeAccountId,
        seedDemo: form.seedDemo && !templateFile, // Only use seedDemo if no template file
        templateId: form.template?.id || 'taqueria',
        templateFile: templateFile, // Pass template file if available
        deliveryRadiusMi: form.seedDemo ? Number(form.deliveryRadiusMi) || 5 : undefined,
        minimumOrderValue: form.seedDemo ? Number(form.minimumOrderValue) || 0 : undefined,
        currency: form.currency,
        timeZone: form.timeZone,
        referralCode: form.referralCode || undefined,
      };
      const res = await fetch('/api/super/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      await refreshTenants();
      setCreateMessage('Tenant created successfully.');
      setOnboardingStep(1);
      setSelectedTemplate(null);
    } catch (err) {
      console.error(err);
      setCreateError('Failed to create tenant.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editForm) return;
    const { name, value, type } = event.target;
    if (type === 'checkbox' && event.target instanceof HTMLInputElement) {
      setEditForm({ ...editForm, [name]: event.target.checked });
      return;
    }
    setEditForm({ ...editForm, [name]: value });
  };

  const handleEditSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!editForm) return;
    const { name, value } = event.target;
    if (name === 'status') {
      setEditForm({ ...editForm, status: value as TenantLifecycleStatus });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };
  const handleSaveTenant = async () => {
    if (!editForm) return;
    setEditLoading(true);
    setEditError(null);
    setEditMessage(null);
    try {
      const subscriptionAddons = editForm.subscriptionAddons
        .split(',')
        .map((addon) => addon.trim())
        .filter(Boolean);
      const subscriptionMonthlyFee =
        editForm.subscriptionMonthlyFee && editForm.subscriptionMonthlyFee.trim().length > 0
          ? Number(editForm.subscriptionMonthlyFee)
          : 0;
      if (Number.isNaN(subscriptionMonthlyFee)) {
        setEditError('Subscription monthly fee must be a valid number.');
        setEditLoading(false);
        return;
      }

      const payload = {
        id: editForm.id,
        name: editForm.name,
        slug: editForm.slug,
        status: editForm.status,
        statusNotes: editForm.statusNotes || null,
        contactEmail: editForm.contactEmail || null,
        contactPhone: editForm.contactPhone || null,
        addressLine1: editForm.addressLine1 || null,
        addressLine2: editForm.addressLine2 || null,
        city: editForm.city || null,
        state: editForm.state || null,
        postalCode: editForm.postalCode || null,
        primaryColor: editForm.primaryColor,
        secondaryColor: editForm.secondaryColor,
        logoUrl: editForm.logoUrl || null,
        heroImageUrl: editForm.heroImageUrl || null,
        heroTitle: editForm.heroTitle || null,
        heroSubtitle: editForm.heroSubtitle || null,
        tagline: editForm.tagline || null,
        deliveryRadiusMi: editForm.deliveryRadiusMi ? Number(editForm.deliveryRadiusMi) : null,
        minimumOrderValue: editForm.minimumOrderValue ? Number(editForm.minimumOrderValue) : null,
        currency: editForm.currency,
        timeZone: editForm.timeZone,
        platformPercentFee: editForm.platformPercentFee ? Number(editForm.platformPercentFee) : null,
        platformFlatFee: editForm.platformFlatFee ? Number(editForm.platformFlatFee) : null,
        defaultTaxRate: editForm.defaultTaxRate ? Number(editForm.defaultTaxRate) : null,
        deliveryBaseFee: editForm.deliveryBaseFee ? Number(editForm.deliveryBaseFee) : null,
        stripeAccountId: editForm.stripeAccountId || null,
        cloverMerchantId: editForm.cloverMerchantId || null,
        cloverApiKey: editForm.cloverApiKey || null,
        subscriptionPlan: editForm.subscriptionPlan || null,
        subscriptionMonthlyFee,
        subscriptionAddons,
        autoPrintOrders: editForm.autoPrintOrders,
        fulfillmentNotificationsEnabled: editForm.fulfillmentNotificationsEnabled,
        isOpen: editForm.isOpen,
        socialInstagram: editForm.socialInstagram || null,
        socialFacebook: editForm.socialFacebook || null,
        socialTikTok: editForm.socialTikTok || null,
        socialYouTube: editForm.socialYouTube || null,
      };

      const res = await fetch('/api/super/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      await res.json();
      await refreshTenants();
      setEditMessage('Tenant settings updated.');
    } catch (err) {
      console.error(err);
      setEditError('Failed to update tenant settings.');
    } finally {
      setEditLoading(false);
    }
  };

  const updateTenantStatus = useCallback(
    async (nextStatus: TenantLifecycleStatus, note?: string) => {
      if (!selectedTenantId) return;
      setEditLoading(true);
      setEditError(null);
      setEditMessage(null);
      try {
        const res = await fetch('/api/super/tenants', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedTenantId,
            status: nextStatus,
            statusNotes: note ?? editForm?.statusNotes ?? null,
          }),
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        await res.json();
        await refreshTenants();
        setEditMessage(`Status updated to ${formatStatus(nextStatus)}.`);
      } catch (err) {
        console.error(err);
        setEditError('Failed to update status.');
      } finally {
        setEditLoading(false);
      }
    },
    [editForm?.statusNotes, refreshTenants, selectedTenantId],
  );

  const statusQuickActions = useMemo<StatusAction[]>(() => {
    if (!editForm) return [];
    switch (editForm.status) {
      case 'PENDING_REVIEW':
        return [
          { label: 'Mark Ready for Approval', next: 'READY_FOR_APPROVAL', icon: '✅' },
          { label: 'Launch Now', next: 'LIVE', icon: '🚀', confirm: 'Launch tenant immediately?' },
        ];
      case 'READY_FOR_APPROVAL':
        return [
          { label: 'Approve Template', next: 'APPROVED', icon: '👍' },
          { label: 'Launch Live', next: 'LIVE', icon: '🚀', confirm: 'Launch tenant live now?' },
          { label: 'Back to Pending', next: 'PENDING_REVIEW', icon: '↩️' },
        ];
      case 'APPROVED':
        return [
          { label: 'Launch Live', next: 'LIVE', icon: '🚀', confirm: 'Launch tenant live now?' },
          { label: 'Pause / Hold', next: 'PAUSED', icon: '⏸️' },
        ];
      case 'LIVE':
        return [
          { label: 'Pause Tenant', next: 'PAUSED', icon: '⏸️', confirm: 'Pause orders for this tenant?' },
          { label: 'Archive Tenant', next: 'ARCHIVED', icon: '🗂️', confirm: 'Archive tenant and stop billing?' },
        ];
      case 'PAUSED':
        return [
          { label: 'Resume Live', next: 'LIVE', icon: '▶️' },
          { label: 'Archive Tenant', next: 'ARCHIVED', icon: '🗂️', confirm: 'Archive tenant and stop billing?' },
        ];
      case 'ARCHIVED':
        return [{ label: 'Reopen (Pending Review)', next: 'PENDING_REVIEW', icon: '🔁' }];
      default:
        return [];
    }
  }, [editForm]);

  const subscriptionMonthlyFeePreview = useMemo(() => {
    if (!editForm) {
      return formatCurrency(selectedTenant?.subscriptionMonthlyFee ?? 0);
    }
    const value = editForm.subscriptionMonthlyFee.trim();
    if (!value) {
      return formatCurrency(selectedTenant?.subscriptionMonthlyFee ?? 0);
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return '$0.00';
    }
    return formatCurrency(numeric);
  }, [editForm, selectedTenant?.subscriptionMonthlyFee]);

  const subscriptionAddonsPreview = useMemo(() => {
    if (editForm) {
      return editForm.subscriptionAddons
        .split(',')
        .map((addon) => addon.trim())
        .filter(Boolean);
    }
    return selectedTenant?.subscriptionAddons ?? [];
  }, [editForm, selectedTenant?.subscriptionAddons]);

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/super/tenants?id=${tenantId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      await refreshTenants();
      if (selectedTenantId === tenantId) {
        setSelectedTenantId(null);
        setEditForm(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete tenant.');
    }
  };

  const topPerformers = useMemo(
    () => [...tenants].sort((a, b) => b.grossLastSevenDays - a.grossLastSevenDays).slice(0, 5),
    [tenants],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Super Admin
              </span>
              <br />
              <span className="text-gray-900">Dashboard</span>
            </h1>
            <p className="text-base text-gray-600 sm:text-lg">
              Monitor tenant performance, manage integrations, and onboard new restaurants.
            </p>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="flex gap-2 border-b border-gray-200">
          {[
            { id: 'dashboard' as SuperAdminTab, label: 'Dashboard', icon: '📊' },
            { id: 'tenants' as SuperAdminTab, label: 'Tenants', icon: '👥' },
            { id: 'onboarding' as SuperAdminTab, label: 'Onboarding', icon: '✨' },
            { id: 'templates' as SuperAdminTab, label: 'Templates', icon: '🎨' },
            { id: 'mlm' as SuperAdminTab, label: 'MLM', icon: '🌳' },
            { id: 'crm' as SuperAdminTab, label: 'CRM', icon: '💼' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-t-lg border-b-2 px-6 py-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {dashboardLoading ? (
              <div className="flex h-96 items-center justify-center">
                <p className="text-gray-500">Loading dashboard...</p>
              </div>
            ) : dashboardData ? (
              <>
                {/* Top Metrics Bar */}
                <TopMetricsBar
                  totalTenants={dashboardData.metrics.totalTenants}
                  liveTenants={dashboardData.metrics.liveTenants}
                  pendingTenants={dashboardData.metrics.pendingTenants}
                  newLeads={dashboardData.metrics.newLeads}
                  inProgressLeads={dashboardData.metrics.inProgressLeads}
                  closingLeads={dashboardData.metrics.closingLeads}
                  totalMRR={dashboardData.metrics.totalMRR}
                  projectedMRR={dashboardData.metrics.projectedMRR}
                  totalAssociates={dashboardData.metrics.totalAssociates}
                  activeRecruits={dashboardData.metrics.activeRecruits}
                  onTenantsClick={() => setActiveTab('tenants')}
                  onPipelineClick={() => {
                    // Scroll to pipeline section
                    document.getElementById('pipeline-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onRevenueClick={() => {
                    // Scroll to revenue section
                    document.getElementById('revenue-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onMLMClick={() => {
                    // Scroll to MLM section
                    document.getElementById('mlm-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />

                {/* Main Content - 3 Column Grid */}
                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <TenantsServicesPanel
                      tenants={dashboardData.tenants}
                      tenantProducts={dashboardData.tenantProducts}
                      products={dashboardData.products}
                      onTenantClick={(tenantId) => {
                        setSelectedTenantId(tenantId);
                        setActiveTab('tenants');
                      }}
                    />
                  </div>

                  {/* Middle Column */}
                  <div className="space-y-6">
                    <div id="pipeline-section">
                      <PipelinePanel initialLeads={dashboardData.leads} />
                    </div>
                    <div id="revenue-section">
                      <RevenueProjection
                        currentMRR={dashboardData.metrics.totalMRR}
                        projectedMRR={dashboardData.metrics.projectedMRR}
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <ProductsEcosystemPanel products={dashboardData.products} />
                  </div>
                </div>

                {/* MLM Tree Section */}
                <div id="mlm-section" className="mt-8">
                  <MLMCompanyTree
                    initialTree={dashboardData.mlmTree}
                    stats={dashboardData.mlmStats}
                  />
                </div>
              </>
            ) : (
              <div className="flex h-96 items-center justify-center">
                <p className="text-gray-500">No dashboard data available</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'tenants' && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Tenant Management</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Tenants</span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{tenants.length}</span>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px,1fr]">
          <div className="space-y-2">
            {tenants.map((tenant) => {
              const badges = getTenantBadges(tenant);
              return (
                <div
                  key={tenant.id}
                  className={`group relative rounded-xl border transition ${
                    tenant.id === selectedTenantId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedTenantId(tenant.id)}
                    className="w-full px-4 py-3 text-left text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{tenant.name}</span>
                      <span className="text-xs uppercase text-gray-500">{tenant.slug}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      Plan: {tenant.subscriptionPlan ?? '—'} · {formatCurrency(tenant.subscriptionMonthlyFee ?? 0)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>{tenant.ordersLastSevenDays} orders · {formatCurrency(tenant.grossLastSevenDays)}</span>
                      {badges.map((badge) => (
                        <span
                          key={badge.key}
                          className={`rounded-full px-2 py-0.5 font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTenant(tenant.id);
                    }}
                    className="absolute right-2 top-2 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 opacity-0 transition hover:bg-rose-100 group-hover:opacity-100"
                    title="Delete tenant"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            {tenants.length === 0 && <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">No tenants yet.</p>}
          </div>

          {editForm ? (
            <div className="space-y-6">
              {editMessage && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{editMessage}</p>}
              {editError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>}

              <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-6 shadow-lg shadow-blue-500/10">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Lifecycle</p>
                    <h3 className="mt-1 text-2xl font-bold text-gray-900">{formatStatus(editForm.status)}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Last updated {formatDateTime(selectedTenant?.statusUpdatedAt ?? null)}
                    </p>
                    {selectedTenant?.statusNotes && (
                      <p className="mt-2 rounded-lg bg-blue-100/50 px-3 py-2 text-sm text-blue-800">
                        “{selectedTenant.statusNotes}”
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_META[editForm.status].className}`}
                    >
                      {formatStatus(editForm.status)}
                    </span>
                    {previewUrl && (
                      <Link
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-blue-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        🌐 Preview storefront
                      </Link>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-[240px,1fr]">
                  <label className="text-sm font-medium text-gray-700">
                    <span>Status</span>
                    <select
                      name="status"
                      value={editForm.status}
                      onChange={handleEditSelectChange}
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    <span>Internal status notes</span>
                    <textarea
                      name="statusNotes"
                      value={editForm.statusNotes}
                      onChange={handleEditChange}
                      rows={3}
                      placeholder="Internal notes or reminders for this tenant status."
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {STATUS_OPTIONS.find((option) => option.value === editForm.status)?.description}
                </p>

                {statusQuickActions.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {statusQuickActions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => {
                          if (action.confirm && !confirm(action.confirm)) return;
                          void updateTenantStatus(action.next);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:shadow"
                        disabled={editLoading}
                      >
                        <span>{action.icon}</span>
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-gray-700">Name</span>
                  <input
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Slug</span>
                  <input
                    name="slug"
                    value={editForm.slug}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                  <span className="mt-1 block text-xs text-gray-500">{editForm.slug || '<slug>'}.{rootDomain}</span>
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Contact Email</span>
                  <input
                    name="contactEmail"
                    value={editForm.contactEmail}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                    type="email"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Contact Phone</span>
                  <input
                    name="contactPhone"
                    value={editForm.contactPhone}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                    type="tel"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Hero Title</span>
                  <input
                    name="heroTitle"
                    value={editForm.heroTitle}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Hero Subtitle</span>
                  <input
                    name="heroSubtitle"
                    value={editForm.heroSubtitle}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Tagline</span>
                  <input
                    name="tagline"
                    value={editForm.tagline}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Logo URL</span>
                  <input
                    name="logoUrl"
                    value={editForm.logoUrl}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                    type="url"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Hero Image URL</span>
                  <input
                    name="heroImageUrl"
                    value={editForm.heroImageUrl}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                    type="url"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-gray-700">Primary Color</span>
                  <input
                    name="primaryColor"
                    value={editForm.primaryColor}
                    onChange={handleEditChange}
                    className="mt-1 h-10 w-16 cursor-pointer rounded border border-gray-300"
                    type="color"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Secondary Color</span>
                  <input
                    name="secondaryColor"
                    value={editForm.secondaryColor}
                    onChange={handleEditChange}
                    className="mt-1 h-10 w-16 cursor-pointer rounded border border-gray-300"
                    type="color"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Subscription & Billing</h3>
                    <p className="text-sm text-gray-500">
                      Set the SaaS billing plan that super admin uses for this tenant.
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    Monthly billing:{' '}
                    <span className="font-semibold text-gray-900">{subscriptionMonthlyFeePreview}</span>
                    {subscriptionAddonsPreview.length > 0 && (
                      <span className="ml-1 text-xs text-gray-500">
                        (+{subscriptionAddonsPreview.length} add-on{subscriptionAddonsPreview.length > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="text-sm font-medium text-gray-700">
                    <span>Plan ID</span>
                    <input
                      name="subscriptionPlan"
                      value={editForm.subscriptionPlan}
                      onChange={handleEditChange}
                      placeholder="alessa-starter"
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    <span>Monthly Fee (USD)</span>
                    <input
                      name="subscriptionMonthlyFee"
                      value={editForm.subscriptionMonthlyFee}
                      onChange={handleEditChange}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="30"
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700 md:col-span-1">
                    <span>Add-on Services (comma separated)</span>
                    <input
                      name="subscriptionAddons"
                      value={editForm.subscriptionAddons}
                      onChange={handleEditChange}
                      placeholder="ada-compliance, premium-support"
                      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-gray-700">Delivery Radius (mi)</span>
                  <input
                    name="deliveryRadiusMi"
                    value={editForm.deliveryRadiusMi}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                    type="number"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Minimum Order Value</span>
                  <input
                    name="minimumOrderValue"
                    value={editForm.minimumOrderValue}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                    type="number"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Currency</span>
                  <input
                    name="currency"
                    value={editForm.currency}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Time Zone</span>
                  <input
                    name="timeZone"
                    value={editForm.timeZone}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-gray-700">Stripe Account ID</span>
                  <input
                    name="stripeAccountId"
                    value={editForm.stripeAccountId}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                    placeholder="acct_123..."
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Platform Percent Fee</span>
                  <input
                    name="platformPercentFee"
                    value={editForm.platformPercentFee}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                    type="number"
                    step="0.001"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Platform Flat Fee</span>
                  <input
                    name="platformFlatFee"
                    value={editForm.platformFlatFee}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                    type="number"
                    step="0.01"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Default Tax Rate</span>
                  <input
                    name="defaultTaxRate"
                    value={editForm.defaultTaxRate}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                    type="number"
                    step="0.0001"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Delivery Base Fee</span>
                  <input
                    name="deliveryBaseFee"
                    value={editForm.deliveryBaseFee}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                    type="number"
                    step="0.01"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  <span className="text-gray-700">Clover Merchant ID</span>
                  <input
                    name="cloverMerchantId"
                    value={editForm.cloverMerchantId}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">Clover API Key</span>
                  <input
                    name="cloverApiKey"
                    value={editForm.cloverApiKey}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                    type="password"
                    placeholder="••••••"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="isOpen"
                    checked={editForm.isOpen}
                    onChange={handleEditChange}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Open for orders
                </label>
                <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="autoPrintOrders"
                    checked={editForm.autoPrintOrders}
                    onChange={handleEditChange}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Print on new order
                </label>
                <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="fulfillmentNotificationsEnabled"
                    checked={editForm.fulfillmentNotificationsEnabled}
                    onChange={handleEditChange}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Fulfillment notifications
                </label>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => selectedTenant && setEditForm(toTenantForm(selectedTenant))}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900"
                  disabled={editLoading}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSaveTenant}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
              Select a tenant to manage its settings.
            </div>
          )}
        </div>
          </section>
        )}

        {activeTab === 'onboarding' && (
          <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <OnboardingWizard
              templates={initialTemplates || BUSINESS_TEMPLATES}
              rootDomain={rootDomain}
              onCreateTenant={handleCreateTenant}
              loading={createLoading}
              message={createMessage}
              error={createError}
              initialTemplate={selectedTemplate}
            />
          </section>
        )}

        {activeTab === 'mlm' && <MLMAdminPanel />}

        {activeTab === 'crm' && (
          <CRMPanel tenants={tenants.map((t) => ({ id: t.id, name: t.name, slug: t.slug }))} />
        )}

        {activeTab === 'templates' && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <TemplateLibrary
              onSelectTemplate={(templateId) => {
                // Navigate to template builder or onboarding with template selected
                console.log('Selected template:', templateId)
                // Could navigate to onboarding with template pre-selected
              }}
              onImportTemplate={async (templateId, tenantId) => {
                if (!tenantId) {
                  alert('Please select a tenant first from the Tenants tab')
                  return
                }
                try {
                  const exportRes = await fetch(`/api/super/templates/export/${templateId}`)
                  if (!exportRes.ok) throw new Error('Failed to export template')
                  
                  const templateData = await exportRes.json()
                  
                  const importRes = await fetch('/api/super/templates/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      templateData: templateData.data,
                      tenantId,
                    }),
                  })
                  
                  if (importRes.ok) {
                    alert('Template imported successfully!')
                    await refreshTenants()
                  } else {
                    throw new Error('Failed to import template')
                  }
                } catch (error) {
                  console.error('Error importing template:', error)
                  alert('Failed to import template')
                }
              }}
            />
          </section>
        )}

        {/* Legacy Create Tenant Form - Hidden but kept for reference */}
        {false && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Create Tenant</h2>
            <p className="mt-1 text-sm text-gray-500">Fill out the basics and optionally seed the demo experience.</p>
            {createMessage && <p className="mt-3 rounded bg-green-50 p-3 text-sm text-green-700">{createMessage}</p>}
            {createError && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{createError}</p>}

            <form onSubmit={(e) => { e.preventDefault(); }} className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              value={createForm.name}
              onChange={handleCreateChange}
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="La Poblanita"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            <input
              name="slug"
              value={createForm.slug}
              onChange={handleCreateChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="lapoblanita"
            />
            <p className="text-xs text-gray-500">Domain preview: {createForm.slug || '<slug>'}.{rootDomain}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
            <input
              name="contactEmail"
              value={createForm.contactEmail}
              onChange={handleCreateChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              type="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
            <input
              name="contactPhone"
              value={createForm.contactPhone}
              onChange={handleCreateChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              type="tel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hero Title</label>
            <input
              name="heroTitle"
              value={createForm.heroTitle}
              onChange={handleCreateChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Culinary Excellence"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hero Subtitle</label>
            <input
              name="heroSubtitle"
              value={createForm.heroSubtitle}
              onChange={handleCreateChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Order direct for pickup or delivery"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Tagline</label>
            <textarea
              name="tagline"
              value={createForm.tagline}
              onChange={handleCreateChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Color</label>
            <input
              type="color"
              name="primaryColor"
              value={createForm.primaryColor}
              onChange={handleCreateChange}
              className="h-10 w-16 cursor-pointer rounded border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
            <input
              type="color"
              name="secondaryColor"
              value={createForm.secondaryColor}
              onChange={handleCreateChange}
              className="h-10 w-16 cursor-pointer rounded border border-gray-300"
            />
          </div>
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="seedDemo"
                checked={createForm.seedDemo}
                onChange={handleCreateChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              Seed demo menu sections and items
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Stripe Connected Account ID (optional)</label>
            <input
              name="stripeAccountId"
              value={createForm.stripeAccountId}
              onChange={handleCreateChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="acct_123..."
            />
            <p className="text-xs text-gray-500">You can also add this later via tenant management.</p>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {createLoading ? 'Creating…' : 'Create tenant'}
            </button>
          </div>
        </form>
        </section>
        )}
      </div>
    </div>
  );
}
