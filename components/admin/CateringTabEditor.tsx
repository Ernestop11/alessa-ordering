'use client';

import { useState, useEffect } from 'react';
import { ChefHat, Eye, EyeOff, Save } from 'lucide-react';

interface CateringTabConfig {
  enabled: boolean;
  label: string;
  icon?: string;
  description?: string;
  modalTagline?: string;
  modalHeading?: string;
}

export default function CateringTabEditor() {
  const [config, setConfig] = useState<CateringTabConfig>({
    enabled: true,
    label: 'Catering',
    icon: 'ChefHat',
    description: 'Full-service events, delivered',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/tenant-settings');
      const data = await res.json();
      if (data.cateringTabConfig) {
        setConfig(data.cateringTabConfig);
      }
    } catch (err) {
      console.error('Failed to fetch catering tab config', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cateringTabConfig: config,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save catering tab config', err);
      alert('Failed to save catering tab settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Catering Tab Settings</h2>
              <p className="text-sm text-gray-500">Configure the catering button on your customer ordering page</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            {config.enabled ? (
              <Eye className="h-5 w-5 text-green-600" />
            ) : (
              <EyeOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-900">Catering Tab Visibility</h3>
              <p className="text-sm text-gray-500">
                {config.enabled ? 'Catering tab is visible to customers' : 'Catering tab is hidden'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setConfig({ ...config, enabled: !config.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Button Label */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Button Label
          </label>
          <input
            type="text"
            value={config.label}
            onChange={(e) => setConfig({ ...config, label: e.target.value })}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Catering"
          />
          <p className="mt-1 text-sm text-gray-500">The text shown on the catering button</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modal Description (Optional)
          </label>
          <input
            type="text"
            value={config.description || ''}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Full-service events, delivered"
          />
          <p className="mt-1 text-sm text-gray-500">Tagline shown in the catering modal header</p>
        </div>

        {/* Modal Tagline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catering Modal Tagline
          </label>
          <input
            type="text"
            value={config.modalTagline || ''}
            onChange={(e) => setConfig({ ...config, modalTagline: e.target.value })}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Authentic Mexican Cuisine"
          />
          <p className="mt-1 text-sm text-gray-500">Small text shown at the top of catering modal image</p>
        </div>

        {/* Modal Heading */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catering Modal Heading
          </label>
          <input
            type="text"
            value={config.modalHeading || ''}
            onChange={(e) => setConfig({ ...config, modalHeading: e.target.value })}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Catering for Every Occasion"
          />
          <p className="mt-1 text-sm text-gray-500">Large heading shown on catering modal image</p>
        </div>

        {/* Live Preview */}
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Live Preview</h3>
          <div className="bg-black/85 rounded-xl p-4">
            <button
              className={`w-full inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                config.enabled
                  ? 'border-red-500/60 bg-red-500/20 text-white'
                  : 'border-gray-600 bg-gray-700/50 text-gray-400 opacity-50'
              }`}
              disabled={!config.enabled}
            >
              <ChefHat className="h-4 w-4" />
              {config.label}
            </button>
          </div>
          {!config.enabled && (
            <p className="mt-2 text-xs text-gray-500 italic">Button is currently hidden from customers</p>
          )}
        </div>
      </div>
    </div>
  );
}
