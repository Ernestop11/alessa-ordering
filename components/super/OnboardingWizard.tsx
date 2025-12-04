'use client';

import { useState } from 'react';

interface BusinessTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  colors: { primary: string; secondary: string };
  features: string[];
}

interface OnboardingForm {
  template: BusinessTemplate | null;
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  logoUrl: string;
  heroImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  deliveryRadiusMi: string;
  minimumOrderValue: string;
  currency: string;
  timeZone: string;
  stripeAccountId: string;
  seedDemo: boolean;
  referralCode?: string; // MLM referral code
}

interface Props {
  templates: BusinessTemplate[];
  rootDomain: string;
  onCreateTenant: (form: OnboardingForm) => Promise<void>;
  loading: boolean;
  message: string | null;
  error: string | null;
  initialTemplate?: BusinessTemplate | null;
}

export default function OnboardingWizard({ templates, rootDomain, onCreateTenant, loading, message, error, initialTemplate }: Props) {
  const [step, setStep] = useState(initialTemplate ? 2 : 1);
  const [form, setForm] = useState<OnboardingForm>({
    template: initialTemplate || null,
    name: '',
    slug: '',
    contactEmail: '',
    contactPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    logoUrl: '',
    heroImageUrl: '',
    heroTitle: '',
    heroSubtitle: '',
    tagline: '',
    primaryColor: initialTemplate?.colors.primary || '#dc2626',
    secondaryColor: initialTemplate?.colors.secondary || '#f59e0b',
    deliveryRadiusMi: '5',
    minimumOrderValue: '0',
    currency: 'USD',
    timeZone: 'America/Los_Angeles',
    stripeAccountId: '',
    seedDemo: true,
    referralCode: '',
  });

  const handleTemplateSelect = (template: BusinessTemplate) => {
    setForm({
      ...form,
      template,
      primaryColor: template.colors.primary,
      secondaryColor: template.colors.secondary,
    });
  };

  const handleChange = (field: keyof OnboardingForm, value: string | boolean) => {
    setForm({ ...form, [field]: value });
    if (field === 'name' && typeof value === 'string') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setForm((prev) => ({ ...prev, slug }));
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    await onCreateTenant(form);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return form.template !== null;
      case 2:
        return form.name && form.slug && form.contactEmail;
      case 3:
        return form.heroTitle && form.primaryColor && form.secondaryColor;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition ${
                s === step
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : s < step
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
            {s < 5 && (
              <div
                className={`h-1 flex-1 mx-2 transition ${
                  s < step ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Step 1: Template Selection */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Business Type</h2>
            <p className="mt-2 text-gray-600">Choose a template that matches your business type</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`rounded-2xl border-2 p-6 text-left transition hover:scale-105 ${
                  form.template?.id === template.id
                    ? 'border-blue-600 bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-4xl mb-3">{template.icon}</div>
                <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{template.description}</p>
                <div className="mt-4 flex gap-2">
                  <div
                    className="h-6 w-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: template.colors.primary }}
                  />
                  <div
                    className="h-6 w-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: template.colors.secondary }}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {template.features.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Basic Information */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
            <p className="mt-2 text-gray-600">Enter your business details</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
                required
              />
              <p className="mt-1 text-xs text-gray-500">{form.slug || '<slug>'}.{rootDomain}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Email *</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
              <input
                type="text"
                value={form.addressLine1}
                onChange={(e) => handleChange('addressLine1', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
              <input
                type="text"
                value={form.addressLine2}
                onChange={(e) => handleChange('addressLine2', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Postal Code</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Branding */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Branding</h2>
            <p className="mt-2 text-gray-600">Customize your business appearance</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hero Title *</label>
              <input
                type="text"
                value={form.heroTitle}
                onChange={(e) => handleChange('heroTitle', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hero Subtitle</label>
              <input
                type="text"
                value={form.heroSubtitle}
                onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Tagline</label>
              <textarea
                value={form.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Logo URL</label>
              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hero Image URL</label>
              <input
                type="url"
                value={form.heroImageUrl}
                onChange={(e) => handleChange('heroImageUrl', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Color</label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="h-12 w-20 cursor-pointer rounded-lg border border-gray-300"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  className="h-12 w-20 cursor-pointer rounded-lg border border-gray-300"
                />
                <input
                  type="text"
                  value={form.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Settings */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="mt-2 text-gray-600">Configure your business settings</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Delivery Radius (miles)</label>
              <input
                type="number"
                value={form.deliveryRadiusMi}
                onChange={(e) => handleChange('deliveryRadiusMi', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum Order Value</label>
              <input
                type="number"
                value={form.minimumOrderValue}
                onChange={(e) => handleChange('minimumOrderValue', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time Zone</label>
              <input
                type="text"
                value={form.timeZone}
                onChange={(e) => handleChange('timeZone', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Stripe Account ID (optional)</label>
              <input
                type="text"
                value={form.stripeAccountId}
                onChange={(e) => handleChange('stripeAccountId', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="acct_123..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Referral Code (optional)
                <span className="ml-2 text-xs text-gray-500">MLM associate referral code</span>
              </label>
              <input
                type="text"
                value={form.referralCode || ''}
                onChange={(e) => handleChange('referralCode', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Enter associate referral code"
              />
              <p className="mt-1 text-xs text-gray-500">
                If this tenant was referred by an associate, enter their referral code here to track commissions.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.seedDemo}
                  onChange={(e) => handleChange('seedDemo', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Seed demo menu items</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Review & Create */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Review & Create</h2>
            <p className="mt-2 text-gray-600">Review your settings and create the tenant</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Business Type</h3>
                <p className="text-gray-600">{form.template?.name || 'Not selected'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Business Name</h3>
                <p className="text-gray-600">{form.name || 'Not set'}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Slug</h3>
                <p className="text-gray-600">{form.slug || 'Not set'}.{rootDomain}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Contact Email</h3>
                <p className="text-gray-600">{form.contactEmail || 'Not set'}</p>
              </div>
              {form.referralCode && (
                <div>
                  <h3 className="font-semibold text-gray-900">Referral Code</h3>
                  <p className="text-gray-600">{form.referralCode}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">Colors</h3>
                <div className="mt-2 flex gap-2">
                  <div
                    className="h-8 w-8 rounded-full border border-gray-300"
                    style={{ backgroundColor: form.primaryColor }}
                  />
                  <div
                    className="h-8 w-8 rounded-full border border-gray-300"
                    style={{ backgroundColor: form.secondaryColor }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        {step < 5 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className="rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Tenant'}
          </button>
        )}
      </div>
    </div>
  );
}

