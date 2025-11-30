'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Gift, Tag, Star, X, Check } from 'lucide-react';

interface Reward {
  id: string;
  name: string;
  description?: string;
  type: 'free_item' | 'discount' | 'points_bonus' | 'free_shipping';
  menuItemId?: string;
  menuItemName?: string;
  discountPercent?: number;
  discountAmount?: number;
  pointsBonus?: number;
  tierId?: string;
  tierName?: string;
  pointsCost?: number;
  expirationDate?: string;
  maxUses?: number;
  usesCount?: number;
  active: boolean;
}

interface RewardModalProps {
  reward: Reward | null;
  menuItems: any[];
  tiers: any[];
  onClose: () => void;
  onSave: (reward: Reward) => void;
}

function RewardModal({ reward, menuItems, tiers, onClose, onSave }: RewardModalProps) {
  const [formData, setFormData] = useState<Partial<Reward>>({
    name: '',
    description: '',
    type: 'free_item',
    active: true,
    ...reward,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReward: Reward = {
      id: reward?.id || `reward-${Date.now()}`,
      name: formData.name || '',
      description: formData.description,
      type: formData.type || 'free_item',
      menuItemId: formData.menuItemId,
      menuItemName: menuItems.find(m => m.id === formData.menuItemId)?.name,
      discountPercent: formData.discountPercent,
      discountAmount: formData.discountAmount,
      pointsBonus: formData.pointsBonus,
      tierId: formData.tierId,
      tierName: tiers.find(t => t.id === formData.tierId)?.name,
      pointsCost: formData.pointsCost,
      expirationDate: formData.expirationDate,
      maxUses: formData.maxUses,
      usesCount: reward?.usesCount || 0,
      active: formData.active ?? true,
    };
    onSave(newReward);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {reward ? 'Edit Reward' : 'Create New Reward'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reward Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reward Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Reward['type'] })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="free_item">Free Item</option>
              <option value="discount">Discount</option>
              <option value="points_bonus">Points Bonus</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>

          {formData.type === 'free_item' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Menu Item</label>
              <select
                value={formData.menuItemId || ''}
                onChange={(e) => setFormData({ ...formData, menuItemId: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              >
                <option value="">Select a menu item</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - ${item.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(formData.type === 'discount') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercent || ''}
                  onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Or Fixed Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discountAmount || ''}
                  onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </>
          )}

          {formData.type === 'points_bonus' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Points</label>
              <input
                type="number"
                min="0"
                value={formData.pointsBonus || ''}
                onChange={(e) => setFormData({ ...formData, pointsBonus: Number(e.target.value) })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Tier (Optional)</label>
            <select
              value={formData.tierId || ''}
              onChange={(e) => setFormData({ ...formData, tierId: e.target.value || undefined })}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Points Cost (0 = Free)</label>
            <input
              type="number"
              min="0"
              value={formData.pointsCost || 0}
              onChange={(e) => setFormData({ ...formData, pointsCost: Number(e.target.value) })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (Optional)</label>
            <input
              type="date"
              value={formData.expirationDate || ''}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value || undefined })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses (Optional)</label>
            <input
              type="number"
              min="0"
              value={formData.maxUses || ''}
              onChange={(e) => setFormData({ ...formData, maxUses: Number(e.target.value) || undefined })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active ?? true}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Save Reward
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

export default function RewardsManager() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch rewards
      const settingsRes = await fetch('/api/admin/tenant-settings');
      const settings = await settingsRes.json();
      setRewards(Array.isArray(settings.settings?.rewards) ? settings.settings.rewards : []);

      // Fetch menu items
      const menuRes = await fetch('/api/admin/menu-items');
      const menuData = await menuRes.json();
      setMenuItems(Array.isArray(menuData) ? menuData : []);

      // Fetch tiers from membership program
      const program = settings.settings?.membershipProgram;
      setTiers(Array.isArray(program?.tiers) ? program.tiers : []);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReward = async (reward: Reward) => {
    try {
      const updatedRewards = editingReward
        ? rewards.map(r => r.id === reward.id ? reward : r)
        : [...rewards, reward];

      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewards: updatedRewards }),
      });

      if (!res.ok) throw new Error('Failed to save reward');
      
      setRewards(updatedRewards);
      setShowRewardModal(false);
      setEditingReward(null);
      alert('Reward saved successfully!');
    } catch (err) {
      console.error('Failed to save reward', err);
      alert('Failed to save reward');
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;
    
    try {
      const updatedRewards = rewards.filter(r => r.id !== rewardId);
      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewards: updatedRewards }),
      });

      if (!res.ok) throw new Error('Failed to delete reward');
      
      setRewards(updatedRewards);
      alert('Reward deleted successfully!');
    } catch (err) {
      console.error('Failed to delete reward', err);
      alert('Failed to delete reward');
    }
  };

  const handleToggleActive = async (reward: Reward) => {
    const updatedReward = { ...reward, active: !reward.active };
    await handleSaveReward(updatedReward);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rewards...</p>
        </div>
      </div>
    );
  }

  const activeRewards = rewards.filter(r => r.active);
  const totalClaims = rewards.reduce((sum, r) => sum + (r.usesCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Active Rewards</div>
          <div className="text-2xl font-bold text-gray-900">{activeRewards.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Total Rewards</div>
          <div className="text-2xl font-bold text-gray-900">{rewards.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">Total Claims</div>
          <div className="text-2xl font-bold text-gray-900">{totalClaims}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">Reward Types</div>
          <div className="text-2xl font-bold text-gray-900">
            {new Set(rewards.map(r => r.type)).size}
          </div>
        </div>
      </div>

      {/* Add Reward Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditingReward(null);
            setShowRewardModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Reward
        </button>
      </div>

      {/* Rewards List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reward
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uses
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rewards.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  No rewards created yet. Click "Create Reward" to get started.
                </td>
              </tr>
            ) : (
              rewards.map((reward) => (
                <tr key={reward.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{reward.name}</div>
                    {reward.description && (
                      <div className="text-xs text-gray-500 mt-1">{reward.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                      {reward.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reward.tierName || 'All Tiers'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reward.pointsCost ? `${reward.pointsCost} pts` : 'Free'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reward.usesCount || 0}
                    {reward.maxUses && ` / ${reward.maxUses}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(reward)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        reward.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {reward.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingReward(reward);
                          setShowRewardModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReward(reward.id)}
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

      {/* Reward Modal */}
      {showRewardModal && (
        <RewardModal
          reward={editingReward}
          menuItems={menuItems}
          tiers={tiers}
          onClose={() => {
            setShowRewardModal(false);
            setEditingReward(null);
          }}
          onSave={handleSaveReward}
        />
      )}
    </div>
  );
}

