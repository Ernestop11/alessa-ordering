'use client'

import { useState } from 'react'
import { CARD_STYLE_PRESETS, CARD_IMAGE_EFFECTS } from '@/lib/template-builder/presets'

interface Settings {
  cardStyle?: string
  cardImageEffect?: string
  cardBackground?: string | null
}

interface Props {
  settings: Settings
  onChange: (settings: Settings) => void
}

export default function CardStylePicker({ settings, onChange }: Props) {
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/assets/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      onChange({ ...settings, cardBackground: data.url })
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Card Style Presets */}
      <div>
        <label className="block text-sm font-semibold mb-4 text-white">Card Style Preset</label>
        <div className="grid grid-cols-4 gap-3">
          {CARD_STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChange({ ...settings, cardStyle: preset.id })}
              className={`p-4 rounded-xl text-center transition-all border-2 ${
                settings.cardStyle === preset.id
                  ? 'border-blue-500 bg-blue-600/20 ring-2 ring-blue-400/50'
                  : 'border-slate-700 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-600'
              }`}
            >
              <span className="text-2xl block mb-2">{preset.icon}</span>
              <span className="text-xs font-medium">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Card Image Effects */}
      <div>
        <label className="block text-sm font-semibold mb-4 text-white">Card Image Effect</label>
        <div className="grid grid-cols-4 gap-3">
          {CARD_IMAGE_EFFECTS.map((effect) => (
            <button
              key={effect.id}
              onClick={() => onChange({ ...settings, cardImageEffect: effect.value })}
              className={`p-4 rounded-xl text-center transition-all border-2 ${
                settings.cardImageEffect === effect.value
                  ? 'border-blue-500 bg-blue-600/20 ring-2 ring-blue-400/50'
                  : 'border-slate-700 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-600'
              }`}
            >
              <span className="text-2xl block mb-2">{effect.icon}</span>
              <span className="text-xs font-medium">{effect.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Card Background Upload */}
      <div className="bg-slate-800 rounded-xl p-5">
        <label className="block text-sm font-semibold mb-3 text-white">Card Background Image</label>
        <p className="text-xs text-slate-400 mb-4">
          Upload a custom background image for product cards (e.g., festive patterns, textures)
        </p>

        {settings.cardBackground ? (
          <div className="relative mb-4">
            <img
              src={settings.cardBackground}
              alt="Card Background"
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={() => onChange({ ...settings, cardBackground: null })}
              className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white font-bold"
            >
              ×
            </button>
          </div>
        ) : null}

        <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition-colors">
          <span>📤</span>
          <span className="text-sm">{uploading ? 'Uploading...' : settings.cardBackground ? 'Change Background' : 'Upload Background'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <span>💡</span>
          Card styles are applied to all product cards in your template. Check the live preview to see changes.
        </p>
      </div>
    </div>
  )
}

