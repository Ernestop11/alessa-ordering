"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface Props {
  currentMRR: number;
  projectedMRR: number;
  historicalData?: Array<{ month: string; revenue: number }>;
}

export default function RevenueProjection({ currentMRR, projectedMRR, historicalData = [] }: Props) {
  // Generate projection data if not provided
  const generateProjectionData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = months.map((month, index) => {
      if (index < historicalData.length) {
        return historicalData[index];
      }
      // Project future months
      const growthRate = (projectedMRR - currentMRR) / currentMRR;
      const projectedValue = currentMRR * (1 + growthRate * (index - historicalData.length + 1));
      return {
        month,
        revenue: index < historicalData.length ? historicalData[index].revenue : projectedValue,
        projected: index >= historicalData.length,
      };
    });
    return data;
  };

  const chartData = generateProjectionData();
  const growthRate = currentMRR > 0 ? ((projectedMRR - currentMRR) / currentMRR) * 100 : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Revenue Projection</h3>
        <p className="mt-1 text-sm text-gray-600">Monthly recurring revenue and projections</p>
      </div>

      {/* Key Metrics */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Current MRR</p>
          <p className="mt-1 text-xl font-bold text-gray-900">${currentMRR.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Projected (30d)</p>
          <p className="mt-1 text-xl font-bold text-blue-600">${projectedMRR.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Growth Rate</p>
          <p className={`mt-1 text-xl font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growthRate >= 0 ? '+' : ''}
            {growthRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Projection Factors */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs font-semibold text-gray-700">Projection Factors:</p>
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          <li>• Active deals closing in pipeline</li>
          <li>• New tenant onboarding scheduled</li>
          <li>• Upsells and cross-sells</li>
          <li>• MLM commission growth</li>
        </ul>
      </div>
    </div>
  );
}

