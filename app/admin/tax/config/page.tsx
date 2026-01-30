'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TaxConfig {
  taxAutoSetAsideEnabled: boolean;
  taxFilingState: string;
  taxFilingFrequency: string;
  taxCdtfaAccountNumber: string;
  taxEin: string;
  taxStateId: string;
  taxAutoPayEnabled: boolean;
  taxRemittanceEnabled: boolean;
  taxRemittanceSchedule: string;
  taxProvider: string;
  defaultTaxRate: number;
}

export default function TaxConfigPage() {
  const [config, setConfig] = useState<TaxConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/tax/config')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(setConfig)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const res = await fetch('/api/tax/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxAutoSetAsideEnabled: config.taxAutoSetAsideEnabled,
          taxFilingState: config.taxFilingState,
          taxFilingFrequency: config.taxFilingFrequency,
          taxCdtfaAccountNumber: config.taxCdtfaAccountNumber,
          taxEin: config.taxEin,
          taxStateId: config.taxStateId,
          taxAutoPayEnabled: config.taxAutoPayEnabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const updated = await res.json();
      setConfig((prev) => (prev ? { ...prev, ...updated } : prev));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tax Settings</h1>
            <p className="text-sm text-gray-500">Configure sales tax automation</p>
          </div>
          <Link
            href="/admin/tax"
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            Settings saved successfully.
          </div>
        )}

        {/* Enable Tax Automation */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Daily Tax Set-Aside
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Automatically calculate and track daily sales tax from POS and online
                orders
              </p>
            </div>
            <button
              onClick={() =>
                setConfig({
                  ...config,
                  taxAutoSetAsideEnabled: !config.taxAutoSetAsideEnabled,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.taxAutoSetAsideEnabled ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.taxAutoSetAsideEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Filing Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Filing Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filing State
              </label>
              <select
                value={config.taxFilingState}
                onChange={(e) =>
                  setConfig({ ...config, taxFilingState: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="CA">California (CDTFA)</option>
                <option value="TX">Texas</option>
                <option value="NY">New York</option>
                <option value="FL">Florida</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filing Frequency
              </label>
              <select
                value={config.taxFilingFrequency}
                onChange={(e) =>
                  setConfig({ ...config, taxFilingFrequency: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CDTFA Permit / Account Number
              </label>
              <input
                type="text"
                value={config.taxCdtfaAccountNumber}
                onChange={(e) =>
                  setConfig({ ...config, taxCdtfaAccountNumber: e.target.value })
                }
                placeholder="e.g., SR KHA 12-345678"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Federal EIN
              </label>
              <input
                type="text"
                value={config.taxEin}
                onChange={(e) => setConfig({ ...config, taxEin: e.target.value })}
                placeholder="e.g., 12-3456789"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State Tax ID
              </label>
              <input
                type="text"
                value={config.taxStateId}
                onChange={(e) =>
                  setConfig({ ...config, taxStateId: e.target.value })
                }
                placeholder="State-specific tax ID"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Auto-Pay */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Automatic ACH Payment
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Automatically send ACH payment to CDTFA after filing is confirmed
              </p>
            </div>
            <button
              onClick={() =>
                setConfig({
                  ...config,
                  taxAutoPayEnabled: !config.taxAutoPayEnabled,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.taxAutoPayEnabled ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.taxAutoPayEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Current Tax Rate (read-only) */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Current Tax Configuration (Read-Only)
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Tax Provider:</span>
              <span className="ml-2 font-medium capitalize">{config.taxProvider}</span>
            </div>
            <div>
              <span className="text-gray-500">Default Rate:</span>
              <span className="ml-2 font-medium">
                {(config.defaultTaxRate * 100).toFixed(2)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Tax rate and provider are configured in the main business settings.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </main>
    </div>
  );
}
