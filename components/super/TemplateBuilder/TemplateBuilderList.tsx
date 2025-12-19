'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  type: string
  isGlobal: boolean
  tenant: {
    id: string
    name: string
    slug: string
  } | null
  _count: {
    blocks: number
  }
  createdAt: Date
}

interface Tenant {
  id: string
  name: string
  slug: string
}

interface Props {
  initialTemplates: Template[]
  tenants: Tenant[]
}

const TEMPLATE_TYPES = [
  { value: 'RESTAURANT', label: 'Restaurant', icon: '🍽️' },
  { value: 'BAKERY', label: 'Bakery', icon: '🥖' },
  { value: 'COFFEE_SHOP', label: 'Coffee Shop', icon: '☕' },
  { value: 'GROCERY', label: 'Grocery', icon: '🛒' },
  { value: 'GYM', label: 'Gym', icon: '💪' },
  { value: 'CAR_SHOP', label: 'Car Shop', icon: '🚗' },
  { value: 'CUSTOM', label: 'Custom', icon: '🎨' },
]

export default function TemplateBuilderList({ initialTemplates, tenants }: Props) {
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateType, setNewTemplateType] = useState('RESTAURANT')
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [isGlobal, setIsGlobal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return

    setIsCreating(true)
    try {
      const res = await fetch('/api/super/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName,
          type: newTemplateType,
          tenantId: isGlobal ? null : (selectedTenantId || null),
          isGlobal,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create template')
      }

      const data = await res.json()
      router.push(`/super-admin/template-builder/${data.data.tenantId || 'global'}`)
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Failed to create template')
    } finally {
      setIsCreating(false)
      setShowCreateModal(false)
      setNewTemplateName('')
      setSelectedTenantId('')
      setIsGlobal(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Template Builder</h1>
            <p className="text-slate-400">Create and manage templates for tenant storefronts</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            <span>➕</span> Create Template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 rounded-xl border border-slate-800">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-xl text-slate-400 mb-2">No templates yet</p>
            <p className="text-slate-500 mb-6">Create your first template to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium"
            >
              Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Link
                key={template.id}
                href={`/super-admin/template-builder/${template.tenant?.id || 'global'}`}
                className="bg-slate-900 rounded-xl p-6 border border-slate-800 hover:border-blue-500 transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {TEMPLATE_TYPES.find(t => t.value === template.type)?.icon || '📋'}
                    </span>
                    <div>
                      <h3 className="font-bold text-lg">{template.name}</h3>
                      <p className="text-sm text-slate-400">
                        {TEMPLATE_TYPES.find(t => t.value === template.type)?.label || template.type}
                      </p>
                    </div>
                  </div>
                  {template.isGlobal && (
                    <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-xs rounded-full border border-emerald-800">
                      Global
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>🏢</span>
                    <span>{template.tenant ? template.tenant.name : 'Global Template'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📦</span>
                    <span>{template._count.blocks} blocks</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl ring-1 ring-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold">Create New Template</h2>
              <p className="text-slate-400 text-sm mt-1">Set up a new template for a tenant</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Restaurant Template"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Template Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {TEMPLATE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setNewTemplateType(type.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        newTemplateType === type.value
                          ? 'border-blue-500 bg-blue-600/20'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-xs">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={isGlobal}
                    onChange={(e) => setIsGlobal(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-white block">Global Template</span>
                    <p className="text-xs text-slate-400">Available for all tenants</p>
                  </div>
                </label>
              </div>

              {!isGlobal && (
                <div>
                  <label className="block text-sm font-medium mb-2">Assign to Tenant</label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a tenant...</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!newTemplateName.trim() || isCreating || (!isGlobal && !selectedTenantId)}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
              >
                {isCreating ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

