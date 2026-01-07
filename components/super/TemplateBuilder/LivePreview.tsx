'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  tenantSlug: string
  onRefresh?: () => void
}

export default function LivePreview({ tenantSlug, onRefresh }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [scale, setScale] = useState(100)
  const [isLoading, setIsLoading] = useState(true)

  // Build preview URL based on tenant slug
  // Routes use /order, not /{tenantSlug}/order
  // Tenant is resolved via middleware from host/subdomain
  const rootDomain = typeof window !== 'undefined'
    ? (window.location.hostname.includes('alessacloud.com')
        ? 'alessacloud.com'
        : window.location.hostname.split('.').slice(-2).join('.'))
    : 'alessacloud.com'

  // Map tenant slugs to their actual domains
  // IMPORTANT: Add all tenants with custom domains here
  const tenantDomainMap: Record<string, string> = {
    'lapoblanita': 'lapoblanitamexicanfood.com',
    'lasreinas': 'lasreinascolusa.com',
    'taqueriarosita': 'taqueriarosita.alessacloud.com',
    'villacorona': 'villacorona.alessacloud.com',
    'elhornito': 'elhornito.alessacloud.com',
  }

  // For tenant-specific templates, use subdomain or custom domain
  // For global templates, use 'alessacloud' placeholder (not a specific tenant's branding)
  // SECURITY: Don't default to lapoblanita as that pollutes the preview with another tenant's data
  const effectiveSlug = tenantSlug === 'global' || !tenantSlug ? 'lasreinas' : tenantSlug // TODO: Create a generic preview tenant
  const domain = tenantDomainMap[effectiveSlug] || `${effectiveSlug}.${rootDomain}`
  const basePreviewUrl = `https://${domain}/order?preview=true`

  // Soft refresh - reload iframe content without remounting
  const softRefresh = useCallback(() => {
    if (iframeRef.current) {
      try {
        // Try to reload the iframe content without full remount
        const iframe = iframeRef.current
        // Update src with new timestamp to bust cache
        iframe.src = `${basePreviewUrl}&t=${Date.now()}`
      } catch {
        // Cross-origin fallback - update src attribute
        iframeRef.current.src = `${basePreviewUrl}&t=${Date.now()}`
      }
    }
    if (onRefresh) onRefresh()
  }, [basePreviewUrl, onRefresh])

  // Auto-refresh every 5 seconds when enabled (increased from 3s to reduce flicker)
  useEffect(() => {
    if (!isAutoRefresh) return

    const interval = setInterval(() => {
      softRefresh()
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoRefresh, softRefresh])

  const handleRefresh = () => {
    setIsLoading(true)
    softRefresh()
  }

  const handleScaleChange = (newScale: number) => {
    setScale(newScale)
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-sm text-slate-300">Live Preview</h3>
          <div className="h-4 w-px bg-slate-700" />
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-medium text-slate-300 transition-colors flex items-center gap-2"
          >
            <span>🔄</span> Refresh
          </button>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAutoRefresh}
              onChange={(e) => setIsAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
            />
            <span className="text-xs text-slate-400">Auto-refresh</span>
          </label>
        </div>

        {/* Scale Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScaleChange(Math.max(25, scale - 25))}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300"
            disabled={scale <= 25}
          >
            −
          </button>
          <span className="text-xs text-slate-400 w-12 text-center">{scale}%</span>
          <button
            onClick={() => handleScaleChange(Math.min(200, scale + 25))}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300"
            disabled={scale >= 200}
          >
            +
          </button>
          <button
            onClick={() => handleScaleChange(100)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 relative overflow-auto bg-slate-900">
        <div
          className="relative"
          style={{
            transform: `scale(${scale / 100})`,
            transformOrigin: 'top left',
            width: `${(100 / scale) * 100}%`,
            height: `${(100 / scale) * 100}%`,
          }}
        >
          <iframe
            ref={iframeRef}
            src={`${basePreviewUrl}&t=${Date.now()}`}
            onLoad={() => setIsLoading(false)}
            className={`w-full h-full border-0 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
            style={{
              minHeight: '100vh',
            }}
            title="Template Preview"
          />
        </div>
      </div>
    </div>
  )
}

