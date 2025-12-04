'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    rank: string;
  };
  recipient: {
    id: string;
    name: string;
  } | null;
  subject: string | null;
  content: string;
  type: string;
  priority: string;
  read: boolean;
  createdAt: string;
}

interface Props {
  associateId: string;
}

export default function TeamCommunication({ associateId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'team'>('inbox');
  const [newMessage, setNewMessage] = useState({ recipientId: '', subject: '', content: '' });

  useEffect(() => {
    loadMessages();
  }, [associateId, activeTab]);

  const loadMessages = async () => {
    try {
      const params = new URLSearchParams({
        associateId,
        tab: activeTab,
      });
      const res = await fetch(`/api/mlm/messages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/mlm/messages/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, associateId }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, read: true } : m))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async () => {
    try {
      const res = await fetch(`/api/mlm/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: associateId,
          recipientId: newMessage.recipientId || null,
          subject: newMessage.subject,
          content: newMessage.content,
        }),
      });
      if (res.ok) {
        setNewMessage({ recipientId: '', subject: '', content: '' });
        loadMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'inbox', label: 'Inbox', icon: '📥', count: unreadCount },
          { id: 'sent', label: 'Sent', icon: '📤' },
          { id: 'team', label: 'Team Broadcast', icon: '📢' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.count && tab.count > 0 && (
              <span className="rounded-full bg-red-500 text-white px-2 py-0.5 text-xs font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No messages</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border-2 p-6 transition hover:shadow-lg ${
                !message.read
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {message.type === 'invitation' ? '✉️' :
                       message.type === 'reminder' ? '⏰' :
                       message.type === 'congratulations' ? '🎉' : '💬'}
                    </span>
                    <div>
                      <h5 className="font-bold text-lg">
                        {message.subject || 'No Subject'}
                      </h5>
                      <p className="text-sm text-gray-600">
                        From: {message.sender.name} ({message.sender.rank})
                        {message.recipient && ` • To: ${message.recipient.name}`}
                      </p>
                    </div>
                    {!message.read && (
                      <span className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mt-3 whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-3">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
                {!message.read && (
                  <button
                    onClick={() => markAsRead(message.id)}
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

      {/* Send Message (for team leaders) */}
      {activeTab === 'team' && (
        <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
          <h4 className="font-bold text-gray-900 mb-4">Send Team Message</h4>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Subject (optional)"
              value={newMessage.subject}
              onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            <textarea
              placeholder="Message content..."
              value={newMessage.content}
              onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.content.trim()}
              className="px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send to Team
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

