'use client'

import { useState, useEffect } from 'react'

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
  menuItems: TenantBlockMenuItem[]
}

interface Props {
  block: TenantBlock
  menuItems: MenuItem[]
  onUpdate: (data: Partial<TenantBlock>) => void
  onDelete: () => void
  onAddMenuItem: (menuItemId: string) => void
  onRemoveMenuItem: (itemId: string) => void
}

const BLOCK_TYPE_ICONS: Record<string, string> = {
  HERO: '🎯',
  MENU_SECTION: '🍽️',
  FEATURED_ITEMS: '⭐',
  PROMO_BANNER: '🎁',
  CATEGORY_ROW: '📂',
  HOURS_LOCATION: '📍',
  TESTIMONIALS: '💬',
  REWARDS_BANNER: '🏆',
  CATERING_CTA: '🎉',
  DELIVERY_PARTNERS: '🚗',
  SOCIAL_FEED: '📱',
  DAILY_SPECIALS: '☕',
  LOYALTY_CARD: '💳',
}

const HERO_GRADIENT_PRESETS = [
  { id: 'mexican', name: 'Mexican Tricolor', value: 'linear-gradient(135deg, #006341 0%, #006341 33%, #ffffff 33%, #ffffff 66%, #ce1126 66%, #ce1126 100%)' },
  { id: 'sunset', name: 'Desert Sunset', value: 'linear-gradient(135deg, #1a472a 0%, #d97706 50%, #dc2626 100%)' },
  { id: 'ocean', name: 'Ocean', value: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #075985 100%)' },
  { id: 'fire', name: 'Fire', value: 'linear-gradient(135deg, #b91c1c 0%, #f97316 50%, #fbbf24 100%)' },
  { id: 'midnight', name: 'Midnight', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #475569 100%)' },
]

export default function BlockEditor({
  block,
  menuItems,
  onUpdate,
  onDelete,
  onAddMenuItem,
  onRemoveMenuItem,
}: Props) {
  const [title, setTitle] = useState(block.title || '')
  const [subtitle, setSubtitle] = useState(block.subtitle || '')
  const [badgeText, setBadgeText] = useState(block.badgeText || '')
  const [ctaText, setCtaText] = useState(block.ctaText || '')
  const [ctaLink, setCtaLink] = useState(block.ctaLink || '')
  const [showMenuItemPicker, setShowMenuItemPicker] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [blockConfig, setBlockConfig] = useState<Record<string, unknown>>(block.config || {})

  useEffect(() => {
    setTitle(block.title || '')
    setSubtitle(block.subtitle || '')
    setBadgeText(block.badgeText || '')
    setCtaText(block.ctaText || '')
    setCtaLink(block.ctaLink || '')
    setBlockConfig(block.config || {})
  }, [block])

  const blockMenuItemIds = new Set(block.menuItems.map(m => m.menuItemId))
  const availableMenuItems = menuItems.filter(m => !blockMenuItemIds.has(m.id))
  const filteredMenuItems = searchTerm
    ? availableMenuItems.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableMenuItems

  const updateConfig = (key: string, value: unknown) => {
    const newConfig = { ...blockConfig, [key]: value }
    setBlockConfig(newConfig)
    onUpdate({ config: newConfig })
  }

  return (
    <div className="space-y-6">
      {/* Block Header */}
      <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4 ring-1 ring-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{BLOCK_TYPE_ICONS[block.type] || '📦'}</span>
          <div>
            <h2 className="text-xl font-bold">{block.title || block.type}</h2>
            <p className="text-slate-400 text-sm">Block Editor</p>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm transition-colors font-medium"
        >
          Delete Block
        </button>
      </div>

      {/* Block Settings */}
      <div className="bg-slate-800 rounded-xl p-5 ring-1 ring-slate-700">
        <h3 className="font-semibold mb-4 text-lg">Block Settings</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => onUpdate({ title })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              onBlur={() => onUpdate({ subtitle })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Badge Text</label>
            <input
              type="text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              onBlur={() => onUpdate({ badgeText })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., WEEKEND SPECIAL"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">CTA Text</label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              onBlur={() => onUpdate({ ctaText })}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Order Now"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm text-slate-400 mb-1.5">CTA Link</label>
          <input
            type="text"
            value={ctaLink}
            onChange={(e) => setCtaLink(e.target.value)}
            onBlur={() => onUpdate({ ctaLink })}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., /order"
          />
        </div>
      </div>

      {/* Hero-specific gradient settings */}
      {block.type === 'HERO' && (
        <div className="bg-slate-800 rounded-xl p-5 ring-1 ring-slate-700">
          <h3 className="font-semibold mb-4 text-lg">Hero Gradient</h3>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {HERO_GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => updateConfig('gradient', preset.value)}
                className={`p-1 rounded-xl transition-all ${
                  blockConfig.gradient === preset.value ? 'ring-2 ring-blue-400 scale-105' : 'hover:scale-102'
                }`}
              >
                <div
                  className="h-16 rounded-lg flex items-center justify-center"
                  style={{ background: preset.value }}
                >
                  <span className="text-white text-xs font-semibold drop-shadow-lg bg-black/30 px-2 py-0.5 rounded-full">
                    {preset.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Custom Gradient</label>
            <input
              type="text"
              value={(blockConfig.gradient as string) || ''}
              onChange={(e) => updateConfig('gradient', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono"
              placeholder="linear-gradient(135deg, #1a472a 0%, #d97706 100%)"
            />
          </div>
        </div>
      )}

      {/* Config JSON Editor */}
      <div className="bg-slate-800 rounded-xl p-5 ring-1 ring-slate-700">
        <h3 className="font-semibold mb-4 text-lg">Advanced Config</h3>
        <textarea
          value={JSON.stringify(blockConfig, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              setBlockConfig(parsed)
              onUpdate({ config: parsed })
            } catch {
              // Invalid JSON, ignore
            }
          }}
          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono h-48 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Menu Items in Block */}
      <div className="bg-slate-800 rounded-xl p-5 ring-1 ring-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Menu Items ({block.menuItems.length})</h3>
          <button
            onClick={() => setShowMenuItemPicker(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors font-medium"
          >
            + Add Menu Items
          </button>
        </div>

        {block.menuItems.length === 0 ? (
          <div className="text-slate-400 text-center py-8 border-2 border-dashed border-slate-700 rounded-xl">
            <p>No menu items in this block</p>
            <button
              onClick={() => setShowMenuItemPicker(true)}
              className="mt-2 text-blue-400 hover:text-blue-300"
            >
              Click to add menu items
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {block.menuItems
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-700 rounded-xl p-3 relative group hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  <button
                    onClick={() => onRemoveMenuItem(item.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center font-bold"
                  >
                    ×
                  </button>
                  <div className="aspect-square bg-slate-600 rounded-lg mb-2 overflow-hidden">
                    {item.menuItem.image ? (
                      <img
                        src={item.menuItem.image}
                        alt={item.menuItem.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate">{item.menuItem.name}</p>
                  <p className="text-xs text-emerald-400">${Number(item.menuItem.price).toFixed(2)}</p>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Menu Item Picker Modal */}
      {showMenuItemPicker && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]"
          onClick={() => setShowMenuItemPicker(false)}
        >
          <div
            className="bg-slate-900 rounded-2xl p-6 w-[900px] max-h-[85vh] flex flex-col shadow-2xl ring-1 ring-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Menu Items to Block</h2>
              <button
                onClick={() => setShowMenuItemPicker(false)}
                className="text-slate-400 hover:text-white text-2xl p-1 hover:bg-slate-800 rounded-lg"
              >
                ×
              </button>
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search menu items by name..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />

            <div className="flex-1 overflow-y-auto">
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No menu items found</div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {filteredMenuItems.slice(0, 60).map((menuItem) => (
                    <button
                      key={menuItem.id}
                      onClick={() => {
                        onAddMenuItem(menuItem.id)
                        setShowMenuItemPicker(false)
                      }}
                      className="bg-slate-800 hover:bg-slate-700 rounded-xl p-3 text-left transition-all hover:ring-2 hover:ring-blue-500"
                    >
                      <div className="aspect-square bg-slate-700 rounded-lg mb-2 overflow-hidden">
                        {menuItem.image ? (
                          <img
                            src={menuItem.image}
                            alt={menuItem.name}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                            No image
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{menuItem.name}</p>
                      <p className="text-sm text-emerald-400 font-medium">
                        ${Number(menuItem.price).toFixed(2)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
              <span className="text-sm text-slate-400">
                {filteredMenuItems.length} menu items available
              </span>
              <button
                onClick={() => setShowMenuItemPicker(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

