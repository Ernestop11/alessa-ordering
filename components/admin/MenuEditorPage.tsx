'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, GripVertical, ArrowLeft } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { compressImage, formatFileSize } from '@/lib/imageCompression';

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
  isFeatured?: boolean;
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
  const [activeTab, setActiveTab] = useState<'menu' | 'catering' | 'grocery' | 'frontend'>('menu');
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cateringSections, setCateringSections] = useState<CateringSection[]>([]);
  const [cateringPackages, setCateringPackages] = useState<CateringPackage[]>([]);
  const [groceryItems, setGroceryItems] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedCateringSection, setSelectedCateringSection] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingSection, setEditingSection] = useState<MenuSection | null>(null);
  const [editingCateringSection, setEditingCateringSection] = useState<CateringSection | null>(null);
  const [editingPackage, setEditingPackage] = useState<CateringPackage | null>(null);
  const [editingGroceryItem, setEditingGroceryItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [cateringGallery, setCateringGallery] = useState<string[]>([]);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Frontend customization state
  const [frontendConfig, setFrontendConfig] = useState({
    featuredCarousel: {
      title: 'Chef Recommends',
      subtitle: 'Handpicked favorites from our kitchen',
    },
    heroSection: {
      subtitle: 'Authentic flavors crafted with passion',
      primaryCTA: 'ORDER NOW',
      secondaryCTA: 'VIEW MENU',
    },
    qualitySection: {
      title: 'WE COOK FOR YOU',
      description: 'Fresh ingredients, authentic recipes, made with passion every single day',
    },
    cateringPanel: {
      title: '🎉 Catering Services',
    },
    rewardsPanel: {
      title: '⭐ Rewards Program',
      subtitle: 'Unlock Exclusive Benefits',
    },
  });
  const [savingFrontendConfig, setSavingFrontendConfig] = useState(false);

  useEffect(() => {
    fetchSections();
    fetchItems();
    fetchCateringSections();
    fetchCateringPackages();
    fetchGroceryItems();
    fetchCateringGallery();
    fetchOrderingStatus();
    fetchFrontendConfig();
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
      isFeatured: false,
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
      // Add cache-busting timestamp to prevent browser caching
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/catering-sections?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
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
      // Add cache-busting timestamp to prevent browser caching
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/catering-packages?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      const data = await res.json();
      // Ensure it's always an array
      const packagesArray = Array.isArray(data) ? data : [];
      setCateringPackages(packagesArray);
    } catch (err) {
      console.error('Failed to fetch catering packages', err);
      setCateringPackages([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchGroceryItems = async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/grocery-items?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      const data = await res.json();
      const itemsArray = Array.isArray(data) ? data : [];
      setGroceryItems(itemsArray);
    } catch (err) {
      console.error('Failed to fetch grocery items', err);
      setGroceryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroceryItem = () => {
    const newItem: any = {
      id: '',
      name: '',
      description: '',
      price: 0,
      category: 'general',
      unit: 'each',
      image: null,
      gallery: [],
      available: true,
      stockQuantity: null,
      tags: [],
      displayOrder: groceryItems.length,
    };
    setEditingGroceryItem(newItem);
  };

  const handleSaveGroceryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroceryItem) return;

    try {
      const method = editingGroceryItem.id ? 'PATCH' : 'POST';
      const url = editingGroceryItem.id
        ? `/api/admin/grocery-items/${editingGroceryItem.id}`
        : '/api/admin/grocery-items';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGroceryItem),
      });

      if (!res.ok) throw new Error('Failed to save grocery item');
      await fetchGroceryItems();
      setEditingGroceryItem(null);
    } catch (err) {
      console.error('Failed to save grocery item', err);
      alert('Failed to save grocery item');
    }
  };

  const handleDeleteGroceryItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this grocery item?')) return;

    try {
      const res = await fetch(`/api/admin/grocery-items/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchGroceryItems();
    } catch (err) {
      console.error('Failed to delete grocery item', err);
      alert('Failed to delete grocery item');
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
      // Add cache-busting timestamp to prevent browser caching
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/catering/gallery?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      const data = await res.json();
      // The API returns { gallery: [...] }
      const gallery = data.gallery;
      const galleryArray = Array.isArray(gallery) ? gallery : [];
      setCateringGallery(galleryArray);
      console.log('Fetched catering gallery:', galleryArray);
    } catch (err) {
      console.error('Failed to fetch catering gallery', err);
      setCateringGallery([]); // Set empty array on error
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
        const galleryArray = Array.isArray(cateringGallery) ? cateringGallery : [];
        const newGallery = [...galleryArray, data.url];
        await saveCateringGallery(newGallery);
      }
    } catch (err) {
      console.error('Failed to upload gallery image', err);
      alert('Failed to upload image');
    }
  };

  const handleRemoveGalleryImage = async (url: string) => {
    // Ensure cateringGallery is an array before filtering
    const galleryArray = Array.isArray(cateringGallery) ? cateringGallery : [];
    const newGallery = galleryArray.filter(img => img !== url);
    await saveCateringGallery(newGallery);
  };

  const saveCateringGallery = async (gallery: string[]) => {
    try {
      const res = await fetch('/api/admin/catering/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery }),
      });
      if (!res.ok) throw new Error('Failed to save gallery');
      setCateringGallery(gallery);
      // Refresh gallery from server to ensure sync
      await fetchCateringGallery();
    } catch (err) {
      console.error('Failed to save gallery', err);
      alert('Failed to save gallery');
    }
  };

  const fetchOrderingStatus = async () => {
    try {
      const res = await fetch('/api/admin/tenant-settings');
      const data = await res.json();
      const isOpen = data.settings?.isOpen !== false;
      const temporarilyClosed = data.settings?.operatingHours?.temporarilyClosed || false;
      setIsAcceptingOrders(isOpen && !temporarilyClosed);
    } catch (err) {
      console.error('Failed to fetch ordering status', err);
    }
  };

  const toggleAcceptingOrders = async () => {
    setLoadingStatus(true);
    try {
      const newStatus = !isAcceptingOrders;

      // First, get current settings to merge properly
      const currentRes = await fetch('/api/admin/tenant-settings');
      const currentData = await currentRes.json();
      const currentHours = currentData.settings?.operatingHours || {};

      // Update with merged operating hours
      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOpen: newStatus,
          operatingHours: {
            ...currentHours,
            temporarilyClosed: false, // Clear temporary closure when toggling
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setIsAcceptingOrders(newStatus);
    } catch (err) {
      console.error('Failed to toggle ordering status', err);
      alert('Failed to update ordering status');
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchFrontendConfig = async () => {
    try {
      const res = await fetch('/api/admin/tenant-settings');
      const data = await res.json();
      if (data.settings?.frontendConfig) {
        setFrontendConfig(data.settings.frontendConfig);
      }
    } catch (err) {
      console.error('Failed to fetch frontend config', err);
    }
  };

  const saveFrontendConfig = async () => {
    setSavingFrontendConfig(true);
    try {
      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frontendConfig,
        }),
      });
      if (!res.ok) throw new Error('Failed to save frontend config');
      alert('Frontend settings saved successfully!');
    } catch (err) {
      console.error('Failed to save frontend config', err);
      alert('Failed to save frontend settings');
    } finally {
      setSavingFrontendConfig(false);
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
      displayOrder: (Array.isArray(cateringPackages) ? cateringPackages : []).length,
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu editor...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
                {/* Accepting Orders Toggle */}
                <button
                  onClick={toggleAcceptingOrders}
                  disabled={loadingStatus}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    isAcceptingOrders
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  } ${loadingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`w-2 h-2 rounded-full mr-2 ${isAcceptingOrders ? 'bg-green-600' : 'bg-red-600'}`}></span>
                  {loadingStatus ? 'Updating...' : isAcceptingOrders ? 'Accepting Orders' : 'Orders Closed'}
                </button>
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
                <button
                  onClick={() => setActiveTab('grocery')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'grocery'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Grocery Items
                </button>
                <button
                  onClick={() => setActiveTab('frontend')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'frontend'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Frontend Sections
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
          ) : activeTab === 'catering' ? (
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
                        onError={(e) => {
                          console.error('Failed to load gallery image:', url);
                          (e.target as HTMLImageElement).src = '/placeholder.jpg';
                        }}
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
                  ) : (Array.isArray(cateringPackages) ? cateringPackages : []).filter(pkg => pkg.cateringSectionId === selectedCateringSection).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No packages in this section</div>
                  ) : (
                    <div className="space-y-3">
                      {(Array.isArray(cateringPackages) ? cateringPackages : [])
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
          ) : activeTab === 'grocery' ? (
            /* Grocery Items View */
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">Grocery Items</h2>
                <button
                  onClick={handleAddGroceryItem}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Grocery Item
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">Loading grocery items...</div>
              ) : groceryItems.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500">No grocery items yet. Add your first item to get started!</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groceryItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        {!item.available && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-green-600">
                          ${item.price.toFixed(2)} {item.unit && `/ ${item.unit}`}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {item.category}
                        </span>
                      </div>
                      {item.stockQuantity !== null && (
                        <p className="text-xs text-gray-500 mb-3">Stock: {item.stockQuantity}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingGroceryItem(item)}
                          className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGroceryItem(item.id)}
                          className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'frontend' ? (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frontend Section Customization</h2>
                <p className="text-gray-600 mb-6">Customize the text displayed in various sections on your customer-facing order page. Changes sync automatically when you save.</p>

                {/* Featured Carousel Section */}
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-amber-500">⭐</span>
                      Featured Items Carousel
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">This section appears at the top of your order page and displays menu items marked as &quot;Featured&quot; in the Menu Items tab.</p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={frontendConfig.featuredCarousel.title}
                          onChange={(e) => setFrontendConfig({
                            ...frontendConfig,
                            featuredCarousel: {
                              ...frontendConfig.featuredCarousel,
                              title: e.target.value,
                            },
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Chef Recommends, Featured Specials, Today's Picks"
                        />
                        <p className="mt-1 text-sm text-gray-500">Main heading shown above the carousel</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Section Subtitle
                        </label>
                        <input
                          type="text"
                          value={frontendConfig.featuredCarousel.subtitle}
                          onChange={(e) => setFrontendConfig({
                            ...frontendConfig,
                            featuredCarousel: {
                              ...frontendConfig.featuredCarousel,
                              subtitle: e.target.value,
                            },
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Handpicked favorites from our kitchen"
                        />
                        <p className="mt-1 text-sm text-gray-500">Description shown below the title</p>
                      </div>

                      {/* Preview Box */}
                      <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-gray-900 to-gray-800">
                        <div className="mb-2">
                          <h4 className="text-2xl font-semibold text-white">
                            {frontendConfig.featuredCarousel.title || 'Chef Recommends'}
                          </h4>
                          <p className="text-sm text-white/60">
                            {frontendConfig.featuredCarousel.subtitle || 'Handpicked favorites from our kitchen'}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400 mt-4">
                          ↑ Live Preview - This is how it will appear on your order page
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hero Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-blue-500">🏠</span>
                      Hero Section
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Main hero section at the top of your order page</p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hero Subtitle
                        </label>
                        <input
                          type="text"
                          value={frontendConfig.heroSection.subtitle}
                          onChange={(e) => setFrontendConfig({
                            ...frontendConfig,
                            heroSection: {
                              ...frontendConfig.heroSection,
                              subtitle: e.target.value,
                            },
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Authentic flavors crafted with passion"
                        />
                        <p className="mt-1 text-sm text-gray-500">Tagline shown below your restaurant name</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Primary CTA Button
                          </label>
                          <input
                            type="text"
                            value={frontendConfig.heroSection.primaryCTA}
                            onChange={(e) => setFrontendConfig({
                              ...frontendConfig,
                              heroSection: {
                                ...frontendConfig.heroSection,
                                primaryCTA: e.target.value,
                              },
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., ORDER NOW"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secondary CTA Button
                          </label>
                          <input
                            type="text"
                            value={frontendConfig.heroSection.secondaryCTA}
                            onChange={(e) => setFrontendConfig({
                              ...frontendConfig,
                              heroSection: {
                                ...frontendConfig.heroSection,
                                secondaryCTA: e.target.value,
                              },
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., VIEW MENU"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quality Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-green-500">✨</span>
                      Quality/About Section
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">&quot;WE COOK FOR YOU&quot; section that highlights your quality and values</p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={frontendConfig.qualitySection.title}
                          onChange={(e) => setFrontendConfig({
                            ...frontendConfig,
                            qualitySection: {
                              ...frontendConfig.qualitySection,
                              title: e.target.value,
                            },
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., WE COOK FOR YOU, OUR STORY"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={frontendConfig.qualitySection.description}
                          onChange={(e) => setFrontendConfig({
                            ...frontendConfig,
                            qualitySection: {
                              ...frontendConfig.qualitySection,
                              description: e.target.value,
                            },
                          })}
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Fresh ingredients, authentic recipes, made with passion every single day"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Catering Panel */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-orange-500">🎉</span>
                      Catering Panel
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Title shown on the catering services panel</p>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Panel Title
                      </label>
                      <input
                        type="text"
                        value={frontendConfig.cateringPanel.title}
                        onChange={(e) => setFrontendConfig({
                          ...frontendConfig,
                          cateringPanel: {
                            ...frontendConfig.cateringPanel,
                            title: e.target.value,
                          },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 🎉 Catering Services, Event Catering, Party Packages"
                      />
                    </div>
                  </div>

                  {/* Rewards Panel */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-purple-500">⭐</span>
                      Rewards Program Panel
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Text shown on the rewards/membership panel</p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Panel Title
                        </label>
                        <input
                          type="text"
                          value={frontendConfig.rewardsPanel.title}
                          onChange={(e) => setFrontendConfig({
                            ...frontendConfig,
                            rewardsPanel: {
                              ...frontendConfig.rewardsPanel,
                              title: e.target.value,
                            },
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., ⭐ Rewards Program, VIP Club, Member Perks"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Panel Subtitle
                        </label>
                        <input
                          type="text"
                          value={frontendConfig.rewardsPanel.subtitle}
                          onChange={(e) => setFrontendConfig({
                            ...frontendConfig,
                            rewardsPanel: {
                              ...frontendConfig.rewardsPanel,
                              subtitle: e.target.value,
                            },
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Unlock Exclusive Benefits, Join the Club"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        // Reset to defaults
                        setFrontendConfig({
                          featuredCarousel: {
                            title: 'Chef Recommends',
                            subtitle: 'Handpicked favorites from our kitchen',
                          },
                          heroSection: {
                            subtitle: 'Authentic flavors crafted with passion',
                            primaryCTA: 'ORDER NOW',
                            secondaryCTA: 'VIEW MENU',
                          },
                          qualitySection: {
                            title: 'WE COOK FOR YOU',
                            description: 'Fresh ingredients, authentic recipes, made with passion every single day',
                          },
                          cateringPanel: {
                            title: '🎉 Catering Services',
                          },
                          rewardsPanel: {
                            title: '⭐ Rewards Program',
                            subtitle: 'Unlock Exclusive Benefits',
                          },
                        });
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Reset to Defaults
                    </button>
                    <button
                      onClick={saveFrontendConfig}
                      disabled={savingFrontendConfig}
                      className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingFrontendConfig ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                  {/* Info Box */}
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">How to add featured items:</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Go to the &quot;Menu Items&quot; tab</li>
                      <li>Edit any menu item</li>
                      <li>Check the &quot;Featured&quot; checkbox</li>
                      <li>Save the item - it will now appear in this carousel!</li>
                    </ol>
                    <p className="text-sm text-blue-700 mt-3">
                      💡 <strong>Tip:</strong> Changes sync automatically when customers refresh the page (Cmd+R / F5)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
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

                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingItem.available}
                      onChange={(e) => setEditingItem({ ...editingItem, available: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">Available</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingItem.isFeatured || false}
                      onChange={(e) => setEditingItem({ ...editingItem, isFeatured: e.target.checked })}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">⭐ Featured (Chef Recommends)</label>
                  </div>
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
                            let file = e.target.files?.[0];
                            if (!file) return;

                            const originalSize = file.size;
                            console.log(`Original size: ${formatFileSize(originalSize)}`);

                            try {
                              // Compress image if larger than 2MB
                              if (file.size > 2 * 1024 * 1024) {
                                console.log('Compressing image...');
                                file = await compressImage(file, {
                                  maxSizeMB: 2,
                                  maxWidthOrHeight: 1920,
                                  quality: 0.85,
                                });
                                console.log(`Compressed size: ${formatFileSize(file.size)}`);
                              }

                              const formData = new FormData();
                              formData.append('file', file);

                              const res = await fetch('/api/admin/assets/upload', {
                                method: 'POST',
                                body: formData,
                              });

                              if (!res.ok) {
                                const error = await res.json();
                                throw new Error(error.message || 'Upload failed');
                              }

                              const data = await res.json();
                              if (data.url) {
                                setEditingPackage((prev) => prev ? { ...prev, image: data.url } : prev);
                              }
                            } catch (err: any) {
                              console.error('Failed to upload image', err);
                              alert(err.message || 'Failed to upload image. Please try a smaller image.');
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
                              let file = e.target.files?.[0];
                              if (!file) return;

                              const originalSize = file.size;
                              console.log(`Gallery upload - Original size: ${formatFileSize(originalSize)}`);

                              try {
                                // Compress image if larger than 2MB
                                if (file.size > 2 * 1024 * 1024) {
                                  console.log('Compressing gallery image...');
                                  file = await compressImage(file, {
                                    maxSizeMB: 2,
                                    maxWidthOrHeight: 1920,
                                    quality: 0.85,
                                  });
                                  console.log(`Compressed size: ${formatFileSize(file.size)}`);
                                }

                                const formData = new FormData();
                                formData.append('file', file);

                                const res = await fetch('/api/admin/assets/upload', {
                                  method: 'POST',
                                  body: formData,
                                });

                                if (!res.ok) {
                                  const error = await res.json();
                                  throw new Error(error.message || 'Upload failed');
                                }

                                const data = await res.json();
                                if (data.url) {
                                  setEditingPackage((prev) => {
                                    if (!prev) return prev;
                                    const currentGallery = prev.gallery || [];
                                    return { ...prev, gallery: [...currentGallery, data.url] };
                                  });
                                }
                              } catch (err: any) {
                                console.error('Failed to upload image', err);
                                alert(err.message || 'Failed to upload image. Please try a smaller image.');
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

        {/* Grocery Item Edit Modal */}
        {editingGroceryItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  {editingGroceryItem.id ? 'Edit Grocery Item' : 'Add Grocery Item'}
                </h3>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveGroceryItem(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={editingGroceryItem.name || ''}
                      onChange={(e) => setEditingGroceryItem({ ...editingGroceryItem, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingGroceryItem.description || ''}
                      onChange={(e) => setEditingGroceryItem({ ...editingGroceryItem, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price ($) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingGroceryItem.price || ''}
                        onChange={(e) => setEditingGroceryItem({ ...editingGroceryItem, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit (optional)
                      </label>
                      <input
                        type="text"
                        value={editingGroceryItem.unit || ''}
                        onChange={(e) => setEditingGroceryItem({ ...editingGroceryItem, unit: e.target.value })}
                        placeholder="e.g., lb, each, dozen"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={editingGroceryItem.category || 'general'}
                        onChange={(e) => setEditingGroceryItem({ ...editingGroceryItem, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="general">General</option>
                        <option value="produce">Produce</option>
                        <option value="dairy">Dairy & Eggs</option>
                        <option value="meat">Meat & Seafood</option>
                        <option value="bakery">Bakery</option>
                        <option value="pantry">Pantry Staples</option>
                        <option value="beverages">Beverages</option>
                        <option value="snacks">Snacks</option>
                        <option value="frozen">Frozen Foods</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock Quantity (optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editingGroceryItem.stockQuantity ?? ''}
                        onChange={(e) => setEditingGroceryItem({
                          ...editingGroceryItem,
                          stockQuantity: e.target.value === '' ? null : parseInt(e.target.value)
                        })}
                        placeholder="Leave empty for unlimited"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingGroceryItem.displayOrder ?? 0}
                      onChange={(e) => setEditingGroceryItem({ ...editingGroceryItem, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          const compressed = await compressImage(file, { maxSizeMB: 2, maxWidthOrHeight: 1920 });
                          const fd = new FormData();
                          fd.append('file', compressed);
                          const res = await fetch('/api/admin/assets/upload', { method: 'POST', body: fd });
                          if (!res.ok) {
                            const err = await res.json();
                            throw new Error(err.message || 'Upload failed');
                          }
                          const data = await res.json();
                          setEditingGroceryItem({ ...editingGroceryItem, image: data.url });
                          alert('Image uploaded successfully!');
                        } catch (err: any) {
                          console.error(err);
                          alert('Upload failed: ' + err.message);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                    {editingGroceryItem.image && (
                      <div className="mt-2">
                        <img
                          src={editingGroceryItem.image}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded border border-gray-200"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="grocery-available"
                      checked={editingGroceryItem.available !== false}
                      onChange={(e) => setEditingGroceryItem({ ...editingGroceryItem, available: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="grocery-available" className="ml-2 block text-sm text-gray-900">
                      Available for purchase
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingGroceryItem(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

