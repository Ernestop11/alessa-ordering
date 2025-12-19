'use client'

import { PAGE_GRADIENT_PRESETS } from '@/lib/template-builder/presets'

interface Settings {
  backgroundGradient?: string
  primaryColor?: string
  secondaryColor?: string
}

interface Props {
  settings: Settings
  onChange: (settings: Settings) => void
}

export default function GradientPicker({ settings, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-4 text-white">Choose Background Gradient</label>
        <div className="grid grid-cols-4 gap-4">
          {PAGE_GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChange({ ...settings, backgroundGradient: preset.value })}
              className={`p-1 rounded-2xl transition-all ${
                settings.backgroundGradient === preset.value
                  ? 'ring-3 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-105'
                  : 'hover:scale-102 hover:ring-2 hover:ring-slate-600'
              }`}
            >
              <div
                className="h-24 rounded-xl flex items-end justify-center pb-3 relative overflow-hidden"
                style={{ background: preset.value }}
              >
                <span className="text-white text-sm font-semibold drop-shadow-lg bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                  {preset.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-5">
        <label className="block text-sm font-semibold mb-3 text-white">Custom Gradient CSS</label>
        <textarea
          value={settings.backgroundGradient || ''}
          onChange={(e) => onChange({ ...settings, backgroundGradient: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          placeholder="linear-gradient(180deg, #0f3d0f 0%, #1a4d1a 100%)"
        />
      </div>

      <div className="bg-slate-800 rounded-xl p-5">
        <label className="block text-sm font-semibold mb-4 text-white">Brand Colors</label>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-slate-400 mb-2 block font-medium">Primary Color</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={settings.primaryColor || '#dc2626'}
                onChange={(e) => onChange({ ...settings, primaryColor: e.target.value })}
                className="w-14 h-12 rounded-xl cursor-pointer border-2 border-slate-600 bg-transparent"
              />
              <input
                type="text"
                value={settings.primaryColor || '#dc2626'}
                onChange={(e) => onChange({ ...settings, primaryColor: e.target.value })}
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block font-medium">Secondary Color</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={settings.secondaryColor || '#f59e0b'}
                onChange={(e) => onChange({ ...settings, secondaryColor: e.target.value })}
                className="w-14 h-12 rounded-xl cursor-pointer border-2 border-slate-600 bg-transparent"
              />
              <input
                type="text"
                value={settings.secondaryColor || '#f59e0b'}
                onChange={(e) => onChange({ ...settings, secondaryColor: e.target.value })}
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

