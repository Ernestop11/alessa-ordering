'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import EnhancedDownlineTree from './EnhancedDownlineTree';
import UplineView from './UplineView';
import BulletinBoard from './BulletinBoard';
import MeetingsSchedule from './MeetingsSchedule';
import TeamCommunication from './TeamCommunication';
import ContestLeaderboard from './ContestLeaderboard';
import RecruitOnboarding from './RecruitOnboarding';

interface Associate {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  level: number;
  rank: string;
  rankPoints: number;
  totalRecruits: number;
  activeRecruits: number;
  totalEarnings: number;
  monthlyEarnings: number;
  lifetimeEarnings: number;
  totalCommissions: number;
  totalPaid: number;
  totalPending: number;
}

interface Commission {
  id: string;
  amount: number;
  type: string;
  status: string;
  description: string | null;
  createdAt: string;
}

interface Referral {
  id: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  status: string;
  commissionRate: number;
  createdAt: string;
}

export default function AssociateDashboard() {
  const [associate, setAssociate] = useState<Associate | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [rankProgress, setRankProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'referrals' | 'downline' | 'upline' | 'achievements' | 'rank' | 'bulletin' | 'meetings' | 'communication' | 'leaderboard' | 'recruit'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get associate from sessionStorage (temporary until proper auth)
      const associateData = typeof window !== 'undefined' ? sessionStorage.getItem('associate') : null;
      
      if (!associateData) {
        // Redirect to login if not authenticated
        if (typeof window !== 'undefined') {
          window.location.href = '/associate/login';
        }
        return;
      }

      const associateObj = JSON.parse(associateData);
      setAssociate(associateObj);

      // Load commissions
      const commissionsRes = await fetch(`/api/mlm/commission?associateId=${associateObj.id}`);
      if (commissionsRes.ok) {
        const commissionsData = await commissionsRes.json();
        setCommissions(commissionsData.commissions || []);
      }

      // Load referrals
      const referralsRes = await fetch(`/api/mlm/referral?associateId=${associateObj.id}`);
      if (referralsRes.ok) {
        const referralsData = await referralsRes.json();
        setReferrals(referralsData || []);
      }

      // Load achievements
      const achievementsRes = await fetch(`/api/mlm/achievements?associateId=${associateObj.id}`);
      if (achievementsRes.ok) {
        const achievementsData = await achievementsRes.json();
        setAchievements(achievementsData.achievements || []);
      }

      // Load rank progress
      const rankRes = await fetch(`/api/mlm/rank?associateId=${associateObj.id}`);
      if (rankRes.ok) {
        const rankData = await rankRes.json();
        setRankProgress(rankData);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 text-2xl text-white shadow-lg">
                👥
              </div>
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                Associate Dashboard
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <nav className="flex gap-2 border-b border-gray-200 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'rank', label: 'Rank', icon: '🏆' },
            { id: 'achievements', label: 'Achievements', icon: '🎖️' },
            { id: 'earnings', label: 'Earnings', icon: '💰' },
            { id: 'referrals', label: 'Referrals', icon: '🔗' },
            { id: 'downline', label: 'Downline', icon: '🌳' },
            { id: 'upline', label: 'Upline', icon: '⬆️' },
            { id: 'bulletin', label: 'Bulletin', icon: '📢' },
            { id: 'meetings', label: 'Meetings', icon: '📅' },
            { id: 'communication', label: 'Messages', icon: '💬' },
            { id: 'leaderboard', label: 'Contests', icon: '🏆' },
            { id: 'recruit', label: 'Recruit', icon: '👥' },
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
            </button>
          ))}
        </nav>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Rank Badge */}
            {associate && (
              <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-8 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">Current Rank</p>
                    <h2 className="mt-2 text-4xl font-black text-purple-900">
                      {associate.rank || 'REP'}
                    </h2>
                    <p className="mt-2 text-sm text-purple-700">
                      {rankProgress?.nextRank ? `Next: ${rankProgress.nextRank}` : 'Maximum rank achieved!'}
                    </p>
                  </div>
                  <div className="text-6xl">🏆</div>
                </div>
                {rankProgress && rankProgress.progress < 100 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-700">Progress to {rankProgress.nextRank}</span>
                      <span className="text-sm font-bold text-purple-900">{rankProgress.progress}%</span>
                    </div>
                    <div className="h-4 w-full rounded-full bg-purple-200">
                      <div
                        className="h-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
                        style={{ width: `${rankProgress.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-purple-50 p-6 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Earnings</p>
                <p className="mt-3 text-3xl font-black text-gray-900">
                  ${associate?.totalEarnings.toFixed(2) || '0.00'}
                </p>
                <p className="mt-2 text-sm text-gray-600">All-time commissions</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-pink-50 p-6 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Monthly Earnings</p>
                <p className="mt-3 text-3xl font-black text-gray-900">
                  ${associate?.monthlyEarnings.toFixed(2) || '0.00'}
                </p>
                <p className="mt-2 text-sm text-gray-600">This month</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-indigo-50 p-6 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recruits</p>
                <p className="mt-3 text-3xl font-black text-gray-900">
                  {associate?.totalRecruits || 0}
                </p>
                <p className="mt-2 text-sm text-gray-600">{associate?.activeRecruits || 0} active</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Referrals</p>
                <p className="mt-3 text-3xl font-black text-gray-900">
                  {referrals.length}
                </p>
                <p className="mt-2 text-sm text-gray-600">Active referrals</p>
              </div>
            </div>

            {/* Referral Code Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Referral Code</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
                  <p className="text-sm font-medium text-purple-700 mb-1">Share this code</p>
                  <p className="text-3xl font-black text-purple-900 font-mono">
                    {associate?.referralCode || 'LOADING...'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (associate?.referralCode) {
                      navigator.clipboard.writeText(associate.referralCode);
                      alert('Referral code copied!');
                    }
                  }}
                  className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
                >
                  Copy
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Share your referral code with restaurants to earn commissions on their subscriptions and orders.
              </p>
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Commission History</h3>
              {commissions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No commissions yet</p>
                  <p className="mt-2 text-sm text-gray-400">Start referring restaurants to earn commissions!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((commission) => (
                        <tr key={commission.id} className="border-b border-gray-100">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(commission.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 capitalize">{commission.type}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            ${commission.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                commission.status === 'PAID'
                                  ? 'bg-green-100 text-green-800'
                                  : commission.status === 'APPROVED'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {commission.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Referrals</h3>
              {referrals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No referrals yet</p>
                  <p className="mt-2 text-sm text-gray-400">Share your referral code to start earning!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{referral.tenant.name}</h4>
                          <p className="text-sm text-gray-600">
                            Commission Rate: {(referral.commissionRate * 100).toFixed(1)}%
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            referral.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : referral.status === 'approved'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {referral.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rank Tab */}
        {activeTab === 'rank' && rankProgress && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Rank Progress</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Current Rank: {rankProgress.currentRank}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {rankProgress.requirements?.description || 'No description available'}
                      </p>
                    </div>
                    <div className="text-5xl">
                      {rankProgress.currentRank === 'SVP' ? '👑' : 
                       rankProgress.currentRank === 'VP' ? '🎩' : 
                       rankProgress.currentRank === 'DIRECTOR' ? '👔' : 
                       rankProgress.currentRank === 'MANAGER' ? '🏅' : 
                       rankProgress.currentRank === 'SUPERVISOR' ? '🎖️' : '⭐'}
                    </div>
                  </div>

                  {rankProgress.nextRank && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress to {rankProgress.nextRank}</span>
                        <span className="text-sm font-bold text-gray-900">{rankProgress.progress}%</span>
                      </div>
                      <div className="h-6 w-full rounded-full bg-gray-200">
                        <div
                          className="h-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${rankProgress.progress}%` }}
                        >
                          {rankProgress.progress > 20 && (
                            <span className="text-xs font-bold text-white">{rankProgress.progress}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {rankProgress.currentStats && (
                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold text-gray-600">Active Recruits</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {rankProgress.currentStats.activeRecruits}
                          {rankProgress.requirements && (
                            <span className="text-sm font-normal text-gray-500">
                              {' '}/ {rankProgress.requirements.minActiveRecruits}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold text-gray-600">Total Sales</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {rankProgress.currentStats.sales}
                          {rankProgress.requirements && (
                            <span className="text-sm font-normal text-gray-500">
                              {' '}/ {rankProgress.requirements.minSales}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold text-gray-600">Total Earnings</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          ${rankProgress.currentStats.earnings.toFixed(2)}
                          {rankProgress.requirements && (
                            <span className="text-sm font-normal text-gray-500">
                              {' '}/ ${rankProgress.requirements.minEarnings.toFixed(2)}
                            </span>
                          )}
                        </p>
                      </div>
                      {rankProgress.requirements?.minManagersInDownline && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs font-semibold text-gray-600">Managers in Downline</p>
                          <p className="mt-1 text-2xl font-bold text-gray-900">
                            {rankProgress.currentStats.managersInDownline}
                            <span className="text-sm font-normal text-gray-500">
                              {' '}/ {rankProgress.requirements.minManagersInDownline}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {rankProgress.missing && rankProgress.missing.length > 0 && (
                    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-800 mb-2">Requirements to meet:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                        {rankProgress.missing.map((req: string, idx: number) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Achievements</h3>
              {achievements.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No achievements yet</p>
                  <p className="mt-2 text-sm text-gray-400">Complete sales and recruit associates to earn achievements!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-purple-50 p-6 shadow-lg hover:shadow-xl transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{achievement.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                          <p className="text-xs text-purple-600 mt-2 font-semibold">
                            +{achievement.points} points • {new Date(achievement.earnedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Downline Tab */}
        {activeTab === 'downline' && associate && (
          <div className="space-y-6">
            <EnhancedDownlineTree associateId={associate.id} />
          </div>
        )}

        {/* Upline Tab */}
        {activeTab === 'upline' && associate && (
          <div className="space-y-6">
            <UplineView associateId={associate.id} />
          </div>
        )}

        {/* Bulletin Board Tab */}
        {activeTab === 'bulletin' && associate && (
          <div className="space-y-6">
            <BulletinBoard associateId={associate.id} />
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && associate && (
          <div className="space-y-6">
            <MeetingsSchedule associateId={associate.id} />
          </div>
        )}

        {/* Communication Tab */}
        {activeTab === 'communication' && associate && (
          <div className="space-y-6">
            <TeamCommunication associateId={associate.id} />
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && associate && (
          <div className="space-y-6">
            <ContestLeaderboard associateId={associate.id} />
          </div>
        )}

        {/* Recruit Tab */}
        {activeTab === 'recruit' && associate && (
          <div className="space-y-6">
            <RecruitOnboarding sponsorId={associate.id} onSuccess={() => {
              // Refresh data after successful recruitment
              loadDashboardData();
              setActiveTab('downline');
            }} />
          </div>
        )}
      </main>
    </div>
  );
}

