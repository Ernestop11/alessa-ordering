'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Package, ArrowLeftRight, TrendingUp, AlertTriangle,
  Plus, Search, Filter, ChevronDown, ChevronRight,
  Check, X, Clock, Truck, ArrowLeft,
} from 'lucide-react';

type Tab = 'overview' | 'items' | 'movements' | 'requests' | 'reports';

interface Department {
  id: string;
  name: string;
  type: string;
  itemCount: number;
  totalStockValue: number;
  lowStockCount: number;
  expiringCount: number;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  unit: string;
  costPerUnit: number;
  salePrice: number | null;
  currentStock: number;
  reorderPoint: number | null;
  expirationDate: string | null;
  vendorName: string | null;
  barcode: string | null;
  active: boolean;
  menuSection: { id: string; name: string; type: string } | null;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  costPerUnit: number | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  item: { id: string; name: string; unit: string; category: string };
}

interface InventoryRequest {
  id: string;
  status: string;
  requestedBy: string;
  approvedBy: string | null;
  notes: string | null;
  createdAt: string;
  fulfilledAt: string | null;
  fromSection: { name: string };
  toSection: { name: string };
  items: {
    id: string;
    quantityRequested: number;
    quantityFulfilled: number | null;
    item: { id: string; name: string; unit: string; currentStock: number };
  }[];
}

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments);
      }
    } catch (e) {
      console.error('Failed to fetch departments', e);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDepartment) params.set('departmentId', selectedDepartment);
      const res = await fetch(`/api/inventory/items?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch (e) {
      console.error('Failed to fetch items', e);
    }
  }, [selectedDepartment]);

  const fetchMovements = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/movements?limit=50');
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements);
      }
    } catch (e) {
      console.error('Failed to fetch movements', e);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch (e) {
      console.error('Failed to fetch requests', e);
    }
  }, []);

  const fetchWeeklyReport = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/reports/weekly');
      if (res.ok) {
        const data = await res.json();
        setWeeklyReport(data.report);
      }
    } catch (e) {
      console.error('Failed to fetch report', e);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchDepartments(), fetchItems(), fetchMovements(), fetchRequests(), fetchWeeklyReport()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchDepartments, fetchItems, fetchMovements, fetchRequests, fetchWeeklyReport]);

  useEffect(() => {
    fetchItems();
  }, [selectedDepartment, fetchItems]);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStockValue = departments.reduce((sum, d) => sum + d.totalStockValue, 0);
  const totalLowStock = departments.reduce((sum, d) => sum + d.lowStockCount, 0);
  const totalExpiring = departments.reduce((sum, d) => sum + d.expiringCount, 0);
  const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const movementTypeLabel: Record<string, string> = {
    PURCHASE: 'Purchase',
    SALE: 'Sale',
    TRANSFER_OUT: 'Transfer Out',
    TRANSFER_IN: 'Transfer In',
    SPOILAGE: 'Spoilage',
    RETURN: 'Return',
    ADJUSTMENT: 'Adjustment',
  };

  const movementTypeColor: Record<string, string> = {
    PURCHASE: 'text-green-700 bg-green-100',
    SALE: 'text-blue-700 bg-blue-100',
    TRANSFER_OUT: 'text-orange-700 bg-orange-100',
    TRANSFER_IN: 'text-purple-700 bg-purple-100',
    SPOILAGE: 'text-red-700 bg-red-100',
    RETURN: 'text-yellow-700 bg-yellow-100',
    ADJUSTMENT: 'text-gray-700 bg-gray-100',
  };

  const statusColor: Record<string, string> = {
    PENDING: 'text-yellow-700 bg-yellow-100',
    APPROVED: 'text-blue-700 bg-blue-100',
    FULFILLED: 'text-green-700 bg-green-100',
    REJECTED: 'text-red-700 bg-red-100',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin/menu" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </a>
            <Package className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-900">Inventory Manager</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddItem(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto">
          {[
            { id: 'overview' as Tab, label: 'Overview', icon: TrendingUp },
            { id: 'items' as Tab, label: 'Items', icon: Package },
            { id: 'movements' as Tab, label: 'Movements', icon: ArrowLeftRight },
            { id: 'requests' as Tab, label: `Requests${pendingRequests ? ` (${pendingRequests})` : ''}`, icon: Truck },
            { id: 'reports' as Tab, label: 'P&L', icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Stock Value" value={formatCurrency(totalStockValue)} color="purple" />
              <StatCard
                label="Low Stock Alerts"
                value={totalLowStock.toString()}
                color={totalLowStock > 0 ? 'red' : 'green'}
              />
              <StatCard
                label="Expiring (7 days)"
                value={totalExpiring.toString()}
                color={totalExpiring > 0 ? 'orange' : 'green'}
              />
              <StatCard
                label="Pending Requests"
                value={pendingRequests.toString()}
                color={pendingRequests > 0 ? 'yellow' : 'green'}
              />
            </div>

            {/* Departments Grid */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Departments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    onClick={() => {
                      setSelectedDepartment(dept.id);
                      setActiveTab('items');
                    }}
                    className="bg-white rounded-lg border p-4 hover:border-purple-300 hover:shadow-sm cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{dept.type}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Items:</span>{' '}
                        <span className="font-medium">{dept.itemCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Value:</span>{' '}
                        <span className="font-medium">{formatCurrency(dept.totalStockValue)}</span>
                      </div>
                      {dept.lowStockCount > 0 && (
                        <div className="text-red-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> {dept.lowStockCount} low
                        </div>
                      )}
                      {dept.expiringCount > 0 && (
                        <div className="text-orange-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {dept.expiringCount} expiring
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
              <div className="bg-white rounded-lg border divide-y">
                {movements.slice(0, 10).map((m) => (
                  <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${movementTypeColor[m.type]}`}>
                        {movementTypeLabel[m.type]}
                      </span>
                      <div>
                        <span className="font-medium text-gray-900">{m.item.name}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {m.quantity > 0 ? '+' : ''}{m.quantity} {m.item.unit}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(m.createdAt)}</span>
                  </div>
                ))}
                {movements.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-400">No movements yet</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ITEMS TAB */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Cost</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Value</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredItems.map((item) => {
                    const isLow = item.reorderPoint !== null && item.currentStock <= item.reorderPoint;
                    const isExpiring = item.expirationDate && (() => {
                      const days = Math.ceil((new Date(item.expirationDate).getTime() - Date.now()) / (86400000));
                      return days <= 7 && days >= 0;
                    })();

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            {item.sku && <span className="mr-2">SKU: {item.sku}</span>}
                            {item.category}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.menuSection?.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(item.costPerUnit)}/{item.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(item.currentStock * item.costPerUnit)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isLow && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Low</span>
                          )}
                          {isExpiring && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded ml-1">Expiring</span>
                          )}
                          {!isLow && !isExpiring && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredItems.length === 0 && (
                <div className="px-4 py-12 text-center text-gray-400">
                  {items.length === 0 ? 'No inventory items yet. Add your first item.' : 'No items match your search.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MOVEMENTS TAB */}
        {activeTab === 'movements' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Stock Movements</h2>
              <button
                onClick={() => setShowAddMovement(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" /> Log Movement
              </button>
            </div>
            <div className="bg-white rounded-lg border divide-y">
              {movements.map((m) => (
                <div key={m.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${movementTypeColor[m.type]}`}>
                        {movementTypeLabel[m.type]}
                      </span>
                      <span className="font-medium text-gray-900">{m.item.name}</span>
                      <span className={`font-mono text-sm ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity} {m.item.unit}
                      </span>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <div>{formatDate(m.createdAt)}</div>
                      {m.createdBy && <div>by {m.createdBy}</div>}
                    </div>
                  </div>
                  {m.notes && <p className="text-sm text-gray-500 mt-1 ml-24">{m.notes}</p>}
                </div>
              ))}
              {movements.length === 0 && (
                <div className="px-4 py-12 text-center text-gray-400">No movements recorded yet.</div>
              )}
            </div>
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Inter-Department Requests</h2>
              <button
                onClick={() => setShowNewRequest(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" /> New Request
              </button>
            </div>
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor[req.status]}`}>
                        {req.status}
                      </span>
                      <span className="text-sm text-gray-600">
                        {req.fromSection.name} <ChevronRight className="inline h-3 w-3" /> {req.toSection.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(req.createdAt)}</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    Requested by {req.requestedBy}
                    {req.approvedBy && <span> &middot; Approved by {req.approvedBy}</span>}
                  </div>
                  <div className="space-y-1">
                    {req.items.map((ri) => (
                      <div key={ri.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{ri.item.name}</span>
                        <span className="text-gray-500">
                          {ri.quantityFulfilled !== null
                            ? `${ri.quantityFulfilled}/${ri.quantityRequested} ${ri.item.unit}`
                            : `${ri.quantityRequested} ${ri.item.unit}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  {req.status === 'PENDING' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={async () => {
                          await fetch(`/api/inventory/requests/${req.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'approve' }),
                          });
                          fetchRequests();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button
                        onClick={async () => {
                          await fetch(`/api/inventory/requests/${req.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'reject' }),
                          });
                          fetchRequests();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  )}
                  {req.status === 'APPROVED' && (
                    <button
                      onClick={async () => {
                        await fetch(`/api/inventory/requests/${req.id}/fulfill`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({}),
                        });
                        fetchRequests();
                        fetchItems();
                        fetchMovements();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 mt-3 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                    >
                      <Truck className="h-3 w-3" /> Fulfill
                    </button>
                  )}
                </div>
              ))}
              {requests.length === 0 && (
                <div className="bg-white rounded-lg border px-4 py-12 text-center text-gray-400">
                  No requests yet. Create one to transfer inventory between departments.
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Weekly P&L Report</h2>
            {weeklyReport ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg border p-4">
                    <div className="text-sm text-gray-500 mb-1">Revenue (Subtotals)</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(weeklyReport.totalRevenue)}</div>
                    <div className="text-xs text-gray-400 mt-1">{weeklyReport.details?.orderCount || 0} orders</div>
                  </div>
                  <div className="bg-white rounded-lg border p-4">
                    <div className="text-sm text-gray-500 mb-1">Cost of Goods (COGS)</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(weeklyReport.totalCOGS)}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Purchases: {formatCurrency(weeklyReport.details?.purchaseCost || 0)} |
                      Spoilage: {formatCurrency(weeklyReport.details?.spoilageCost || 0)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border p-4">
                    <div className="text-sm text-gray-500 mb-1">Gross Margin</div>
                    <div className={`text-2xl font-bold ${weeklyReport.grossMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(weeklyReport.grossMargin)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {weeklyReport.details?.marginPercent || 0}% margin
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Breakdown</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-gray-500">Revenue (subtotals)</div>
                    <div className="text-right font-medium">{formatCurrency(weeklyReport.totalRevenue)}</div>
                    <div className="text-gray-500">Tax collected</div>
                    <div className="text-right">{formatCurrency(weeklyReport.details?.totalTax || 0)}</div>
                    <div className="text-gray-500">Tips</div>
                    <div className="text-right">{formatCurrency(weeklyReport.details?.totalTips || 0)}</div>
                    <div className="border-t pt-2 text-gray-500">Purchase costs</div>
                    <div className="border-t pt-2 text-right text-red-600">-{formatCurrency(weeklyReport.details?.purchaseCost || 0)}</div>
                    <div className="text-gray-500">Spoilage costs</div>
                    <div className="text-right text-red-600">-{formatCurrency(weeklyReport.details?.spoilageCost || 0)}</div>
                    <div className="text-gray-500">Vendor credits</div>
                    <div className="text-right text-green-600">+{formatCurrency(weeklyReport.details?.vendorCredits || 0)}</div>
                    <div className="border-t pt-2 font-semibold text-gray-900">Gross Margin</div>
                    <div className={`border-t pt-2 text-right font-bold ${weeklyReport.grossMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(weeklyReport.grossMargin)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    const now = new Date();
                    const dayOfWeek = now.getDay();
                    const monday = new Date(now);
                    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                    monday.setHours(0, 0, 0, 0);

                    await fetch('/api/inventory/reports/weekly', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ weekStart: monday.toISOString() }),
                    });
                    fetchWeeklyReport();
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Refresh Report
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border px-4 py-12 text-center text-gray-400">
                <p>No report data yet. Start logging purchases and the P&L will populate automatically.</p>
                <button
                  onClick={async () => {
                    const now = new Date();
                    const dayOfWeek = now.getDay();
                    const monday = new Date(now);
                    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                    monday.setHours(0, 0, 0, 0);

                    await fetch('/api/inventory/reports/weekly', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ weekStart: monday.toISOString() }),
                    });
                    fetchWeeklyReport();
                  }}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Generate Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD ITEM MODAL */}
      {showAddItem && (
        <AddItemModal
          departments={departments}
          onClose={() => setShowAddItem(false)}
          onSaved={() => {
            setShowAddItem(false);
            fetchItems();
            fetchDepartments();
          }}
        />
      )}

      {/* ADD MOVEMENT MODAL */}
      {showAddMovement && (
        <AddMovementModal
          items={items}
          onClose={() => setShowAddMovement(false)}
          onSaved={() => {
            setShowAddMovement(false);
            fetchMovements();
            fetchItems();
            fetchDepartments();
          }}
        />
      )}

      {/* NEW REQUEST MODAL */}
      {showNewRequest && (
        <NewRequestModal
          departments={departments}
          items={items}
          onClose={() => setShowNewRequest(false)}
          onSaved={() => {
            setShowNewRequest(false);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green: 'bg-green-50 border-green-200 text-green-700',
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <div className="text-xs font-medium opacity-75">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function AddItemModal({
  departments,
  onClose,
  onSaved,
}: {
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: '', sku: '', category: 'general', unit: 'each',
    costPerUnit: '', salePrice: '', currentStock: '',
    reorderPoint: '', menuSectionId: '', vendorName: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          costPerUnit: parseFloat(form.costPerUnit) || 0,
          salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
          currentStock: parseFloat(form.currentStock) || 0,
          reorderPoint: form.reorderPoint ? parseFloat(form.reorderPoint) : null,
          menuSectionId: form.menuSectionId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create item');
      }

      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Add Inventory Item</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="general">General</option>
                  <option value="meat">Meat</option>
                  <option value="produce">Produce</option>
                  <option value="dairy">Dairy</option>
                  <option value="dry-goods">Dry Goods</option>
                  <option value="beverages">Beverages</option>
                  <option value="supplies">Supplies</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="each">Each</option>
                  <option value="lb">Pound (lb)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="oz">Ounce (oz)</option>
                  <option value="gallon">Gallon</option>
                  <option value="case">Case</option>
                  <option value="bag">Bag</option>
                  <option value="box">Box</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={form.menuSectionId} onChange={(e) => setForm({ ...form, menuSectionId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Unassigned</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost/Unit</label>
                <input type="number" step="0.01" value={form.costPerUnit}
                  onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                <input type="number" step="0.01" value={form.salePrice}
                  onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="POS only" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                <input type="number" step="0.01" value={form.currentStock}
                  onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                <input type="number" step="0.01" value={form.reorderPoint}
                  onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Low stock alert" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Optional" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddMovementModal({
  items,
  onClose,
  onSaved,
}: {
  items: InventoryItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ itemId: '', type: 'PURCHASE', quantity: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: form.itemId,
          type: form.type,
          quantity: parseFloat(form.quantity),
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to log movement');
      }

      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Log Stock Movement</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
              <select required value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Select item...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.currentStock} {item.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="PURCHASE">Purchase (stock in)</option>
                <option value="SPOILAGE">Spoilage (stock out)</option>
                <option value="ADJUSTMENT">Adjustment (+/-)</option>
                <option value="RETURN">Return to vendor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input required type="number" step="0.01" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Amount" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Optional notes" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Log Movement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function NewRequestModal({
  departments,
  items,
  onClose,
  onSaved,
}: {
  departments: Department[];
  items: InventoryItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ fromSectionId: '', toSectionId: '', notes: '' });
  const [requestItems, setRequestItems] = useState<{ itemId: string; quantity: string }[]>([
    { itemId: '', quantity: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const validItems = requestItems.filter((ri) => ri.itemId && parseFloat(ri.quantity) > 0);
    if (validItems.length === 0) {
      setError('Add at least one item with quantity');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/inventory/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromSectionId: form.fromSectionId,
          toSectionId: form.toSectionId,
          notes: form.notes || null,
          items: validItems.map((ri) => ({
            itemId: ri.itemId,
            quantity: parseFloat(ri.quantity),
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create request');
      }

      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">New Inter-Department Request</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From (requesting)</label>
                <select required value={form.fromSectionId}
                  onChange={(e) => setForm({ ...form, fromSectionId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To (supplying)</label>
                <select required value={form.toSectionId}
                  onChange={(e) => setForm({ ...form, toSectionId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select...</option>
                  {departments.filter((d) => d.id !== form.fromSectionId).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Items</label>
              {requestItems.map((ri, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <select value={ri.itemId}
                    onChange={(e) => {
                      const updated = [...requestItems];
                      updated[idx].itemId = e.target.value;
                      setRequestItems(updated);
                    }}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm">
                    <option value="">Select item...</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                    ))}
                  </select>
                  <input type="number" step="0.01" placeholder="Qty" value={ri.quantity}
                    onChange={(e) => {
                      const updated = [...requestItems];
                      updated[idx].quantity = e.target.value;
                      setRequestItems(updated);
                    }}
                    className="w-20 border rounded-lg px-3 py-2 text-sm" />
                  {requestItems.length > 1 && (
                    <button type="button" onClick={() => setRequestItems(requestItems.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
              <button type="button"
                onClick={() => setRequestItems([...requestItems, { itemId: '', quantity: '' }])}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                + Add Item
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Optional notes" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {saving ? 'Sending...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
