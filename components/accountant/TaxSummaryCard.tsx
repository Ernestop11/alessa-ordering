'use client';

interface TenantSummary {
  tenantId: string;
  totalCollected: number;
  totalRemitted: number;
  pendingRemittances: number;
}

interface Props {
  summaries: TenantSummary[];
}

export default function TaxSummaryCard({ summaries }: Props) {
  const totalCollected = summaries.reduce((sum, s) => sum + s.totalCollected, 0);
  const totalRemitted = summaries.reduce((sum, s) => sum + s.totalRemitted, 0);
  const totalPending = summaries.reduce((sum, s) => sum + (s.totalCollected - s.totalRemitted), 0);
  const totalPendingRemittances = summaries.reduce((sum, s) => sum + s.pendingRemittances, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Total Tax Collected</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">
            ${totalCollected.toFixed(2)}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Total Tax Remitted</div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            ${totalRemitted.toFixed(2)}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-sm text-yellow-600 font-medium">Tax Due</div>
          <div className="text-2xl font-bold text-yellow-900 mt-1">
            ${totalPending.toFixed(2)}
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-sm text-orange-600 font-medium">Pending Remittances</div>
          <div className="text-2xl font-bold text-orange-900 mt-1">
            {totalPendingRemittances}
          </div>
        </div>
      </div>
    </div>
  );
}

