'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TenantThemeProvider, type TenantTheme } from '../TenantThemeProvider';
import OrderPageClient, { type OrderMenuSection, type OrderMenuItem } from '../order/OrderPageClient';

interface CustomizePreviewProps {
  initialTenant: TenantTheme;
  mockSections: OrderMenuSection[];
  mockFeaturedItems: OrderMenuItem[];
}

interface CustomizationSettings {
  heroTitle: string;
  heroSubtitle: string;
  primaryColor: string;
  secondaryColor: string;
  highlights: string[];
  featureFlags: string[];
}

interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  changes: Record<string, { from: any; to: any }>;
}

// Helper function to calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string) => {
    const rgb = parseInt(color.replace('#', ''), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function CustomizePreview({
  initialTenant,
  mockSections,
  mockFeaturedItems,
}: CustomizePreviewProps) {
  const [settings, setSettings] = useState<CustomizationSettings>({
    heroTitle: initialTenant.heroTitle || initialTenant.name,
    heroSubtitle: initialTenant.heroSubtitle || '',
    primaryColor: initialTenant.primaryColor,
    secondaryColor: initialTenant.secondaryColor,
    highlights: initialTenant.branding?.highlights || [],
    featureFlags: initialTenant.featureFlags || [],
  });

  const [originalSettings, setOriginalSettings] = useState<CustomizationSettings>(settings);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [newHighlight, setNewHighlight] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Calculate contrast ratio
  const contrastRatio = useMemo(() => {
    return getContrastRatio(settings.primaryColor, settings.secondaryColor);
  }, [settings.primaryColor, settings.secondaryColor]);

  const hasContrastWarning = contrastRatio < 3;

  // Create preview tenant with current settings
  const previewTenant = useMemo<TenantTheme>(() => ({
    ...initialTenant,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    featureFlags: settings.featureFlags,
    branding: {
      ...initialTenant.branding,
      highlights: settings.highlights,
    },
  }), [settings, initialTenant]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  const handleAddHighlight = useCallback(() => {
    if (newHighlight.trim() && settings.highlights.length < 10) {
      setSettings((prev) => ({
        ...prev,
        highlights: [...prev.highlights, newHighlight.trim()],
      }));
      setNewHighlight('');
    }
  }, [newHighlight, settings.highlights.length]);

  const handleRemoveHighlight = useCallback((index: number) => {
    setSettings((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  }, []);

  const toggleFeatureFlag = useCallback((flag: string) => {
    setSettings((prev) => ({
      ...prev,
      featureFlags: prev.featureFlags.includes(flag)
        ? prev.featureFlags.filter((f) => f !== flag)
        : [...prev.featureFlags, flag],
    }));
  }, []);

  const handlePublish = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Calculate changes for audit log
      const changes: Record<string, { from: any; to: any }> = {};
      Object.keys(settings).forEach((key) => {
        const k = key as keyof CustomizationSettings;
        if (JSON.stringify(settings[k]) !== JSON.stringify(originalSettings[k])) {
          changes[key] = { from: originalSettings[k], to: settings[k] };
        }
      });

      // Send to API
      const response = await fetch('/api/admin/tenant-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroTitle: settings.heroTitle,
          heroSubtitle: settings.heroSubtitle,
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
          featureFlags: settings.featureFlags,
          branding: {
            ...initialTenant.branding,
            highlights: settings.highlights,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Add audit log
      const auditLog: AuditLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        action: 'Settings Published',
        changes,
      };
      setAuditLogs((prev) => [auditLog, ...prev].slice(0, 10));

      setOriginalSettings(settings);
      setSaveMessage('Settings published successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to publish settings:', error);
      setSaveMessage('Failed to publish settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [settings, originalSettings, initialTenant.branding]);

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset all changes to the last published version?')) {
      setSettings(originalSettings);
      setSaveMessage('Settings reset to published version');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, [originalSettings]);

  const handleResetToDefaults = useCallback(() => {
    if (
      confirm(
        'Are you sure you want to reset all settings to default values? This will not publish the changes until you click Publish.',
      )
    ) {
      const defaults: CustomizationSettings = {
        heroTitle: initialTenant.name,
        heroSubtitle: 'Experience flavors that tell a story.',
        primaryColor: '#38c4ff',
        secondaryColor: '#071836',
        highlights: ['Authentic', 'Fresh', 'Local'],
        featureFlags: [],
      };
      setSettings(defaults);
      setSaveMessage('Settings reset to defaults (not published)');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  }, [initialTenant.name]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controls Panel */}
        <div className="space-y-6 p-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Live Preview Controls</h2>
            <p className="mb-6 text-sm text-gray-600">
              Make changes below and see them reflected in real-time in the preview panel. Click
              &quot;Publish&quot; to save your changes.
            </p>

            {/* Hero Copy */}
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">Hero Section</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Hero Title
                  </label>
                  <input
                    type="text"
                    value={settings.heroTitle}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, heroTitle: e.target.value }))
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Your restaurant name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Hero Subtitle
                  </label>
                  <textarea
                    value={settings.heroSubtitle}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, heroSubtitle: e.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="A compelling tagline for your restaurant"
                  />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">Brand Colors</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Primary Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, primaryColor: e.target.value }))
                        }
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Secondary Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))
                        }
                        className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))
                        }
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                {hasContrastWarning && (
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <div className="flex gap-2">
                      <span className="text-amber-600">⚠️</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">Low Contrast Warning</p>
                        <p className="text-xs text-amber-700">
                          The contrast ratio between your colors is {contrastRatio.toFixed(2)}:1.
                          For better accessibility, aim for at least 3:1 (current) or 4.5:1 (WCAG
                          AA).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {!hasContrastWarning && (
                  <div className="rounded-md bg-green-50 border border-green-200 p-3">
                    <div className="flex gap-2">
                      <span className="text-green-600">✓</span>
                      <p className="text-sm text-green-800">
                        Good contrast ratio: {contrastRatio.toFixed(2)}:1
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">Feature Highlights</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddHighlight()}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Add a highlight (e.g., 'Family-owned')"
                    maxLength={30}
                  />
                  <button
                    onClick={handleAddHighlight}
                    disabled={!newHighlight.trim() || settings.highlights.length >= 10}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.highlights.map((highlight, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {highlight}
                      <button
                        onClick={() => handleRemoveHighlight(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {settings.highlights.length === 0 && (
                  <p className="text-xs text-gray-500">No highlights added yet</p>
                )}
                {settings.highlights.length >= 10 && (
                  <p className="text-xs text-amber-600">Maximum 10 highlights reached</p>
                )}
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">Feature Toggles</h3>
              <div className="space-y-3">
                {['membership', 'catering', 'bakery'].map((flag) => (
                  <label key={flag} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.featureFlags.includes(flag)}
                      onChange={() => toggleFeatureFlag(flag)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 capitalize">{flag}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 border-t border-gray-200 pt-6">
              {saveMessage && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    saveMessage.includes('successfully')
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  {saveMessage}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handlePublish}
                  disabled={!hasChanges || isSaving}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Publishing...' : 'Publish Changes'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={!hasChanges || isSaving}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </div>
              <button
                onClick={handleResetToDefaults}
                disabled={isSaving}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Reset to Defaults
              </button>
            </div>
          </div>

          {/* Audit Log */}
          {auditLogs.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">Recent Changes</h3>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="rounded-md border border-gray-200 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{log.action}</span>
                      <span className="text-xs text-gray-500">
                        {log.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(log.changes).map(([key, { from, to }]) => (
                        <div key={key} className="text-xs text-gray-600">
                          <span className="font-medium">{key}:</span>{' '}
                          <span className="text-red-600">
                            {JSON.stringify(from).substring(0, 30)}
                          </span>{' '}
                          →{' '}
                          <span className="text-green-600">
                            {JSON.stringify(to).substring(0, 30)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="sticky top-6 h-[calc(100vh-3rem)] overflow-hidden">
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Live Preview</h3>
              <div className="flex gap-2">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  {hasChanges ? 'Unsaved changes' : 'Published'}
                </span>
              </div>
            </div>
            <div className="relative h-[calc(100vh-10rem)] overflow-auto rounded border border-gray-300">
              <TenantThemeProvider tenant={previewTenant}>
                <OrderPageClient
                  sections={mockSections}
                  featuredItems={mockFeaturedItems}
                  tenantSlug={previewTenant.slug}
                />
              </TenantThemeProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
