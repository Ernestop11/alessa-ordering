"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

type MenuSectionType = 'RESTAURANT' | 'BAKERY' | 'GROCERY' | 'BEVERAGE' | 'SPECIAL' | 'OTHER';

interface MenuSection {
  id: string;
  name: string;
  description: string | null;
  type: MenuSectionType;
  position: number;
  hero: boolean;
  _count?: {
    menuItems: number;
  };
}

interface SectionFormState {
  id?: string;
  name: string;
  description: string;
  type: MenuSectionType;
  hero: boolean;
}

const DEFAULT_FORM: SectionFormState = {
  name: '',
  description: '',
  type: 'RESTAURANT',
  hero: false,
};

const TYPE_LABELS: Record<MenuSectionType, string> = {
  RESTAURANT: 'Taquería / Restaurant',
  BAKERY: 'Panadería / Bakery',
  GROCERY: 'Grocery / Mercado',
  BEVERAGE: 'Beverages',
  SPECIAL: 'Specials',
  OTHER: 'Other',
};

export default function MenuSectionsManager() {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SectionFormState>({ ...DEFAULT_FORM });
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(form.id);

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.position - b.position),
    [sections],
  );

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/menu-sections', { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSections(data || []);
    } catch (err) {
      console.error('Failed to load menu sections', err);
      setError('Failed to load sections.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    if (!message && !error) return;
    const timeout = setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [message, error]);

  const resetForm = () => {
    setForm({ ...DEFAULT_FORM });
    setShowForm(false);
    setSaving(false);
  };

  const openCreateForm = () => {
    setForm({ ...DEFAULT_FORM });
    setShowForm(true);
  };

  const openEditForm = (section: MenuSection) => {
    setForm({
      id: section.id,
      name: section.name,
      description: section.description || '',
      type: section.type,
      hero: section.hero,
    });
    setShowForm(true);
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (event.target instanceof HTMLInputElement) {
      const { name, type, checked, value } = event.target;
      setForm((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      return;
    }

    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        name: form.name,
        description: form.description,
        type: form.type,
        hero: form.hero,
      };

      const res = await fetch('/api/admin/menu-sections', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
      });

      if (!res.ok) throw new Error(await res.text());

      await fetchSections();
      setMessage(`Section ${form.id ? 'updated' : 'created'} successfully.`);
      resetForm();
    } catch (err) {
      console.error('Failed to save section', err);
      setError('Failed to save section.');
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this section? Items will no longer be grouped.')) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/menu-sections?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      await fetchSections();
      setMessage('Section deleted.');
    } catch (err) {
      console.error('Failed to delete section', err);
      setError('Failed to delete section.');
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sortedSections.length) return;

    const reordered = [...sortedSections];
    const [current] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, current);

    setSections(reordered.map((section, position) => ({ ...section, position })));

    try {
      await fetch('/api/admin/menu-sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: reordered.map((section) => section.id) }),
      });
      setMessage('Section order updated.');
    } catch (err) {
      console.error('Failed to update order', err);
      setError('Failed to update order.');
      fetchSections();
    }
  };

  return (
    <div className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Menu Sections</h2>
          <p className="mt-1 text-sm text-gray-500">
            Group menu items into taquería, panadería, and grocery sections. Sections appear in the order listed below.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          New Section
        </button>
      </header>

      {message && <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">{message}</div>}
      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="p-6 text-gray-500">Loading sections...</div>
      ) : sortedSections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500">
          No sections yet. Create your first section to organize menu items.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSections.map((section, index) => (
            <div
              key={section.id}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    {TYPE_LABELS[section.type]}
                  </span>
                  {section.hero && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      Featured hero
                    </span>
                  )}
                </div>
                {section.description && <p className="mt-1 text-sm text-gray-600">{section.description}</p>}
                <p className="mt-2 text-xs uppercase tracking-wide text-gray-400">
                  {section._count?.menuItems ?? 0} item{(section._count?.menuItems ?? 0) === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    className="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-600 disabled:opacity-40"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMove(index, 1)}
                    disabled={index === sortedSections.length - 1}
                    className="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-600 disabled:opacity-40"
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
                <button
                  onClick={() => openEditForm(section)}
                  className="inline-flex items-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(section.id)}
                  className="inline-flex items-center rounded border border-transparent bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                  disabled={saving}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isEditing ? 'Edit Section' : 'Create Section'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Section Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  id="hero"
                  name="hero"
                  type="checkbox"
                  checked={form.hero}
                  onChange={handleFormChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hero" className="ml-2 block text-sm text-gray-700">
                  Feature this section in the hero banner
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70"
                >
                  {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
