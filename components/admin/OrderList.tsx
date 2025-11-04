'use client';

import { useEffect, useMemo, useState } from 'react';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  menuItem?: {
    id: string;
    name: string;
  } | null;
  tenantId?: string;
}

interface Order {
  id: string;
  customerName?: string | null;
  customer?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  items: OrderItem[];
  subtotalAmount?: number | null;
  taxAmount?: number | null;
  deliveryFee?: number | null;
  tipAmount?: number | null;
  platformFee?: number | null;
  totalAmount: number;
  status: OrderStatus;
  fulfillmentMethod?: string | null;
  deliveryPartner?: string | null;
  paymentMethod?: string | null;
  createdAt: string;
  tenantId?: string;
}

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [exporting, setExporting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) {
        throw new Error('Failed to load orders');
      }
      const data = await res.json();
      setOrders(data || []);
    } catch (e) {
      console.error('Failed to fetch orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const totalOrders = orders.length;
  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0),
    [orders],
  );
  const outstandingCount = useMemo(
    () => orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length,
    [orders],
  );
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesQuery =
        !query ||
        order.id.toLowerCase().includes(query) ||
        (order.customerName ?? '').toLowerCase().includes(query) ||
        (order.customer?.email ?? '').toLowerCase().includes(query) ||
        order.items.some((item) => item.menuItem?.name?.toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [orders, search, statusFilter]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);

  const exportCsv = async () => {
    try {
      setExporting(true);
      const headers = [
        'Order ID',
        'Status',
        'Fulfillment',
        'Payment',
        'Customer',
        'Email',
        'Phone',
        'Total',
        'Created At',
      ];
      const rows = filteredOrders.map((order) => [
        order.id,
        order.status,
        order.fulfillmentMethod || '',
        order.paymentMethod || '',
        order.customerName || order.customer?.name || 'Guest',
        order.customer?.email || '',
        order.customer?.phone || '',
        Number(order.totalAmount ?? 0).toFixed(2),
        new Date(order.createdAt).toISOString(),
      ]);
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
      link.download = `orders-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update order');

      const updated: Order = await res.json();

      setOrders((orders) =>
        orders.map((order) => (order.id === orderId ? updated : order))
      );
    } catch (e) {
      console.error('Failed to update order', e);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg font-medium text-gray-900">Active Orders</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Total orders</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{totalOrders}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Gross revenue</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Outstanding</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{outstandingCount}</p>
            <p className="text-xs text-gray-500">Preparing / ready / pending</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Average ticket</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(averageTicket)}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by order, customer, item…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 sm:w-72"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 sm:w-48"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              onClick={exportCsv}
              disabled={filteredOrders.length === 0 || exporting}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Showing {filteredOrders.length} of {totalOrders} orders
        </p>
      </div>
      <div className="border-t border-gray-200">
        {loading ? (
          <div className="p-6">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No orders match your filters. Adjust the search or status to see more.
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <li key={order.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Order #{order.id} — {order.customerName || 'Guest'}
                      </p>
                      {order.fulfillmentMethod && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {order.fulfillmentMethod === 'delivery' ? 'Delivery' : 'Pickup'}
                        </span>
                      )}
                      {order.paymentMethod && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {order.paymentMethod === 'apple_pay' ? ' Pay' : 'Card'}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-col space-y-1">
                      {order.items.map((item) => (
                        <p key={item.id} className="text-sm text-gray-500">
                          {item.quantity}x {item.menuItem?.name || 'Item'} (${item.price.toFixed(2)} each)
                        </p>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-col text-xs text-gray-500">
                      {order.customer?.email && <span>Email: {order.customer.email}</span>}
                      {order.customer?.phone && <span>Phone: {order.customer.phone}</span>}
                      {order.subtotalAmount !== undefined && (
                        <span>Subtotal: ${Number(order.subtotalAmount || 0).toFixed(2)}</span>
                      )}
                      {order.deliveryFee ? <span>Delivery: ${order.deliveryFee.toFixed(2)}</span> : null}
                      {order.platformFee ? <span>Platform fee: ${order.platformFee.toFixed(2)}</span> : null}
                      {order.taxAmount ? <span>Tax: ${order.taxAmount.toFixed(2)}</span> : null}
                      {order.tipAmount ? <span>Tip: ${order.tipAmount.toFixed(2)}</span> : null}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      Total charged: ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="ml-6 flex-shrink-0">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(order.id, e.target.value as OrderStatus)
                      }
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
