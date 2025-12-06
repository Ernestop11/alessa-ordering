"use client";

interface TopMetricsBarProps {
  totalTenants: number;
  liveTenants: number;
  pendingTenants: number;
  newLeads: number;
  inProgressLeads: number;
  closingLeads: number;
  totalMRR: number;
  projectedMRR: number;
  totalAssociates: number;
  activeRecruits: number;
  onTenantsClick?: () => void;
  onPipelineClick?: () => void;
  onRevenueClick?: () => void;
  onMLMClick?: () => void;
}

export default function TopMetricsBar({
  totalTenants,
  liveTenants,
  pendingTenants,
  newLeads,
  inProgressLeads,
  closingLeads,
  totalMRR,
  projectedMRR,
  totalAssociates,
  activeRecruits,
  onTenantsClick,
  onPipelineClick,
  onRevenueClick,
  onMLMClick,
}: TopMetricsBarProps) {
  const activeDeals = newLeads + inProgressLeads + closingLeads;
  const growthRate = totalMRR > 0 ? ((projectedMRR - totalMRR) / totalMRR) * 100 : 0;

  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Total Tenants */}
      <button
        onClick={onTenantsClick}
        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 text-left shadow-lg shadow-blue-500/10 transition hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20"
      >
        <div className="absolute right-4 top-4 text-4xl opacity-20">👥</div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Tenants</p>
        <p className="mt-3 text-4xl font-black text-gray-900">{totalTenants}</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            {liveTenants} Live
          </span>
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
            {pendingTenants} Pending
          </span>
        </div>
      </button>

      {/* Card 2: Active Deals */}
      <button
        onClick={onPipelineClick}
        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-purple-50 p-6 text-left shadow-lg shadow-purple-500/10 transition hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20"
      >
        <div className="absolute right-4 top-4 text-4xl opacity-20">💼</div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Deals</p>
        <p className="mt-3 text-4xl font-black text-gray-900">{activeDeals}</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <span className="text-xs">{newLeads} New</span>
          <span className="text-xs">•</span>
          <span className="text-xs">{inProgressLeads} In Progress</span>
          <span className="text-xs">•</span>
          <span className="text-xs">{closingLeads} Closing</span>
        </div>
      </button>

      {/* Card 3: Revenue Projection */}
      <button
        onClick={onRevenueClick}
        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-green-50 p-6 text-left shadow-lg shadow-green-500/10 transition hover:scale-105 hover:shadow-xl hover:shadow-green-500/20"
      >
        <div className="absolute right-4 top-4 text-4xl opacity-20">💰</div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Revenue Projection</p>
        <p className="mt-3 text-3xl font-black text-gray-900">${totalMRR.toLocaleString()}/mo</p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className={`font-semibold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growthRate >= 0 ? '↑' : '↓'} {Math.abs(growthRate).toFixed(1)}%
          </span>
          <span className="text-gray-600">→ ${projectedMRR.toLocaleString()}/mo</span>
        </div>
      </button>

      {/* Card 4: MLM Associates */}
      <button
        onClick={onMLMClick}
        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-amber-50 p-6 text-left shadow-lg shadow-amber-500/10 transition hover:scale-105 hover:shadow-xl hover:shadow-amber-500/20"
      >
        <div className="absolute right-4 top-4 text-4xl opacity-20">🌳</div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">MLM Associates</p>
        <p className="mt-3 text-4xl font-black text-gray-900">{totalAssociates}</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {activeRecruits} Active Recruits
          </span>
        </div>
      </button>
    </section>
  );
}

