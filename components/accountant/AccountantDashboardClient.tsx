'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientList from './ClientList';
import TaxSummaryCard from './TaxSummaryCard';

interface Accountant {
  id: string;
  name: string;
  firmName: string | null;
  email: string;
}

interface TenantSummary {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  logoUrl: string | null;
  accessLevel: string;
  totalCollected: number;
  totalRemitted: number;
  pendingRemittances: number;
  lastActivity: Date | null;
}

interface Props {
  accountant: Accountant;
  tenantSummaries: TenantSummary[];
}

export default function AccountantDashboardClient({ accountant, tenantSummaries }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'taxDue' | 'activity'>('activity');

  const filteredSummaries = tenantSummaries.filter((summary) => {
    if (filter === 'pending') {
      return summary.pendingRemittances > 0;
    }
    return true;
  });

  const sortedSummaries = [...filteredSummaries].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.tenantName.localeCompare(b.tenantName);
      case 'taxDue':
        return (b.totalCollected - b.totalRemitted) - (a.totalCollected - a.totalRemitted);
      case 'activity':
        if (!a.lastActivity && !b.lastActivity) return 0;
        if (!a.lastActivity) return 1;
        if (!b.lastActivity) return -1;
        return b.lastActivity.getTime() - a.lastActivity.getTime();
      default:
        return 0;
    }
  });

  const handleClientClick = (slug: string) => {
    router.push(`/accountant/${slug}?accountantId=${accountant.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tax Dashboard</h1>
              <p className="text-sm text-gray-600">
                {accountant.firmName || accountant.name} - {tenantSummaries.length} clients
              </p>
            </div>
            <button
              onClick={() => router.push('/accountant')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TaxSummaryCard summaries={tenantSummaries} />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Clients</h2>
            <div className="flex gap-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Clients</option>
                <option value="pending">Pending Remittances</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="activity">Last Activity</option>
                <option value="name">Name</option>
                <option value="taxDue">Tax Due</option>
              </select>
            </div>
          </div>

          <ClientList summaries={sortedSummaries} onClientClick={handleClientClick} />
        </div>
      </div>
    </div>
  );
}

