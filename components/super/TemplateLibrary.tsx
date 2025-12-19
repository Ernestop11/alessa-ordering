'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  type: string
  isGlobal: boolean
  tenantId: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    blocks: number
  }
  tenant?: {
    id: string
    name: string
    slug: string
  } | null
}

interface TemplateUsage {
  templateId: string
  count: number
  tenants: Array<{
    id: string
    name: string
    slug: string
  }>
}

interface Props {
  onSelectTemplate?: (templateId: string) => void
  onImportTemplate?: (templateId: string, tenantId?: string) => void
}

export default function TemplateLibrary({ onSelectTemplate, onImportTemplate }: Props) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [usageStats, setUsageStats] = useState<TemplateUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
    loadUsageStats()
  }, [])

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/super/templates', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.data || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsageStats = async () => {
    try {
      const res = await fetch('/api/super/templates/usage', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setUsageStats(data.data || [])
      }
    } catch (error) {
      console.error('Error loading usage stats:', error)
    }
  }

  const handleExport = async (templateId: string) => {
    setExporting(templateId)
    try {
      const res = await fetch(`/api/super/templates/export/${templateId}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `template-${templateId}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting template:', error)
      alert('Failed to export template')
    } finally {
      setExporting(null)
    }
  }

  const handleImport = async (templateId: string, tenantId?: string) => {
    if (onImportTemplate) {
      onImportTemplate(templateId, tenantId)
    } else {
      // Default import behavior
      if (!tenantId) {
        alert('Please select a tenant first')
        return
      }
      try {
        // First export the template
        const exportRes = await fetch(`/api/super/templates/export/${templateId}`)
        if (!exportRes.ok) throw new Error('Failed to export template')
        
        const templateData = await exportRes.json()
        
        // Then import it for the tenant
        const importRes = await fetch('/api/super/templates/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateData: templateData.data,
            tenantId,
          }),
        })
        
        if (importRes.ok) {
          alert('Template imported successfully!')
          loadTemplates()
        } else {
          throw new Error('Failed to import template')
        }
      } catch (error) {
        console.error('Error importing template:', error)
        alert('Failed to import template')
      }
    }
  }

  const globalTemplates = templates.filter(t => t.isGlobal && !t.tenantId)
  const tenantTemplates = templates.filter(t => !t.isGlobal && t.tenantId)

  const getUsageCount = (templateId: string) => {
    const usage = usageStats.find(u => u.templateId === templateId)
    return usage?.count || 0
  }

  const getTemplateIcon = (type: string) => {
    const icons: Record<string, string> = {
      RESTAURANT: '🍽️',
      BAKERY: '🥐',
      COFFEE_SHOP: '☕',
      GYM: '💪',
      CAR_SHOP: '🚗',
      GROCERY: '🛒',
      CUSTOM: '🎨',
    }
    return icons[type] || '📄'
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">Loading templates...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Template Library</h2>
        <p className="mt-2 text-gray-600">
          Manage reusable templates for batch onboarding. Global templates can be applied to any tenant.
        </p>
      </div>

      {/* Global Templates */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Templates</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {globalTemplates.map((template) => {
            const usageCount = getUsageCount(template.id)
            return (
              <div
                key={template.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getTemplateIcon(template.type)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-500">{template.type}</p>
                    </div>
                  </div>
                  {usageCount > 0 && (
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {usageCount} {usageCount === 1 ? 'tenant' : 'tenants'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <span>{template._count?.blocks || 0} blocks</span>
                  <span>•</span>
                  <span>Global</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/super-admin/template-builder/${template.tenantId || 'global'}?templateId=${template.id}`}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition text-center"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleExport(template.id)}
                    disabled={exporting === template.id}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                  >
                    {exporting === template.id ? '...' : 'Export'}
                  </button>
                  {onSelectTemplate && (
                    <button
                      onClick={() => {
                        setSelectedTemplate(template.id)
                        onSelectTemplate(template.id)
                      }}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
                    >
                      Use
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tenant Templates */}
      {tenantTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenant Templates</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tenantTemplates.map((template) => (
              <div
                key={template.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getTemplateIcon(template.type)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-500">
                        {template.tenant?.name || 'Unknown Tenant'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <span>{template._count?.blocks || 0} blocks</span>
                  <span>•</span>
                  <span>{template.tenant?.slug || 'N/A'}</span>
                </div>

                <div className="flex gap-2">
                  {template.tenantId && (
                    <Link
                      href={`/super-admin/template-builder/${template.tenantId}?templateId=${template.id}`}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition text-center"
                    >
                      Edit
                    </Link>
                  )}
                  <button
                    onClick={() => handleExport(template.id)}
                    disabled={exporting === template.id}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                  >
                    {exporting === template.id ? '...' : 'Export'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No templates found. Create your first template in the Template Builder.</p>
          <Link
            href="/super-admin/template-builder"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Go to Template Builder
          </Link>
        </div>
      )}
    </div>
  )
}

