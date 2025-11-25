'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

interface SettingsPageProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    settings: any;
  };
}

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SettingsPage({ tenant }: SettingsPageProps) {
  const [formData, setFormData] = useState({
    restaurantName: tenant.name,
    contactEmail: tenant.contactEmail || '',
    contactPhone: tenant.contactPhone || '',
    addressLine1: tenant.addressLine1 || '',
    addressLine2: tenant.addressLine2 || '',
    city: tenant.city || '',
    state: tenant.state || '',
    postalCode: tenant.postalCode || '',
    deliveryRadiusMi: tenant.settings?.deliveryRadiusMi || 5,
    minimumOrderValue: tenant.settings?.minimumOrderValue || 20,
    defaultTaxRate: tenant.settings?.defaultTaxRate || 0.0825,
  });

  const [hours, setHours] = useState<Record<string, DayHours>>(() => {
    const defaultHours: Record<string, DayHours> = {};
    DAYS.forEach(day => {
      defaultHours[day] = tenant.settings?.operatingHours?.[day] || {
        open: '09:00',
        close: '21:00',
        closed: false,
      };
    });
    return defaultHours;
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cloverCredentials, setCloverCredentials] = useState({
    merchantId: tenant.settings?.clover?.merchantId || '',
    apiKey: tenant.settings?.clover?.apiKey || '',
  });
  const [davoCredentials, setDavoCredentials] = useState({
    accountId: tenant.settings?.davo?.accountId || '',
    licenseKey: tenant.settings?.davo?.licenseKey || '',
    companyCode: tenant.settings?.davo?.companyCode || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.restaurantName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          deliveryRadiusMi: parseFloat(formData.deliveryRadiusMi.toString()),
          minimumOrderValue: parseFloat(formData.minimumOrderValue.toString()),
          defaultTaxRate: parseFloat(formData.defaultTaxRate.toString()),
          operatingHours: hours,
          clover: cloverCredentials,
          davo: davoCredentials,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateHours = (day: string, field: keyof DayHours, value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Business Settings</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Business Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
                  <input
                    type="text"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h2>
              <div className="space-y-3">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24">
                      <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!hours[day].closed}
                        onChange={(e) => updateHours(day, 'closed', !e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-500">Open</span>
                    </div>
                    {!hours[day].closed && (
                      <>
                        <input
                          type="time"
                          value={hours[day].open}
                          onChange={(e) => updateHours(day, 'open', e.target.value)}
                          className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-sm text-gray-500">to</span>
                        <input
                          type="time"
                          value={hours[day].close}
                          onChange={(e) => updateHours(day, 'close', e.target.value)}
                          className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </>
                    )}
                    {hours[day].closed && (
                      <span className="text-sm text-gray-500">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery & Pricing */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery & Pricing</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Radius (mi)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.deliveryRadiusMi}
                    onChange={(e) => setFormData({ ...formData, deliveryRadiusMi: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Order ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minimumOrderValue}
                    onChange={(e) => setFormData({ ...formData, minimumOrderValue: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.defaultTaxRate}
                    onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Clover POS Integration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Clover POS Integration</h2>
              <p className="text-sm text-gray-600 mb-4">
                Connect your Clover POS system to automatically sync orders and inventory.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Clover Merchant ID</label>
                  <input
                    type="text"
                    value={cloverCredentials.merchantId}
                    onChange={(e) => setCloverCredentials({ ...cloverCredentials, merchantId: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="merchant_xxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Clover API Key</label>
                  <input
                    type="password"
                    value={cloverCredentials.apiKey}
                    onChange={(e) => setCloverCredentials({ ...cloverCredentials, apiKey: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Davo (Avalara) Tax Integration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Davo (Avalara) Tax Integration</h2>
              <p className="text-sm text-gray-600 mb-4">
                Connect to Avalara via Davo for automated tax calculation and compliance.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Avalara Account ID</label>
                  <input
                    type="text"
                    value={davoCredentials.accountId}
                    onChange={(e) => setDavoCredentials({ ...davoCredentials, accountId: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="account_xxxxx"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Key</label>
                    <input
                      type="password"
                      value={davoCredentials.licenseKey}
                      onChange={(e) => setDavoCredentials({ ...davoCredentials, licenseKey: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Code (Optional)</label>
                    <input
                      type="text"
                      value={davoCredentials.companyCode}
                      onChange={(e) => setDavoCredentials({ ...davoCredentials, companyCode: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="DEFAULT"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                } ${saved ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
              </button>
            </div>
                </form>
              </div>
            </div>
          </DashboardLayout>
        );
      }

