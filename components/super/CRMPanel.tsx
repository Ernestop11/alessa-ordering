"use client";

import { useEffect, useState } from 'react';

interface CRMActivity {
  id: string;
  tenantId: string | null;
  activityType: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  metadata: any;
  tenant: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdAt: string;
}

interface CRMNote {
  id: string;
  tenantId: string;
  author: string;
  content: string;
  tags: string[];
  pinned: boolean;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
}

interface Props {
  tenants: Array<{ id: string; name: string; slug: string }>;
}

export default function CRMPanel({ tenants }: Props) {
  const [activeView, setActiveView] = useState<'activities' | 'notes'>('activities');
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [notes, setNotes] = useState<CRMNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [filterCompleted, setFilterCompleted] = useState(false);

  // Activity form
  const [activityForm, setActivityForm] = useState({
    tenantId: '',
    activityType: 'note',
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
  });
  const [showActivityForm, setShowActivityForm] = useState(false);

  // Note form
  const [noteForm, setNoteForm] = useState({
    tenantId: '',
    content: '',
    tags: '',
    pinned: false,
  });
  const [showNoteForm, setShowNoteForm] = useState(false);

  useEffect(() => {
    loadActivities();
    loadNotes();
  }, [selectedTenantId, filterCompleted]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTenantId !== 'all') params.append('tenantId', selectedTenantId);
      if (filterCompleted) params.append('completed', 'false');

      const res = await fetch(`/api/crm/activities?${params}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedTenantId !== 'all') params.append('tenantId', selectedTenantId);

      const res = await fetch(`/api/crm/notes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const createActivity = async () => {
    try {
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activityForm,
          dueDate: activityForm.dueDate || null,
        }),
      });

      if (res.ok) {
        setActivityForm({
          tenantId: '',
          activityType: 'note',
          title: '',
          description: '',
          assignedTo: '',
          dueDate: '',
        });
        setShowActivityForm(false);
        loadActivities();
      }
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  const createNote = async () => {
    try {
      const res = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: noteForm.tenantId,
          content: noteForm.content,
          tags: noteForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
          pinned: noteForm.pinned,
        }),
      });

      if (res.ok) {
        setNoteForm({ tenantId: '', content: '', tags: '', pinned: false });
        setShowNoteForm(false);
        loadNotes();
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const toggleActivityComplete = async (id: string, completed: boolean) => {
    try {
      await fetch(`/api/crm/activities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });
      loadActivities();
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No date';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CRM Dashboard</h2>
          <p className="text-sm text-gray-600">Manage customer relationships and activities</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('activities')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeView === 'activities'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Activities
          </button>
          <button
            onClick={() => setActiveView('notes')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeView === 'notes'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Notes
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <select
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Tenants</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {activeView === 'activities' && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterCompleted}
              onChange={(e) => setFilterCompleted(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Hide completed</span>
          </label>
        )}
      </div>

      {/* Activities View */}
      {activeView === 'activities' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Activities</h3>
            <button
              onClick={() => setShowActivityForm(!showActivityForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + New Activity
            </button>
          </div>

          {showActivityForm && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold">Create Activity</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tenant</label>
                  <select
                    value={activityForm.tenantId}
                    onChange={(e) => setActivityForm({ ...activityForm, tenantId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select tenant...</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={activityForm.activityType}
                    onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="task">Task</option>
                    <option value="status_change">Status Change</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={activityForm.title}
                    onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Activity title..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={activityForm.description}
                    onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Activity description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Assigned To</label>
                  <input
                    type="text"
                    value={activityForm.assignedTo}
                    onChange={(e) => setActivityForm({ ...activityForm, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Email or name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={activityForm.dueDate}
                    onChange={(e) => setActivityForm({ ...activityForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createActivity}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowActivityForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No activities found</div>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`bg-white border rounded-lg p-4 ${
                    activity.completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={activity.completed}
                          onChange={() => toggleActivityComplete(activity.id, activity.completed)}
                          className="rounded"
                        />
                        <h4 className="font-semibold">{activity.title}</h4>
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                          {activity.activityType}
                        </span>
                        {activity.tenant && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {activity.tenant.name}
                          </span>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        {activity.assignedTo && <span>Assigned: {activity.assignedTo}</span>}
                        {activity.dueDate && <span>Due: {formatDate(activity.dueDate)}</span>}
                        <span>Created: {formatDate(activity.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes View */}
      {activeView === 'notes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notes</h3>
            <button
              onClick={() => setShowNoteForm(!showNoteForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + New Note
            </button>
          </div>

          {showNoteForm && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold">Create Note</h4>
              <div>
                <label className="block text-sm font-medium mb-1">Tenant</label>
                <select
                  value={noteForm.tenantId}
                  onChange={(e) => setNoteForm({ ...noteForm, tenantId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select tenant...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={5}
                  placeholder="Note content..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={noteForm.tags}
                  onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="important, follow-up, etc."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={noteForm.pinned}
                  onChange={(e) => setNoteForm({ ...noteForm, pinned: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm">Pin this note</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createNote}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNoteForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No notes found</div>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`bg-white border rounded-lg p-4 ${
                    note.pinned ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {note.pinned && (
                          <span className="text-blue-600">📌</span>
                        )}
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          {note.tenant.name}
                        </span>
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>By: {note.author}</span>
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

