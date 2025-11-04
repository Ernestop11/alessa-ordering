"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

interface CustomerOrderSummary {
  id: string;
  totalAmount: number;
  createdAt: string;
  fulfillmentMethod?: string | null;
}

interface CustomerRow {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  lastOrder: CustomerOrderSummary | null;
  recentOrders: CustomerOrderSummary[];
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/customers', { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as CustomerRow[];
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch customers', err);
      setError('Unable to load customers. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const totalCustomers = customers.length;
  const customersWithOrders = useMemo(
    () => customers.filter((customer) => customer.orderCount > 0).length,
    [customers],
  );
  const returningCustomers = useMemo(
    () => customers.filter((customer) => customer.orderCount > 1).length,
    [customers],
  );
  const newCustomers30 = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return customers.filter((customer) => new Date(customer.createdAt) >= cutoff).length;
  }, [customers]);
  const { recentRevenue, uniqueRecentOrders } = useMemo(() => {
    const seen = new Set<string>();
    let revenue = 0;
    customers.forEach((customer) => {
      customer.recentOrders.forEach((order) => {
        if (!seen.has(order.id)) {
          seen.add(order.id);
          revenue += Number(order.totalAmount ?? 0);
        }
      });
    });
    return { recentRevenue: revenue, uniqueRecentOrders: seen.size };
  }, [customers]);
  const averageRecentTicket = uniqueRecentOrders > 0 ? recentRevenue / uniqueRecentOrders : 0;

  const filteredCustomers = useMemo(() => {
    if (!filter.trim()) return customers;
    const query = filter.toLowerCase();
    return customers.filter((customer) => {
      const fields = [customer.name, customer.email, customer.phone].filter(Boolean) as string[];
      return fields.some((field) => field.toLowerCase().includes(query));
    });
  }, [customers, filter]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);

  const customerLifetimeValue = (customer: CustomerRow) =>
    customer.recentOrders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0);

  const exportCsv = () => {
    if (filteredCustomers.length === 0) return;
    setExporting(true);
    try {
      const headers = [
        'Customer ID',
        'Name',
        'Email',
        'Phone',
        'Orders',
        'Last Order Date',
        'Recent Spend',
      ];
      const rows = filteredCustomers.map((customer) => {
        const lastDate = customer.lastOrder ? new Date(customer.lastOrder.createdAt).toISOString() : '';
        return [
          customer.id,
          customer.name || 'Guest',
          customer.email || '',
          customer.phone || '',
          customer.orderCount,
          lastDate,
          customerLifetimeValue(customer).toFixed(2),
        ];
      });
      const csvContent = [headers, ...rows]
        .map((columns) =>
          columns
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(','),
        )
        .join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customers-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
          <p className="text-sm text-gray-500">
            View loyal guests and their recent orders. Use this tab to reach out or review history quickly.
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <input
            type="search"
            placeholder="Search by name, email, or phone"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 md:w-72"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter customers"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={loadCustomers}
              className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              onClick={exportCsv}
              disabled={filteredCustomers.length === 0 || exporting}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Total customers</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{totalCustomers}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">With orders</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{customersWithOrders}</p>
            <p className="text-xs text-gray-500">{returningCustomers} returning</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Recent revenue</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(recentRevenue)}</p>
            <p className="text-xs text-gray-500">Avg ticket {formatCurrency(averageRecentTicket)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">New (30 days)</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{newCustomers30}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">Showing {filteredCustomers.length} of {totalCustomers} customers</p>
      </div>

      <div className="border-t border-gray-200 mt-4">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading customers…</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-500">{error}</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No customers yet. Orders will populate this list automatically.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Orders
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Recent activity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{customer.name || 'Guest'}</div>
                      <div className="text-xs text-gray-500">
                        Joined {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {customer.email && <div>{customer.email}</div>}
                      {customer.phone && <div className="text-gray-500">{customer.phone}</div>}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{customer.orderCount}</div>
                      <div className="text-xs text-gray-500">{formatCurrency(customerLifetimeValue(customer))} lifetime spend</div>
                      {customer.lastOrder && (
                        <div className="text-xs text-gray-500">
                          Last {customer.lastOrder.fulfillmentMethod === 'delivery' ? 'delivery' : 'pickup'} ·{' '}
                          {new Date(customer.lastOrder.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {customer.recentOrders.length === 0 ? (
                        <span className="text-xs text-gray-400">No orders yet</span>
                      ) : (
                        <div className="space-y-1 text-xs">
                          {customer.recentOrders.map((order) => (
                            <div
                              key={order.id}
                              className="flex items-center justify-between rounded border border-gray-200 px-2 py-1"
                            >
                              <span>#{order.id.slice(-6)}</span>
                              <span>{formatCurrency(order.totalAmount)}</span>
                              <span className="text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
