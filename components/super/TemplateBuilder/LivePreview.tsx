'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  tenantSlug: string
  onRefresh?: () => void
}

export default function LivePreview({ tenantSlug, onRefresh }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [scale, setScale] = useState(100)
  const [previewKey, setPreviewKey] = useState(0)

  // Build preview URL based on tenant slug
  // Routes use /order, not /{tenantSlug}/order
  // Tenant is resolved via middleware from host/subdomain
  const rootDomain = typeof window !== 'undefined' 
    ? (window.location.hostname.includes('alessacloud.com') 
        ? 'alessacloud.com' 
        : window.location.hostname.split('.').slice(-2).join('.'))
    : 'alessacloud.com'
  
  // Map tenant slugs to their actual domains
  // lapoblanita -> lapoblanitamexicanfood.com (custom domain) or lapoblanita.alessacloud.com
  const tenantDomainMap: Record<string, string> = {
    'lapoblanita': 'lapoblanitamexicanfood.com',
    'lasreinas': 'lasreinascolusa.com',
  }
  
  // For tenant-specific templates, use subdomain or custom domain
  // For global templates, use default tenant
  const effectiveSlug = tenantSlug === 'global' || !tenantSlug ? 'lapoblanita' : tenantSlug
  const domain = tenantDomainMap[effectiveSlug] || `${effectiveSlug}.${rootDomain}`
  const previewUrl = `https://${domain}/order?preview=true&t=${Date.now()}`

  // Auto-refresh every 3 seconds when enabled
  useEffect(() => {
    if (!isAutoRefresh) return

    const interval = setInterval(() => {
      setPreviewKey(prev => prev + 1)
      if (onRefresh) onRefresh()
    }, 3000)

    return () => clearInterval(interval)
  }, [isAutoRefresh, onRefresh])

  const handleRefresh = () => {
    setPreviewKey(prev => prev + 1)
    if (onRefresh) onRefresh()
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
            key={previewKey}
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
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

