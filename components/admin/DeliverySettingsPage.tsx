'use client';

import { useState, useEffect } from 'react';
import { Truck, Settings, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface DeliverySettings {
  uberEnabled: boolean;
  doordashEnabled: boolean;
  selfDeliveryEnabled: boolean;
  deliveryBaseFee: number;
  selfDeliveryFee: number;
  deliveryRadiusMi: number;
  minimumOrderValue: number;
  passDeliveryFeeToCustomer: boolean;
  deliveryFeeMarkup: number;
}

interface ConnectionStatus {
  uber: { connected: boolean; message: string };
  doordash: { connected: boolean; message: string };
}

export default function DeliverySettingsPage() {
  const [settings, setSettings] = useState<DeliverySettings>({
    uberEnabled: false,
    doordashEnabled: false,
    selfDeliveryEnabled: true,
    deliveryBaseFee: 6.99,
    selfDeliveryFee: 4.99,
    deliveryRadiusMi: 5,
    minimumOrderValue: 15,
    passDeliveryFeeToCustomer: true,
    deliveryFeeMarkup: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState<'uber' | 'doordash' | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    uber: { connected: false, message: 'Not configured' },
    doordash: { connected: false, message: 'Not configured' },
  });

  useEffect(() => {
    loadSettings();
    checkConnections();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/delivery');
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...settings, ...data });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkConnections = async () => {
    // Check Uber connection
    try {
      const uberRes = await fetch('/api/admin/uber/status');
      const uberData = await uberRes.json();
      setConnectionStatus((prev) => ({
        ...prev,
        uber: {
          connected: uberData.configured,
          message: uberData.configured ? 'Connected' : 'API keys not configured',
        },
      }));
    } catch {
      setConnectionStatus((prev) => ({
        ...prev,
        uber: { connected: false, message: 'Connection check failed' },
      }));
    }

    // Check DoorDash connection
    try {
      const ddRes = await fetch('/api/admin/doordash/status');
      const ddData = await ddRes.json();
      setConnectionStatus((prev) => ({
        ...prev,
        doordash: {
          connected: ddData.configured,
          message: ddData.configured ? 'Connected' : 'API keys not configured',
        },
      }));
    } catch {
      setConnectionStatus((prev) => ({
        ...prev,
        doordash: { connected: false, message: 'Connection check failed' },
      }));
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/delivery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save');
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (partner: 'uber' | 'doordash') => {
    setTestingConnection(partner);
    try {
      const endpoint = partner === 'uber' ? '/api/delivery/uber/quote' : '/api/delivery/doordash/quote';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress: {
            street: '123 Main St',
            city: 'Colusa',
            state: 'CA',
            zipCode: '95932',
          },
          dropoffAddress: {
            street: '456 Oak Ave',
            city: 'Colusa',
            state: 'CA',
            zipCode: '95932',
          },
        }),
      });
      const data = await response.json();
      if (data.deliveryFee) {
        alert(`Test successful! Quoted fee: $${data.deliveryFee.toFixed(2)}`);
        setConnectionStatus((prev) => ({
          ...prev,
          [partner]: { connected: true, message: `Working - $${data.deliveryFee.toFixed(2)} test quote` },
        }));
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      alert(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestingConnection(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-emerald-500/20 p-3">
          <Truck className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Delivery Settings</h1>
          <p className="text-white/60">Configure delivery partners and fees</p>
        </div>
      </div>

      {/* Delivery Partners */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Delivery Partners</h2>

        <div className="space-y-4">
          {/* Uber Direct */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-black flex items-center justify-center">
                <span className="text-white font-bold">U</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Uber Direct</h3>
                <div className="flex items-center gap-2 text-sm">
                  {connectionStatus.uber.connected ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-400">{connectionStatus.uber.message}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-amber-400" />
                      <span className="text-amber-400">{connectionStatus.uber.message}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => testConnection('uber')}
                disabled={testingConnection === 'uber'}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 disabled:opacity-50"
              >
                {testingConnection === 'uber' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </button>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.uberEnabled}
                  onChange={(e) => setSettings({ ...settings, uberEnabled: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-white/20 peer-checked:bg-emerald-500 peer-focus:ring-2 peer-focus:ring-emerald-500/50 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          </div>

          {/* DoorDash */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#FF3008] flex items-center justify-center">
                <span className="text-white font-bold">D</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">DoorDash Drive</h3>
                <div className="flex items-center gap-2 text-sm">
                  {connectionStatus.doordash.connected ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-400">{connectionStatus.doordash.message}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-amber-400" />
                      <span className="text-amber-400">{connectionStatus.doordash.message}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => testConnection('doordash')}
                disabled={testingConnection === 'doordash'}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 disabled:opacity-50"
              >
                {testingConnection === 'doordash' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
              </button>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.doordashEnabled}
                  onChange={(e) => setSettings({ ...settings, doordashEnabled: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-white/20 peer-checked:bg-emerald-500 peer-focus:ring-2 peer-focus:ring-emerald-500/50 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          </div>

          {/* Self Delivery */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Restaurant Delivery</h3>
                <p className="text-sm text-white/60">Use your own drivers</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={settings.selfDeliveryEnabled}
                onChange={(e) => setSettings({ ...settings, selfDeliveryEnabled: e.target.checked })}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-white/20 peer-checked:bg-emerald-500 peer-focus:ring-2 peer-focus:ring-emerald-500/50 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>
        </div>
      </div>

      {/* Delivery Settings */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-white/60" />
          <h2 className="text-lg font-semibold text-white">Fee Settings</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-white/70">Self Delivery Fee ($)</label>
            <input
              type="number"
              step="0.01"
              value={settings.selfDeliveryFee}
              onChange={(e) => setSettings({ ...settings, selfDeliveryFee: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            />
            <p className="mt-1 text-xs text-white/50">Fee charged when using restaurant delivery</p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Delivery Radius (miles)</label>
            <input
              type="number"
              value={settings.deliveryRadiusMi}
              onChange={(e) => setSettings({ ...settings, deliveryRadiusMi: parseInt(e.target.value) || 5 })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Minimum Order Value ($)</label>
            <input
              type="number"
              step="0.01"
              value={settings.minimumOrderValue}
              onChange={(e) => setSettings({ ...settings, minimumOrderValue: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            />
            <p className="mt-1 text-xs text-white/50">Minimum order amount for delivery</p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Delivery Fee Markup ($)</label>
            <input
              type="number"
              step="0.01"
              value={settings.deliveryFeeMarkup}
              onChange={(e) => setSettings({ ...settings, deliveryFeeMarkup: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            />
            <p className="mt-1 text-xs text-white/50">Additional markup added to partner delivery fees</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={settings.passDeliveryFeeToCustomer}
              onChange={(e) => setSettings({ ...settings, passDeliveryFeeToCustomer: e.target.checked })}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-white/20 peer-checked:bg-emerald-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
          </label>
          <span className="text-white/80">Pass delivery fee to customer</span>
        </div>
        <p className="mt-1 ml-14 text-xs text-white/50">
          When enabled, customers pay the delivery fee. When disabled, you absorb the cost.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="rounded-xl bg-emerald-500 px-8 py-3 font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
