'use client'

interface TenantBlock {
  id: string
  type: string
  title: string | null
  position: number
  active: boolean
  menuItems: { id: string }[]
}

interface Props {
  blocks: TenantBlock[]
  selectedBlock: TenantBlock | null
  onSelectBlock: (block: TenantBlock) => void
  onMoveBlock: (index: number, direction: 'up' | 'down') => void
  onToggleActive: (blockId: string, active: boolean) => void
  onDelete: (blockId: string) => void
  isLoading: boolean
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

export default function BlockList({
  blocks,
  selectedBlock,
  onSelectBlock,
  onMoveBlock,
  onToggleActive,
  onDelete,
  isLoading,
}: Props) {
  if (isLoading) {
    return <div className="text-slate-400">Loading...</div>
  }

  if (blocks.length === 0) {
    return (
      <div className="text-slate-400 text-center py-8">
        <p>No blocks yet</p>
        <p className="text-xs mt-2">Add your first block</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold mb-4 text-slate-200">Blocks</h2>
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className={`p-3 rounded-lg cursor-pointer transition-all ${
            selectedBlock?.id === block.id
              ? 'bg-blue-600 ring-2 ring-blue-400'
              : 'bg-slate-800 hover:bg-slate-700'
          } ${!block.active ? 'opacity-50' : ''}`}
          onClick={() => onSelectBlock(block)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span>{BLOCK_TYPE_ICONS[block.type] || '📦'}</span>
              <span className="font-medium text-sm truncate">{block.title || block.type}</span>
              {!block.active && (
                <span className="text-xs text-slate-500">(inactive)</span>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveBlock(index, 'up')
                }}
                disabled={index === 0}
                className="p-1 hover:bg-slate-600 rounded disabled:opacity-30 text-xs"
                title="Move up"
              >
                ▲
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveBlock(index, 'down')
                }}
                disabled={index === blocks.length - 1}
                className="p-1 hover:bg-slate-600 rounded disabled:opacity-30 text-xs"
                title="Move down"
              >
                ▼
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-slate-400">
              {block.menuItems.length} {block.menuItems.length === 1 ? 'item' : 'items'}
            </div>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleActive(block.id, !block.active)
                }}
                className={`p-1 rounded text-xs ${
                  block.active
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
                title={block.active ? 'Deactivate' : 'Activate'}
              >
                {block.active ? '✓' : '○'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Delete this block?')) {
                    onDelete(block.id)
                  }
                }}
                className="p-1 bg-red-600 hover:bg-red-500 rounded text-xs"
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

