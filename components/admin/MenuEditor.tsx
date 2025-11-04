'use client';

import { useEffect, useState } from 'react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  menuSectionId?: string | null;
  section?: {
    id: string;
    name: string;
    type: string;
  } | null;
  tags?: string[];
}

interface MenuSection {
  id: string;
  name: string;
  type: string;
}

export default function MenuEditor() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenuItems(data || []);
    } catch (e) {
      console.error('Failed to fetch menu', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    setSectionsLoading(true);
    try {
      const res = await fetch('/api/admin/menu-sections', { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSections(data || []);
    } catch (err) {
      console.error('Failed to fetch menu sections', err);
    } finally {
      setSectionsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchSections();
  }, []);

  const handleAddNewItem = () => {
    const newItem: MenuItem = {
      id: '',
      name: '',
      description: '',
      price: 0,
      category: '',
      available: true,
      menuSectionId: null,
      section: null,
      tags: [],
    };
    setEditingItem(newItem);
  };

  const handleEditItem = (item: MenuItem) =>
    setEditingItem({
      ...item,
      menuSectionId: item.menuSectionId ?? item.section?.id ?? null,
      tags: item.tags ?? [],
    });

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      setMenuItems(items => items.filter(i => i.id !== id));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSaving(true);
    try {
      const payload = {
        name: editingItem.name,
        description: editingItem.description,
        price: editingItem.price,
        category: editingItem.category,
        available: editingItem.available,
        tags: editingItem.tags || [],
        menuSectionId: editingItem.menuSectionId || null,
      };

      if (!editingItem.id) {
        // create
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        if (res.ok) {
          await fetchItems();
        } else {
          console.error('Failed to create item', created);
        }
        fetchSections();
      } else {
        // update
        const res = await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await fetchItems();
        } else {
          console.error('Failed to update item', await res.text());
        }
      }
      setEditingItem(null);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Menu Items</h2>
        <button onClick={handleAddNewItem} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Add New Item</button>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name
                  <input type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description
                  <textarea value={editingItem.description} onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price
                  <input type="number" step="0.01" value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value || '0') })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category
                  <input type="text" value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <select
                  value={editingItem.menuSectionId || ''}
                  onChange={e => setEditingItem({ ...editingItem, menuSectionId: e.target.value || null })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={sectionsLoading}
                >
                  <option value="">Unassigned</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center text-sm font-medium text-gray-700"><input type="checkbox" checked={editingItem.available} onChange={e => setEditingItem({ ...editingItem, available: e.target.checked })} className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />Available</label>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setEditingItem(null)} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {menuItems.map(item => (
              <li key={item.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">${item.price.toFixed(2)}</p>
                    {item.section?.name && (
                      <p className="text-xs text-gray-400 mt-1">Section: {item.section.name}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.available ? 'Available' : 'Unavailable'}</span>
                    <button onClick={() => handleEditItem(item)} className="text-blue-600 hover:text-blue-900">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
