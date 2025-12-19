'use client'

import { PATTERN_PRESETS, PAGE_GRADIENT_PRESETS } from '@/lib/template-builder/presets'

interface Settings {
  backgroundGradient?: string
  backgroundPattern?: string | null
  patternOpacity?: number
  patternSize?: string | null
}

interface Props {
  settings: Settings
  onChange: (settings: Settings) => void
}

export default function PatternPicker({ settings, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-800/50 rounded-xl p-4 mb-6">
        <p className="text-emerald-300 text-sm flex items-center gap-2">
          <span className="text-xl">🇲🇽</span>
          <span>Mexico 98 World Cup inspired patterns - Aztec geometric designs</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-4 text-white">Select Pattern Overlay</label>
        <div className="grid grid-cols-4 gap-4">
          {PATTERN_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() =>
                onChange({
                  ...settings,
                  backgroundPattern: preset.value,
                  patternSize: preset.size || null,
                })
              }
              className={`rounded-2xl transition-all overflow-hidden ${
                settings.backgroundPattern === preset.value
                  ? 'ring-3 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-105'
                  : 'hover:scale-102 hover:ring-2 hover:ring-slate-600'
              }`}
            >
              <div
                className="h-28 relative flex flex-col items-center justify-center"
                style={{
                  background: settings.backgroundGradient || PAGE_GRADIENT_PRESETS[0].value,
                }}
              >
                {preset.value && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: preset.value,
                      backgroundSize: preset.size || '100% 100%',
                      opacity: 0.6,
                    }}
                  />
                )}
                <span className="text-3xl relative z-10 mb-1">{preset.preview}</span>
                <span className="text-white text-xs font-semibold relative z-10 bg-black/40 px-2 py-0.5 rounded-full">
                  {preset.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-5">
        <label className="block text-sm font-semibold mb-4 text-white">Pattern Intensity</label>
        <div className="flex items-center gap-6">
          <span className="text-slate-400 text-sm">Subtle</span>
          <input
            type="range"
            min="5"
            max="80"
            value={Math.round((settings.patternOpacity || 0.1) * 100)}
            onChange={(e) =>
              onChange({ ...settings, patternOpacity: parseInt(e.target.value) / 100 })
            }
            className="flex-1 h-3 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-slate-400 text-sm">Bold</span>
          <span className="text-white font-bold text-lg w-16 text-right">
            {Math.round((settings.patternOpacity || 0.1) * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}

