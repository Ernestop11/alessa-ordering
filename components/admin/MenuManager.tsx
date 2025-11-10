'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Eye, EyeOff, Edit2, Trash2, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  available: boolean
  hasSection: boolean
  sectionName: string
  image: string | null
  willShowOnFrontend: boolean
  status: 'HIDDEN' | 'IN_SECTION' | 'ORPHANED'
}

interface MenuSection {
  id: string
  name: string
  type: string
  itemCount: number
  position: number
}

interface MenuData {
  summary: {
    totalItems: number
    frontendVisible: number
    inSections: number
    orphaned: number
    hidden: number
    totalSections: number
  }
  items: {
    all: MenuItem[]
  }
  sections: MenuSection[]
}

export default function MenuManager() {
  const [data, setData] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'hidden' | 'orphaned'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/menu-diagnostic')
      if (!res.ok) throw new Error('Failed to fetch menu data')
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Error fetching menu data:', error)
      alert('Failed to load menu data. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async (item: MenuItem) => {
    try {
      setActionLoading(item.id)
      const res = await fetch(`/api/menu/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !item.available }),
      })
      if (!res.ok) throw new Error('Failed to update item')
      await fetchData()
    } catch (error) {
      console.error('Error toggling visibility:', error)
      alert('Failed to update item visibility')
    } finally {
      setActionLoading(null)
    }
  }

  const assignSection = async (itemId: string, sectionId: string | null) => {
    try {
      setActionLoading(itemId)
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuSectionId: sectionId }),
      })
      if (!res.ok) throw new Error('Failed to assign section')
      await fetchData()
    } catch (error) {
      console.error('Error assigning section:', error)
      alert('Failed to assign section')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteItem = async (itemId: string) => {
    try {
      setActionLoading(itemId)
      const res = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete item')
      setDeleteConfirm(null)
      await fetchData()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredItems = useMemo(() => {
    if (!data) return []

    let items = data.items.all

    // Apply status filter
    if (filterStatus === 'live') {
      items = items.filter(item => item.willShowOnFrontend && item.hasSection)
    } else if (filterStatus === 'hidden') {
      items = items.filter(item => !item.available)
    } else if (filterStatus === 'orphaned') {
      items = items.filter(item => !item.hasSection)
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.sectionName.toLowerCase().includes(query)
      )
    }

    return items
  }, [data, filterStatus, searchQuery])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading menu data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Manager</h1>
          <p className="text-gray-600">Manage your menu items, visibility, and organization</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title="Total Items"
            value={data.summary.totalItems}
            icon={<div className="w-3 h-3 rounded-full bg-blue-500" />}
            color="blue"
          />
          <SummaryCard
            title="Live on Frontend"
            value={data.summary.frontendVisible}
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            color="green"
          />
          <SummaryCard
            title="Hidden Items"
            value={data.summary.hidden}
            icon={<EyeOff className="w-5 h-5 text-gray-600" />}
            color="gray"
          />
          <SummaryCard
            title="Needs Section"
            value={data.summary.orphaned}
            icon={<AlertCircle className="w-5 h-5 text-yellow-600" />}
            color="yellow"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              <FilterButton
                active={filterStatus === 'all'}
                onClick={() => setFilterStatus('all')}
                label="All Items"
                count={data.summary.totalItems}
              />
              <FilterButton
                active={filterStatus === 'live'}
                onClick={() => setFilterStatus('live')}
                label="Live"
                count={data.summary.frontendVisible}
                color="green"
              />
              <FilterButton
                active={filterStatus === 'hidden'}
                onClick={() => setFilterStatus('hidden')}
                label="Hidden"
                count={data.summary.hidden}
                color="gray"
              />
              <FilterButton
                active={filterStatus === 'orphaned'}
                onClick={() => setFilterStatus('orphaned')}
                label="Orphaned"
                count={data.summary.orphaned}
                color="yellow"
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredItems.length} of {data.summary.totalItems} items
          </p>
        </div>

        {/* Menu Items List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search or filters' : 'No menu items match the selected filter'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                sections={data.sections}
                onToggleVisibility={toggleVisibility}
                onAssignSection={assignSection}
                onEdit={() => setEditingItem(item)}
                onDelete={() => setDeleteConfirm(item.id)}
                loading={actionLoading === item.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal onClose={() => setDeleteConfirm(null)}>
          <div className="p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Menu Item?</h3>
            <p className="text-gray-600 text-center mb-6">
              This action cannot be undone. The item will be permanently removed from your menu.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={actionLoading === deleteConfirm}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteItem(deleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={actionLoading === deleteConfirm}
              >
                {actionLoading === deleteConfirm && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal (placeholder) */}
      {editingItem && (
        <Modal onClose={() => setEditingItem(null)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Menu Item</h3>
            <p className="text-gray-600 mb-4">
              Editing: <span className="font-medium">{editingItem.name}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Full edit functionality can be integrated here. For now, use the quick actions to manage visibility and sections.
            </p>
            <button
              onClick={() => setEditingItem(null)}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Helper Components

function SummaryCard({ title, value, icon, color }: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'gray' | 'yellow'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    gray: 'bg-gray-50 border-gray-200',
    yellow: 'bg-yellow-50 border-yellow-200',
  }

  return (
    <div className={`rounded-lg border ${colorClasses[color]} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  label,
  count,
  color = 'blue'
}: {
  active: boolean
  onClick: () => void
  label: string
  count?: number
  color?: 'blue' | 'green' | 'gray' | 'yellow'
}) {
  const colorClasses = {
    blue: active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600 hover:text-blue-600',
    green: active ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:border-green-600 hover:text-green-600',
    gray: active ? 'bg-gray-600 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-600 hover:text-gray-600',
    yellow: active ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-600 hover:text-yellow-600',
  }

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border font-medium transition-colors whitespace-nowrap ${colorClasses[color]}`}
    >
      {label} {count !== undefined && <span className="ml-1">({count})</span>}
    </button>
  )
}

function MenuItemCard({
  item,
  sections,
  onToggleVisibility,
  onAssignSection,
  onEdit,
  onDelete,
  loading,
}: {
  item: MenuItem
  sections: MenuSection[]
  onToggleVisibility: (item: MenuItem) => void
  onAssignSection: (itemId: string, sectionId: string | null) => void
  onEdit: () => void
  onDelete: () => void
  loading: boolean
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Image */}
        <div className="flex-shrink-0">
          <div className="w-full md:w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                No image
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
              <p className="text-sm text-gray-600">{item.sectionName}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <StatusBadge item={item} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Toggle Visibility */}
            <button
              onClick={() => onToggleVisibility(item)}
              disabled={loading}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                item.available
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'border-green-600 text-green-600 hover:bg-green-50'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : item.available ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span className="sm:hidden md:inline">Hide</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="sm:hidden md:inline">Show</span>
                </>
              )}
            </button>

            {/* Assign Section */}
            <select
              value={item.hasSection ? item.sectionName : ''}
              onChange={(e) => {
                const sectionId = e.target.value ? sections.find(s => s.name === e.target.value)?.id || null : null
                onAssignSection(item.id, sectionId)
              }}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">No Section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.name}>
                  {section.name}
                </option>
              ))}
            </select>

            {/* Edit */}
            <button
              onClick={onEdit}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              <span className="sm:hidden md:inline">Edit</span>
            </button>

            {/* Delete */}
            <button
              onClick={onDelete}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-2 border border-red-300 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span className="sm:hidden md:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ item }: { item: MenuItem }) {
  if (!item.available) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        <EyeOff className="w-3.5 h-3.5" />
        Hidden
      </span>
    )
  }

  if (!item.hasSection) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <AlertCircle className="w-3.5 h-3.5" />
        Needs Section
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle className="w-3.5 h-3.5" />
      Live
    </span>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="ml-auto p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
