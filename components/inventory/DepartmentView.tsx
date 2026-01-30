'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import RequestFlow from './RequestFlow';
import MovementLogger from './MovementLogger';

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  unit: string;
  costPerUnit: number;
  currentStock: number;
  reorderPoint: number | null;
  expirationDate: string | null;
  vendorName: string | null;
  menuSection: { id: string; name: string; type: string } | null;
}

interface Department {
  id: string;
  name: string;
  type: string;
  itemCount: number;
  totalStockValue: number;
  lowStockCount: number;
  expiringCount: number;
}

interface DepartmentViewProps {
  tenantSlug: string;
  departmentId: string;
}

type TabType = 'stock' | 'requests' | 'log';

export default function DepartmentView({ tenantSlug, departmentId }: DepartmentViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [department, setDepartment] = useState<Department | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const apiBase = `/api/inventory`;
  const authParam = `tenantSlug=${tenantSlug}`;

  const fetchData = useCallback(async () => {
    try {
      const [deptRes, itemsRes] = await Promise.all([
        fetch(`${apiBase}/departments?${authParam}`),
        fetch(`${apiBase}/items?departmentId=${departmentId}&${authParam}`),
      ]);

      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData.departments || []);
        const current = (deptData.departments || []).find((d: Department) => d.id === departmentId);
        setDepartment(current || null);
      }

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch department data:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, departmentId, apiBase, authParam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStockStatus = (item: InventoryItem) => {
    if (item.reorderPoint !== null && item.currentStock <= 0) return 'out';
    if (item.reorderPoint !== null && item.currentStock <= item.reorderPoint) return 'low';
    return 'ok';
  };

  const getExpiryStatus = (item: InventoryItem) => {
    if (!item.expirationDate) return null;
    const days = Math.ceil((new Date(item.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'expired';
    if (days <= 3) return 'critical';
    if (days <= 7) return 'warning';
    return null;
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-violet-900/50 border-b border-purple-800/30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/${tenantSlug}/inventory`)}
                className="p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold">{department?.name || 'Department'}</h1>
                <p className="text-purple-300 text-sm">{items.length} items tracked</p>
              </div>
            </div>
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              className="p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Quick Stats */}
          {department && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-gray-800/40 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">${department.totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-400">Stock Value</p>
              </div>
              <div className="bg-gray-800/40 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${department.lowStockCount > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                  {department.lowStockCount}
                </p>
                <p className="text-xs text-gray-400">Low Stock</p>
              </div>
              <div className="bg-gray-800/40 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${department.expiringCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {department.expiringCount}
                </p>
                <p className="text-xs text-gray-400">Expiring</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 flex">
          {[
            { id: 'stock' as TabType, label: 'Stock' },
            { id: 'requests' as TabType, label: 'Requests' },
            { id: 'log' as TabType, label: 'Log Movement' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 max-w-4xl mx-auto px-4 py-4 w-full">
        {activeTab === 'stock' && (
          <div>
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 text-base"
              />
            </div>

            {/* Item List */}
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No items found</p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const expiryStatus = getExpiryStatus(item);

                  return (
                    <div
                      key={item.id}
                      className={`bg-gray-900 border rounded-xl p-4 ${
                        stockStatus === 'out' ? 'border-red-700/50' :
                        stockStatus === 'low' ? 'border-amber-700/50' :
                        'border-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{item.name}</h3>
                            {stockStatus === 'out' && (
                              <span className="px-2 py-0.5 bg-red-900/50 text-red-400 text-xs rounded-full">OUT</span>
                            )}
                            {stockStatus === 'low' && (
                              <span className="px-2 py-0.5 bg-amber-900/50 text-amber-400 text-xs rounded-full">LOW</span>
                            )}
                            {expiryStatus === 'expired' && (
                              <span className="px-2 py-0.5 bg-red-900/50 text-red-400 text-xs rounded-full">EXPIRED</span>
                            )}
                            {expiryStatus === 'critical' && (
                              <span className="px-2 py-0.5 bg-red-900/50 text-red-300 text-xs rounded-full">EXP SOON</span>
                            )}
                            {expiryStatus === 'warning' && (
                              <span className="px-2 py-0.5 bg-yellow-900/50 text-yellow-400 text-xs rounded-full">EXP 7d</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                            {item.sku && <span>SKU: {item.sku}</span>}
                            <span className="capitalize">{item.category}</span>
                            {item.vendorName && <span>{item.vendorName}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            stockStatus === 'out' ? 'text-red-400' :
                            stockStatus === 'low' ? 'text-amber-400' :
                            'text-white'
                          }`}>
                            {item.currentStock}
                          </p>
                          <p className="text-xs text-gray-400">{item.unit}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>${item.costPerUnit.toFixed(2)} / {item.unit}</span>
                        {item.reorderPoint !== null && (
                          <span>Reorder at: {item.reorderPoint} {item.unit}</span>
                        )}
                        {item.expirationDate && (
                          <span>Exp: {new Date(item.expirationDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <RequestFlow
            tenantSlug={tenantSlug}
            departmentId={departmentId}
            departmentName={department?.name || ''}
            departments={departments}
            items={items}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'log' && (
          <MovementLogger
            tenantSlug={tenantSlug}
            departmentId={departmentId}
            items={items}
            onRefresh={fetchData}
          />
        )}
      </div>
    </div>
  );
}
