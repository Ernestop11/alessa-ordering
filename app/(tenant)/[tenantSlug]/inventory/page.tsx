'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Department {
  id: string;
  name: string;
  type: string;
  itemCount: number;
  totalStockValue: number;
  lowStockCount: number;
  expiringCount: number;
}

export default function InventoryDepartmentSelector() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params?.tenantSlug as string;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch(`/api/inventory/departments?tenantSlug=${tenantSlug}`);
      if (!res.ok) throw new Error('Failed to load departments');
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (tenantSlug) fetchDepartments();
  }, [tenantSlug, fetchDepartments]);

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      RESTAURANT: '\u{1F372}',
      GROCERY: '\u{1F6D2}',
      BAKERY: '\u{1F950}',
      JUICE_BAR: '\u{1F964}',
    };
    return icons[type] || '\u{1F4E6}';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      RESTAURANT: 'from-orange-500 to-red-500',
      GROCERY: 'from-emerald-500 to-green-500',
      BAKERY: 'from-amber-500 to-yellow-500',
      JUICE_BAR: 'from-cyan-500 to-blue-500',
    };
    return colors[type] || 'from-purple-500 to-violet-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading departments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-red-900/30 border border-red-700 rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => { setError(''); setLoading(true); fetchDepartments(); }}
            className="px-6 py-3 bg-red-600 text-white rounded-xl text-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-violet-900/50 border-b border-purple-800/30">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-purple-300 mt-2 text-lg">Select your department</p>
        </div>
      </div>

      {/* Department Grid */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {departments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-xl">No departments configured</p>
            <p className="text-gray-600 mt-2">Ask an admin to set up inventory departments</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => router.push(`/${tenantSlug}/inventory/${dept.id}`)}
                className="text-left bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-600 transition-all active:scale-[0.98] touch-manipulation"
              >
                {/* Icon & Name */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getTypeColor(dept.type)} flex items-center justify-center text-2xl`}>
                    {getTypeIcon(dept.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{dept.name}</h2>
                    <p className="text-gray-400 text-sm capitalize">{dept.type.toLowerCase().replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{dept.itemCount}</p>
                    <p className="text-xs text-gray-400">Items</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${dept.lowStockCount > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                      {dept.lowStockCount}
                    </p>
                    <p className="text-xs text-gray-400">Low Stock</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${dept.expiringCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {dept.expiringCount}
                    </p>
                    <p className="text-xs text-gray-400">Expiring</p>
                  </div>
                </div>

                {/* Stock Value */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Stock Value</span>
                  <span className="text-lg font-semibold text-purple-400">
                    ${dept.totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
