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
  kitchenMode?: boolean; // Large UI for kitchen tablet
  isNew?: boolean; // Highlight as new order (blue glow)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
}

function formatTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function OrderCard({ order, scope, onAccept, onMarkReady, onComplete, onPrint, onCancel, onRefund, kitchenMode = false, isNew = false }: Props) {
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

  // Kitchen mode: extra large text and buttons for visibility
  if (kitchenMode) {
    return (
      <article className={`rounded-2xl border-4 bg-white p-6 shadow-lg transition ${
        canAccept ? 'border-blue-400 bg-blue-50' :
        canMarkReady ? 'border-amber-400 bg-amber-50' :
        status === 'ready' ? 'border-emerald-400 bg-emerald-50' :
        'border-gray-300'
      }`}>
        {/* Order header - LARGE */}
        <header className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              #{order.id.slice(-6).toUpperCase()}
            </h2>
            <p className="text-xl font-bold text-gray-700 mt-1">
              {customerLabel}
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-block rounded-full px-4 py-2 text-xl font-bold ${
              status === 'pending' || status === 'confirmed'
                ? 'bg-blue-600 text-white'
                : status === 'preparing'
                  ? 'bg-amber-500 text-white'
                  : status === 'ready'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-500 text-white'
            }`}>
              {status.toUpperCase()}
            </span>
            <p className="text-lg text-gray-600 mt-2">
              {formatTime(order.createdAt)} · {isDelivery ? '🚗 DELIVERY' : '🏪 PICKUP'}
            </p>
          </div>
        </header>

        {/* Items - LARGE LIST */}
        <div className="bg-white rounded-xl p-4 mb-4 border-2 border-gray-200">
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id}>
                <div className="flex items-center text-2xl">
                  <span className="bg-gray-900 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-3">
                    {item.quantity}
                  </span>
                  <span className="font-semibold text-gray-900">{item.menuItemName || 'Menu Item'}</span>
                </div>
                {item.notes && (
                  <div className="ml-14 mt-1 bg-orange-100 border-2 border-orange-300 rounded-lg px-3 py-2">
                    <span className="text-lg font-bold text-orange-800">⚠️ {item.notes}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Notes - VERY VISIBLE */}
        {order.notes && (
          <div className="bg-yellow-200 border-4 border-yellow-400 rounded-xl p-4 mb-4">
            <p className="text-xl font-bold text-yellow-900">📝 NOTES:</p>
            <p className="text-2xl font-semibold text-yellow-800 mt-1">{order.notes}</p>
          </div>
        )}

        {/* Total */}
        <div className="text-3xl font-black text-gray-900 mb-4">
          Total: {formatCurrency(order.totalAmount)}
        </div>

        {/* ACTION BUTTONS - HUGE */}
        <div className="grid grid-cols-2 gap-3">
          {canAccept && (
            <button
              type="button"
              onClick={() => onAccept(order)}
              className="col-span-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-3xl font-black py-6 rounded-2xl shadow-lg transform active:scale-95 transition"
            >
              ✓ ACCEPT ORDER
            </button>
          )}
          {canMarkReady && (
            <button
              type="button"
              onClick={() => onMarkReady(order)}
              className="col-span-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-3xl font-black py-6 rounded-2xl shadow-lg transform active:scale-95 transition"
            >
              ✓ MARK READY
            </button>
          )}
          {canComplete && (
            <button
              type="button"
              onClick={() => onComplete(order)}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-2xl font-bold py-4 rounded-xl shadow transform active:scale-95 transition"
            >
              COMPLETE
            </button>
          )}
          <button
            type="button"
            onClick={() => onPrint(order)}
            className="bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white text-2xl font-bold py-4 rounded-xl shadow transform active:scale-95 transition"
          >
            🖨️ PRINT
          </button>
          {canCancel && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(order)}
              className="bg-red-100 hover:bg-red-200 border-2 border-red-400 text-red-700 text-xl font-bold py-3 rounded-xl transform active:scale-95 transition"
            >
              CANCEL
            </button>
          )}
        </div>

        {/* Refund button - separate section, requires completed/cancelled status */}
        {canRefund && onRefund && (
          <div className="mt-4 pt-4 border-t-2 border-gray-200">
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 list-none flex items-center gap-2">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                More Actions
              </summary>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => onRefund(order)}
                  className="bg-red-600 hover:bg-red-700 text-white text-lg font-bold px-4 py-2 rounded-xl shadow transform active:scale-95 transition"
                >
                  💰 Process Refund
                </button>
              </div>
            </details>
          </div>
        )}
      </article>
    );
  }

  // Standard mode (desktop) - with color-coded status styling
  // Colors go from LOUD (new/urgent) → MUTED (done)
  return (
    <article className={`rounded-xl border-2 px-4 py-3 shadow-sm transition hover:shadow-md ${
      isNew
        ? 'border-red-400 bg-red-50 hover:border-red-500 shadow-red-100'
        : status === 'preparing'
          ? 'border-amber-300 bg-amber-50 hover:border-amber-400'
          : status === 'ready'
            ? 'border-green-200 bg-green-50 hover:border-green-300'
            : status === 'completed'
              ? 'border-slate-200 bg-slate-50 hover:border-slate-300'
              : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
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
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.id}>
              <div className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">{item.quantity}×</span> {item.menuItemName || 'Menu Item'}
              </div>
              {item.notes && (
                <p className="ml-4 mt-0.5 text-xs font-medium text-orange-700 bg-orange-50 rounded px-2 py-1 border border-orange-200">
                  ⚠️ {item.notes}
                </p>
              )}
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
        </div>
      </footer>

      {/* Refund button - separate section in collapsible, requires completed/cancelled status */}
      {canRefund && onRefund && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <details className="group">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 list-none flex items-center gap-1">
              <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              More Actions
            </summary>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => onRefund(order)}
                className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-700"
              >
                💰 Process Refund
              </button>
            </div>
          </details>
        </div>
      )}
    </article>
  );
}
