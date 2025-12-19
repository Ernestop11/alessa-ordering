'use client'

import { useState } from 'react'

interface Props {
  onClose: () => void
  onCreate: (type: string, config: Record<string, unknown>) => void
}

const BLOCK_TYPES = [
  // Core
  { type: 'HERO', name: 'Hero Banner', icon: '🎯', category: 'core', description: 'Large promotional banner' },
  { type: 'MENU_SECTION', name: 'Menu Section', icon: '🍽️', category: 'core', description: 'Display menu items' },
  { type: 'FEATURED_ITEMS', name: 'Featured Items', icon: '⭐', category: 'core', description: 'Highlight featured menu items' },
  { type: 'PROMO_BANNER', name: 'Promo Banner', icon: '🎁', category: 'core', description: 'Promotional banner strip' },
  { type: 'CATEGORY_ROW', name: 'Categories', icon: '📂', category: 'core', description: 'Category navigation' },
  // Restaurant
  { type: 'HOURS_LOCATION', name: 'Hours & Location', icon: '📍', category: 'restaurant', description: 'Business hours and location' },
  { type: 'TESTIMONIALS', name: 'Reviews', icon: '💬', category: 'restaurant', description: 'Customer testimonials' },
  { type: 'REWARDS_BANNER', name: 'Rewards', icon: '🏆', category: 'restaurant', description: 'Loyalty rewards program' },
  { type: 'CATERING_CTA', name: 'Catering', icon: '🎉', category: 'restaurant', description: 'Catering call-to-action' },
  { type: 'DELIVERY_PARTNERS', name: 'Delivery', icon: '🚗', category: 'restaurant', description: 'Delivery partner info' },
  { type: 'SOCIAL_FEED', name: 'Social', icon: '📱', category: 'restaurant', description: 'Social media feed' },
  // Coffee
  { type: 'DAILY_SPECIALS', name: 'Daily Specials', icon: '☕', category: 'coffee', description: 'Daily special offers' },
  { type: 'LOYALTY_CARD', name: 'Loyalty Card', icon: '💳', category: 'coffee', description: 'Loyalty card display' },
]

const BLOCK_CATEGORIES = [
  { id: 'core', name: 'Core Blocks', description: 'Essential building blocks' },
  { id: 'restaurant', name: 'Restaurant', description: 'Restaurant-specific blocks' },
  { id: 'coffee', name: 'Coffee Shop', description: 'Coffee shop blocks' },
]

export default function AddBlockModal({ onClose, onCreate }: Props) {
  const [selectedType, setSelectedType] = useState<string>('HERO')

  const handleCreate = () => {
    const blockType = BLOCK_TYPES.find(t => t.type === selectedType)
    const defaultConfig: Record<string, unknown> = {}

    // Set default configs based on block type
    if (selectedType === 'HERO') {
      defaultConfig.gradient = 'linear-gradient(135deg, #1a472a 0%, #d97706 50%, #dc2626 100%)'
    }

    onCreate(selectedType, defaultConfig)
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl ring-1 ring-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Add New Block</h2>
              <p className="text-slate-400 text-sm mt-1">Choose a block type to add to your template</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl p-2 hover:bg-slate-700 rounded-xl transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {BLOCK_CATEGORIES.map((category) => (
            <div key={category.id} className="mb-6 last:mb-0">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-lg text-white">{category.name}</h3>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
                  {category.description}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {BLOCK_TYPES.filter(t => t.category === category.id).map((type) => (
                  <button
                    key={type.type}
                    onClick={() => setSelectedType(type.type)}
                    className={`p-4 rounded-xl text-left transition-all border-2 ${
                      selectedType === type.type
                        ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-400/50'
                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{type.icon}</span>
                      <span className="font-semibold text-sm">{type.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Selected Block Preview */}
          {selectedType && (
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{BLOCK_TYPES.find(t => t.type === selectedType)?.icon}</span>
                <div>
                  <p className="font-bold text-white">{BLOCK_TYPES.find(t => t.type === selectedType)?.name}</p>
                  <p className="text-sm text-slate-400">
                    {BLOCK_TYPES.find(t => t.type === selectedType)?.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800 px-6 py-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedType}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors font-bold flex items-center justify-center gap-2"
          >
            <span>➕</span> Create Block
          </button>
        </div>
      </div>
    </div>
  )
}

