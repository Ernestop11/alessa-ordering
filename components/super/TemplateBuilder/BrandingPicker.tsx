'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface TenantTemplateSettings {
  logoUrl?: string | null
  logoSize?: 'small' | 'medium' | 'large'
  faviconUrl?: string | null
  businessName?: string | null
  tagline?: string | null
  primaryColor?: string
  secondaryColor?: string
}

interface Props {
  settings: Partial<TenantTemplateSettings>
  onChange: (settings: Partial<TenantTemplateSettings>) => void
  templateId: string
}

const LOGO_SIZES = [
  { id: 'small', label: 'Small', size: '80px' },
  { id: 'medium', label: 'Medium', size: '120px' },
  { id: 'large', label: 'Large', size: '160px' },
] as const

export default function BrandingPicker({ settings, onChange, templateId }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadType, setUploadType] = useState<'logo' | 'favicon' | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    if (type === 'favicon') {
      validTypes.push('image/x-icon', 'image/vnd.microsoft.icon')
    }

    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, WebP, or SVG)')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }

    setIsUploading(true)
    setUploadType(type)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('templateId', templateId)

      const response = await fetch('/api/super/templates/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()

      if (type === 'logo') {
        onChange({ ...settings, logoUrl: data.url })
      } else {
        onChange({ ...settings, faviconUrl: data.url })
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadType(null)
    }
  }

  const handleRemoveImage = (type: 'logo' | 'favicon') => {
    if (type === 'logo') {
      onChange({ ...settings, logoUrl: null })
    } else {
      onChange({ ...settings, faviconUrl: null })
    }
  }

  const getLogoSizeValue = () => {
    const size = LOGO_SIZES.find(s => s.id === settings.logoSize)
    return size?.size || '120px'
  }

  return (
    <div className="space-y-8">
      {/* Logo Upload Section */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🖼️</span> Logo
        </h3>

        <div className="flex gap-6">
          {/* Logo Preview */}
          <div
            className="flex-shrink-0 bg-slate-900 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden"
            style={{ width: '180px', height: '180px' }}
          >
            {settings.logoUrl ? (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <Image
                  src={settings.logoUrl}
                  alt="Logo preview"
                  width={160}
                  height={160}
                  className="object-contain"
                  style={{ maxWidth: getLogoSizeValue(), maxHeight: getLogoSizeValue() }}
                />
              </div>
            ) : (
              <div className="text-center text-slate-500 p-4">
                <span className="text-4xl block mb-2">🏷️</span>
                <span className="text-sm">No logo uploaded</span>
              </div>
            )}
          </div>

          {/* Logo Controls */}
          <div className="flex-1 space-y-4">
            <div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                className="hidden"
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading && uploadType === 'logo' ? (
                  <>
                    <span className="animate-spin">⏳</span> Uploading...
                  </>
                ) : (
                  <>
                    <span>📤</span> Upload Logo
                  </>
                )}
              </button>
              <p className="text-xs text-slate-500 mt-2">PNG, JPG, WebP, or SVG. Max 2MB.</p>
            </div>

            {settings.logoUrl && (
              <button
                onClick={() => handleRemoveImage('logo')}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
              >
                Remove Logo
              </button>
            )}

            {/* Logo Size */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Logo Size</label>
              <div className="flex gap-2">
                {LOGO_SIZES.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => onChange({ ...settings, logoSize: size.id })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      settings.logoSize === size.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Favicon Upload Section */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🔖</span> Favicon
        </h3>

        <div className="flex gap-6">
          {/* Favicon Preview */}
          <div
            className="flex-shrink-0 bg-slate-900 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center"
            style={{ width: '100px', height: '100px' }}
          >
            {settings.faviconUrl ? (
              <Image
                src={settings.faviconUrl}
                alt="Favicon preview"
                width={48}
                height={48}
                className="object-contain"
              />
            ) : (
              <div className="text-center text-slate-500">
                <span className="text-2xl block">🔖</span>
                <span className="text-xs">No icon</span>
              </div>
            )}
          </div>

          {/* Favicon Controls */}
          <div className="flex-1 space-y-4">
            <div>
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'favicon')}
                className="hidden"
              />
              <button
                onClick={() => faviconInputRef.current?.click()}
                disabled={isUploading}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading && uploadType === 'favicon' ? (
                  <>
                    <span className="animate-spin">⏳</span> Uploading...
                  </>
                ) : (
                  <>
                    <span>📤</span> Upload Favicon
                  </>
                )}
              </button>
              <p className="text-xs text-slate-500 mt-2">PNG, ICO, or SVG. 32x32 or 64x64 recommended.</p>
            </div>

            {settings.faviconUrl && (
              <button
                onClick={() => handleRemoveImage('favicon')}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors"
              >
                Remove Favicon
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Business Info Section */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📝</span> Business Info
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Business Name</label>
            <input
              type="text"
              value={settings.businessName || ''}
              onChange={(e) => onChange({ ...settings, businessName: e.target.value || null })}
              placeholder="e.g., La Poblanita"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Tagline</label>
            <input
              type="text"
              value={settings.tagline || ''}
              onChange={(e) => onChange({ ...settings, tagline: e.target.value || null })}
              placeholder="e.g., Authentic Mexican Cuisine"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Brand Colors Section */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🎨</span> Brand Colors
        </h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.primaryColor || '#dc2626'}
                onChange={(e) => onChange({ ...settings, primaryColor: e.target.value })}
                className="w-12 h-12 rounded-lg border-2 border-slate-600 cursor-pointer"
              />
              <input
                type="text"
                value={settings.primaryColor || '#dc2626'}
                onChange={(e) => onChange({ ...settings, primaryColor: e.target.value })}
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.secondaryColor || '#f59e0b'}
                onChange={(e) => onChange({ ...settings, secondaryColor: e.target.value })}
                className="w-12 h-12 rounded-lg border-2 border-slate-600 cursor-pointer"
              />
              <input
                type="text"
                value={settings.secondaryColor || '#f59e0b'}
                onChange={(e) => onChange({ ...settings, secondaryColor: e.target.value })}
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Color Preview */}
        <div className="mt-4 p-4 rounded-lg bg-slate-900">
          <p className="text-xs text-slate-500 mb-2">Preview</p>
          <div className="flex gap-4">
            <button
              style={{ backgroundColor: settings.primaryColor || '#dc2626' }}
              className="px-6 py-2 rounded-lg text-white font-semibold"
            >
              Primary Button
            </button>
            <button
              style={{ backgroundColor: settings.secondaryColor || '#f59e0b' }}
              className="px-6 py-2 rounded-lg text-white font-semibold"
            >
              Secondary Button
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
