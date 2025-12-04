'use client';

import { useState, useEffect } from 'react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  createdAt: string;
  read: boolean;
  readAt: string | null;
}

interface Props {
  associateId: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 border-red-300 text-red-900',
  high: 'bg-orange-100 border-orange-300 text-orange-900',
  normal: 'bg-blue-100 border-blue-300 text-blue-900',
  low: 'bg-gray-100 border-gray-300 text-gray-900',
};

const TYPE_ICONS: Record<string, string> = {
  general: '📢',
  training: '📚',
  contest: '🏆',
  promotion: '🎉',
  meeting: '📅',
};

export default function BulletinBoard({ associateId }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'training' | 'contest'>('all');

  useEffect(() => {
    loadAnnouncements();
  }, [associateId, filter]);

  const loadAnnouncements = async () => {
    try {
      const params = new URLSearchParams({
        associateId,
        ...(filter !== 'all' && { filter }),
      });
      const res = await fetch(`/api/mlm/announcements?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (announcementId: string) => {
    try {
      await fetch(`/api/mlm/announcements/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId, associateId }),
      });
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcementId ? { ...a, read: true, readAt: new Date().toISOString() } : a
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const unreadCount = announcements.filter((a) => !a.read).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Bulletin Board</h3>
          <p className="text-sm text-gray-600 mt-1">
            Stay updated with team announcements, training, and contests
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="rounded-full bg-red-500 text-white px-3 py-1 text-sm font-bold">
            {unreadCount} New
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: 'Unread' },
          { id: 'training', label: 'Training' },
          { id: 'contest', label: 'Contests' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === f.id
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Announcements */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No announcements</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`rounded-lg border-2 p-6 transition hover:shadow-lg ${
                !announcement.read
                  ? PRIORITY_COLORS[announcement.priority] || PRIORITY_COLORS.normal
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{TYPE_ICONS[announcement.type] || '📢'}</span>
                    <h4 className="font-bold text-lg">{announcement.title}</h4>
                    {!announcement.read && (
                      <span className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mt-2 whitespace-pre-wrap">{announcement.content}</p>
                  <p className="text-xs text-gray-500 mt-3">
                    {new Date(announcement.createdAt).toLocaleDateString()} • {announcement.type}
                  </p>
                </div>
                {!announcement.read && (
                  <button
                    onClick={() => markAsRead(announcement.id)}
                    className="ml-4 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

