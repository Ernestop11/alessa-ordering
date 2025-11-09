"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
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
}

interface TenantListItem {
  id: string;
  name: string;
  slug: string;
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
  autoPrintOrders: boolean;
  fulfillmentNotificationsEnabled: boolean;
  isOpen: boolean;
  socialInstagram: string;
  socialFacebook: string;
  socialTikTok: string;
  socialYouTube: string;
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

function formatCurrency(value: number | null | undefined) {
  if (!value || Number.isNaN(value)) return '$0.00';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

const BADGE_CLASSES = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
} as const;

function getTenantBadges(summary: TenantSummary) {
  const badges: Array<{ key: string; label: string; className: string }> = [];

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
    autoPrintOrders: summary.autoPrintOrders,
    fulfillmentNotificationsEnabled: summary.fulfillmentNotificationsEnabled,
    isOpen: summary.isOpen,
    socialInstagram: summary.socialInstagram ?? '',
    socialFacebook: summary.socialFacebook ?? '',
    socialTikTok: summary.socialTikTok ?? '',
    socialYouTube: summary.socialYouTube ?? '',
  };
}

export default function SuperAdminDashboard({ initialTenants, initialMetrics, rootDomain }: Props) {
  const [tenants, setTenants] = useState(initialTenants);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [createForm, setCreateForm] = useState<CreateFormState>(defaultCreateForm);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(initialTenants[0]?.id ?? null);
  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) ?? null,
    [selectedTenantId, tenants],
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
  }, [selectedTenant]);

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

  const handleCreateTenant = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateMessage(null);
    try {
      const payload = {
        ...createForm,
        deliveryRadiusMi: createForm.seedDemo ? 5 : undefined,
        minimumOrderValue: createForm.seedDemo ? 0 : undefined,
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
      setCreateForm(defaultCreateForm);
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

  const handleSaveTenant = async () => {
    if (!editForm) return;
    setEditLoading(true);
    setEditError(null);
    setEditMessage(null);
    try {
      const payload = {
        id: editForm.id,
        name: editForm.name,
        slug: editForm.slug,
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
          <Link
            href="/super-admin/fulfillment"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105 hover:shadow-indigo-500/50"
          >
            <span>🚀</span>
            Fulfillment Board
          </Link>
        </header>

        {/* Metrics Cards */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-lg shadow-blue-500/10 transition hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20">
            <div className="absolute right-4 top-4 text-4xl opacity-20">👥</div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Tenants</p>
            <p className="mt-3 text-4xl font-black text-gray-900">{metrics.totalTenants}</p>
            <p className="mt-2 text-sm text-gray-600">Active restaurants</p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-purple-50 p-6 shadow-lg shadow-purple-500/10 transition hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
            <div className="absolute right-4 top-4 text-4xl opacity-20">📦</div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Orders</p>
            <p className="mt-3 text-4xl font-black text-gray-900">{metrics.totalOrders.toLocaleString()}</p>
            <p className="mt-2 text-sm text-gray-600">All-time orders</p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-green-50 p-6 shadow-lg shadow-green-500/10 transition hover:scale-105 hover:shadow-xl hover:shadow-green-500/20">
            <div className="absolute right-4 top-4 text-4xl opacity-20">💰</div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">7-day Volume</p>
            <p className="mt-3 text-3xl font-black text-gray-900">
              {formatCurrency(metrics.sevenDayVolume.reduce((sum, row) => sum + row.gross, 0))}
            </p>
            <p className="mt-2 text-sm text-gray-600">This week</p>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-amber-50 p-6 shadow-lg shadow-amber-500/10 transition hover:scale-105 hover:shadow-xl hover:shadow-amber-500/20">
            <div className="absolute right-4 top-4 text-4xl opacity-20">💳</div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Est. Stripe Volume</p>
            <p className="mt-3 text-3xl font-black text-gray-900">{formatCurrency(metrics.estimatedStripeVolume)}</p>
            <p className="mt-2 text-sm text-gray-600">All-time payouts</p>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Highlights</h2>
            <p className="mt-1 text-sm text-gray-600">Top performers and recent activity</p>
          </div>
          <button
            type="button"
            onClick={refreshMetrics}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
          >
            🔄 Refresh
          </button>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Top Volume (7 Days)</h3>
            </div>
            <ul className="mt-4 space-y-3">
              {topPerformers.length === 0 ? (
                <li className="text-sm text-gray-500">No recent orders</li>
              ) : (
                topPerformers.map((tenant, index) => (
                  <li
                    key={tenant.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-gray-900">{tenant.name}</span>
                    </div>
                    <span className="font-bold text-blue-600">{formatCurrency(tenant.grossLastSevenDays)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-purple-50 p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-2">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Latest Activity</h3>
            </div>
            <ul className="mt-4 space-y-3">
              {metrics.tenantActivity.slice(0, 5).map((activity) => (
                <li
                  key={activity.tenantId}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    <span className="font-semibold text-gray-900">{activity.tenantName}</span>
                    <p className="text-xs text-gray-500">{formatDateTime(activity.lastOrderAt)}</p>
                  </div>
                  {activity.lastOrderAmount && (
                    <span className="font-bold text-purple-600">{formatCurrency(activity.lastOrderAmount)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

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
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => setSelectedTenantId(tenant.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                    tenant.id === selectedTenantId
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{tenant.name}</span>
                    <span className="text-xs uppercase text-gray-500">{tenant.slug}</span>
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
              );
            })}
            {tenants.length === 0 && <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">No tenants yet.</p>}
          </div>

          {editForm ? (
            <div className="space-y-6">
              {editMessage && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{editMessage}</p>}
              {editError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>}

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

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Create Tenant</h2>
        <p className="mt-1 text-sm text-gray-500">Fill out the basics and optionally seed the demo experience.</p>
        {createMessage && <p className="mt-3 rounded bg-green-50 p-3 text-sm text-green-700">{createMessage}</p>}
        {createError && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{createError}</p>}

        <form onSubmit={handleCreateTenant} className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
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
      </div>
    </div>
  );
}
