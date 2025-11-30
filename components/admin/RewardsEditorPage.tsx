'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, Star, Users } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import RewardsMembersList from './RewardsMembersList';

interface MembershipTierForm {
  id: string;
  name: string;
  threshold: number;
  rewardDescription: string;
  perks: string[];
  badgeColor: string;
  sortOrder?: number;
}

interface MembershipProgramForm {
  enabled: boolean;
  pointsPerDollar: number;
  heroCopy: string;
  featuredMemberName: string;
  tiers: MembershipTierForm[];
}

function generateId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function RewardsEditorPage() {
  const [membershipProgram, setMembershipProgram] = useState<MembershipProgramForm>({
    enabled: true,
    pointsPerDollar: 10,
    heroCopy: 'Earn puntos with every order and unlock sweet rewards.',
    featuredMemberName: 'Gold Member',
    tiers: [],
  });
  const [rewardsGallery, setRewardsGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [activeTab, setActiveTab] = useState<'program' | 'members'>('program');

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const fetchRewardsData = async () => {
    try {
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/tenant-settings?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      const data = await res.json();
      
      // Load membership program from settings
      if (data.settings?.membershipProgram) {
        const program = data.settings.membershipProgram as any;
        setMembershipProgram({
          enabled: program.enabled !== false,
          pointsPerDollar: program.pointsPerDollar ?? 10,
          heroCopy: program.heroCopy || '',
          featuredMemberName: program.featuredMemberName || '',
          tiers: Array.isArray(program.tiers) ? program.tiers.map((tier: any) => ({
            id: tier.id || generateId('tier'),
            name: tier.name || '',
            threshold: tier.threshold ?? 0,
            rewardDescription: tier.rewardDescription || '',
            perks: Array.isArray(tier.perks) ? tier.perks : [],
            badgeColor: tier.badgeColor || '#f97316',
            sortOrder: tier.sortOrder ?? 0,
          })) : [],
        });
      }
      
      // Load rewards gallery (we'll add this to tenant settings)
      // For now, we can use a separate field or add it to settings
      setRewardsGallery(data.settings?.rewardsGallery || []);
      
      console.log('Fetched rewards data:', { membershipProgram: data.settings?.membershipProgram, rewardsGallery: data.settings?.rewardsGallery });
    } catch (err) {
      console.error('Failed to fetch rewards data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipProgram: membershipProgram,
          rewardsGallery: rewardsGallery,
        }),
      });
      if (!res.ok) throw new Error('Failed to save rewards');
      
      // Revalidate the order page to ensure frontend updates
      try {
        await fetch('/api/revalidate?path=/order', { method: 'POST' });
      } catch (revalidateErr) {
        console.warn('Failed to revalidate order page:', revalidateErr);
      }
      
      alert('Rewards program saved successfully! Changes will appear on the frontend after refresh.');
      await fetchRewardsData(); // Refresh to ensure sync
    } catch (err) {
      console.error('Failed to save rewards', err);
      alert('Failed to save rewards program');
    } finally {
      setSaving(false);
    }
  };

  const loadSampleData = () => {
    setMembershipProgram({
      enabled: true,
      pointsPerDollar: 10,
      heroCopy: 'Earn puntos with every order and unlock sweet rewards. Join our loyalty program and get exclusive perks!',
      featuredMemberName: 'Gold Member',
      tiers: [
        {
          id: generateId('tier'),
          name: 'Bronze',
          threshold: 0,
          rewardDescription: 'Welcome to the club! Start earning points today.',
          perks: ['Earn 10 points per $1 spent', 'Monthly chef tips via email', 'Early access to new menu items'],
          badgeColor: '#b45309',
          sortOrder: 0,
        },
        {
          id: generateId('tier'),
          name: 'Silver',
          threshold: 250,
          rewardDescription: 'Unlock exclusive rewards and special offers.',
          perks: ['Free dessert on orders over $30', 'Birthday surprise treat', 'Priority customer support'],
          badgeColor: '#6b7280',
          sortOrder: 1,
        },
        {
          id: generateId('tier'),
          name: 'Gold',
          threshold: 500,
          rewardDescription: 'Sweet treats and exclusive drops for our VIP members.',
          perks: ['Free dessert on birthdays', 'Priority support', 'Exclusive tastings', '10% off all orders'],
          badgeColor: '#d97706',
          sortOrder: 2,
        },
      ],
    });
    
    // Add sample gallery images
    setRewardsGallery([
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=80',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&q=80',
      'https://images.unsplash.com/photo-1555939594-58d7cb561b1e?w=1200&q=80',
    ]);
  };

  const addTier = () => {
    const newTier: MembershipTierForm = {
      id: generateId('tier'),
      name: 'New Tier',
      threshold: 0,
      rewardDescription: '',
      perks: [],
      badgeColor: '#f97316',
      sortOrder: membershipProgram.tiers.length,
    };
    setMembershipProgram((prev) => ({
      ...prev,
      tiers: [...prev.tiers, newTier],
    }));
  };

  const removeTier = (tierId: string) => {
    setMembershipProgram((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((t) => t.id !== tierId),
    }));
  };

  const updateTier = (tierId: string, field: keyof MembershipTierForm, value: any) => {
    setMembershipProgram((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) =>
        tier.id === tierId ? { ...tier, [field]: value } : tier
      ),
    }));
  };

  const addPerk = (tierId: string) => {
    setMembershipProgram((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) =>
        tier.id === tierId
          ? { ...tier, perks: [...tier.perks, ''] }
          : tier
      ),
    }));
  };

  const removePerk = (tierId: string, perkIndex: number) => {
    setMembershipProgram((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) =>
        tier.id === tierId
          ? { ...tier, perks: tier.perks.filter((_, i) => i !== perkIndex) }
          : tier
      ),
    }));
  };

  const updatePerk = (tierId: string, perkIndex: number, value: string) => {
    setMembershipProgram((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) =>
        tier.id === tierId
          ? {
              ...tier,
              perks: tier.perks.map((p, i) => (i === perkIndex ? value : p)),
            }
          : tier
      ),
    }));
  };

  const handleAddGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingGallery(true);
      const res = await fetch('/api/admin/assets/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        const newGallery = [...rewardsGallery, data.url];
        setRewardsGallery(newGallery);
        await saveRewardsGallery(newGallery);
      }
    } catch (err) {
      console.error('Failed to upload gallery image', err);
      alert('Failed to upload image');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = async (url: string) => {
    const newGallery = rewardsGallery.filter((img) => img !== url);
    setRewardsGallery(newGallery);
    await saveRewardsGallery(newGallery);
  };

  const saveRewardsGallery = async (gallery: string[]) => {
    try {
      const res = await fetch('/api/admin/tenant-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardsGallery: gallery }),
      });
      if (!res.ok) throw new Error('Failed to save gallery');
      setRewardsGallery(gallery);
      await fetchRewardsData(); // Refresh to ensure sync
    } catch (err) {
      console.error('Failed to save gallery', err);
      alert('Failed to save gallery');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading rewards program...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link
              href="/admin"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Rewards Program</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your membership program, tiers, rewards gallery, and members
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('program')}
                  className={`${
                    activeTab === 'program'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Star className="w-4 h-4" />
                  Program Editor
                </button>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`${
                    activeTab === 'members'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Users className="w-4 h-4" />
                  Members List
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'program' ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Program Settings</h2>
              <div className="flex gap-2">
                <button
                  onClick={loadSampleData}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Load Sample Data
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={membershipProgram.enabled}
                  onChange={(e) =>
                    setMembershipProgram((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                  Enable Rewards Program
                </label>
              </div>

              {/* Points Per Dollar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Per Dollar Spent
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={membershipProgram.pointsPerDollar}
                  onChange={(e) =>
                    setMembershipProgram((prev) => ({
                      ...prev,
                      pointsPerDollar: Number(e.target.value),
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                />
              </div>

              {/* Featured Member Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Member Name
                </label>
                <input
                  type="text"
                  value={membershipProgram.featuredMemberName}
                  onChange={(e) =>
                    setMembershipProgram((prev) => ({
                      ...prev,
                      featuredMemberName: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder="Maria Rodriguez"
                />
              </div>

              {/* Hero Copy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Copy
                </label>
                <textarea
                  value={membershipProgram.heroCopy}
                  onChange={(e) =>
                    setMembershipProgram((prev) => ({
                      ...prev,
                      heroCopy: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder="Earn puntos with every order and unlock sweet rewards."
                />
              </div>

              {/* Tiers Management */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Membership Tiers</h3>
                  <button
                    onClick={addTier}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tier
                  </button>
                </div>

                <div className="space-y-4">
                  {membershipProgram.tiers.map((tier, index) => (
                    <div key={tier.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-orange-500" />
                          <span className="text-sm font-semibold text-gray-900">
                            Tier {index + 1}: {tier.name}
                          </span>
                        </div>
                        {membershipProgram.tiers.length > 1 && (
                          <button
                            onClick={() => removeTier(tier.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Tier Name
                          </label>
                          <input
                            type="text"
                            value={tier.name}
                            onChange={(e) => updateTier(tier.id, 'name', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Points Threshold
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={tier.threshold}
                            onChange={(e) =>
                              updateTier(tier.id, 'threshold', Number(e.target.value))
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Badge Color
                          </label>
                          <input
                            type="color"
                            value={tier.badgeColor}
                            onChange={(e) => updateTier(tier.id, 'badgeColor', e.target.value)}
                            className="h-10 w-full cursor-pointer rounded border border-gray-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Reward Description
                          </label>
                          <input
                            type="text"
                            value={tier.rewardDescription}
                            onChange={(e) =>
                              updateTier(tier.id, 'rewardDescription', e.target.value)
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            placeholder="Sweet treats and exclusive drops"
                          />
                        </div>
                      </div>

                      {/* Perks */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-medium text-gray-500">
                            Perks
                          </label>
                          <button
                            onClick={() => addPerk(tier.id)}
                            className="text-xs text-orange-600 hover:text-orange-800"
                          >
                            + Add Perk
                          </button>
                        </div>
                        <div className="space-y-2">
                          {tier.perks.map((perk, perkIndex) => (
                            <div key={perkIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={perk}
                                onChange={(e) =>
                                  updatePerk(tier.id, perkIndex, e.target.value)
                                }
                                className="flex-1 block rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                                placeholder="Free dessert on birthdays"
                              />
                              <button
                                onClick={() => removePerk(tier.id, perkIndex)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rewards Gallery */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Rewards Tab Gallery
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  These images will display in the rewards tab. Recommended: 1200x600px landscape images.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {rewardsGallery.map((url, index) => (
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
                    {uploadingGallery ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="mt-2 text-sm text-gray-500">Add Image</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAddGalleryImage}
                      className="hidden"
                      disabled={uploadingGallery}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <RewardsMembersList />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

