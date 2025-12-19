'use client';

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
  summaries: TenantSummary[];
  onClientClick: (slug: string) => void;
}

export default function ClientList({ summaries, onClientClick }: Props) {
  if (summaries.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">No clients found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {summaries.map((summary) => {
        const taxDue = summary.totalCollected - summary.totalRemitted;
        
        return (
          <div
            key={summary.tenantId}
            onClick={() => onClientClick(summary.tenantSlug)}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              {summary.logoUrl ? (
                <img
                  src={summary.logoUrl}
                  alt={summary.tenantName}
                  className="h-12 w-12 object-contain"
                />
              ) : (
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">
                    {summary.tenantName.charAt(0)}
                  </span>
                </div>
              )}
              {summary.pendingRemittances > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  {summary.pendingRemittances} Pending
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {summary.tenantName}
            </h3>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Tax Collected:</span>
                <span className="font-medium">${summary.totalCollected.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Remitted:</span>
                <span className="font-medium">${summary.totalRemitted.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Tax Due:</span>
                <span className={`font-bold ${taxDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${taxDue.toFixed(2)}
                </span>
              </div>
              {summary.lastActivity && (
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Last Activity: {new Date(summary.lastActivity).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                View Details
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

