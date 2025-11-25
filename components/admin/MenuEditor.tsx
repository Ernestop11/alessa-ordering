'use client';

import { useEffect, useState } from 'react';

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

export default function MenuEditor() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [galleryInput, setGalleryInput] = useState('');
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
      image: '',
      tags: [],
      gallery: [],
    };
    setUploadError(null);
    setUploadingImage(false);
    setUploadingGallery(false);
    setGalleryInput('');
    setTagsInput('');
    setSuccessMessage(null);
    setEditingItem(newItem);
  };

  const handleEditItem = (item: MenuItem) => {
    setUploadError(null);
    setUploadingImage(false);
    setUploadingGallery(false);
    setGalleryInput('');
    setTagsInput('');
    setSuccessMessage(null);
    setEditingItem({
      ...item,
      menuSectionId: item.menuSectionId ?? item.section?.id ?? null,
      tags: item.tags ?? [],
      image: item.image ?? '',
      gallery: Array.isArray(item.gallery) ? item.gallery.filter((url) => typeof url === 'string' && url.length > 0) : [],
    });
  };

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
        isFeatured: editingItem.isFeatured || false,
        tags: editingItem.tags || [],
        menuSectionId: editingItem.menuSectionId || null,
        image: editingItem.image || null,
        gallery: editingItem.gallery?.filter((url) => typeof url === 'string' && url.trim().length > 0) ?? [],
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
      setUploadError(null);
      setUploadingImage(false);
      setUploadingGallery(false);
      setGalleryInput('');
      setTagsInput('');
      setSuccessMessage(editingItem.id ? 'Menu item updated successfully' : 'Menu item created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
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
    } catch (err) {
      console.error(err);
      setUploadError('Failed to upload gallery image. Please try again.');
    } finally {
      setUploadingGallery(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Menu Items</h2>
        <button onClick={handleAddNewItem} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Add New Item</button>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingItem.id ? 'Edit Menu Item' : 'New Menu Item'}
              </h3>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setUploadError(null);
                  setTagsInput('');
                  setGalleryInput('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {uploadError}
                </div>
              )}
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Image URL
                  <input
                    type="text"
                    value={editingItem.image ?? ''}
                    onChange={e => setEditingItem({ ...editingItem, image: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="/tenant/lasreinas/images/menu-items/item.jpg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const url = (e.target as HTMLInputElement).value.trim();
                        if (url && editingItem) {
                          const currentGallery = editingItem.gallery || [];
                          if (!currentGallery.includes(url)) {
                            setEditingItem({ ...editingItem, gallery: [...currentGallery, url] });
                          }
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use tenant paths like <code>/tenant/lasreinas/images/menu-items/</code> or full URLs. Press Enter to add to gallery.
                  </p>
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    id="menu-item-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      void handlePrimaryImageUpload(file);
                      event.target.value = '';
                    }}
                  />
                  <label
                    htmlFor="menu-item-image-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer transition ${
                      uploadingImage ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {uploadingImage ? 'Uploading…' : '📤 Upload Image'}
                  </label>
                  {editingItem.image && (
                    <div className="relative w-20 h-20 border border-gray-300 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
              </div>

              {/* Gallery Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                {editingItem.gallery && editingItem.gallery.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {editingItem.gallery.map((url, index) => (
                      <div key={index} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
                          onClick={() =>
                            setEditingItem((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    gallery: prev.gallery?.filter((_, i) => i !== index) ?? [],
                                  }
                                : prev
                            )
                          }
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
                    placeholder="/tenant/lasreinas/images/menu-items/item.jpg"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const url = galleryInput.trim();
                        if (url && editingItem) {
                          const currentGallery = editingItem.gallery || [];
                          if (!currentGallery.includes(url)) {
                            setEditingItem({ ...editingItem, gallery: [...currentGallery, url] });
                          }
                          setGalleryInput('');
                        }
                      }
                    }}
                  />
                  <input
                    id="menu-item-gallery-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      void handleGalleryUpload(file);
                      event.target.value = '';
                    }}
                  />
                  <label
                    htmlFor="menu-item-gallery-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer transition ${
                      uploadingGallery ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {uploadingGallery ? 'Uploading…' : '📤 Upload'}
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
                        onClick={() =>
                          setEditingItem((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  tags: (prev.tags || []).filter((t) => t !== tag),
                                }
                              : prev
                          )
                        }
                        className="hover:text-blue-600"
                      >
                        ×
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
                      const tag = tagsInput.trim();
                      if (tag && editingItem) {
                        const currentTags = editingItem.tags || [];
                        if (!currentTags.includes(tag)) {
                          setEditingItem({ ...editingItem, tags: [...currentTags, tag] });
                        }
                        setTagsInput('');
                      }
                    }
                  }}
                  placeholder="Type tag and press Enter (e.g., popular, spicy, vegetarian)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center text-sm font-medium text-gray-700"><input type="checkbox" checked={editingItem.available} onChange={e => setEditingItem({ ...editingItem, available: e.target.checked })} className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />Available</label>
              </div>
              <div className="flex items-center">
                <label className="flex items-center text-sm font-medium text-gray-700"><input type="checkbox" checked={editingItem.isFeatured || false} onChange={e => setEditingItem({ ...editingItem, isFeatured: e.target.checked })} className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />Featured (appears in &quot;Chef Recommends&quot;)</label>
              </div>
              <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setUploadError(null);
                      setUploadingImage(false);
                      setUploadingGallery(false);
                      setGalleryInput('');
                      setTagsInput('');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : editingItem.id ? 'Update Item' : 'Create Item'}
                  </button>
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
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="mt-2 h-20 w-20 rounded border border-gray-200 object-cover" />
                    )}
                    {item.gallery && item.gallery.length > 1 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.gallery.slice(0, 4).map((url, index) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={`${item.id}-gallery-${index}`}
                            src={url}
                            alt={`${item.name} gallery ${index + 1}`}
                            className="h-10 w-10 rounded border border-gray-200 object-cover"
                          />
                        ))}
                      </div>
                    )}
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
