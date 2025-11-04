"use client";

import { useState } from 'react';

interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  stripeAccountId?: string | null;
  createdAt: string;
}

interface Props {
  initialTenants: TenantSummary[];
  rootDomain: string;
}

const defaultForm = {
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

export default function SuperAdminDashboard({ initialTenants, rootDomain }: Props) {
  const [tenants, setTenants] = useState(initialTenants);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshTenants = async () => {
    const res = await fetch('/api/super/tenants', { cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setTenants(data || []);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.target instanceof HTMLInputElement) {
      const { name, type, checked, value } = event.target;
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      return;
    }

    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        ...form,
        deliveryRadiusMi: form.seedDemo ? 5 : undefined,
        minimumOrderValue: form.seedDemo ? 0 : undefined,
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
      setMessage('Tenant created!');
      setForm(defaultForm);
    } catch (err) {
      console.error(err);
      setError('Failed to create tenant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 py-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-sm text-gray-600">
          Provision new restaurant tenants, seed demo menus, and review onboarding status.
        </p>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Create Tenant</h2>
        <p className="mt-1 text-sm text-gray-500">Fill out the basic branding info and optionally seed demo menu data.</p>
        {message && <p className="mt-3 rounded bg-green-50 p-3 text-sm text-green-700">{message}</p>}
        {error && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="La Poblanita"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="lapoblanita"
            />
            <p className="text-xs text-gray-500">Domain preview: {form.slug || '<slug>'}.{rootDomain}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
            <input
              name="contactEmail"
              value={form.contactEmail}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              type="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
            <input
              name="contactPhone"
              value={form.contactPhone}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              type="tel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hero Title</label>
            <input
              name="heroTitle"
              value={form.heroTitle}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Culinary Excellence"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hero Subtitle</label>
            <input
              name="heroSubtitle"
              value={form.heroSubtitle}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="Order direct for pickup or delivery"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Tagline</label>
            <textarea
              name="tagline"
              value={form.tagline}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Color</label>
            <input
              type="color"
              name="primaryColor"
              value={form.primaryColor}
              onChange={handleChange}
              className="h-10 w-16 cursor-pointer rounded border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
            <input
              type="color"
              name="secondaryColor"
              value={form.secondaryColor}
              onChange={handleChange}
              className="h-10 w-16 cursor-pointer rounded border border-gray-300"
            />
          </div>
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="seedDemo"
                checked={form.seedDemo}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              Seed demo menu sections and items
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Stripe Connected Account ID (optional)</label>
            <input
              name="stripeAccountId"
              value={form.stripeAccountId}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="acct_123..."
            />
            <p className="text-xs text-gray-500">You can also add this later via tenant settings after onboarding.</p>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Existing Tenants</h2>
          <button
            onClick={async () => {
              try {
                await refreshTenants();
              } catch (err) {
                console.error(err);
                setError('Failed to refresh tenants');
              }
            }}
            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Slug</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Contact</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Stripe</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">{tenant.name}</td>
                  <td className="px-4 py-2 text-gray-600">
                    <div>{tenant.slug}</div>
                    <div className="text-xs text-gray-400">{tenant.slug}.{rootDomain}</div>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {tenant.contactEmail && <div>{tenant.contactEmail}</div>}
                    {tenant.contactPhone && <div>{tenant.contactPhone}</div>}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {tenant.stripeAccountId ? (
                      <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        Connected
                      </span>
                    ) : (
                      <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                        Not linked
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No tenants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
