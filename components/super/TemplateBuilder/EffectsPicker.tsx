'use client'

import { ANIMATION_PRESETS } from '@/lib/template-builder/presets'

interface Settings {
  animation?: string | null
  glowEffect?: boolean
  particleEffect?: string | null
}

interface Props {
  settings: Settings
  onChange: (settings: Settings) => void
}

export default function EffectsPicker({ settings, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-4 text-white">Animation Effects</label>
        <div className="grid grid-cols-2 gap-4">
          {ANIMATION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChange({ ...settings, animation: preset.value })}
              className={`p-5 rounded-2xl text-left transition-all ${
                settings.animation === preset.value
                  ? 'bg-emerald-900/50 ring-2 ring-emerald-400'
                  : 'bg-slate-800 hover:bg-slate-750'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{preset.icon}</span>
                <div>
                  <p className="font-bold text-white text-lg">{preset.name}</p>
                  <p className="text-sm text-slate-400">{preset.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-5">
        <label className="flex items-center gap-4 cursor-pointer group">
          <div
            className={`w-14 h-8 rounded-full transition-all relative ${
              settings.glowEffect ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                settings.glowEffect ? 'left-7' : 'left-1'
              }`}
            />
          </div>
          <input
            type="checkbox"
            checked={settings.glowEffect || false}
            onChange={(e) => onChange({ ...settings, glowEffect: e.target.checked })}
            className="sr-only"
          />
          <div>
            <span className="font-bold text-white text-lg block">Ambient Glow</span>
            <p className="text-sm text-slate-400">Adds a soft glow effect to hero sections</p>
          </div>
        </label>
      </div>

      <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
        <p className="text-amber-300 text-sm flex items-center gap-2">
          <span className="text-xl">💡</span>
          <span>Effects are applied in real-time when you save. Check the live preview!</span>
        </p>
      </div>
    </div>
  )
}

