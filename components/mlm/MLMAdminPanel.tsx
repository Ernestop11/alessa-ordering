'use client';

import { useState, useEffect } from 'react';

interface Associate {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  level: number;
  status: string;
  totalEarnings: number;
  monthlyEarnings: number;
  totalCommissions: number;
  totalPaid: number;
  totalPending: number;
  createdAt: string;
  sponsor?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    downline: number;
    referrals: number;
    commissions: number;
  };
}

interface Referral {
  id: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  associate: {
    id: string;
    name: string;
    email: string;
    referralCode: string;
  };
  status: string;
  commissionRate: number;
  createdAt: string;
}

export default function MLMAdminPanel() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'associates' | 'referrals'>('associates');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load associates
      const associatesRes = await fetch('/api/mlm/associate');
      if (associatesRes.ok) {
        const associatesData = await associatesRes.json();
        setAssociates(associatesData || []);
      }

      // Load referrals
      const referralsRes = await fetch('/api/mlm/referral');
      if (referralsRes.ok) {
        const referralsData = await referralsRes.json();
        setReferrals(referralsData || []);
      }
    } catch (error) {
      console.error('Error loading MLM data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900">MLM Associate Program</h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage associates, referrals, and commissions
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveView('associates')}
          className={`border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeView === 'associates'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
          }`}
        >
          Associates ({associates.length})
        </button>
        <button
          onClick={() => setActiveView('referrals')}
          className={`border-b-2 px-6 py-3 text-sm font-semibold transition ${
            activeView === 'referrals'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
          }`}
        >
          Referrals ({referrals.length})
        </button>
      </nav>

      {/* Associates View */}
      {activeView === 'associates' && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Referral Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody>
                {associates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No associates yet
                    </td>
                  </tr>
                ) : (
                  associates.map((associate) => (
                    <tr key={associate.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{associate.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{associate.email}</td>
                      <td className="px-6 py-4 text-sm font-mono text-purple-600">{associate.referralCode}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{associate.level}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ${associate.totalEarnings.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            associate.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : associate.status === 'INACTIVE'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {associate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(associate.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Referrals View */}
      {activeView === 'referrals' && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Associate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Commission Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No referrals yet
                    </td>
                  </tr>
                ) : (
                  referrals.map((referral) => (
                    <tr key={referral.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{referral.tenant.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{referral.associate.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {(referral.commissionRate * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

