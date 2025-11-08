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
    setEditingItem(newItem);
  };

  const handleEditItem = (item: MenuItem) => {
    setUploadError(null);
    setUploadingImage(false);
    setUploadingGallery(false);
    setGalleryInput('');
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
    } catch (err) {
      console.error('Save failed', err);
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <form onSubmit={handleSaveItem} className="space-y-4">
              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700">Name
                  <input type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gallery Images</label>
                {editingItem.gallery && editingItem.gallery.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-3">
                    {editingItem.gallery.map((url, index) => (
                      <div key={`${url}-${index}`} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`${editingItem.name} gallery ${index + 1}`}
                          className="h-12 w-12 rounded border border-gray-200 object-cover"
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
                                : prev,
                            )
                          }
                          className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-gray-600 shadow hover:bg-gray-100"
                          aria-label="Remove gallery image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={galleryInput}
                      onChange={(event) => setGalleryInput(event.target.value)}
                      placeholder="https://... or /uploads/item-2.jpg"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const value = galleryInput.trim();
                        if (!value) return;
                        setEditingItem((prev) =>
                          prev
                            ? {
                                ...prev,
                                gallery: prev.gallery && prev.gallery.includes(value)
                                  ? prev.gallery
                                  : [...(prev.gallery ?? []), value],
                              }
                            : prev,
                        );
                        setGalleryInput('');
                      }}
                      className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
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
                      className={`inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition ${
                        uploadingGallery ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-gray-400 hover:text-gray-900'
                      }`}
                    >
                      {uploadingGallery ? 'Uploading…' : 'Upload to gallery'}
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gallery Images</label>
                {editingItem.gallery && editingItem.gallery.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-3">
                    {editingItem.gallery.map((url, index) => (
                      <div key={`${url}-${index}`} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`${editingItem.name} gallery ${index + 1}`} className="h-12 w-12 rounded border border-gray-200 object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setEditingItem((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    gallery: prev.gallery?.filter((_, i) => i !== index) ?? [],
                                  }
                                : prev,
                            )
                          }
                          className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-gray-600 shadow hover:bg-gray-100"
                          aria-label="Remove gallery image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={galleryInput}
                      onChange={(event) => setGalleryInput(event.target.value)}
                      placeholder="https://... or /uploads/item-2.jpg"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const value = galleryInput.trim();
                        if (!value) return;
                        setEditingItem((prev) =>
                          prev
                            ? {
                                ...prev,
                                gallery: prev.gallery && prev.gallery.includes(value)
                                  ? prev.gallery
                                  : [...(prev.gallery ?? []), value],
                              }
                            : prev,
                        );
                        setGalleryInput('');
                      }}
                      className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
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
                      className={`inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition ${
                        uploadingGallery ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-gray-400 hover:text-gray-900'
                      }`}
                    >
                      {uploadingGallery ? 'Uploading…' : 'Upload to gallery'}
                    </label>
                  </div>
                </div>
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
                <label className="block text-sm font-medium text-gray-700">Image URL
                  <input
                    type="text"
                    value={editingItem.image ?? ''}
                    onChange={e => setEditingItem({ ...editingItem, image: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="https://... or /uploads/item.jpg"
                  />
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
                    className={`inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition ${
                      uploadingImage ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {uploadingImage ? 'Uploading…' : 'Upload image'}
                  </label>
                  {editingItem.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editingItem.image}
                      alt={`${editingItem.name} preview`}
                      className="h-12 w-12 rounded border border-gray-200 object-cover"
                    />
                  )}
                </div>
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
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
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
