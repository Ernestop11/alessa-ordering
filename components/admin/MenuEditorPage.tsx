'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, GripVertical, ArrowLeft } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { compressImage, formatFileSize } from '@/lib/imageCompression';
import { validateOperatingHours } from '@/lib/hours-validator';

// Version constant - increment this to force cache refresh
const MENU_EDITOR_VERSION = '2025-12-13-v2';

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

interface FrontendUISection {
  id: string;
  name: string;
  type: 'hero' | 'quickInfo' | 'featuredCarousel' | 'menuSections' | 'promoBanner1' | 'groceryBanner' | 'weCookBanner' | 'dealStrip' | 'qualityBanner' | 'reviewsStrip';
  position: number;
  enabled: boolean;
  content: {
    title?: string;
    subtitle?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    image?: string;
    badge?: string;
    backgroundColor?: string;
    textColor?: string;
    gradientFrom?: string;
    gradientTo?: string;
  };
}

export default function MenuEditorPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'menu' | 'catering' | 'grocery' | 'frontend'>('menu');
  const [grocerySubTab, setGrocerySubTab] = useState<'items' | 'bundles' | 'weekend'>('items');
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cateringSections, setCateringSections] = useState<CateringSection[]>([]);
  const [cateringPackages, setCateringPackages] = useState<CateringPackage[]>([]);
  const [groceryItems, setGroceryItems] = useState<any[]>([]);
  const [groceryBundles, setGroceryBundles] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedCateringSection, setSelectedCateringSection] = useState<string | null>(null);
  const [selectedGroceryCategory, setSelectedGroceryCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingSection, setEditingSection] = useState<MenuSection | null>(null);
  const [editingCateringSection, setEditingCateringSection] = useState<CateringSection | null>(null);
  const [editingPackage, setEditingPackage] = useState<CateringPackage | null>(null);
  const [editingGroceryItem, setEditingGroceryItem] = useState<any | null>(null);
  const [editingGroceryBundle, setEditingGroceryBundle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [cateringGallery, setCateringGallery] = useState<string[]>([]);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(false); // Default to closed until status is fetched
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Frontend UI sections state
  const [frontendUISections, setFrontendUISections] = useState<FrontendUISection[]>([]);
  const [editingFrontendSection, setEditingFrontendSection] = useState<FrontendUISection | null>(null);
  const [savingFrontendSection, setSavingFrontendSection] = useState(false);
  const [reorderingSection, setReorderingSection] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  
  // Add-ons state
  const [enabledAddOns, setEnabledAddOns] = useState<string[]>([]);
  const [availableAddOns, setAvailableAddOns] = useState<any[]>([]);

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

  const fetchGroceryBundles = async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/grocery-bundles?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      const data = await res.json();
      const bundlesArray = Array.isArray(data) ? data : [];
      setGroceryBundles(bundlesArray);
    } catch (err) {
      console.error('Failed to fetch grocery bundles', err);
      setGroceryBundles([]);
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

  const handleSaveGroceryItem = async () => {
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

  const handleSaveGroceryBundle = async () => {
    if (!editingGroceryBundle) return;

    try {
      const method = editingGroceryBundle.id ? 'PATCH' : 'POST';
      const url = editingGroceryBundle.id
        ? `/api/admin/grocery-bundles/${editingGroceryBundle.id}`
        : '/api/admin/grocery-bundles';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGroceryBundle),
      });

      if (!res.ok) throw new Error('Failed to save grocery bundle');
      await fetchGroceryBundles();
      setEditingGroceryBundle(null);
    } catch (err) {
      console.error('Failed to save grocery bundle', err);
      alert('Failed to save grocery bundle');
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

  const fetchOrderingStatus = useCallback(async () => {
    try {
      // Aggressive cache busting
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/tenant-settings?t=${timestamp}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      if (!res.ok) {
        console.error('Failed to fetch ordering status:', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      const isOpenFlag = data.settings?.isOpen === true; // Only true if explicitly true, null/undefined = closed
      const operatingHours = data.settings?.operatingHours;

      // Use the same validation logic as the front-end
      const validation = validateOperatingHours(operatingHours, isOpenFlag);
      setIsAcceptingOrders(validation.isOpen);

      console.log('[MenuEditor] Operating status:', {
        isOpenFlag,
        validationResult: validation,
        actuallyAccepting: validation.isOpen,
        reason: validation.reason,
        message: validation.message,
      });
    } catch (err) {
      console.error('Failed to fetch ordering status', err);
    }
  }, []);

  // Main initialization useEffect - placed after fetchOrderingStatus to avoid hoisting issues
  useEffect(() => {
    // Update version without causing redirects or clearing storage
    const cachedVersion = localStorage.getItem('menu-editor-version');
    if (cachedVersion !== MENU_EDITOR_VERSION) {
      console.log('[MenuEditor] Version updated:', { cached: cachedVersion, current: MENU_EDITOR_VERSION });
      localStorage.setItem('menu-editor-version', MENU_EDITOR_VERSION);
    }

    console.log('[MenuEditor] Initializing...');

    fetchSections();
    fetchItems();
    fetchCateringSections();
    fetchCateringPackages();
    fetchGroceryItems();
    fetchGroceryBundles();
    fetchCateringGallery();
    fetchOrderingStatus();
    fetchFrontendUISections();

    // Re-check operating hours every 30 seconds to keep toggle synced
  }, []);

  // Fetch frontend sections when tab is active
  useEffect(() => {
    if (activeTab === 'frontend') {
      fetchFrontendUISections();
    }
    const statusInterval = setInterval(() => {
      fetchOrderingStatus();
    }, 30000);

    // Listen for operating hours updates from Settings page
    const handleHoursUpdate = () => {
      console.log('[MenuEditor] Operating hours updated, refreshing status...');
      fetchOrderingStatus();
    };
    window.addEventListener('operatingHoursUpdated', handleHoursUpdate);

    return () => {
      clearInterval(statusInterval);
      window.removeEventListener('operatingHoursUpdated', handleHoursUpdate);
    };
  }, [fetchOrderingStatus]);

  // Fetch frontend sections and add-ons when tab is active
  useEffect(() => {
    if (activeTab === 'frontend') {
      fetchFrontendUISections();
      fetchAddOns();
    }
  }, [activeTab]);

  const toggleAcceptingOrders = async () => {
    setLoadingStatus(true);
    try {
      // Get current status to determine what to toggle (with aggressive cache busting)
      const timestamp = Date.now();
      const currentRes = await fetch(`/api/admin/tenant-settings?t=${timestamp}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!currentRes.ok) throw new Error('Failed to fetch current settings');
      const currentData = await currentRes.json();
      const currentHours = currentData.settings?.operatingHours || {};
      const currentIsOpen = currentData.settings?.isOpen === true; // Only true if explicitly true
      
      // Get the actual validation result to see current state
      const currentValidation = validateOperatingHours(currentHours, currentIsOpen);
      const currentlyOpen = currentValidation.isOpen;
      
      // Toggle: if currently open (based on hours), set isOpen to false to close
      // If currently closed (based on hours), set isOpen to true to open (if hours allow)
      const newIsOpen = !currentlyOpen;

      // Update with merged operating hours (with aggressive cache busting)
      const res = await fetch(`/api/admin/tenant-settings?t=${Date.now()}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({
          isOpen: newIsOpen, // Explicitly set true or false
          operatingHours: {
            ...currentHours,
            temporarilyClosed: false, // Clear temporary closure when toggling
          },
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[MenuEditor] Failed to update status:', res.status, errorText);
        throw new Error(`Failed to update status: ${res.status} ${errorText}`);
      }
      
      const updatedData = await res.json();
      console.log('[MenuEditor] Status updated:', {
        requestedIsOpen: newIsOpen,
        serverResponse: updatedData.settings?.isOpen,
      });
      
      // Refetch status from server to ensure sync (this will recalculate based on hours + isOpen)
      await fetchOrderingStatus();
    } catch (err) {
      console.error('Failed to toggle ordering status', err);
      alert('Failed to update ordering status. Please refresh the page.');
      // Refetch to restore correct state
      await fetchOrderingStatus();
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchFrontendUISections = async () => {
    try {
      // Cache busting - same pattern as "Accepting Orders"
      const res = await fetch(`/api/admin/frontend-ui-sections?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setFrontendUISections(data || []);
    } catch (err) {
      console.error('Failed to fetch frontend UI sections', err);
      setFrontendUISections([]);
    }
  };

  const handleSaveFrontendSection = async () => {
    if (!editingFrontendSection) return;
    setSavingFrontendSection(true);

    try {
      const res = await fetch(`/api/admin/frontend-ui-sections/${editingFrontendSection.id}?t=${Date.now()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFrontendSection),
        cache: 'no-store',
      });

      if (!res.ok) throw new Error('Failed to save frontend section');
      
      // Cache busting: revalidate paths
      await fetch('/api/admin/revalidate?path=/order&path=/', { method: 'POST' }).catch(() => {});
      
      await fetchFrontendUISections();
      setEditingFrontendSection(null);
      
      // Trigger router refresh for immediate frontend update (same as Accept Orders)
      router.refresh();
    } catch (err) {
      console.error('Failed to save frontend section', err);
      alert('Failed to save frontend section');
    } finally {
      setSavingFrontendSection(false);
    }
  };

  // Delete section (same pattern as Accept Orders)
  const handleDeleteFrontendSection = async (sectionId: string) => {
    if (!confirm('Delete this section? This cannot be undone.')) return;
    
    setSyncStatus('syncing');
    
    try {
      const res = await fetch(`/api/admin/frontend-ui-sections?id=${sectionId}&t=${Date.now()}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      if (!res.ok) throw new Error('Failed to delete');
      
      await fetchFrontendUISections();
      setSyncStatus('synced');
      
      // Trigger router refresh for immediate frontend update (same as Accept Orders)
      router.refresh();
      
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to delete section', err);
      alert('Failed to delete. Please refresh the page.');
    }
  };

  // Move section up/down - INSTANT SYNC (same pattern as Accept Orders)
  const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    setReorderingSection(sectionId);
    setSyncStatus('syncing');
    
    try {
      const res = await fetch(`/api/admin/frontend-ui-sections/reorder?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({ sectionId, direction }),
      });

      if (!res.ok) throw new Error('Failed to reorder');
      
      const data = await res.json();
      setFrontendUISections(data.sections);
      setSyncStatus('synced');
      
      // Trigger router refresh for immediate frontend update (same as Accept Orders)
      router.refresh();
      
      // Reset sync indicator after 2s
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to move section', err);
      alert('Failed to reorder. Please refresh the page.');
      await fetchFrontendUISections(); // Refetch on error
    } finally {
      setReorderingSection(null);
    }
  };

  // Toggle section enabled/disabled - INSTANT SYNC (same pattern as Accept Orders)
  const handleToggleSection = async (sectionId: string, currentEnabled: boolean) => {
    setSyncStatus('syncing');
    
    try {
      const res = await fetch(`/api/admin/frontend-ui-sections?t=${Date.now()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({
          sectionId,
          updates: { enabled: !currentEnabled },
        }),
      });

      if (!res.ok) throw new Error('Failed to toggle');
      
      const data = await res.json();
      setFrontendUISections(data.sections);
      setSyncStatus('synced');
      
      // Trigger router refresh for immediate frontend update (same as Accept Orders)
      router.refresh();
      
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to toggle section', err);
      alert('Failed to update. Please refresh the page.');
      await fetchFrontendUISections();
    }
  };

  // Fetch add-ons (same pattern as Accept Orders)
  const fetchAddOns = async () => {
    try {
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/addons?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch add-ons');
      const data = await res.json();
      setEnabledAddOns(data.enabledAddOns || []);
      setAvailableAddOns(data.available || []);
    } catch (err) {
      console.error('Failed to fetch add-ons', err);
      setEnabledAddOns([]);
      setAvailableAddOns([]);
    }
  };

  // Toggle add-on (same pattern as Accept Orders)
  const handleToggleAddOn = async (addOnId: string, currentEnabled: boolean) => {
    setSyncStatus('syncing');
    
    try {
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/addons?t=${timestamp}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({
          addOnId,
          enabled: !currentEnabled,
        }),
      });

      if (!res.ok) throw new Error('Failed to toggle add-on');
      
      const data = await res.json();
      setEnabledAddOns(data.enabledAddOns || []);
      setFrontendUISections(data.sections || frontendUISections);
      setSyncStatus('synced');
      
      // Refetch add-ons to get updated list
      await fetchAddOns();
      
      // Refetch sections to get newly seeded sections
      await fetchFrontendUISections();
      
      // Trigger router refresh for immediate frontend update (same as Accept Orders)
      router.refresh();
      
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to toggle add-on', err);
      alert('Failed to update add-on. Please refresh the page.');
      await fetchAddOns();
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
            /* Grocery View with Sub-tabs */
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">Grocery Management</h2>
              </div>

              {/* Sub-tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setGrocerySubTab('items')}
                    className={`${
                      grocerySubTab === 'items'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Grocery Items
                  </button>
                  <button
                    onClick={() => setGrocerySubTab('bundles')}
                    className={`${
                      grocerySubTab === 'bundles'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Bundles & Combos
                  </button>
                  <button
                    onClick={() => setGrocerySubTab('weekend')}
                    className={`${
                      grocerySubTab === 'weekend'
                        ? 'border-yellow-500 text-yellow-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    🌟 Weekend Specials
                  </button>
                </nav>
              </div>

              {/* Grocery Items Sub-tab */}
              {grocerySubTab === 'items' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Categories List */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow p-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
                      <div className="space-y-2">
                        {Array.from(new Set(groceryItems.map(item => item.category))).sort().map((category) => {
                          const itemsInCategory = groceryItems.filter(item => item.category === category).length;
                          return (
                            <div
                              key={category}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedGroceryCategory === category
                                  ? 'bg-green-50 border-2 border-green-500'
                                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                              }`}
                              onClick={() => setSelectedGroceryCategory(category)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 capitalize">{category}</span>
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{itemsInCategory}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {selectedGroceryCategory ? `${selectedGroceryCategory.charAt(0).toUpperCase() + selectedGroceryCategory.slice(1)} Items` : 'Select a category'}
                        </h2>
                        {selectedGroceryCategory && (
                          <button
                            onClick={() => {
                              setEditingGroceryItem({
                                id: null,
                                name: '',
                                description: '',
                                price: 0,
                                category: selectedGroceryCategory,
                                unit: '',
                                image: null,
                                available: true,
                                stockQuantity: null,
                                taxPercentage: null,
                                expirationDate: null,
                                displayOrder: 0,
                                isWeekendSpecial: false,
                                weekendPrice: null,
                                weekendStartDate: null,
                                weekendEndDate: null,
                              });
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </button>
                        )}
                      </div>

                      {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                      ) : !selectedGroceryCategory ? (
                        <div className="text-center py-8 text-gray-500">
                          Select a category to view items
                        </div>
                      ) : groceryItems.filter(item => item.category === selectedGroceryCategory).length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No items in this category
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {groceryItems
                            .filter(item => item.category === selectedGroceryCategory)
                            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                            .map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                              {item.image && (
                                <img src={item.image} alt={item.name} className="h-12 w-12 rounded object-cover" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                                  {item.isWeekendSpecial && (
                                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded font-semibold">
                                      Weekend Special
                                    </span>
                                  )}
                                  {!item.available && (
                                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                                      Unavailable
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <p className="text-sm font-bold text-green-600">
                                    ${item.price.toFixed(2)} {item.unit && `/ ${item.unit}`}
                                  </p>
                                  {item.weekendPrice && (
                                    <p className="text-sm text-yellow-600">
                                      Weekend: ${item.weekendPrice.toFixed(2)}
                                    </p>
                                  )}
                                  {item.stockQuantity !== null && (
                                    <p className="text-xs text-gray-500">Stock: {item.stockQuantity}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingGroceryItem(item)}
                                  className="text-gray-400 hover:text-blue-600"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGroceryItem(item.id)}
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
              )}

              {/* Grocery Bundles Sub-tab */}
              {grocerySubTab === 'bundles' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-medium text-gray-900">Grocery Bundles & Combos</h3>
                      <p className="text-sm text-gray-500 mt-1">Create special combos like &quot;Pozole Kit&quot; with multiple grocery items bundled together</p>
                    </div>
                    <button
                      onClick={() => setEditingGroceryBundle({ id: null, name: '', description: '', price: 0, category: 'combo', items: [], available: true, displayOrder: 0 })}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Bundle
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">Loading bundles...</div>
                  ) : groceryBundles.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                      <p className="text-gray-500">No bundles yet. Create your first combo to get started!</p>
                      <p className="text-sm text-gray-400 mt-2">Example: &quot;Pozole Special&quot; with hominy, chiles, and pork</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {groceryBundles.map((bundle: any) => (
                        <div key={bundle.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-2 border-green-200">
                          {bundle.image && (
                            <img
                              src={bundle.image}
                              alt={bundle.name}
                              className="w-full h-32 object-cover rounded mb-3"
                            />
                          )}
                          {bundle.badge && (
                            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mb-2">
                              {bundle.badge}
                            </span>
                          )}
                          <h4 className="font-semibold text-gray-900 mb-1">{bundle.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{bundle.description}</p>
                          <p className="text-lg font-bold text-green-600 mb-2">${bundle.price.toFixed(2)}</p>
                          <div className="text-xs text-gray-500 mb-3">
                            {Array.isArray(bundle.items) && bundle.items.length > 0 && (
                              <div>Includes {bundle.items.length} items</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingGroceryBundle(bundle)}
                              className="flex-1 text-sm px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete bundle "${bundle.name}"?`)) {
                                  fetch(`/api/admin/grocery-bundles/${bundle.id}`, { method: 'DELETE' })
                                    .then(() => setGroceryBundles(groceryBundles.filter((b: any) => b.id !== bundle.id)))
                                    .catch(err => alert('Error deleting bundle'));
                                }
                              }}
                              className="flex-1 text-sm px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Weekend Specials Sub-tab */}
              {grocerySubTab === 'weekend' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-medium text-gray-900 mb-2">🌟 Weekend Specials Promotions</h3>
                    <p className="text-sm text-gray-600">
                      Select items to promote during weekends with special pricing. These will sync to Switch Menu Pro for digital menu displays.
                    </p>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">Loading items...</div>
                  ) : groceryItems.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                      <p className="text-gray-500">No grocery items available. Add items first to create weekend specials.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Active Weekend Specials */}
                      <div className="bg-white rounded-lg shadow p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Active Weekend Specials</h4>
                        {groceryItems.filter(item => item.isWeekendSpecial).length === 0 ? (
                          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                            <p>No weekend specials active. Click items below to add them.</p>
                          </div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {groceryItems
                              .filter(item => item.isWeekendSpecial)
                              .map((item) => (
                                <div key={item.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg shadow-md p-4">
                                  {item.image && (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-32 object-cover rounded mb-3"
                                    />
                                  )}
                                  <div className="flex items-start gap-2 mb-2">
                                    <h3 className="font-bold text-gray-900 flex-1">{item.name}</h3>
                                    <span className="px-2 py-1 text-xs bg-yellow-500 text-white rounded-full font-bold">
                                      SPECIAL
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                                  <div className="space-y-2 mb-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">Regular Price:</span>
                                      <span className="text-sm text-gray-600 line-through">${item.price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-yellow-700">Weekend Price:</span>
                                      <span className="text-lg font-black text-yellow-600">
                                        ${(item.weekendPrice || item.price).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setEditingGroceryItem(item)}
                                      className="flex-1 text-sm px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      Edit Price
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const res = await fetch(`/api/admin/grocery-items/${item.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              isWeekendSpecial: false,
                                              weekendPrice: null,
                                            }),
                                          });
                                          if (!res.ok) throw new Error('Failed to remove from weekend specials');
                                          await fetchGroceryItems();
                                        } catch (err) {
                                          console.error('Failed to remove weekend special', err);
                                          alert('Failed to remove weekend special');
                                        }
                                      }}
                                      className="flex-1 text-sm px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* All Available Items */}
                      <div className="bg-white rounded-lg shadow p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Add Items to Weekend Specials</h4>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {groceryItems
                            .filter(item => !item.isWeekendSpecial)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((item) => (
                              <div
                                key={item.id}
                                className="bg-white border-2 border-gray-200 hover:border-green-400 rounded-lg p-3 cursor-pointer transition group"
                                onClick={async () => {
                                  const weekendPrice = prompt(
                                    `Enter weekend special price for "${item.name}"\nCurrent price: $${item.price.toFixed(2)}`,
                                    item.price.toFixed(2)
                                  );
                                  if (weekendPrice === null) return;

                                  const price = parseFloat(weekendPrice);
                                  if (isNaN(price) || price < 0) {
                                    alert('Invalid price');
                                    return;
                                  }

                                  try {
                                    const res = await fetch(`/api/admin/grocery-items/${item.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        isWeekendSpecial: true,
                                        weekendPrice: price,
                                      }),
                                    });
                                    if (!res.ok) throw new Error('Failed to add to weekend specials');
                                    await fetchGroceryItems();
                                  } catch (err) {
                                    console.error('Failed to add weekend special', err);
                                    alert('Failed to add weekend special');
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  {item.image && (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-12 h-12 rounded object-cover"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-gray-900 text-sm truncate">{item.name}</h5>
                                    <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                                    <p className="text-sm font-bold text-green-600">${item.price.toFixed(2)}</p>
                                  </div>
                                  <Plus className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition" />
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'frontend' ? (
            <div className="space-y-6">
              {/* Header with Sync Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Frontend Sections</h2>
                  <p className="text-sm text-gray-500">
                    Reorder sections with arrows • Changes sync instantly
                  </p>
                </div>
                
                {/* Sync Status Indicator - same style as "Accepting Orders" */}
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  syncStatus === 'syncing'
                    ? 'bg-yellow-100 text-yellow-800'
                    : syncStatus === 'synced'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    syncStatus === 'syncing'
                      ? 'bg-yellow-500 animate-pulse'
                      : syncStatus === 'synced'
                      ? 'bg-green-500'
                      : 'bg-gray-400'
                  }`}></span>
                  {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'synced' ? 'Synced!' : 'Ready'}
                </div>
              </div>

              {/* Business Add-ons Grid */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Business Add-ons</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Enable add-ons to unlock additional sections and features
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availableAddOns.map((addOn) => {
                    const isEnabled = enabledAddOns.includes(addOn.id);
                    return (
                      <div
                        key={addOn.id}
                        className={`border-2 rounded-lg p-4 transition-all ${
                          isEnabled
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{addOn.icon}</span>
                            <div>
                              <h4 className="font-semibold text-gray-900">{addOn.name}</h4>
                              <p className="text-xs text-gray-500">{addOn.status}</p>
                            </div>
                          </div>
                          {/* Toggle Switch */}
                          <button
                            onClick={() => handleToggleAddOn(addOn.id, isEnabled)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              isEnabled ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                            title={isEnabled ? 'Click to disable' : 'Click to enable'}
                          >
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                              isEnabled ? 'left-6' : 'left-0.5'
                            }`} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">{addOn.description}</p>
                        {isEnabled && (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="text-xs text-green-700 font-medium">
                              ✓ {addOn.sections?.length || 0} sections enabled
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sections List */}
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                {frontendUISections.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No sections configured. Add sections below.
                  </div>
                ) : (
                  frontendUISections
                    .sort((a, b) => a.position - b.position)
                    .map((section, index) => (
                      <div
                        key={section.id}
                        className={`p-4 flex items-center gap-4 transition-opacity ${
                          !section.enabled ? 'opacity-50 bg-gray-50' : ''
                        } ${reorderingSection === section.id ? 'bg-blue-50' : ''}`}
                      >
                        {/* Reorder Arrows */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveSection(section.id, 'up')}
                            disabled={index === 0 || reorderingSection !== null}
                            className={`p-1 rounded transition-colors ${
                              index === 0 || reorderingSection !== null
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                            title="Move up"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMoveSection(section.id, 'down')}
                            disabled={index === frontendUISections.length - 1 || reorderingSection !== null}
                            className={`p-1 rounded transition-colors ${
                              index === frontendUISections.length - 1 || reorderingSection !== null
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                            title="Move down"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {/* Position Badge */}
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                          {index + 1}
                        </div>

                        {/* Section Icon */}
                        <span className="text-2xl">
                          {section.type === 'hero' ? '🖼️' :
                           section.type === 'promoBanner1' ? '📢' :
                           section.type === 'groceryBanner' ? '🛒' :
                           section.type === 'panaderiaBanner' ? '🥐' :
                           section.type === 'quickInfo' ? '📍' :
                           section.type === 'featuredCarousel' ? '⭐' :
                           section.type === 'menuSections' ? '🍽️' :
                           section.type === 'weCookBanner' ? '👨‍🍳' :
                           section.type === 'dealStrip' ? '💰' :
                           section.type === 'qualityBanner' ? '✨' :
                           section.type === 'reviewsStrip' ? '💬' : '📄'}
                        </span>

                        {/* Section Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{section.name}</h3>
                          <p className="text-xs text-gray-500">{section.type}</p>
                        </div>

                        {/* Enable/Disable Toggle */}
                        <button
                          onClick={() => handleToggleSection(section.id, section.enabled)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            section.enabled ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                          title={section.enabled ? 'Click to disable' : 'Click to enable'}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                            section.enabled ? 'left-6' : 'left-0.5'
                          }`} />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingFrontendSection({ ...section, content: section.content || {} });
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit section"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteFrontendSection(section.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete section"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))
                )}
              </div>

              {/* Add Section Button */}
              <button
                onClick={() => {
                  setEditingFrontendSection(null);
                }}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Section
              </button>

              {/* Stats Footer */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500 flex items-center justify-between">
                <span>
                  {frontendUISections.filter(s => s.enabled).length} of {frontendUISections.length} sections enabled
                </span>
                <span>
                  Order page: /order
                </span>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Percentage (optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={editingGroceryItem.taxPercentage ?? ''}
                        onChange={(e) => setEditingGroceryItem({
                          ...editingGroceryItem,
                          taxPercentage: e.target.value === '' ? null : parseFloat(e.target.value)
                        })}
                        placeholder="e.g., 8.5 for 8.5%"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration Date (optional)
                    </label>
                    <input
                      type="date"
                      value={editingGroceryItem.expirationDate ? new Date(editingGroceryItem.expirationDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingGroceryItem({
                        ...editingGroceryItem,
                        expirationDate: e.target.value ? e.target.value : null
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">For perishable items - helps track freshness</p>
                  </div>

                  {/* Weekend Special Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="grocery-weekend-special"
                        checked={editingGroceryItem.isWeekendSpecial || false}
                        onChange={(e) => setEditingGroceryItem({
                          ...editingGroceryItem,
                          isWeekendSpecial: e.target.checked,
                          weekendPrice: e.target.checked ? (editingGroceryItem.weekendPrice || editingGroceryItem.price) : null
                        })}
                        className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      />
                      <label htmlFor="grocery-weekend-special" className="ml-2 block text-sm font-medium text-gray-900">
                        🌟 Mark as Weekend Special
                      </label>
                    </div>

                    {editingGroceryItem.isWeekendSpecial && (
                      <div className="ml-6 space-y-3 bg-yellow-50 p-3 rounded-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Weekend Price ($) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingGroceryItem.weekendPrice ?? ''}
                            onChange={(e) => setEditingGroceryItem({
                              ...editingGroceryItem,
                              weekendPrice: e.target.value === '' ? null : parseFloat(e.target.value)
                            })}
                            placeholder={`Regular: $${editingGroceryItem.price || 0}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Special pricing for weekends (typically lower than regular price)
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Date (optional)
                            </label>
                            <input
                              type="date"
                              value={editingGroceryItem.weekendStartDate ? new Date(editingGroceryItem.weekendStartDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => setEditingGroceryItem({
                                ...editingGroceryItem,
                                weekendStartDate: e.target.value ? e.target.value : null
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Date (optional)
                            </label>
                            <input
                              type="date"
                              value={editingGroceryItem.weekendEndDate ? new Date(editingGroceryItem.weekendEndDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => setEditingGroceryItem({
                                ...editingGroceryItem,
                                weekendEndDate: e.target.value ? e.target.value : null
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Leave dates empty to keep special active indefinitely
                        </p>
                      </div>
                    )}
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

        {/* Grocery Bundle Edit Modal */}
        {editingGroceryBundle && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setEditingGroceryBundle(null)} />
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <form onSubmit={(e) => { e.preventDefault(); handleSaveGroceryBundle(); }} className="space-y-4">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {editingGroceryBundle.id ? 'Edit' : 'Create'} Grocery Bundle
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Name</label>
                        <input
                          type="text"
                          required
                          value={editingGroceryBundle.name || ''}
                          onChange={(e) => setEditingGroceryBundle({ ...editingGroceryBundle, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="e.g., Pozole Special Kit"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          required
                          value={editingGroceryBundle.description || ''}
                          onChange={(e) => setEditingGroceryBundle({ ...editingGroceryBundle, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                          placeholder="e.g., Everything you need to make authentic pozole: hominy, chiles, pork"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={editingGroceryBundle.price || 0}
                          onChange={(e) => setEditingGroceryBundle({ ...editingGroceryBundle, price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Badge (optional)</label>
                        <input
                          type="text"
                          value={editingGroceryBundle.badge || ''}
                          onChange={(e) => setEditingGroceryBundle({ ...editingGroceryBundle, badge: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="e.g., Popular, Best Value"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={editingGroceryBundle.category || 'combo'}
                          onChange={(e) => setEditingGroceryBundle({ ...editingGroceryBundle, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="combo">Combo</option>
                          <option value="meal-kit">Meal Kit</option>
                          <option value="special">Special</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                        <input
                          type="number"
                          value={editingGroceryBundle.displayOrder || 0}
                          onChange={(e) => setEditingGroceryBundle({ ...editingGroceryBundle, displayOrder: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingGroceryBundle.available !== false}
                            onChange={(e) => setEditingGroceryBundle({ ...editingGroceryBundle, available: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Available for purchase</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 font-medium"
                    >
                      Save Bundle
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingGroceryBundle(null)}
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

        {/* Frontend Section Edit Modal - Enhanced Visual Editor */}
        {editingFrontendSection && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {editingFrontendSection.type === 'featuredCarousel' ? '🌟' :
                     editingFrontendSection.type === 'hero' ? '🏠' :
                     editingFrontendSection.type === 'promoBanner1' ? '📢' :
                     editingFrontendSection.type === 'groceryBanner' ? '🛒' :
                     editingFrontendSection.type === 'panaderiaBanner' ? '🥐' :
                     editingFrontendSection.type === 'weCookBanner' ? '👨‍🍳' :
                     editingFrontendSection.type === 'dealStrip' ? '🏷️' :
                     editingFrontendSection.type === 'qualityBanner' ? '✨' :
                     editingFrontendSection.type === 'reviewsStrip' ? '⭐' : '📋'}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{editingFrontendSection.name}</h3>
                    <p className="text-sm text-gray-400">Edit section content and appearance</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingFrontendSection.enabled}
                      onChange={(e) =>
                        setEditingFrontendSection({
                          ...editingFrontendSection,
                          enabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-white font-medium">
                      {editingFrontendSection.enabled ? 'Visible' : 'Hidden'}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingFrontendSection(null)}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveFrontendSection();
                  }}
                >
                  {/* ============================================ */}
                  {/* FEATURED CAROUSEL - Item Selection FIRST */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'featuredCarousel' && (
                    <div className="p-6 bg-gradient-to-b from-yellow-50 to-white border-b">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            <span className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded text-sm">STEP 1</span>
                            Select Featured Items
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Click items below to add/remove from the carousel. Changes save instantly!
                          </p>
                        </div>
                        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold text-lg">
                          {items.filter(i => i.isFeatured).length} items
                        </div>
                      </div>

                      {/* Currently Selected - Visual Grid */}
                      {items.filter(i => i.isFeatured).length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-yellow-700 mb-2 uppercase tracking-wide">Currently in Carousel:</p>
                          <div className="flex flex-wrap gap-3">
                            {items.filter(i => i.isFeatured).map((item) => (
                              <div
                                key={item.id}
                                className="relative group"
                              >
                                <div className="w-20 h-20 rounded-xl overflow-hidden border-3 border-yellow-400 shadow-lg">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-2xl">🍽️</div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setItems(items.map(i => i.id === item.id ? { ...i, isFeatured: false } : i));
                                    try {
                                      await fetch(`/api/menu/${item.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ isFeatured: false }),
                                      });
                                    } catch (err) {
                                      setItems(items.map(i => i.id === item.id ? { ...i, isFeatured: true } : i));
                                    }
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg hover:bg-red-600 transition-colors"
                                >
                                  ×
                                </button>
                                <p className="text-xs text-center mt-1 font-medium text-gray-700 truncate w-20">{item.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Items Grid by Category */}
                      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl bg-white">
                        {items.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-8">No menu items. Add items in Menu tab first.</p>
                        ) : (
                          <div>
                            {(() => {
                              const categories = Array.from(new Set(items.map(i => i.category || 'Uncategorized'))).sort();
                              return categories.map((category) => {
                                const categoryItems = items.filter(i => (i.category || 'Uncategorized') === category);
                                return (
                                  <div key={category} className="border-b border-gray-100 last:border-b-0">
                                    <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200 z-10">
                                      <h5 className="font-bold text-gray-700 text-sm">{category}</h5>
                                    </div>
                                    <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {categoryItems.map((item) => (
                                        <button
                                          type="button"
                                          key={item.id}
                                          onClick={async () => {
                                            const newFeatured = !item.isFeatured;
                                            setItems(items.map(i => i.id === item.id ? { ...i, isFeatured: newFeatured } : i));
                                            try {
                                              await fetch(`/api/menu/${item.id}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ isFeatured: newFeatured }),
                                              });
                                            } catch (err) {
                                              setItems(items.map(i => i.id === item.id ? { ...i, isFeatured: !newFeatured } : i));
                                            }
                                          }}
                                          className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                                            item.isFeatured
                                              ? 'bg-yellow-100 border-2 border-yellow-400 shadow-md'
                                              : 'bg-white border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                                          }`}
                                        >
                                          {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                                          ) : (
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">🍽️</div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500">${item.price.toFixed(2)}</p>
                                          </div>
                                          {item.isFeatured && <span className="text-yellow-500">⭐</span>}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* HERO SECTION - Visual Editor */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'hero' && (
                    <div className="p-6 bg-gradient-to-b from-blue-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-sm font-bold">HERO</span>
                        <h4 className="font-bold text-gray-900">Main Banner Settings</h4>
                      </div>

                      {/* Live Preview */}
                      <div className="mb-6 rounded-xl overflow-hidden border border-gray-300 shadow-lg">
                        <div
                          className="relative h-48 bg-cover bg-center"
                          style={{
                            backgroundImage: editingFrontendSection.content?.image
                              ? `url(${editingFrontendSection.content.image})`
                              : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                          }}
                        >
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4">
                            <h2 className="text-2xl font-bold text-white mb-2">
                              {editingFrontendSection.content?.title || 'Your Restaurant Name'}
                            </h2>
                            <p className="text-white/80 text-sm mb-4">
                              {editingFrontendSection.content?.subtitle || 'Authentic flavors crafted with passion'}
                            </p>
                            <button className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-sm">
                              {editingFrontendSection.content?.buttonText || 'ORDER NOW'}
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-100 px-3 py-2 text-xs text-gray-500 text-center">
                          Live Preview - Changes appear as you type
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Hero Image URL</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.image || ''}
                            onChange={(e) =>
                              setEditingFrontendSection({
                                ...editingFrontendSection,
                                content: { ...(editingFrontendSection.content || {}), image: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://images.unsplash.com/..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title (optional)</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) =>
                              setEditingFrontendSection({
                                ...editingFrontendSection,
                                content: { ...(editingFrontendSection.content || {}), title: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Leave empty to use restaurant name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) =>
                              setEditingFrontendSection({
                                ...editingFrontendSection,
                                content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Authentic flavors crafted with passion"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.buttonText || ''}
                            onChange={(e) =>
                              setEditingFrontendSection({
                                ...editingFrontendSection,
                                content: { ...(editingFrontendSection.content || {}), buttonText: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="ORDER NOW"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Link</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.buttonLink || ''}
                            onChange={(e) =>
                              setEditingFrontendSection({
                                ...editingFrontendSection,
                                content: { ...(editingFrontendSection.content || {}), buttonLink: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="#menu"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* PROMO BANNER - Visual Editor */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'promoBanner1' && (
                    <div className="p-6 bg-gradient-to-b from-orange-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-sm font-bold">LIVE PREVIEW</span>
                      </div>
                      {/* Preview Panel */}
                      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-orange-200 mb-6">
                        <div
                          className="relative h-40 bg-cover bg-center"
                          style={{
                            backgroundImage: editingFrontendSection.content?.image
                              ? `url(${editingFrontendSection.content.image})`
                              : 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
                            backgroundColor: editingFrontendSection.content?.backgroundColor || '#dc2626'
                          }}
                        >
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-between p-6">
                            <div className="text-white">
                              <h2 className="text-2xl font-bold mb-1">
                                {editingFrontendSection.content?.title || 'Promotional Title'}
                              </h2>
                              <p className="text-white/90 text-sm">
                                {editingFrontendSection.content?.subtitle || 'Add your promo description here'}
                              </p>
                            </div>
                            {editingFrontendSection.content?.buttonText && (
                              <button className="bg-white text-red-600 px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                                {editingFrontendSection.content.buttonText}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Editor Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Background Image URL</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.image || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), image: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="https://your-image-url.jpg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), title: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="FAMILY BUNDLES"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Perfect for the whole family"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.buttonText || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), buttonText: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Order Bundle"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Background Color</label>
                            <div className="flex gap-2">
                              <input type="color" value={editingFrontendSection.content?.backgroundColor || '#dc2626'} onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), backgroundColor: e.target.value } })} className="w-10 h-10 rounded cursor-pointer" />
                              <input type="text" value={editingFrontendSection.content?.backgroundColor || ''} onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), backgroundColor: e.target.value } })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="#dc2626" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* GROCERY BANNER - Visual Editor */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'groceryBanner' && (
                    <div className="p-6 bg-gradient-to-b from-green-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-green-600 text-white px-2 py-0.5 rounded text-sm font-bold">LIVE PREVIEW</span>
                      </div>
                      {/* Preview Panel */}
                      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-green-200 mb-6">
                        <div className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 p-6 flex items-center justify-between">
                          <div className="text-white">
                            <span className="text-3xl mb-2 block">🛒</span>
                            <h2 className="text-2xl font-bold mb-1">
                              {editingFrontendSection.content?.title || 'Order Your Groceries Too!'}
                            </h2>
                            <p className="text-white/90 text-sm">
                              {editingFrontendSection.content?.subtitle || 'Fresh produce and pantry staples'}
                            </p>
                          </div>
                          <button className="bg-white text-green-700 px-6 py-3 rounded-full font-bold text-sm shadow-lg">
                            {editingFrontendSection.content?.buttonText || 'Browse Grocery'}
                          </button>
                        </div>
                      </div>
                      {/* Editor Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), title: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Order Your Groceries Too!"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Fresh produce, pantry staples, and more"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.buttonText || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), buttonText: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Browse Grocery Store"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Link</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.buttonLink || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), buttonLink: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="/grocery"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* PANADERIA BANNER - Visual Editor */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'panaderiaBanner' && (
                    <div className="p-6 bg-gradient-to-b from-amber-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">LIVE PREVIEW</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Panaderia Add-on</span>
                      </div>
                      {/* Preview Panel */}
                      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-amber-200 mb-6">
                        <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 p-6 flex items-center justify-between">
                          <div className="text-white">
                            <span className="text-3xl mb-2 block">🥐</span>
                            <h2 className="text-2xl font-bold mb-1">
                              {editingFrontendSection.content?.title || 'Fresh Baked Daily!'}
                            </h2>
                            <p className="text-white/90 text-sm">
                              {editingFrontendSection.content?.subtitle || 'Authentic Mexican pastries and breads'}
                            </p>
                          </div>
                          <button className="bg-white text-amber-700 px-6 py-3 rounded-full font-bold text-sm shadow-lg">
                            {editingFrontendSection.content?.buttonText || 'Browse Bakery'}
                          </button>
                        </div>
                      </div>
                      {/* Editor Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), title: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Fresh Baked Daily!"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Authentic Mexican pastries and breads made fresh every morning"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.buttonText || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), buttonText: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Browse Bakery"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Link</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.buttonLink || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), buttonLink: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="/bakery"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* WE COOK BANNER - Visual Editor */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'weCookBanner' && (
                    <div className="p-6 bg-gradient-to-b from-red-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-red-600 text-white px-2 py-0.5 rounded text-sm font-bold">LIVE PREVIEW</span>
                      </div>
                      {/* Preview Panel */}
                      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-red-200 mb-6">
                        <div className="bg-gradient-to-r from-red-700 via-red-600 to-orange-600 p-8 text-center">
                          <span className="text-4xl mb-3 block">👨‍🍳</span>
                          <h2 className="text-3xl font-black text-white tracking-wide mb-2">
                            {editingFrontendSection.content?.title || 'WE COOK FOR YOU'}
                          </h2>
                          <p className="text-white/90 text-sm max-w-md mx-auto">
                            {editingFrontendSection.content?.description || 'Fresh ingredients, authentic recipes, made with passion'}
                          </p>
                        </div>
                      </div>
                      {/* Editor Fields */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), title: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="WE COOK FOR YOU"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                          <textarea
                            value={editingFrontendSection.content?.description || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), description: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            rows={2}
                            placeholder="Fresh ingredients, authentic recipes, made with passion every single day"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* DEAL STRIP - Visual Editor */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'dealStrip' && (
                    <div className="p-6 bg-gradient-to-b from-yellow-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-yellow-500 text-white px-2 py-0.5 rounded text-sm font-bold">LIVE PREVIEW</span>
                      </div>
                      {/* Preview Panel */}
                      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-yellow-200 mb-6">
                        <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">🏷️</span>
                            <div>
                              <h3 className="text-lg font-black text-gray-900">
                                {editingFrontendSection.content?.title || 'LUNCH SPECIAL'}
                              </h3>
                              <p className="text-gray-800 text-sm">
                                {editingFrontendSection.content?.subtitle || 'Any 2 tacos + drink for $8.99'}
                              </p>
                            </div>
                          </div>
                          <button className="bg-gray-900 text-white px-5 py-2 rounded-full font-bold text-sm">
                            {editingFrontendSection.content?.buttonText || 'Get Deal'}
                          </button>
                        </div>
                      </div>
                      {/* Editor Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Deal Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), title: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="LUNCH SPECIAL"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Deal Details</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Any 2 tacos + drink for $8.99"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.buttonText || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), buttonText: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Get Deal"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Link</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.buttonLink || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), buttonLink: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="#menu"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* QUALITY BANNER - Visual Editor */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'qualityBanner' && (
                    <div className="p-6 bg-gradient-to-b from-emerald-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-sm font-bold">LIVE PREVIEW</span>
                      </div>
                      {/* Preview Panel */}
                      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-emerald-200 mb-6">
                        <div className="bg-gradient-to-r from-emerald-700 via-green-600 to-teal-600 p-6 text-center">
                          {editingFrontendSection.content?.badge && (
                            <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                              {editingFrontendSection.content.badge}
                            </span>
                          )}
                          <div className="flex items-center justify-center gap-3 mb-2">
                            <span className="text-3xl">✨</span>
                            <h2 className="text-2xl font-bold text-white">
                              {editingFrontendSection.content?.title || 'Quality You Can Taste'}
                            </h2>
                            <span className="text-3xl">✨</span>
                          </div>
                          <p className="text-white/90 text-sm">
                            {editingFrontendSection.content?.subtitle || 'All ingredients sourced fresh daily'}
                          </p>
                        </div>
                      </div>
                      {/* Editor Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Badge Text</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.badge || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), badge: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Fresh Guarantee"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), title: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Quality You Can Taste"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="All ingredients sourced fresh daily from local suppliers"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* REVIEWS STRIP - Visual Editor */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'reviewsStrip' && (
                    <div className="p-6 bg-gradient-to-b from-amber-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-sm font-bold">LIVE PREVIEW</span>
                      </div>
                      {/* Preview Panel */}
                      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-amber-200 mb-6">
                        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 p-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex">
                              {[1,2,3,4,5].map(i => <span key={i} className="text-2xl">⭐</span>)}
                            </div>
                            <div className="text-white">
                              <h3 className="text-lg font-bold">
                                {editingFrontendSection.content?.title || 'Best authentic Mexican food in town!'}
                              </h3>
                              <p className="text-white/90 text-sm">
                                {editingFrontendSection.content?.subtitle || 'Over 500+ 5-star reviews'}
                              </p>
                            </div>
                          </div>
                          <button className="bg-white text-amber-700 px-5 py-2 rounded-full font-bold text-sm shadow-lg">
                            {editingFrontendSection.content?.buttonText || 'Read Reviews'}
                          </button>
                        </div>
                      </div>
                      {/* Editor Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Review Quote</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), title: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Best authentic Mexican food in town!"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Reviews Count</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Over 500+ 5-star reviews"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.buttonText || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), buttonText: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Read Reviews"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* WEEKEND SPECIALS - Visual Editor (Grocery Add-on) */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'weekendSpecials' && (
                    <div className="p-6 bg-gradient-to-b from-yellow-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-yellow-600 text-white px-2 py-0.5 rounded text-sm font-bold">LIVE PREVIEW</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Grocery Add-on</span>
                      </div>
                      {/* Preview Panel */}
                      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-yellow-200 mb-6">
                        <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 p-6 text-center">
                          {editingFrontendSection.content?.badge && (
                            <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                              {editingFrontendSection.content.badge}
                            </span>
                          )}
                          <h2 className="text-3xl font-black text-white mb-2">
                            🌟 {editingFrontendSection.content?.title || 'Weekend Specials'} 🌟
                          </h2>
                          <p className="text-white/90">
                            {editingFrontendSection.content?.subtitle || 'Fresh deals every weekend'}
                          </p>
                        </div>
                      </div>
                      {/* Editor Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Badge</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.badge || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), badge: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Weekend Only"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), title: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Weekend Specials"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Fresh deals every weekend"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* BUNDLES - Visual Editor (Grocery Add-on) */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'bundles' && (
                    <div className="p-6 bg-gradient-to-b from-green-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-green-600 text-white px-2 py-0.5 rounded text-sm font-bold">LIVE PREVIEW</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Grocery Add-on</span>
                      </div>
                      {/* Preview Panel */}
                      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-green-200 mb-6">
                        <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 p-6 text-center">
                          <span className="text-4xl mb-3 block">📦</span>
                          <h2 className="text-2xl font-bold text-white mb-2">
                            {editingFrontendSection.content?.title || 'Bundles & Packages'}
                          </h2>
                          <p className="text-white/90">
                            {editingFrontendSection.content?.subtitle || 'Save with our combo deals'}
                          </p>
                        </div>
                      </div>
                      {/* Editor Fields */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), title: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Bundles & Packages"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Save with our combo deals"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* AISLES - Visual Editor (Grocery Add-on) */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'aisles' && (
                    <div className="p-6 bg-gradient-to-b from-teal-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-teal-600 text-white px-2 py-0.5 rounded text-sm font-bold">LIVE PREVIEW</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Grocery Add-on</span>
                      </div>
                      {/* Preview Panel */}
                      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-teal-200 mb-6">
                        <div className="bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-500 p-6">
                          <h2 className="text-2xl font-bold text-white mb-2 text-center">
                            🏪 {editingFrontendSection.content?.title || 'Browse Aisles'}
                          </h2>
                          <p className="text-white/90 text-center mb-4">
                            {editingFrontendSection.content?.subtitle || 'Find what you need'}
                          </p>
                          <div className="flex justify-center gap-3 flex-wrap">
                            {['Produce', 'Dairy', 'Meats', 'Pantry', 'Drinks'].map(aisle => (
                              <span key={aisle} className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium">
                                {aisle}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Editor Fields */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), title: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Browse Aisles"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Find what you need"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* DAILY FRESH - Visual Editor (Panaderia Add-on) */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'dailyFresh' && (
                    <div className="p-6 bg-gradient-to-b from-amber-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">LIVE PREVIEW</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Panaderia Add-on</span>
                      </div>
                      {/* Preview Panel */}
                      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-amber-200 mb-6">
                        <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 p-6 text-center">
                          {editingFrontendSection.content?.badge && (
                            <span className="inline-block bg-white text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                              {editingFrontendSection.content.badge}
                            </span>
                          )}
                          <span className="text-4xl mb-3 block">🥐</span>
                          <h2 className="text-2xl font-bold text-white mb-2">
                            {editingFrontendSection.content?.title || 'Daily Fresh'}
                          </h2>
                          <p className="text-white/90">
                            {editingFrontendSection.content?.subtitle || 'Baked fresh every day'}
                          </p>
                        </div>
                      </div>
                      {/* Editor Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Badge</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.badge || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), badge: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Fresh"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), title: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Daily Fresh"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Baked fresh every day"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* BOX BUILDER - Visual Editor (Panaderia Add-on) */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'boxBuilder' && (
                    <div className="p-6 bg-gradient-to-b from-orange-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-orange-600 text-white px-2 py-0.5 rounded text-sm font-bold">LIVE PREVIEW</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Panaderia Add-on</span>
                      </div>
                      {/* Preview Panel */}
                      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-orange-200 mb-6">
                        <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 p-6 flex items-center justify-between">
                          <div className="text-white">
                            <span className="text-3xl mb-2 block">📦</span>
                            <h2 className="text-2xl font-bold mb-1">
                              {editingFrontendSection.content?.title || 'Build Your Box'}
                            </h2>
                            <p className="text-white/90 text-sm">
                              {editingFrontendSection.content?.subtitle || 'Create your perfect selection'}
                            </p>
                          </div>
                          <button className="bg-white text-orange-700 px-6 py-3 rounded-full font-bold text-sm shadow-lg">
                            {editingFrontendSection.content?.buttonText || 'Start Building'}
                          </button>
                        </div>
                      </div>
                      {/* Editor Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), title: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Build Your Box"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Create your perfect selection"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.buttonText || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), buttonText: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Start Building"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* CATEGORIES - Visual Editor (Panaderia Add-on) */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'categories' && (
                    <div className="p-6 bg-gradient-to-b from-yellow-50 to-white border-b">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="bg-yellow-600 text-white px-2 py-0.5 rounded text-sm font-bold">LIVE PREVIEW</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Panaderia Add-on</span>
                      </div>
                      {/* Preview Panel */}
                      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-yellow-200 mb-6">
                        <div className="bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-400 p-6">
                          <h2 className="text-2xl font-bold text-white mb-2 text-center">
                            🍞 {editingFrontendSection.content?.title || 'Browse Categories'}
                          </h2>
                          <p className="text-white/90 text-center mb-4">
                            {editingFrontendSection.content?.subtitle || 'Find your favorites'}
                          </p>
                          <div className="flex justify-center gap-3 flex-wrap">
                            {['Conchas', 'Cuernos', 'Polvorones', 'Empanadas', 'Orejas'].map(cat => (
                              <span key={cat} className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Editor Fields */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), title: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Browse Categories"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) => setEditingFrontendSection({ ...editingFrontendSection, content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Find your favorites"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* GENERIC FALLBACK - For any unknown section types */}
                  {/* ============================================ */}
                  {!['featuredCarousel', 'hero', 'promoBanner1', 'groceryBanner', 'panaderiaBanner', 'weCookBanner', 'dealStrip', 'qualityBanner', 'reviewsStrip', 'weekendSpecials', 'bundles', 'aisles', 'dailyFresh', 'boxBuilder', 'categories', 'quickInfo', 'menuSections'].includes(editingFrontendSection.type) && (
                    <div className="p-6">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-sm">CONTENT</span>
                        Section Settings
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) =>
                              setEditingFrontendSection({
                                ...editingFrontendSection,
                                content: { ...(editingFrontendSection.content || {}), title: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Section title"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle / Description</label>
                          <textarea
                            value={editingFrontendSection.content?.subtitle || editingFrontendSection.content?.description || ''}
                            onChange={(e) =>
                              setEditingFrontendSection({
                                ...editingFrontendSection,
                                content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value, description: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            rows={2}
                            placeholder="Section description or subtitle"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.buttonText || ''}
                            onChange={(e) =>
                              setEditingFrontendSection({
                                ...editingFrontendSection,
                                content: { ...(editingFrontendSection.content || {}), buttonText: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Shop Now, Learn More..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Button Link</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.buttonLink || ''}
                            onChange={(e) =>
                              setEditingFrontendSection({
                                ...editingFrontendSection,
                                content: { ...(editingFrontendSection.content || {}), buttonLink: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="/grocery, /catering, https://..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Badge</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.badge || ''}
                            onChange={(e) =>
                              setEditingFrontendSection({
                                ...editingFrontendSection,
                                content: { ...(editingFrontendSection.content || {}), badge: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="NEW, SPECIAL, Popular..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.image || ''}
                            onChange={(e) =>
                              setEditingFrontendSection({
                                ...editingFrontendSection,
                                content: { ...(editingFrontendSection.content || {}), image: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="https://..."
                          />
                        </div>

                        {editingFrontendSection.content?.image && (
                          <div className="col-span-2">
                            <img
                              src={editingFrontendSection.content.image}
                              alt="Preview"
                              className="w-full h-32 object-cover rounded-lg border border-gray-300"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Background Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={editingFrontendSection.content?.backgroundColor || '#8B0000'}
                              onChange={(e) =>
                                setEditingFrontendSection({
                                  ...editingFrontendSection,
                                  content: { ...(editingFrontendSection.content || {}), backgroundColor: e.target.value },
                                })
                              }
                              className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={editingFrontendSection.content?.backgroundColor || ''}
                              onChange={(e) =>
                                setEditingFrontendSection({
                                  ...editingFrontendSection,
                                  content: { ...(editingFrontendSection.content || {}), backgroundColor: e.target.value },
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="#8B0000"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Text Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={editingFrontendSection.content?.textColor || '#FFFFFF'}
                              onChange={(e) =>
                                setEditingFrontendSection({
                                  ...editingFrontendSection,
                                  content: { ...(editingFrontendSection.content || {}), textColor: e.target.value },
                                })
                              }
                              className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={editingFrontendSection.content?.textColor || ''}
                              onChange={(e) =>
                                setEditingFrontendSection({
                                  ...editingFrontendSection,
                                  content: { ...(editingFrontendSection.content || {}), textColor: e.target.value },
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================ */}
                  {/* FEATURED CAROUSEL - Title/Subtitle (STEP 2) */}
                  {/* ============================================ */}
                  {editingFrontendSection.type === 'featuredCarousel' && (
                    <div className="p-6 bg-white">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-sm">STEP 2</span>
                        Carousel Title & Subtitle
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.title || ''}
                            onChange={(e) =>
                              setEditingFrontendSection({
                                ...editingFrontendSection,
                                content: { ...(editingFrontendSection.content || {}), title: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Chef Recommends"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={editingFrontendSection.content?.subtitle || ''}
                            onChange={(e) =>
                              setEditingFrontendSection({
                                ...editingFrontendSection,
                                content: { ...(editingFrontendSection.content || {}), subtitle: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Handpicked favorites from our kitchen"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save Button Footer */}
                  <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t sticky bottom-0">
                    <button
                      type="button"
                      onClick={() => setEditingFrontendSection(null)}
                      className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingFrontendSection}
                      className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingFrontendSection ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
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

