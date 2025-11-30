'use client';

import { useEffect, useState, useMemo } from 'react';
import { Edit2, Star, TrendingUp, Package, X, Check } from 'lucide-react';

interface RewardsMember {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  loyaltyPoints: number;
  membershipTier: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  createdAt: string;
}

export default function RewardsMembersList() {
  const [members, setMembers] = useState<RewardsMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState(0);
  const [editTier, setEditTier] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/rewards/members', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error('Failed to fetch members', err);
      setError('Failed to load members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (memberId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/rewards/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyaltyPoints: editPoints,
          membershipTier: editTier || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to update member');
      await fetchMembers();
      setEditingMember(null);
      alert('Member updated successfully!');
    } catch (err) {
      console.error('Failed to update member', err);
      alert('Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch = !filter || 
        member.name?.toLowerCase().includes(filter.toLowerCase()) ||
        member.email?.toLowerCase().includes(filter.toLowerCase()) ||
        member.phone?.includes(filter);
      const matchesTier = tierFilter === 'all' || member.membershipTier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [members, filter, tierFilter]);

  const tierStats = useMemo(() => {
    const stats: Record<string, number> = {};
    members.forEach((m) => {
      const tier = m.membershipTier || 'None';
      stats[tier] = (stats[tier] || 0) + 1;
    });
    return stats;
  }, [members]);

  const totalPoints = useMemo(() => {
    return members.reduce((sum, m) => sum + m.loyaltyPoints, 0);
  }, [members]);

  const activeMembers = useMemo(() => {
    return members.filter(m => m.orderCount > 0).length;
  }, [members]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchMembers}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">Total Members</div>
          <div className="text-2xl font-bold text-gray-900">{members.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Active Members</div>
          <div className="text-2xl font-bold text-green-600">{activeMembers}</div>
          <div className="text-xs text-gray-500 mt-1">
            {members.length > 0 ? Math.round((activeMembers / members.length) * 100) : 0}% active
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
          <div className="text-sm text-gray-600 mb-1">Total Points</div>
          <div className="text-2xl font-bold text-amber-600">{totalPoints.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Avg Points/Member</div>
          <div className="text-2xl font-bold text-gray-900">
            {members.length > 0 
              ? Math.round(totalPoints / members.length)
              : 0
            }
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
            >
              <option value="all">All Tiers</option>
              {Object.keys(tierStats).map((tier) => (
                <option key={tier} value={tier}>
                  {tier} ({tierStats[tier]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    {filter || tierFilter !== 'all' 
                      ? 'No members match your filters'
                      : 'No members found'
                    }
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.name || 'Guest'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.email || member.phone || 'No contact'}
                      </div>
                      {member.lastOrderDate && (
                        <div className="text-xs text-gray-400 mt-1">
                          Last order: {new Date(member.lastOrderDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <Star className="w-3 h-3 mr-1" />
                        {member.membershipTier || 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {member.loyaltyPoints.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">points</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-1 text-gray-400" />
                        {member.orderCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-semibold">${member.totalSpent.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingMember === member.id ? (
                        <div className="space-y-2 min-w-[200px]">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Points</label>
                            <input
                              type="number"
                              value={editPoints}
                              onChange={(e) => setEditPoints(Number(e.target.value))}
                              className="w-full rounded border-gray-300 text-sm px-2 py-1"
                              placeholder="Points"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Tier</label>
                            <input
                              type="text"
                              value={editTier}
                              onChange={(e) => setEditTier(e.target.value)}
                              className="w-full rounded border-gray-300 text-sm px-2 py-1"
                              placeholder="Tier name"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateMember(member.id)}
                              disabled={saving}
                              className="flex-1 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingMember(null);
                                setEditPoints(0);
                                setEditTier('');
                              }}
                              className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingMember(member.id);
                            setEditPoints(member.loyaltyPoints);
                            setEditTier(member.membershipTier || '');
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-orange-600 bg-orange-50 hover:bg-orange-100"
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

