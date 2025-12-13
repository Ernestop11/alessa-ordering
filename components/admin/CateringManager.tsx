'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export interface CateringOption {
  id: string;
  name: string;
  description: string;
  price: number;
  servingInfo: string;
  category: 'regular' | 'holiday';
  removals: string[];
  addons: {
    id: string;
    label: string;
    price: number;
  }[];
  badge?: string;
  featured?: boolean;
}

export default function CateringManager() {
  const [options, setOptions] = useState<CateringOption[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CateringOption | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [galleryInput, setGalleryInput] = useState('');

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        await Promise.all([
          fetchCateringOptions(),
          fetchCateringGallery()
        ]);
      } catch (error) {
        console.error('Error loading catering data:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchCateringOptions = async () => {
    try {
      const response = await fetch('/api/admin/catering');
      if (!response.ok) throw new Error('Failed to fetch catering options');
      const data = await response.json();
      // Ensure options is always an array
      const optionsArray = Array.isArray(data.options) ? data.options : [];
      setOptions(optionsArray);
    } catch (error) {
      console.error('Error fetching catering options:', error);
      setOptions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchCateringGallery = async () => {
    try {
      const response = await fetch('/api/admin/catering/gallery');
      if (!response.ok) throw new Error('Failed to fetch gallery');
      const data = await response.json();
      // Ensure gallery is always an array
      const galleryArray = Array.isArray(data.gallery) ? data.gallery : [];
      setGallery(galleryArray);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      setGallery([]); // Set empty array on error
    }
  };

  const handleGalleryUpload = async (file?: File | null) => {
    if (!file) return;
    setUploadingGallery(true);
    try {
      const payload = new FormData();
      payload.append('file', file);
      const res = await fetch('/api/admin/assets/upload', {
        method: 'POST',
        body: payload,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const newGallery = [...gallery, data.url];
      setGallery(newGallery);
      
      // Save to backend
      const saveRes = await fetch('/api/admin/catering/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery: newGallery }),
      });
      if (!saveRes.ok) throw new Error('Failed to save gallery');
    } catch (err) {
      console.error('Gallery upload failed:', err);
      alert('Failed to upload image');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = async (url: string) => {
    const newGallery = gallery.filter(img => img !== url);
    setGallery(newGallery);
    try {
      const res = await fetch('/api/admin/catering/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery: newGallery }),
      });
      if (!res.ok) throw new Error('Failed to save gallery');
    } catch (err) {
      console.error('Failed to remove image:', err);
      alert('Failed to remove image');
    }
  };

  const handleSave = async () => {
    if (!editForm) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/catering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: editingId
          ? options.map(o => o.id === editingId ? editForm : o)
          : [...options, editForm]
        }),
      });

      if (!response.ok) throw new Error('Failed to save catering options');

      await fetchCateringOptions();
      setEditingId(null);
      setEditForm(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving catering options:', error);
      alert('Failed to save catering option');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this catering option?')) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/catering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: options.filter(o => o.id !== id) }),
      });

      if (!response.ok) throw new Error('Failed to delete catering option');
      await fetchCateringOptions();
    } catch (error) {
      console.error('Error deleting catering option:', error);
      alert('Failed to delete catering option');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (option: CateringOption) => {
    setEditingId(option.id);
    setEditForm({ ...option });
    setShowAddForm(false);
  };

  const startAdd = () => {
    setEditForm({
      id: `catering-${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      servingInfo: '',
      category: 'regular',
      removals: [],
      addons: [],
    });
    setShowAddForm(true);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setShowAddForm(false);
  };

  const updateEditForm = (field: keyof CateringOption, value: any) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  const addRemoval = () => {
    if (!editForm) return;
    const newRemoval = prompt('Enter removal option name:');
    if (newRemoval) {
      setEditForm({ ...editForm, removals: [...editForm.removals, newRemoval] });
    }
  };

  const removeRemoval = (index: number) => {
    if (!editForm) return;
    setEditForm({ ...editForm, removals: editForm.removals.filter((_, i) => i !== index) });
  };

  const addAddon = () => {
    if (!editForm) return;
    const label = prompt('Enter addon name:');
    if (!label) return;
    const priceStr = prompt('Enter addon price:');
    if (!priceStr) return;
    const price = parseFloat(priceStr);
    if (isNaN(price)) {
      alert('Invalid price');
      return;
    }
    setEditForm({
      ...editForm,
      addons: [
        ...editForm.addons,
        { id: `addon-${Date.now()}`, label, price },
      ],
    });
  };

  const removeAddon = (index: number) => {
    if (!editForm) return;
    setEditForm({ ...editForm, addons: editForm.addons.filter((_, i) => i !== index) });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading catering options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Catering Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage catering options, bundles, and holiday packages
          </p>
        </div>
        <button
          onClick={startAdd}
          disabled={saving || showAddForm}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Catering Option
        </button>
      </div>

      {/* Catering Gallery Management */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-bold text-gray-900">Catering Modal Gallery</h3>
        <p className="mb-4 text-sm text-gray-600">
          These images will rotate at the top of the catering modal. Recommended: 1200x600px landscape images.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {gallery.map((url, index) => (
            <div key={index} className="group relative aspect-video overflow-hidden rounded-lg border border-gray-200">
              <img
                src={url}
                alt={`Gallery ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => handleRemoveGalleryImage(url)}
                className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="flex aspect-video cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-blue-400 hover:bg-gray-100">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleGalleryUpload(e.target.files?.[0])}
              className="hidden"
              disabled={uploadingGallery}
            />
            {uploadingGallery ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            ) : (
              <Plus className="h-8 w-8 text-gray-400" />
            )}
          </label>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Or add image URL</label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={galleryInput}
              onChange={(e) => setGalleryInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && galleryInput.trim()) {
                  const newGallery = [...gallery, galleryInput.trim()];
                  setGallery(newGallery);
                  setGalleryInput('');
                  fetch('/api/admin/catering/gallery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gallery: newGallery }),
                  }).catch(console.error);
                }
              }}
            />
            <button
              onClick={() => {
                if (galleryInput.trim()) {
                  const newGallery = [...gallery, galleryInput.trim()];
                  setGallery(newGallery);
                  setGalleryInput('');
                  fetch('/api/admin/catering/gallery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gallery: newGallery }),
                  }).catch(console.error);
                }
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && editForm && (
        <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900">
            {showAddForm ? 'Add New Catering Option' : 'Edit Catering Option'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => updateEditForm('name', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="e.g., Taco Bar Catering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => updateEditForm('price', parseFloat(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => updateEditForm('description', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Full description of the catering option"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Serving Info</label>
                <input
                  type="text"
                  value={editForm.servingInfo}
                  onChange={(e) => updateEditForm('servingInfo', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="e.g., From $12/person"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => updateEditForm('category', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="regular">Regular</option>
                  <option value="holiday">Holiday Bundle</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Badge (Optional)</label>
                <input
                  type="text"
                  value={editForm.badge || ''}
                  onChange={(e) => updateEditForm('badge', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="e.g., Popular, Best Value"
                />
              </div>

              <div className="flex items-center pt-7">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.featured || false}
                    onChange={(e) => updateEditForm('featured', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>
              </div>
            </div>

            {/* Removals */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Removals</label>
                <button
                  type="button"
                  onClick={addRemoval}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Removal
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {editForm.removals.map((removal, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm text-red-800"
                  >
                    {removal}
                    <button
                      type="button"
                      onClick={() => removeRemoval(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Addons */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Addons</label>
                <button
                  type="button"
                  onClick={addAddon}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Addon
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {editForm.addons.map((addon, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-green-100 px-3 py-2"
                  >
                    <span className="text-sm text-green-900">
                      {addon.label} - ${addon.price.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAddon(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !editForm.name || !editForm.description}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Options List */}
      <div className="grid gap-4">
        {options.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">No catering options yet. Add your first one above!</p>
          </div>
        ) : (
          options.map((option) => (
            <div
              key={option.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{option.name}</h3>
                    {option.badge && (
                      <span className="rounded-full bg-rose-500 px-2 py-1 text-xs font-bold text-white">
                        {option.badge}
                      </span>
                    )}
                    {option.featured && (
                      <span className="rounded-full bg-blue-500 px-2 py-1 text-xs font-bold text-white">
                        Featured
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      option.category === 'holiday'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {option.category}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="font-bold text-green-600">
                      ${option.price.toFixed(2)}
                    </span>
                    <span className="text-gray-500">{option.servingInfo}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">Removals: </span>
                      <span className="text-gray-600">
                        {option.removals.length > 0 ? option.removals.join(', ') : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Addons: </span>
                      <span className="text-gray-600">
                        {option.addons.length > 0
                          ? option.addons.map(a => a.label).join(', ')
                          : 'None'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(option)}
                    disabled={saving || editingId !== null || showAddForm}
                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(option.id)}
                    disabled={saving || editingId !== null || showAddForm}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
