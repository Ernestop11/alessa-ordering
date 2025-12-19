'use client';

import { useState } from 'react';

interface Props {
  tenantId: string;
  tenantSlug: string;
}

export default function ReportDownloader({ tenantId, tenantSlug }: Props) {
  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [selectedPeriod, setSelectedPeriod] = useState<{
    start: string;
    end: string;
  }>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  });
  const [format, setFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      if (format === 'pdf') {
        window.open(
          `/api/tax/reports/pdf?tenantId=${tenantId}&periodStart=${selectedPeriod.start}&periodEnd=${selectedPeriod.end}`,
          '_blank'
        );
      } else {
        // CSV/Excel downloads would be implemented here
        const response = await fetch(
          `/api/tax/reports?periodStart=${selectedPeriod.start}&periodEnd=${selectedPeriod.end}&format=${format}`
        );
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-report-${tenantSlug}-${selectedPeriod.start}-${selectedPeriod.end}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (type: 'month' | 'quarter' | 'year') => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (type === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }

    setSelectedPeriod({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
    setPeriodType(type);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Tax Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
          <div className="flex gap-2">
            <button
              onClick={() => handlePeriodChange('month')}
              className={`px-3 py-2 text-sm rounded-md ${
                periodType === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => handlePeriodChange('quarter')}
              className={`px-3 py-2 text-sm rounded-md ${
                periodType === 'quarter'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => handlePeriodChange('year')}
              className={`px-3 py-2 text-sm rounded-md ${
                periodType === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Year
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={selectedPeriod.start}
              onChange={(e) => setSelectedPeriod({ ...selectedPeriod, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="date"
              value={selectedPeriod.end}
              onChange={(e) => setSelectedPeriod({ ...selectedPeriod, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Downloading...' : 'Download Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

