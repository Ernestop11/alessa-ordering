'use client';

import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Upload, Save } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  isFeatured?: boolean;
  image?: string | null;
  menuSectionId?: string | null;
  section?: {
    id: string;
    name: string;
    type: string;
  } | null;
  tags?: string[];
  gallery?: string[] | null;
}

interface MenuSection {
  id: string;
  name: string;
  type: string;
}

export default function MenuEditorImproved() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenuItems(data || []);
    } catch (e) {
      console.error('Failed to fetch menu', e);
      setUploadError('Failed to load menu items');
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
      isFeatured: false,
      menuSectionId: null,
      section: null,
      image: null,
      tags: [],
      gallery: [],
    };
    setUploadError(null);
    setSuccessMessage(null);
    setTagsInput('');
    setEditingItem(newItem);
  };

  const handleEditItem = (item: MenuItem) => {
    setUploadError(null);
    setSuccessMessage(null);
    setTagsInput('');
    setEditingItem({
      ...item,
      menuSectionId: item.menuSectionId ?? item.section?.id ?? null,
      tags: item.tags ?? [],
      image: item.image ?? null,
      gallery: Array.isArray(item.gallery) ? item.gallery.filter((url) => typeof url === 'string' && url.length > 0) : [],
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this menu item? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchItems();
        setSuccessMessage('Menu item deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setUploadError('Failed to delete item');
      }
    } catch (e) {
      console.error('Delete failed', e);
      setUploadError('Failed to delete item');
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    // Validation
    if (!editingItem.name.trim()) {
      setUploadError('Name is required');
      return;
    }
    if (!editingItem.menuSectionId) {
      setUploadError('Please assign a section');
      return;
    }
    
    setSaving(true);
    setUploadError(null);
    try {
      const payload = {
        name: editingItem.name.trim(),
        description: editingItem.description.trim(),
        price: editingItem.price,
        category: editingItem.category.trim() || 'uncategorized',
        available: editingItem.available,
        isFeatured: editingItem.isFeatured || false,
        tags: editingItem.tags || [],
        menuSectionId: editingItem.menuSectionId || null,
        image: editingItem.image || null,
        gallery: editingItem.gallery?.filter((url) => typeof url === 'string' && url.trim().length > 0) ?? [],
      };

      let res;
      if (!editingItem.id) {
        // create
        res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // update
        res = await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      
      if (res.ok) {
        await fetchItems();
        setEditingItem(null);
        setSuccessMessage(editingItem.id ? 'Menu item updated successfully' : 'Menu item created successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await res.text();
        setUploadError(error || 'Failed to save item');
      }
    } catch (err) {
      console.error('Save failed', err);
      setUploadError('Failed to save item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrimaryImageUpload = async (file?: File | null) => {
    if (!file || !editingItem) return;
    setUploadError(null);
    setUploadingImage(true);
    try {
      const payload = new FormData();
      payload.append('file', file);
      const res = await fetch('/api/admin/assets/upload', {
        method: 'POST',
        body: payload,
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setEditingItem((prev) => (prev ? { ...prev, image: data.url } : prev));
      setSuccessMessage('Image uploaded successfully');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error(err);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGalleryUpload = async (file?: File | null) => {
    if (!file || !editingItem) return;
    setUploadError(null);
    setUploadingGallery(true);
    try {
      const payload = new FormData();
      payload.append('file', file);
      const res = await fetch('/api/admin/assets/upload', {
        method: 'POST',
        body: payload,
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setEditingItem((prev) =>
        prev
          ? {
              ...prev,
              gallery: prev.gallery && prev.gallery.includes(data.url) ? prev.gallery : [...(prev.gallery ?? []), data.url],
            }
          : prev,
      );
      setSuccessMessage('Gallery image uploaded successfully');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error(err);
      setUploadError('Failed to upload gallery image. Please try again.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const addTag = (tag: string) => {
    if (!tag.trim() || !editingItem) return;
    const trimmed = tag.trim();
    const currentTags = editingItem.tags || [];
    if (!currentTags.includes(trimmed)) {
      setEditingItem({ ...editingItem, tags: [...currentTags, trimmed] });
    }
    setTagsInput('');
  };

  const removeTag = (tagToRemove: string) => {
    if (!editingItem) return;
    setEditingItem({
      ...editingItem,
      tags: (editingItem.tags || []).filter((tag) => tag !== tagToRemove),
    });
  };

  const addGalleryUrl = (url: string) => {
    if (!url.trim() || !editingItem) return;
    const trimmed = url.trim();
    const currentGallery = editingItem.gallery || [];
    if (!currentGallery.includes(trimmed)) {
      setEditingItem({ ...editingItem, gallery: [...currentGallery, trimmed] });
    }
  };

  const removeGalleryUrl = (urlToRemove: string) => {
    if (!editingItem) return;
    setEditingItem({
      ...editingItem,
      gallery: (editingItem.gallery || []).filter((url) => url !== urlToRemove),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Menu Editor</h1>
            <p className="text-gray-600 mt-1">Create and edit menu items for your restaurant</p>
          </div>
          <button
            onClick={handleAddNewItem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add New Item
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {uploadError}
          </div>
        )}

        {/* Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingItem.id ? 'Edit Menu Item' : 'New Menu Item'}
                </h2>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setUploadError(null);
                    setTagsInput('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value || '0') })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe this menu item..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input
                      type="text"
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., tacos, breakfast, beverages"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingItem.menuSectionId || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, menuSectionId: e.target.value || null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={sectionsLoading}
                      required
                    >
                      <option value="">Select a section...</option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name} ({section.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Primary Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Image</label>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={editingItem.image || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="/tenant/lasreinas/images/menu-items/item.jpg or https://..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use tenant paths like <code>/tenant/lasreinas/images/menu-items/</code> or full URLs
                      </p>
                    </div>
                    <div>
                      <input
                        id="primary-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          void handlePrimaryImageUpload(file);
                          e.target.value = '';
                        }}
                      />
                      <label
                        htmlFor="primary-image-upload"
                        className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer transition ${
                          uploadingImage
                            ? 'bg-gray-100 cursor-not-allowed'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        {uploadingImage ? 'Uploading...' : 'Upload'}
                      </label>
                    </div>
                  </div>
                  {editingItem.image && (
                    <div className="mt-3 relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={editingItem.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-food.jpg';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Gallery Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                  {editingItem.gallery && editingItem.gallery.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      {editingItem.gallery.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-food.jpg';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryUrl(url)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="/tenant/lasreinas/images/menu-items/item.jpg"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addGalleryUrl((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <input
                      id="gallery-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        void handleGalleryUpload(file);
                        e.target.value = '';
                      }}
                    />
                    <label
                      htmlFor="gallery-upload"
                      className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer transition ${
                        uploadingGallery
                          ? 'bg-gray-100 cursor-not-allowed'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingGallery ? 'Uploading...' : 'Upload'}
                    </label>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editingItem.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(tagsInput);
                      }
                    }}
                    placeholder="Type tag and press Enter (e.g., popular, spicy, vegetarian)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Status */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.available}
                      onChange={(e) => setEditingItem({ ...editingItem, available: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Available</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.isFeatured || false}
                      onChange={(e) => setEditingItem({ ...editingItem, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setUploadError(null);
                      setTagsInput('');
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : editingItem.id ? 'Update Item' : 'Create Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menu Items List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading menu items...</p>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">No menu items yet. Click &quot;Add New Item&quot; to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{item.description}</div>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {item.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{item.section?.name || 'Unassigned'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">${item.price.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            item.available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.available ? 'Available' : 'Unavailable'}
                        </span>
                        {item.isFeatured && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
