"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import { useTenantTheme } from '../TenantThemeProvider';

interface OrderHistoryItem {
  id: string;
  createdAt: string;
  totalAmount: number;
  fulfillmentMethod?: string | null;
  status: string;
  items: Array<{ id: string; quantity: number; price: number; menuItem?: { name: string } | null }>;
}

interface CustomerModel {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  orders: OrderHistoryItem[];
}

interface TenantModel {
  slug: string;
  name: string;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
}

interface Props {
  tenant: TenantModel;
  customer: CustomerModel;
}

export default function OrderHistoryClient({ tenant, customer }: Props) {
  const theme = useTenantTheme();

  const orders = useMemo(() => customer.orders ?? [], [customer.orders]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-black/80 via-black/60 to-black/80 text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">{tenant.name}</p>
            <h1 className="text-3xl font-bold">Welcome back{customer.name ? `, ${customer.name}` : ''}!</h1>
            <p className="text-sm text-white/70">
              Review your recent orders, track deliveries, and reorder favorites instantly.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-xs text-white/70">
            {customer.email && <span>Email: {customer.email}</span>}
            {customer.phone && <span>Phone: {customer.phone}</span>}
            <Link
              href={`/order?tenant=${tenant.slug}`}
              className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:border-white"
            >
              Continue Ordering
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-gray-900">No orders yet</h2>
            <p className="mt-2 text-sm text-gray-600">
              Place your first order and it will show up here. Ready when you are!
            </p>
            <Link
              href={`/order?tenant=${tenant.slug}`}
              className="mt-6 inline-flex rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Order #{order.id.slice(-6)}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()} · {order.fulfillmentMethod === 'delivery' ? 'Delivery' : 'Pickup'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">${order.totalAmount.toFixed(2)}</div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">{order.status}</div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.quantity}× {item.menuItem?.name || 'Item'}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Reorder (coming soon)
                  </button>
                  <button className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Download receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
