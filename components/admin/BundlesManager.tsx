'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Upload } from 'lucide-react';

interface Bundle {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  category: string; // 'bundle' or 'popular'
  image: string | null;
  gallery?: string[] | null;
  badge?: string | null;
  available: boolean;
  displayOrder: number;
  // Time-specific fields
  timeSpecificEnabled?: boolean;
  timeSpecificDays?: number[];
  timeSpecificStartTime?: string | null;
  timeSpecificEndTime?: string | null;
  timeSpecificPrice?: number | null;
  timeSpecificLabel?: string | null;
}

export default function BundlesManager() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Bundle | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [galleryInput, setGalleryInput] = useState('');

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const response = await fetch('/api/admin/catering-packages?category=bundle,popular');
      if (!response.ok) throw new Error('Failed to fetch bundles');
      const data = await response.json();
      // Filter to only bundles/popular packages
      const bundlePackages = (data.packages || []).filter(
        (pkg: any) => pkg.category === 'bundle' || pkg.category === 'popular'
      );
      setBundles(bundlePackages);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file?: File | null) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const payload = new FormData();
      payload.append('file', file);
      const res = await fetch('/api/admin/assets/upload', {
        method: 'POST',
        body: payload,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (editForm) {
        setEditForm({ ...editForm, image: data.url });
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddGalleryImage = () => {
    if (!galleryInput.trim() || !editForm) return;
    const currentGallery = editForm.gallery || [];
    if (!currentGallery.includes(galleryInput.trim())) {
      setEditForm({ ...editForm, gallery: [...currentGallery, galleryInput.trim()] });
    }
    setGalleryInput('');
  };

  const handleRemoveGalleryImage = (url: string) => {
    if (!editForm) return;
    const currentGallery = editForm.gallery || [];
    setEditForm({ ...editForm, gallery: currentGallery.filter(img => img !== url) });
  };

  const handleSave = async () => {
    if (!editForm) return;
    setSaving(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId 
        ? `/api/admin/catering-packages/${editingId}`
        : '/api/admin/catering-packages';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          price: editForm.price,
          pricePerGuest: editForm.price, // Use same price for bundles
          category: editForm.category || 'bundle',
          image: editForm.image,
          gallery: editForm.gallery || [],
          badge: editForm.badge,
          available: editForm.available,
          displayOrder: editForm.displayOrder,
          // Time-specific fields
          timeSpecificEnabled: editForm.timeSpecificEnabled || false,
          timeSpecificDays: editForm.timeSpecificDays || [],
          timeSpecificStartTime: editForm.timeSpecificStartTime || null,
          timeSpecificEndTime: editForm.timeSpecificEndTime || null,
          timeSpecificPrice: editForm.timeSpecificPrice || null,
          timeSpecificLabel: editForm.timeSpecificLabel || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save bundle');

      await fetchBundles();
      setEditingId(null);
      setEditForm(null);
      setShowAddForm(false);
      setGalleryInput('');
    } catch (error) {
      console.error('Error saving bundle:', error);
      alert('Failed to save bundle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bundle?')) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/catering-packages/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete bundle');
      await fetchBundles();
    } catch (error) {
      console.error('Error deleting bundle:', error);
      alert('Failed to delete bundle');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (bundle: Bundle) => {
    setEditingId(bundle.id);
    setEditForm({ ...bundle });
    setShowAddForm(true);
    setGalleryInput('');
  };

  const handleAddNew = () => {
    setEditingId(null);
    setEditForm({
      id: '',
      name: '',
      description: '',
      price: 0,
      originalPrice: null,
      category: 'bundle',
      image: null,
      gallery: [],
      badge: null,
      available: true,
      displayOrder: bundles.length,
      timeSpecificEnabled: false,
      timeSpecificDays: [],
      timeSpecificStartTime: null,
      timeSpecificEndTime: null,
      timeSpecificPrice: null,
      timeSpecificLabel: null,
    });
    setShowAddForm(true);
    setGalleryInput('');
  };

  if (loading) {
    return <div className="p-6">Loading bundles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu Bundles & Specials</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage bundles and specials that appear in menu layouts (e.g., Family Fiesta Bundle)
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Bundle
        </button>
      </div>

      {showAddForm && editForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingId ? 'Edit Bundle' : 'New Bundle'}
            </h3>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditForm(null);
                setEditingId(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bundle Name *
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Family Fiesta Bundle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Feed the whole crew! Get 12 tacos, rice, beans, chips & salsa..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original Price (for "Save $X" display)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.originalPrice || ''}
                  onChange={(e) => setEditForm({ ...editForm, originalPrice: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="bundle">Bundle</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={editForm.displayOrder}
                  onChange={(e) => setEditForm({ ...editForm, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Badge Text (e.g., "Best Value", "Limited Time")
              </label>
              <input
                type="text"
                value={editForm.badge || ''}
                onChange={(e) => setEditForm({ ...editForm, badge: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Best Value"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Image
              </label>
              {editForm.image && (
                <div className="mb-2 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editForm.image}
                    alt="Bundle preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    onClick={() => setEditForm({ ...editForm, image: null })}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={uploadingImage}
              />
              {uploadingImage && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
            </div>

            {/* Gallery Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
              {editForm.gallery && editForm.gallery.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {editForm.gallery.map((url, index) => (
                    <div key={index} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(url)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={galleryInput}
                  onChange={(e) => setGalleryInput(e.target.value)}
                  placeholder="Image URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGalleryImage();
                    }
                  }}
                />
                <button
                  onClick={handleAddGalleryImage}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Time-Specific Availability */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-3">⏰ Time-Specific Availability</h4>
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={editForm.timeSpecificEnabled || false}
                  onChange={(e) => setEditForm({ ...editForm, timeSpecificEnabled: e.target.checked } as Bundle)}
                  className="mr-2 h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Enable time-specific availability</span>
              </label>

              {editForm.timeSpecificEnabled && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available on days:</label>
                    <div className="flex flex-wrap gap-2">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                        <label key={day} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(editForm.timeSpecificDays || []).includes(index)}
                            onChange={(e) => {
                              const currentDays = editForm.timeSpecificDays || [];
                              const newDays = e.target.checked
                                ? [...currentDays, index]
                                : currentDays.filter((d: number) => d !== index);
                              setEditForm({ ...editForm, timeSpecificDays: newDays } as Bundle);
                            }}
                            className="mr-1 h-4 w-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{day.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={editForm.timeSpecificStartTime || ''}
                        onChange={(e) => setEditForm({ ...editForm, timeSpecificStartTime: e.target.value } as Bundle)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={editForm.timeSpecificEndTime || ''}
                        onChange={(e) => setEditForm({ ...editForm, timeSpecificEndTime: e.target.value } as Bundle)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Price (optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.timeSpecificPrice || ''}
                      onChange={(e) => setEditForm({ ...editForm, timeSpecificPrice: e.target.value ? parseFloat(e.target.value) : null } as Bundle)}
                      placeholder="Leave empty to use regular price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Label</label>
                    <input
                      type="text"
                      value={editForm.timeSpecificLabel || ''}
                      onChange={(e) => setEditForm({ ...editForm, timeSpecificLabel: e.target.value } as Bundle)}
                      placeholder="Weekend Special"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={editForm.available}
                  onChange={(e) => setEditForm({ ...editForm, available: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600"
                />
                Available
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditForm(null);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.name || !editForm.description || editForm.price <= 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : editingId ? 'Update Bundle' : 'Create Bundle'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {bundles.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No bundles yet. Click "Add Bundle" to create one.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {bundles.map((bundle) => (
              <li key={bundle.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {bundle.image && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={bundle.image}
                          alt={bundle.name}
                          className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{bundle.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{bundle.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm font-semibold text-gray-900">
                            ${bundle.price.toFixed(2)}
                          </span>
                          {bundle.badge && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {bundle.badge}
                            </span>
                          )}
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {bundle.category}
                          </span>
                          {bundle.timeSpecificEnabled && (
                            <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                              ⏰ Time-Specific
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      bundle.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {bundle.available ? 'Available' : 'Unavailable'}
                    </span>
                    <button
                      onClick={() => handleEdit(bundle)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bundle.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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




