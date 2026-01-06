'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

interface EmailDomainRecord {
  type: string;
  name: string;
  value: string;
  status: string;
  priority?: number;
}

interface SettingsPageProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    customDomain: string | null;
    emailDomainVerified: boolean;
    resendDomainId: string | null;
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
    logoUrl: (tenant as any).logoUrl || '',
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
      defaultHours[day] = tenant.settings?.operatingHours?.storeHours?.[day] || tenant.settings?.operatingHours?.[day] || {
        open: '09:00',
        close: '21:00',
        closed: false,
      };
    });
    return defaultHours;
  });

  const [isOpen, setIsOpen] = useState(tenant.settings?.isOpen !== false);
  const [temporarilyClosed, setTemporarilyClosed] = useState(tenant.settings?.operatingHours?.temporarilyClosed || false);
  const [closedMessage, setClosedMessage] = useState(tenant.settings?.operatingHours?.closedMessage || '');
  const [holidays, setHolidays] = useState<Array<{ id: string; date: string; name: string; closingTime?: string }>>(
    tenant.settings?.operatingHours?.holidays || []
  );
  const [timezone, setTimezone] = useState(tenant.settings?.operatingHours?.timezone || 'America/Los_Angeles');

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

  // Email domain settings
  const [emailDomain, setEmailDomain] = useState(tenant.customDomain || '');
  const [emailDomainVerified, setEmailDomainVerified] = useState(tenant.emailDomainVerified || false);
  const [emailDomainRecords, setEmailDomainRecords] = useState<EmailDomainRecord[]>([]);
  const [emailDomainLoading, setEmailDomainLoading] = useState(false);
  const [emailDomainError, setEmailDomainError] = useState('');
  const [emailDomainSuccess, setEmailDomainSuccess] = useState('');

  // Fetch email domain status on mount
  useEffect(() => {
    if (tenant.resendDomainId) {
      fetchEmailDomainStatus();
    }
  }, [tenant.resendDomainId]);

  const fetchEmailDomainStatus = async () => {
    try {
      const res = await fetch(`/api/admin/email-domain/status?tenantId=${tenant.id}`);
      const data = await res.json();
      if (data.configured) {
        setEmailDomain(data.domain || '');
        setEmailDomainVerified(data.verified || false);
        setEmailDomainRecords(data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch email domain status', err);
    }
  };

  const handleSetupEmailDomain = async () => {
    if (!emailDomain.trim()) {
      setEmailDomainError('Please enter a domain');
      return;
    }

    setEmailDomainLoading(true);
    setEmailDomainError('');
    setEmailDomainSuccess('');

    try {
      const res = await fetch('/api/admin/email-domain/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id, domain: emailDomain.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setEmailDomainError(data.error || 'Failed to setup domain');
        return;
      }

      setEmailDomainRecords(data.records || []);
      setEmailDomainSuccess('Domain added! Add the DNS records below to verify.');
    } catch (err) {
      setEmailDomainError('Failed to setup email domain');
    } finally {
      setEmailDomainLoading(false);
    }
  };

  const handleVerifyEmailDomain = async () => {
    setEmailDomainLoading(true);
    setEmailDomainError('');
    setEmailDomainSuccess('');

    try {
      const res = await fetch('/api/admin/email-domain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setEmailDomainError(data.error || 'Failed to verify domain');
        return;
      }

      if (data.verified) {
        setEmailDomainVerified(true);
        setEmailDomainSuccess('Domain verified! Emails will now send from your custom domain.');
      } else {
        setEmailDomainError('Domain not yet verified. Please ensure all DNS records are added correctly.');
        setEmailDomainRecords(data.records || []);
      }
    } catch (err) {
      setEmailDomainError('Failed to verify email domain');
    } finally {
      setEmailDomainLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: formData.restaurantName,
          logoUrl: formData.logoUrl,
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
          isOpen,
          operatingHours: {
            timezone,
            storeHours: hours,
            temporarilyClosed,
            closedMessage,
            holidays,
          },
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Logo</label>
                  <div className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://... or upload logo"
                    />
                    <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const formDataObj = new FormData();
                          formDataObj.append('file', file);
                          try {
                            // Upload the file
                            const res = await fetch('/api/admin/assets/upload', {
                              method: 'POST',
                              body: formDataObj,
                            });
                            const data = await res.json();
                            if (data.url) {
                              // Update local state
                              setFormData((prev) => ({ ...prev, logoUrl: data.url }));

                              // Auto-save the logo URL to database immediately
                              const saveRes = await fetch('/api/admin/tenant-settings', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ logoUrl: data.url }),
                              });
                              if (saveRes.ok) {
                                setSaved(true);
                                setTimeout(() => setSaved(false), 2000);
                              }
                            }
                          } catch (err) {
                            console.error('Failed to upload logo', err);
                            alert('Failed to upload logo');
                          }
                        }}
                      />
                      Upload Logo
                    </label>
                  </div>
                  {formData.logoUrl && (
                    <img
                      src={formData.logoUrl}
                      alt="Logo Preview"
                      className="mt-2 h-20 w-20 object-contain rounded border border-gray-300 bg-white p-2"
                    />
                  )}
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

            {/* Operating Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Operating Status</h2>
              <div className="space-y-4">
                {/* Master On/Off Toggle */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={isOpen && !temporarilyClosed}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setIsOpen(true);
                          setTemporarilyClosed(false);
                        } else {
                          setIsOpen(false);
                        }
                      }}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="font-medium text-gray-700">Accepting Orders</label>
                    <p className="text-sm text-gray-500">
                      Enable online ordering (respects operating hours)
                    </p>
                  </div>
                </div>

                {/* Temporary Closure */}
                <div className="border-t pt-4">
                  <div className="flex items-start mb-2">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={temporarilyClosed}
                        onChange={(e) => {
                          setTemporarilyClosed(e.target.checked);
                          if (e.target.checked) {
                            setIsOpen(false);
                          }
                        }}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label className="font-medium text-gray-700">Temporary Closure</label>
                      <p className="text-sm text-gray-500">
                        Override everything - closes ordering immediately
                      </p>
                    </div>
                  </div>
                  {temporarilyClosed && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Closure Message
                      </label>
                      <input
                        type="text"
                        value={closedMessage}
                        onChange={(e) => setClosedMessage(e.target.value)}
                        placeholder="We are temporarily closed. Check back soon!"
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  )}
                </div>

                {/* Timezone */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="America/Los_Angeles">Pacific (Los Angeles)</option>
                    <option value="America/Denver">Mountain (Denver)</option>
                    <option value="America/Chicago">Central (Chicago)</option>
                    <option value="America/New_York">Eastern (New York)</option>
                    <option value="America/Phoenix">Arizona (Phoenix)</option>
                    <option value="America/Anchorage">Alaska (Anchorage)</option>
                    <option value="Pacific/Honolulu">Hawaii (Honolulu)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Holiday Closures */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Holiday Closures</h2>
              <p className="text-sm text-gray-500 mb-4">
                Set specific dates when your restaurant will be closed or closing early (overrides regular hours)
              </p>
              <div className="space-y-4">
                {holidays.map((holiday, index) => (
                  <div key={holiday.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="date"
                        value={holiday.date}
                        onChange={(e) => {
                          const updated = [...holidays];
                          updated[index].date = e.target.value;
                          setHolidays(updated);
                        }}
                        className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={holiday.name}
                        onChange={(e) => {
                          const updated = [...holidays];
                          updated[index].name = e.target.value;
                          setHolidays(updated);
                        }}
                        placeholder="Holiday name (e.g., New Year's Eve)"
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setHolidays(holidays.filter((_, i) => i !== index));
                        }}
                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex items-center gap-3 pl-1">
                      <input
                        type="checkbox"
                        id={`early-close-${holiday.id}`}
                        checked={!!holiday.closingTime}
                        onChange={(e) => {
                          const updated = [...holidays];
                          updated[index].closingTime = e.target.checked ? '15:00' : undefined;
                          setHolidays(updated);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`early-close-${holiday.id}`} className="text-sm text-gray-600">
                        Early closing (instead of all-day closure)
                      </label>
                      {holiday.closingTime && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Close at:</span>
                          <input
                            type="time"
                            value={holiday.closingTime}
                            onChange={(e) => {
                              const updated = [...holidays];
                              updated[index].closingTime = e.target.value;
                              setHolidays(updated);
                            }}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setHolidays([
                      ...holidays,
                      {
                        id: `holiday-${Date.now()}`,
                        date: new Date().toISOString().split('T')[0],
                        name: '',
                        closingTime: undefined,
                      },
                    ]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded border border-blue-300"
                >
                  + Add Holiday
                </button>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Regular Operating Hours</h2>
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

            {/* Email Domain Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Email Domain Settings</h2>
                {emailDomainVerified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Set up a custom email domain so order confirmations appear from your business email
                (e.g., <code className="bg-gray-100 px-1 rounded">orders@{emailDomain || 'yourdomain.com'}</code>).
              </p>

              {emailDomainError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{emailDomainError}</p>
                </div>
              )}

              {emailDomainSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">{emailDomainSuccess}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Your Domain</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      value={emailDomain}
                      onChange={(e) => setEmailDomain(e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="yourdomain.com"
                      disabled={emailDomainVerified || emailDomainLoading}
                    />
                    {!emailDomainVerified && emailDomainRecords.length === 0 && (
                      <button
                        type="button"
                        onClick={handleSetupEmailDomain}
                        disabled={emailDomainLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {emailDomainLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Add Domain
                      </button>
                    )}
                  </div>
                </div>

                {/* DNS Records */}
                {emailDomainRecords.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      DNS Records to Add
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Add these records to your domain's DNS settings. This usually takes a few minutes to propagate.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {emailDomainRecords.map((record, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 font-mono text-xs">{record.type}</td>
                              <td className="px-3 py-2 font-mono text-xs break-all max-w-xs">{record.name}</td>
                              <td className="px-3 py-2 font-mono text-xs break-all max-w-md">{record.value}</td>
                              <td className="px-3 py-2">
                                {record.status === 'verified' ? (
                                  <span className="inline-flex items-center text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    OK
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-yellow-600">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {!emailDomainVerified && (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={handleVerifyEmailDomain}
                          disabled={emailDomainLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {emailDomainLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                          Verify Domain
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {emailDomainVerified && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-green-700">
                      Order confirmation emails will now be sent from{' '}
                      <code className="bg-green-50 px-1 rounded font-semibold">orders@{emailDomain}</code>
                    </p>
                  </div>
                )}
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

