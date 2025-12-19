'use client'

import { useState, useEffect } from 'react'
import BrandingPicker from './BrandingPicker'
import GradientPicker from './GradientPicker'
import PatternPicker from './PatternPicker'
import EffectsPicker from './EffectsPicker'
import CardStylePicker from './CardStylePicker'
import { PAGE_GRADIENT_PRESETS } from '@/lib/template-builder/presets'

interface TenantTemplateSettings {
  id?: string
  backgroundGradient: string
  backgroundPattern: string | null
  patternOpacity: number
  patternSize: string | null
  primaryColor: string
  secondaryColor: string
  animation: string | null
  glowEffect: boolean
  particleEffect: string | null
  cardStyle: string
  cardImageEffect: string
  cardBackground: string | null
  headingFont: string
  bodyFont: string
  // Branding
  logoUrl: string | null
  logoSize: 'small' | 'medium' | 'large'
  faviconUrl: string | null
  businessName: string | null
  tagline: string | null
}

interface Props {
  templateId: string
  settings: TenantTemplateSettings | null
  onClose: () => void
  onSave: (settings: Partial<TenantTemplateSettings>) => Promise<void>
}

const DEFAULT_SETTINGS: TenantTemplateSettings = {
  backgroundGradient: 'linear-gradient(180deg, #1c1917 0%, #292524 50%, #1c1917 100%)',
  backgroundPattern: null,
  patternOpacity: 0.1,
  patternSize: null,
  primaryColor: '#dc2626',
  secondaryColor: '#f59e0b',
  animation: null,
  glowEffect: false,
  particleEffect: null,
  cardStyle: 'dark-red',
  cardImageEffect: 'soft-shadow',
  cardBackground: null,
  headingFont: 'Bebas Neue',
  bodyFont: 'Inter',
  // Branding defaults
  logoUrl: null,
  logoSize: 'medium',
  faviconUrl: null,
  businessName: null,
  tagline: null,
}

export default function DesignStudio({ templateId, settings, onClose, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<'branding' | 'gradient' | 'pattern' | 'effects' | 'cards'>('branding')
  const [localSettings, setLocalSettings] = useState<Partial<TenantTemplateSettings>>(
    settings || DEFAULT_SETTINGS
  )
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(localSettings)
      onClose()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS)
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6">
      <div className="bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl ring-1 ring-slate-700 flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-800 px-6 py-5 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl shadow-lg">
                🎨
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Design Studio</h2>
                <p className="text-slate-400 text-sm">Customize your template appearance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl p-2 hover:bg-slate-700 rounded-xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-850 border-b border-slate-700">
          <div className="flex">
            {[
              { id: 'branding', label: 'Branding', icon: '🏷️', desc: 'Logo & identity' },
              { id: 'gradient', label: 'Gradients', icon: '🌈', desc: 'Background colors' },
              { id: 'pattern', label: 'Patterns', icon: '🔲', desc: 'Overlay patterns' },
              { id: 'effects', label: 'Effects', icon: '✨', desc: 'Animations' },
              { id: 'cards', label: 'Cards', icon: '🃏', desc: 'Card styling' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 px-6 py-4 text-center transition-all relative group ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span className="text-2xl block mb-1">{tab.icon}</span>
                <span className="font-semibold block">{tab.label}</span>
                <span className="text-xs opacity-60 block">{tab.desc}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-4 right-4 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
          {activeTab === 'branding' && (
            <BrandingPicker
              settings={localSettings}
              onChange={setLocalSettings}
              templateId={templateId}
            />
          )}

          {activeTab === 'gradient' && (
            <GradientPicker
              settings={localSettings}
              onChange={setLocalSettings}
            />
          )}

          {activeTab === 'pattern' && (
            <PatternPicker
              settings={localSettings}
              onChange={setLocalSettings}
            />
          )}

          {activeTab === 'effects' && (
            <EffectsPicker
              settings={localSettings}
              onChange={setLocalSettings}
            />
          )}

          {activeTab === 'cards' && (
            <CardStylePicker
              settings={localSettings}
              onChange={setLocalSettings}
            />
          )}
        </div>

        {/* Footer with Preview & Actions */}
        <div className="bg-slate-800 border-t border-slate-700 p-6">
          {/* Live Preview */}
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-3 text-white">Preview</label>
            <div
              className="h-36 rounded-xl relative overflow-hidden transition-all duration-500 ring-1 ring-slate-700"
              style={{
                background: localSettings.backgroundGradient || DEFAULT_SETTINGS.backgroundGradient,
              }}
            >
              {localSettings.backgroundPattern && (
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    backgroundImage: localSettings.backgroundPattern,
                    backgroundSize: localSettings.patternSize || '40px 40px',
                    opacity: localSettings.patternOpacity || 0.1,
                  }}
                />
              )}
              {localSettings.glowEffect && (
                <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent animate-pulse" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-white font-black text-2xl drop-shadow-lg mb-1">Template Preview</h3>
                  <p className="text-white/70 text-sm">Your design preview</p>
                  {localSettings.animation && (
                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs">
                      {localSettings.animation} animation active
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="px-6 py-3.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors font-semibold"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3.5 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin">⏳</span> Saving...
                </>
              ) : (
                <>
                  <span>💾</span> Save & Apply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

