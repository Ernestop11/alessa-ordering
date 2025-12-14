'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Mail, Send, X, Check, Calendar } from 'lucide-react';

interface EmailOffer {
  id: string;
  subject: string;
  body: string;
  targetTier?: string;
  targetTierName?: string;
  targetSegment?: 'all' | 'inactive' | 'high_value';
  scheduledDate?: string;
  sent: boolean;
  sentAt?: string;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
}

interface EmailOfferModalProps {
  offer: EmailOffer | null;
  tiers: any[];
  onClose: () => void;
  onSave: (offer: EmailOffer) => void;
}

function EmailOfferModal({ offer, tiers, onClose, onSave }: EmailOfferModalProps) {
  const [formData, setFormData] = useState<Partial<EmailOffer>>({
    subject: '',
    body: '',
    targetTier: '',
    targetSegment: 'all',
    scheduledDate: '',
    sent: false,
    ...offer,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newOffer: EmailOffer = {
      id: offer?.id || `offer-${Date.now()}`,
      subject: formData.subject || '',
      body: formData.body || '',
      targetTier: formData.targetTier || undefined,
      targetTierName: tiers.find(t => t.id === formData.targetTier)?.name,
      targetSegment: formData.targetSegment || 'all',
      scheduledDate: formData.scheduledDate || undefined,
      sent: offer?.sent || false,
      sentAt: offer?.sentAt,
      openRate: offer?.openRate,
      clickRate: offer?.clickRate,
      createdAt: offer?.createdAt || new Date().toISOString(),
    };
    onSave(newOffer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {offer ? 'Edit Email Offer' : 'Create Email Offer'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              placeholder="Special offer just for you!"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
            <select
              value={formData.targetSegment}
              onChange={(e) => setFormData({ ...formData, targetSegment: e.target.value as EmailOffer['targetSegment'] })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="all">All Members</option>
              <option value="inactive">Inactive Members (no orders in 30 days)</option>
              <option value="high_value">High Value Members (top 20% spenders)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Tier (Optional - overrides segment)</label>
            <select
              value={formData.targetTier || ''}
              onChange={(e) => setFormData({ ...formData, targetTier: e.target.value || undefined })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="">All Tiers</option>
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={12}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 font-mono text-sm"
              placeholder="Hi {name},&#10;&#10;We have a special offer just for you!&#10;&#10;Use code SAVE20 for 20% off your next order.&#10;&#10;Thanks,&#10;The Team"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Use {'{name}'} for personalization. HTML is supported.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Send (Optional)</label>
            <input
              type="datetime-local"
              value={formData.scheduledDate || ''}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value || undefined })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to send immediately or save as draft
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
            >
              <Check className="w-4 h-4 mr-2" />
              {formData.scheduledDate ? 'Schedule' : offer?.sent ? 'Update' : 'Save & Send'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmailOffersManager() {
  const [offers, setOffers] = useState<EmailOffer[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<EmailOffer | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch email offers
      const settingsRes = await fetch('/api/admin/tenant-settings');
      const settings = await settingsRes.json();
      setOffers(Array.isArray(settings.settings?.emailOffers) ? settings.settings.emailOffers : []);

      // Fetch tiers from membership program
      const program = settings.settings?.membershipProgram;
      setTiers(Array.isArray(program?.tiers) ? program.tiers : []);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOffer = async (offer: EmailOffer) => {
    try {
      const updatedOffers = editingOffer
        ? offers.map(o => o.id === offer.id ? offer : o)
        : [...offers, offer];

      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOffers: updatedOffers }),
      });

      if (!res.ok) throw new Error('Failed to save offer');
      
      setOffers(updatedOffers);
      setShowOfferModal(false);
      setEditingOffer(null);
      alert('Email offer saved successfully!');
    } catch (err) {
      console.error('Failed to save offer', err);
      alert('Failed to save email offer');
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this email offer?')) return;
    
    try {
      const updatedOffers = offers.filter(o => o.id !== offerId);
      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOffers: updatedOffers }),
      });

      if (!res.ok) throw new Error('Failed to delete offer');
      
      setOffers(updatedOffers);
      alert('Email offer deleted successfully!');
    } catch (err) {
      console.error('Failed to delete offer', err);
      alert('Failed to delete email offer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email offers...</p>
        </div>
      </div>
    );
  }

  const sentOffers = offers.filter(o => o.sent);
  const scheduledOffers = offers.filter(o => !o.sent && o.scheduledDate);
  const draftOffers = offers.filter(o => !o.sent && !o.scheduledDate);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Total Offers</div>
          <div className="text-2xl font-bold text-gray-900">{offers.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Sent</div>
          <div className="text-2xl font-bold text-gray-900">{sentOffers.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="text-sm text-gray-600 mb-1">Scheduled</div>
          <div className="text-2xl font-bold text-gray-900">{scheduledOffers.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
          <div className="text-sm text-gray-600 mb-1">Drafts</div>
          <div className="text-2xl font-bold text-gray-900">{draftOffers.length}</div>
        </div>
      </div>

      {/* Add Offer Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingOffer(null);
            setShowOfferModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Email Offer
        </button>
      </div>

      {/* Offers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {offers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No email offers created yet. Click &quot;Create Email Offer&quot; to get started.
                </td>
              </tr>
            ) : (
              offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{offer.subject}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{offer.body.substring(0, 100)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {offer.targetTierName || offer.targetSegment || 'All Members'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {offer.sent ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        <Send className="w-3 h-3 inline mr-1" />
                        Sent {offer.sentAt ? new Date(offer.sentAt).toLocaleDateString() : ''}
                      </span>
                    ) : offer.scheduledDate ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Scheduled {new Date(offer.scheduledDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {offer.sent && (
                      <div className="text-xs">
                        {offer.openRate !== undefined && <div>Opens: {offer.openRate}%</div>}
                        {offer.clickRate !== undefined && <div>Clicks: {offer.clickRate}%</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {!offer.sent && (
                        <button
                          onClick={() => {
                            setEditingOffer(offer);
                            setShowOfferModal(true);
                          }}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Email Offer Modal */}
      {showOfferModal && (
        <EmailOfferModal
          offer={editingOffer}
          tiers={tiers}
          onClose={() => {
            setShowOfferModal(false);
            setEditingOffer(null);
          }}
          onSave={handleSaveOffer}
        />
      )}
    </div>
  );
}
