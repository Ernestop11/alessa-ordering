"use client";

import { useMemo } from 'react';
import type { FulfillmentOrder } from './types';

interface Props {
  order: FulfillmentOrder;
  scope: 'tenant' | 'platform';
  onAccept: (order: FulfillmentOrder) => void;
  onMarkReady: (order: FulfillmentOrder) => void;
  onComplete: (order: FulfillmentOrder) => void;
  onPrint: (order: FulfillmentOrder) => void;
  onCancel?: (order: FulfillmentOrder) => void;
  onRefund?: (order: FulfillmentOrder) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
}

function formatTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function OrderCard({ order, scope, onAccept, onMarkReady, onComplete, onPrint, onCancel, onRefund }: Props) {
  const status = (order.status ?? '').toLowerCase();
  const isDelivery = order.fulfillmentMethod === 'delivery';
  const canAccept = status === 'pending' || status === 'confirmed';
  const canMarkReady = status === 'preparing';
  const canComplete = status === 'ready' || status === 'preparing';
  const canCancel = status !== 'completed' && status !== 'cancelled';
  const canRefund = status === 'completed' || status === 'cancelled';

  const customerLabel = useMemo(() => {
    if (order.customerName) return order.customerName;
    if (order.customer?.name) return order.customer.name;
    return 'Guest';
  }, [order.customerName, order.customer]);

  return (
    <article className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                status === 'pending' || status === 'confirmed'
                  ? 'bg-blue-100 text-blue-700'
                  : status === 'preparing'
                    ? 'bg-amber-100 text-amber-700'
                    : status === 'ready'
                      ? 'bg-emerald-100 text-emerald-700'
                      : status === 'completed'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-slate-100 text-slate-700'
              }`}
            >
              {status.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Placed at {formatTime(order.createdAt)} · {isDelivery ? 'Delivery' : 'Pickup'}
          </p>
          {scope === 'platform' && order.tenant && (
            <p className="text-xs font-medium text-indigo-600">
              {order.tenant.name} ({order.tenant.slug})
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onPrint(order)}
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-900"
        >
          Print
        </button>
      </header>

      <div className="mt-3 space-y-2">
        <div>
          <p className="text-sm font-medium text-gray-900">{customerLabel}</p>
          {(order.customerEmail || order.customerPhone) && (
            <p className="text-xs text-gray-500">
              {[order.customerEmail, order.customerPhone].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <ul className="space-y-1">
          {order.items.map((item) => (
            <li key={item.id} className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">{item.quantity}×</span> {item.menuItemName || 'Menu Item'}
            </li>
          ))}
        </ul>
        {order.notes && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{order.notes}</p>
        )}
      </div>

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</div>
        <div className="flex flex-wrap items-center gap-2">
          {canAccept && (
            <button
              type="button"
              onClick={() => onAccept(order)}
              className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700"
            >
              Accept Order
            </button>
          )}
          {canMarkReady && (
            <button
              type="button"
              onClick={() => onMarkReady(order)}
              className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-600"
            >
              Mark Ready
            </button>
          )}
          {canComplete && (
            <button
              type="button"
              onClick={() => onComplete(order)}
              className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-400 hover:text-gray-900"
            >
              Complete
            </button>
          )}
          {canCancel && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(order)}
              className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:border-red-400 hover:bg-red-50"
            >
              Cancel
            </button>
          )}
          {canRefund && onRefund && (
            <button
              type="button"
              onClick={() => onRefund(order)}
              className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-700"
            >
              Refund
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}
