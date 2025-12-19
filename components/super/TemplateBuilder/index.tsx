'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BlockList from './BlockList'
import BlockEditor from './BlockEditor'
import AddBlockModal from './AddBlockModal'
import DesignStudio from './DesignStudio'
import LivePreview from './LivePreview'

interface MenuItem {
  id: string
  name: string
  price: number
  image: string | null
  description: string
}

interface TenantBlockMenuItem {
  id: string
  menuItemId: string
  displayOrder: number
  menuItem: MenuItem
}

interface TenantBlock {
  id: string
  type: string
  title: string | null
  subtitle: string | null
  badgeText: string | null
  ctaText: string | null
  ctaLink: string | null
  config: Record<string, unknown>
  position: number
  active: boolean
  menuItems: TenantBlockMenuItem[]
}

interface TenantTemplateSettings {
  id: string
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
}

interface TenantTemplate {
  id: string
  name: string
  type: string
  tenant: {
    id: string
    name: string
    slug: string
  } | null
  blocks: TenantBlock[]
  settings: TenantTemplateSettings | null
}

interface Props {
  template: TenantTemplate
  tenantSlug: string
  menuItems: MenuItem[]
}

export default function TemplateBuilder({ template, tenantSlug, menuItems }: Props) {
  const router = useRouter()
  const previewRef = useRef<HTMLIFrameElement>(null)
  const [blocks, setBlocks] = useState<TenantBlock[]>(template.blocks)
  const [selectedBlock, setSelectedBlock] = useState<TenantBlock | null>(null)
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [showDesignStudio, setShowDesignStudio] = useState(false)
  const [showLivePreview, setShowLivePreview] = useState(true)
  const [previewKey, setPreviewKey] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<TenantTemplateSettings | null>(template.settings)

  // Refresh blocks from server
  const refreshBlocks = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/super/templates/${template.id}/blocks`)
      if (res.ok) {
        const data = await res.json()
        setBlocks(data.data || [])
      }
    } catch (error) {
      console.error('Error refreshing blocks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [template.id])

  // Refresh live preview
  const refreshPreview = useCallback(() => {
    setPreviewKey(prev => prev + 1)
  }, [])

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/super/templates/${template.id}/settings`)
      if (res.ok) {
        const data = await res.json()
        setSettings(data.data || null)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }, [template.id])

  // Save settings
  const handleSaveSettings = async (newSettings: Partial<TenantTemplateSettings>) => {
    try {
      const res = await fetch(`/api/super/templates/${template.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })
      if (res.ok) {
        await fetchSettings()
        refreshPreview()
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      throw error
    }
  }

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Update block
  const handleUpdateBlock = async (blockId: string, data: Partial<TenantBlock>) => {
    try {
      const res = await fetch(`/api/super/templates/${template.id}/blocks/${blockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        await refreshBlocks()
        refreshPreview()
      }
    } catch (error) {
      console.error('Error updating block:', error)
    }
  }

  // Delete block
  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Are you sure you want to delete this block?')) return
    try {
      const res = await fetch(`/api/super/templates/${template.id}/blocks/${blockId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSelectedBlock(null)
        await refreshBlocks()
        refreshPreview()
      }
    } catch (error) {
      console.error('Error deleting block:', error)
    }
  }

  // Create block
  const handleCreateBlock = async (type: string, config: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/super/templates/${template.id}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config }),
      })
      if (res.ok) {
        await refreshBlocks()
        refreshPreview()
        setShowAddBlock(false)
      }
    } catch (error) {
      console.error('Error creating block:', error)
    }
  }

  // Reorder blocks
  const handleReorderBlocks = async (newOrder: TenantBlock[]) => {
    try {
      const res = await fetch(`/api/super/templates/${template.id}/blocks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: newOrder.map((b, index) => ({ id: b.id, position: index })),
        }),
      })
      if (res.ok) {
        await refreshBlocks()
        refreshPreview()
      }
    } catch (error) {
      console.error('Error reordering blocks:', error)
    }
  }

  // Add menu item to block
  const handleAddMenuItem = async (blockId: string, menuItemId: string) => {
    try {
      const res = await fetch(`/api/super/templates/${template.id}/blocks/${blockId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId }),
      })
      if (res.ok) {
        await refreshBlocks()
        refreshPreview()
      }
    } catch (error) {
      console.error('Error adding menu item:', error)
    }
  }

  // Remove menu item from block
  const handleRemoveMenuItem = async (blockId: string, itemId: string) => {
    try {
      const res = await fetch(`/api/super/templates/${template.id}/blocks/${blockId}/items/${itemId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await refreshBlocks()
        refreshPreview()
      }
    } catch (error) {
      console.error('Error removing menu item:', error)
    }
  }

  // Keep selectedBlock in sync with latest data
  useEffect(() => {
    if (selectedBlock && blocks.length > 0) {
      const updatedBlock = blocks.find(b => b.id === selectedBlock.id)
      if (updatedBlock) {
        setSelectedBlock(updatedBlock)
      }
    }
  }, [blocks, selectedBlock])

  const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position)
  const previewUrl = `/${tenantSlug}/order?preview=true`

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <p className="text-slate-400 text-sm mt-1">
              {template.tenant ? `Template for ${template.tenant.name}` : 'Global Template'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/super-admin/template-builder')}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
              <span>←</span> Back to Templates
            </button>
            <button
              onClick={() => setShowDesignStudio(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg flex items-center gap-2 transition-all shadow-lg font-medium"
            >
              <span>🎨</span> Design Studio
            </button>
            <button
              onClick={() => setShowAddBlock(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
              <span>➕</span> Add Block
            </button>
            <button
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium ${
                showLivePreview ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              <span>{showLivePreview ? '📺' : '👁️'}</span> {showLivePreview ? 'Hide Preview' : 'Preview'}
            </button>
            <a
              href={`/${tenantSlug}/order`}
              target="_blank"
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
              <span>🔗</span> Open Storefront
            </a>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Block List Sidebar */}
        <div className="w-72 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-73px)] p-4">
          <BlockList
            blocks={sortedBlocks}
            selectedBlock={selectedBlock}
            onSelectBlock={setSelectedBlock}
            onMoveBlock={(index, direction) => {
              const newIndex = direction === 'up' ? index - 1 : index + 1
              if (newIndex < 0 || newIndex >= sortedBlocks.length) return
              const newOrder = [...sortedBlocks]
              const [moved] = newOrder.splice(index, 1)
              newOrder.splice(newIndex, 0, moved)
              handleReorderBlocks(newOrder)
            }}
            onToggleActive={async (blockId, active) => {
              await handleUpdateBlock(blockId, { active })
            }}
            onDelete={handleDeleteBlock}
            isLoading={isLoading}
          />
        </div>

        {/* Main Editor Area */}
        <div className={`flex-1 p-6 overflow-y-auto max-h-[calc(100vh-73px)] ${showLivePreview ? 'w-1/2' : ''}`}>
          {selectedBlock ? (
            <BlockEditor
              block={selectedBlock}
              menuItems={menuItems}
              onUpdate={(data) => handleUpdateBlock(selectedBlock.id, data)}
              onDelete={() => handleDeleteBlock(selectedBlock.id)}
              onAddMenuItem={(menuItemId) => handleAddMenuItem(selectedBlock.id, menuItemId)}
              onRemoveMenuItem={(itemId) => handleRemoveMenuItem(selectedBlock.id, itemId)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-xl mb-2">Select a block to edit</p>
                <p className="text-sm">Or add a new block to get started</p>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Panel */}
        {showLivePreview && (
          <div className="w-1/2 bg-slate-950 border-l border-slate-800">
            <LivePreview
              tenantSlug={template.tenant?.slug || tenantSlug}
              onRefresh={refreshPreview}
            />
          </div>
        )}
      </div>

      {/* Add Block Modal */}
      {showAddBlock && (
        <AddBlockModal
          onClose={() => setShowAddBlock(false)}
          onCreate={handleCreateBlock}
        />
      )}

      {/* Design Studio Modal */}
      {showDesignStudio && (
        <DesignStudio
          templateId={template.id}
          settings={settings}
          onClose={() => setShowDesignStudio(false)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  )
}

