'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, GripVertical, ArrowLeft } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

interface MenuSection {
  id: string;
  name: string;
  type: string;
  displayOrder: number | null;
}

interface CustomizationOption {
  id: string;
  label: string;
  price: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image: string | null;
  menuSectionId: string | null;
  displayOrder: number | null;
  customizationRemovals?: string[];
  customizationAddons?: CustomizationOption[];
}

interface CateringSection {
  id: string;
  name: string;
  description: string | null;
  position: number;
  imageUrl?: string | null;
  _count?: { packages: number };
}

interface CateringPackage {
  id: string;
  cateringSectionId: string | null;
  name: string;
  description: string;
  pricePerGuest: number;
  price?: number | null;
  category: string;
  image: string | null;
  gallery?: string[] | null;
  badge: string | null;
  customizationRemovals?: string[];
  customizationAddons?: CustomizationOption[];
  available: boolean;
  displayOrder: number;
}

export default function MenuEditorPage() {
  const [activeTab, setActiveTab] = useState<'menu' | 'catering'>('menu');
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cateringSections, setCateringSections] = useState<CateringSection[]>([]);
  const [cateringPackages, setCateringPackages] = useState<CateringPackage[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedCateringSection, setSelectedCateringSection] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingSection, setEditingSection] = useState<MenuSection | null>(null);
  const [editingCateringSection, setEditingCateringSection] = useState<CateringSection | null>(null);
  const [editingPackage, setEditingPackage] = useState<CateringPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [cateringGallery, setCateringGallery] = useState<string[]>([]);

  useEffect(() => {
    fetchSections();
    fetchItems();
    fetchCateringSections();
    fetchCateringPackages();
    fetchCateringGallery();
  }, []);

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/admin/menu-sections');
      const data = await res.json();
      setSections(data || []);
      if (data && data.length > 0 && !selectedSection) {
        setSelectedSection(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch sections', err);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      console.error('Failed to fetch items', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = () => {
    const newSection: MenuSection = {
      id: '',
      name: '',
      type: 'RESTAURANT',
      displayOrder: sections.length,
    };
    setEditingSection(newSection);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    try {
      const method = editingSection.id ? 'PUT' : 'POST';
      const url = '/api/admin/menu-sections';

      const payload = editingSection.id ? { ...editingSection, id: editingSection.id } : editingSection;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save section');
      await fetchSections();
      setEditingSection(null);
    } catch (err) {
      console.error('Failed to save section', err);
      alert('Failed to save section');
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Delete this section? Items in this section will be unassigned.')) return;

    try {
      const res = await fetch(`/api/admin/menu-sections?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to delete section');
      }
      await fetchSections();
      if (selectedSection === id) {
        setSelectedSection(null);
      }
    } catch (err) {
      console.error('Failed to delete section', err);
      alert('Failed to delete section');
    }
  };

  const handleAddItem = () => {
    const newItem: MenuItem = {
      id: '',
      name: '',
      description: '',
      price: 0,
      category: '',
      available: true,
      image: null,
      menuSectionId: selectedSection || null,
      displayOrder: items.filter(i => i.menuSectionId === selectedSection).length,
      customizationRemovals: [],
      customizationAddons: [],
    };
    setEditingItem(newItem);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const method = editingItem.id ? 'PUT' : 'POST';
      const url = editingItem.id ? `/api/menu/${editingItem.id}` : '/api/menu';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });

      if (!res.ok) throw new Error('Failed to save item');
      await fetchItems();
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to save item', err);
      alert('Failed to save item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;

    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');
      await fetchItems();
    } catch (err) {
      console.error('Failed to delete item', err);
      alert('Failed to delete item');
    }
  };

  const fetchCateringSections = async () => {
    try {
      const res = await fetch('/api/admin/catering-sections');
      const data = await res.json();
      setCateringSections(data || []);
      if (data && data.length > 0 && !selectedCateringSection) {
        setSelectedCateringSection(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch catering sections', err);
    }
  };

  const fetchCateringPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/catering-packages');
      const data = await res.json();
      setCateringPackages(data || []);
    } catch (err) {
      console.error('Failed to fetch catering packages', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCateringSection = () => {
    const newSection: CateringSection = {
      id: '',
      name: '',
      description: null,
      position: cateringSections.length,
    };
    setEditingCateringSection(newSection);
  };

  const handleSaveCateringSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCateringSection) return;

    try {
      const method = editingCateringSection.id ? 'PATCH' : 'POST';
      const url = editingCateringSection.id
        ? `/api/admin/catering-sections/${editingCateringSection.id}`
        : '/api/admin/catering-sections';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCateringSection),
      });

      if (!res.ok) throw new Error('Failed to save catering section');
      await fetchCateringSections();
      setEditingCateringSection(null);
    } catch (err) {
      console.error('Failed to save catering section', err);
      alert('Failed to save catering section');
    }
  };

  const handleDeleteCateringSection = async (id: string) => {
    if (!confirm('Delete this catering section? All packages in this section will become unassigned.')) return;

    try {
      const res = await fetch(`/api/admin/catering-sections/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete catering section');
      await fetchCateringSections();
      await fetchCateringPackages();
    } catch (err) {
      console.error('Failed to delete catering section', err);
      alert('Failed to delete catering section');
    }
  };

  const fetchCateringGallery = async () => {
    try {
      const res = await fetch('/api/admin/tenant-settings');
      const data = await res.json();
      setCateringGallery(data.cateringGallery || []);
    } catch (err) {
      console.error('Failed to fetch catering gallery', err);
    }
  };

  const handleAddGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/assets/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        const newGallery = [...cateringGallery, data.url];
        await saveCateringGallery(newGallery);
      }
    } catch (err) {
      console.error('Failed to upload gallery image', err);
      alert('Failed to upload image');
    }
  };

  const handleRemoveGalleryImage = async (url: string) => {
    const newGallery = cateringGallery.filter(img => img !== url);
    await saveCateringGallery(newGallery);
  };

  const saveCateringGallery = async (gallery: string[]) => {
    try {
      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cateringGallery: gallery }),
      });
      if (!res.ok) throw new Error('Failed to save gallery');
      setCateringGallery(gallery);
    } catch (err) {
      console.error('Failed to save gallery', err);
      alert('Failed to save gallery');
    }
  };

  const handleAddPackage = () => {
    const newPackage: CateringPackage = {
      id: '',
      cateringSectionId: selectedCateringSection,
      name: '',
      description: '',
      pricePerGuest: 0,
      price: null,
      category: 'popular',
      image: null,
      gallery: [],
      badge: null,
      customizationRemovals: [],
      customizationAddons: [],
      available: true,
      displayOrder: cateringPackages.length,
    };
    setEditingPackage(newPackage);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    try {
      const method = editingPackage.id ? 'PATCH' : 'POST';
      const url = editingPackage.id
        ? `/api/admin/catering-packages/${editingPackage.id}`
        : '/api/admin/catering-packages';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPackage),
      });

      if (!res.ok) throw new Error('Failed to save package');
      await fetchCateringPackages();
      setEditingPackage(null);
    } catch (err) {
      console.error('Failed to save package', err);
      alert('Failed to save package');
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Delete this catering package?')) return;

    try {
      const res = await fetch(`/api/admin/catering-packages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete package');
      await fetchCateringPackages();
    } catch (err) {
      console.error('Failed to delete package', err);
      alert('Failed to delete package');
    }
  };

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetItemId: string) => {
    if (!draggedItem || draggedItem === targetItemId) {
      setDraggedItem(null);
      return;
    }

    const dragged = items.find(i => i.id === draggedItem);
    const target = items.find(i => i.id === targetItemId);
    if (!dragged || !target || dragged.menuSectionId !== target.menuSectionId) {
      setDraggedItem(null);
      return;
    }

    // Swap display orders
    const newOrder = target.displayOrder;
    const oldOrder = dragged.displayOrder;

    try {
      await fetch(`/api/menu/${draggedItem}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dragged, displayOrder: newOrder }),
      });

      await fetch(`/api/menu/${targetItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...target, displayOrder: oldOrder }),
      });

      await fetchItems();
    } catch (err) {
      console.error('Failed to reorder items', err);
    }

    setDraggedItem(null);
  };

  const filteredItems = selectedSection
    ? items.filter(i => i.menuSectionId === selectedSection).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : [];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/admin"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Menu Editor</h1>
              </div>
              {activeTab === 'menu' ? (
                <button
                  onClick={handleAddSection}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </button>
              ) : (
                <button
                  onClick={handleAddCateringSection}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </button>
              )}
            </div>
            {/* Tab Switcher */}
            <div className="mt-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'menu'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Menu Items
                </button>
                <button
                  onClick={() => setActiveTab('catering')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'catering'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Catering Packages
                </button>
              </nav>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'menu' ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sections List */}
              <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sections</h2>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedSection === section.id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedSection(section.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{section.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSection(section);
                            }}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSection(section.id);
                            }}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedSection ? sections.find(s => s.id === selectedSection)?.name || 'Items' : 'Select a section'}
                  </h2>
                  {selectedSection && (
                    <button
                      onClick={handleAddItem}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {selectedSection ? 'No items in this section' : 'Select a section to view items'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(item.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(item.id)}
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move"
                      >
                        <GripVertical className="h-5 w-5 text-gray-400" />
                        {item.image && (
                          <img src={item.image} alt={item.name} className="h-12 w-12 rounded object-cover" />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>
          ) : (
            /* Catering Packages View */
            <div className="space-y-6">
              {/* Catering Gallery Manager */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Catering Modal Gallery</h2>
                <p className="text-sm text-gray-600 mb-4">These images will rotate at the top of the catering modal. Recommended: 1200x600px landscape images.</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {cateringGallery.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => handleRemoveGalleryImage(url)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Add Image Button */}
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="mt-2 text-sm text-gray-500">Add Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAddGalleryImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Catering Sections List */}
                <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Catering Sections</h2>
                  <div className="space-y-2">
                    {cateringSections.map((section) => (
                      <div
                        key={section.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedCateringSection === section.id
                            ? 'bg-orange-50 border-2 border-orange-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedCateringSection(section.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{section.name}</span>
                            {section._count && section._count.packages > 0 && (
                              <span className="ml-2 text-xs text-gray-500">({section._count.packages})</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCateringSection(section);
                              }}
                              className="text-gray-400 hover:text-orange-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCateringSection(section.id);
                              }}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Catering Packages List */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedCateringSection ? cateringSections.find(s => s.id === selectedCateringSection)?.name || 'Packages' : 'Select a section'}
                    </h2>
                    {selectedCateringSection && (
                      <button
                        onClick={handleAddPackage}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Package
                      </button>
                    )}
                  </div>

                  {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                  ) : !selectedCateringSection ? (
                    <div className="text-center py-8 text-gray-500">Select a section to view packages</div>
                  ) : cateringPackages.filter(pkg => pkg.cateringSectionId === selectedCateringSection).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No packages in this section</div>
                  ) : (
                    <div className="space-y-3">
                      {cateringPackages
                        .filter(pkg => pkg.cateringSectionId === selectedCateringSection)
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map((pkg) => (
                          <div
                            key={pkg.id}
                            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50/30 transition-all"
                          >
                            {pkg.image && (
                              <img src={pkg.image} alt={pkg.name} className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {pkg.badge && (
                                  <span className="inline-block px-2 py-0.5 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full">
                                    {pkg.badge}
                                  </span>
                                )}
                                <h3 className="font-semibold text-gray-900 text-lg truncate">{pkg.name}</h3>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-1">{pkg.description}</p>
                              <p className="text-sm font-bold text-orange-600 mt-1">
                                {pkg.price ? `$${pkg.price.toFixed(0)}` : `$${pkg.pricePerGuest.toFixed(0)}/guest`}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => setEditingPackage(pkg)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePackage(pkg.id)}
                                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Edit Section Modal */}
        {editingSection && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold mb-4">
                {editingSection.id ? 'Edit Section' : 'Add Section'}
              </h2>
              <form onSubmit={handleSaveSection} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editingSection.name}
                    onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={editingSection.type}
                    onChange={(e) => setEditingSection({ ...editingSection, type: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="BEVERAGE">Beverage</option>
                    <option value="GROCERY">Grocery</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Catering Section Modal */}
        {editingCateringSection && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold mb-4">
                {editingCateringSection.id ? 'Edit Catering Section' : 'Add Catering Section'}
              </h2>
              <form onSubmit={handleSaveCateringSection} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Section Name</label>
                  <input
                    type="text"
                    value={editingCateringSection.name}
                    onChange={(e) => setEditingCateringSection({ ...editingCateringSection, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., Popular Catering Options, Holiday Bundles"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                  <textarea
                    value={editingCateringSection.description || ''}
                    onChange={(e) => setEditingCateringSection({ ...editingCateringSection, description: e.target.value || null })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                    placeholder="Brief description of this section"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hero Image (optional)</label>
                  <div className="mt-1 space-y-2">
                    {editingCateringSection.imageUrl && (
                      <div className="relative w-full h-32 border border-gray-300 rounded-md overflow-hidden">
                        <img
                          src={editingCateringSection.imageUrl}
                          alt="Section hero"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingCateringSection({ ...editingCateringSection, imageUrl: null })}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch('/api/admin/assets/upload', {
                            method: 'POST',
                            body: formData,
                          });
                          const data = await res.json();
                          if (data.url) {
                            setEditingCateringSection({ ...editingCateringSection, imageUrl: data.url });
                          }
                        } catch (err) {
                          console.error('Failed to upload image', err);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    <p className="text-xs text-gray-500">Recommended: 1200x400px landscape image for hero display</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCateringSection(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Item Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">
                {editingItem.id ? 'Edit Item' : 'Add Item'}
              </h2>
              <form onSubmit={handleSaveItem} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Editor Form */}
                <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <input
                      type="text"
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Image</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      value={editingItem.image || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://... or upload image"
                    />
                    <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await fetch('/api/admin/assets/upload', {
                              method: 'POST',
                              body: formData,
                            });
                            const data = await res.json();
                            if (data.url) {
                              // Use callback to get current state
                              setEditingItem((prev) => prev ? { ...prev, image: data.url } : prev);
                            }
                          } catch (err) {
                            console.error('Failed to upload image', err);
                            alert('Failed to upload image');
                          }
                        }}
                      />
                      Upload
                    </label>
                  </div>
                  {editingItem.image && (
                    <img
                      src={editingItem.image}
                      alt="Preview"
                      className="mt-2 h-32 w-32 object-cover rounded border border-gray-300"
                    />
                  )}
                </div>

                {/* Customization: Removals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customization Options - Removals</label>
                  <div className="space-y-2">
                    {(editingItem.customizationRemovals || []).map((removal, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={removal}
                          onChange={(e) => {
                            const newRemovals = [...(editingItem.customizationRemovals || [])];
                            newRemovals[index] = e.target.value;
                            setEditingItem({ ...editingItem, customizationRemovals: newRemovals });
                          }}
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="e.g., No onions"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newRemovals = (editingItem.customizationRemovals || []).filter((_, i) => i !== index);
                            setEditingItem({ ...editingItem, customizationRemovals: newRemovals });
                          }}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem({
                          ...editingItem,
                          customizationRemovals: [...(editingItem.customizationRemovals || []), ''],
                        });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Removal Option
                    </button>
                  </div>
                </div>

                {/* Customization: Addons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customization Options - Paid Add-ons</label>
                  <div className="space-y-2">
                    {(editingItem.customizationAddons || []).map((addon, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={addon.label}
                          onChange={(e) => {
                            const newAddons = [...(editingItem.customizationAddons || [])];
                            newAddons[index] = { ...newAddons[index], label: e.target.value };
                            setEditingItem({ ...editingItem, customizationAddons: newAddons });
                          }}
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="e.g., Extra cheese"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={addon.price}
                          onChange={(e) => {
                            const newAddons = [...(editingItem.customizationAddons || [])];
                            newAddons[index] = { ...newAddons[index], price: parseFloat(e.target.value) || 0 };
                            setEditingItem({ ...editingItem, customizationAddons: newAddons });
                          }}
                          className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="0.00"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newAddons = (editingItem.customizationAddons || []).filter((_, i) => i !== index);
                            setEditingItem({ ...editingItem, customizationAddons: newAddons });
                          }}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem({
                          ...editingItem,
                          customizationAddons: [...(editingItem.customizationAddons || []), { id: `addon_${Date.now()}`, label: '', price: 0 }],
                        });
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Paid Add-on
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingItem.available}
                    onChange={(e) => setEditingItem({ ...editingItem, available: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Available</label>
                </div>
                </div>

                {/* Right Column: Live Preview */}
                <div className="lg:sticky lg:top-6 lg:h-fit">
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Live Preview</h3>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 shadow-2xl">
                      {editingItem.image && (
                        <img
                          src={editingItem.image}
                          alt={editingItem.name || 'Preview'}
                          className="w-full h-48 object-cover rounded-xl mb-4"
                        />
                      )}
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-white">
                          {editingItem.name || 'Item Name'}
                        </h4>
                        <p className="text-sm text-white/70 line-clamp-3">
                          {editingItem.description || 'Add a description to see how it looks...'}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-2xl font-black text-yellow-400">
                            ${editingItem.price.toFixed(2)}
                          </span>
                          {editingItem.category && (
                            <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">
                              {editingItem.category}
                            </span>
                          )}
                        </div>
                        {!editingItem.available && (
                          <div className="mt-2 text-xs text-red-400 bg-red-500/20 px-3 py-1 rounded-full inline-block">
                            Currently Unavailable
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Catering Package Modal */}
        {editingPackage && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">
                {editingPackage.id ? 'Edit Catering Package' : 'Add Catering Package'}
              </h2>
              <form onSubmit={handleSavePackage} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Editor Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Package Name</label>
                    <input
                      type="text"
                      value={editingPackage.name}
                      onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={editingPackage.description}
                      onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Section</label>
                    <select
                      value={editingPackage.cateringSectionId || ''}
                      onChange={(e) => setEditingPackage({ ...editingPackage, cateringSectionId: e.target.value || null })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">No Section (Unassigned)</option>
                      {cateringSections.map(section => (
                        <option key={section.id} value={section.id}>{section.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={editingPackage.category}
                      onChange={(e) => setEditingPackage({ ...editingPackage, category: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="popular">Popular Catering Options</option>
                      <option value="holiday">Holiday & Event Bundles</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price per Guest</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingPackage.pricePerGuest}
                        onChange={(e) => setEditingPackage({ ...editingPackage, pricePerGuest: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Flat Price (optional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingPackage.price || ''}
                        onChange={(e) => setEditingPackage({ ...editingPackage, price: e.target.value ? parseFloat(e.target.value) : null })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Leave empty for per-guest pricing"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Badge (optional)</label>
                    <input
                      type="text"
                      value={editingPackage.badge || ''}
                      onChange={(e) => setEditingPackage({ ...editingPackage, badge: e.target.value || null })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Popular, Best Value"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Image</label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={editingPackage.image || ''}
                        onChange={(e) => setEditingPackage({ ...editingPackage, image: e.target.value })}
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://... or upload image"
                      />
                      <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append('file', file);
                            try {
                              const res = await fetch('/api/admin/assets/upload', {
                                method: 'POST',
                                body: formData,
                              });
                              const data = await res.json();
                              if (data.url) {
                                setEditingPackage((prev) => prev ? { ...prev, image: data.url } : prev);
                              }
                            } catch (err) {
                              console.error('Failed to upload image', err);
                              alert('Failed to upload image');
                            }
                          }}
                        />
                        Upload
                      </label>
                    </div>
                    {editingPackage.image && (
                      <img
                        src={editingPackage.image}
                        alt="Preview"
                        className="mt-2 h-32 w-32 object-cover rounded border border-gray-300"
                      />
                    )}
                  </div>

                  {/* Gallery */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Images (Gallery)</label>
                    <div className="space-y-2">
                      {(editingPackage.gallery || []).map((url, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <img
                            src={url}
                            alt={`Gallery ${index + 1}`}
                            className="h-20 w-20 object-cover rounded border border-gray-300"
                          />
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                              const newGallery = [...(editingPackage.gallery || [])];
                              newGallery[index] = e.target.value;
                              setEditingPackage({ ...editingPackage, gallery: newGallery });
                            }}
                            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="https://..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newGallery = (editingPackage.gallery || []).filter((_, i) => i !== index);
                              setEditingPackage({ ...editingPackage, gallery: newGallery });
                            }}
                            className="px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const formData = new FormData();
                              formData.append('file', file);
                              try {
                                const res = await fetch('/api/admin/assets/upload', {
                                  method: 'POST',
                                  body: formData,
                                });
                                const data = await res.json();
                                if (data.url) {
                                  setEditingPackage((prev) => {
                                    if (!prev) return prev;
                                    const currentGallery = prev.gallery || [];
                                    return { ...prev, gallery: [...currentGallery, data.url] };
                                  });
                                }
                              } catch (err) {
                                console.error('Failed to upload image', err);
                                alert('Failed to upload image');
                              }
                            }}
                          />
                          Upload Image to Gallery
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Customization: Removals */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customization Options - Removals</label>
                    <div className="space-y-2">
                      {(editingPackage.customizationRemovals || []).map((removal, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={removal}
                            onChange={(e) => {
                              const newRemovals = [...(editingPackage.customizationRemovals || [])];
                              newRemovals[index] = e.target.value;
                              setEditingPackage({ ...editingPackage, customizationRemovals: newRemovals });
                            }}
                            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="e.g., Onions, Cilantro, Spicy Salsa"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newRemovals = (editingPackage.customizationRemovals || []).filter((_, i) => i !== index);
                              setEditingPackage({ ...editingPackage, customizationRemovals: newRemovals });
                            }}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPackage({
                            ...editingPackage,
                            customizationRemovals: [...(editingPackage.customizationRemovals || []), ''],
                          });
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Removal Option
                      </button>
                    </div>
                  </div>

                  {/* Customization: Addons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customization Options - Paid Add-ons</label>
                    <div className="space-y-2">
                      {(editingPackage.customizationAddons || []).map((addon, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={addon.label}
                            onChange={(e) => {
                              const newAddons = [...(editingPackage.customizationAddons || [])];
                              newAddons[index] = { ...newAddons[index], label: e.target.value };
                              setEditingPackage({ ...editingPackage, customizationAddons: newAddons });
                            }}
                            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="e.g., Add Guacamole"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={addon.price}
                            onChange={(e) => {
                              const newAddons = [...(editingPackage.customizationAddons || [])];
                              newAddons[index] = { ...newAddons[index], price: parseFloat(e.target.value) || 0 };
                              setEditingPackage({ ...editingPackage, customizationAddons: newAddons });
                            }}
                            className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="0.00"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newAddons = (editingPackage.customizationAddons || []).filter((_, i) => i !== index);
                              setEditingPackage({ ...editingPackage, customizationAddons: newAddons });
                            }}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPackage({
                            ...editingPackage,
                            customizationAddons: [...(editingPackage.customizationAddons || []), { id: `addon_${Date.now()}`, label: '', price: 0 }],
                          });
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Paid Add-on
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingPackage.available}
                      onChange={(e) => setEditingPackage({ ...editingPackage, available: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">Available</label>
                  </div>
                </div>

                {/* Right Column: Live Preview */}
                <div className="lg:sticky lg:top-6 lg:h-fit">
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Live Preview</h3>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 shadow-2xl">
                      {editingPackage.image && (
                        <img
                          src={editingPackage.image}
                          alt={editingPackage.name || 'Preview'}
                          className="w-full h-48 object-cover rounded-xl mb-4"
                        />
                      )}
                      <div className="space-y-2">
                        {editingPackage.badge && (
                          <span className="inline-block px-2 py-1 text-xs font-semibold text-yellow-400 bg-yellow-400/20 rounded-full">
                            {editingPackage.badge}
                          </span>
                        )}
                        <h4 className="text-xl font-bold text-white">
                          {editingPackage.name || 'Package Name'}
                        </h4>
                        <p className="text-sm text-white/70 line-clamp-3">
                          {editingPackage.description || 'Add a description to see how it looks...'}
                        </p>
                        <div className="pt-2">
                          <span className="text-2xl font-black text-yellow-400">
                            ${editingPackage.pricePerGuest.toFixed(2)} / guest
                          </span>
                        </div>
                        {!editingPackage.available && (
                          <div className="mt-2 text-xs text-red-400 bg-red-500/20 px-3 py-1 rounded-full inline-block">
                            Currently Unavailable
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPackage(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

