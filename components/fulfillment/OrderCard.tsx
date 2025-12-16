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

  // KITCHEN TICKET STYLE - Color-coded modifiers, prominent actions
  // Colors: NEW (red/urgent) → PREPARING (amber) → READY (green) → DONE (slate/muted)
  return (
    <article className={`rounded-xl border-2 shadow-sm transition hover:shadow-md overflow-hidden ${
      isNew
        ? 'border-red-400 bg-white hover:border-red-500 shadow-red-100'
        : status === 'preparing'
          ? 'border-amber-400 bg-white hover:border-amber-500'
          : status === 'ready'
            ? 'border-green-400 bg-white hover:border-green-500'
            : status === 'completed'
              ? 'border-slate-300 bg-slate-50 hover:border-slate-400'
              : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      {/* TICKET HEADER - Order number and status prominently displayed */}
      <header className={`px-4 py-2 ${
        isNew
          ? 'bg-red-500 text-white'
          : status === 'preparing'
            ? 'bg-amber-500 text-white'
            : status === 'ready'
              ? 'bg-green-500 text-white'
              : status === 'completed'
                ? 'bg-slate-400 text-white'
                : 'bg-gray-100 text-gray-900'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black">#{order.id.slice(-6).toUpperCase()}</span>
            <span className="text-sm font-medium opacity-90">
              {formatTime(order.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
              isNew ? 'bg-white/20' : 'bg-black/10'
            }`}>
              {isDelivery ? '🚗 DELIVERY' : '🏪 PICKUP'}
            </span>
          </div>
        </div>
      </header>

      {/* CUSTOMER INFO */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
        <p className="text-sm font-bold text-gray-900">{customerLabel}</p>
        {(order.customerEmail || order.customerPhone) && (
          <p className="text-xs text-gray-500">
            {[order.customerEmail, order.customerPhone].filter(Boolean).join(' · ')}
          </p>
        )}
        {scope === 'platform' && order.tenant && (
          <p className="text-xs font-medium text-indigo-600 mt-1">
            📍 {order.tenant.name}
          </p>
        )}
      </div>

      {/* ITEMS LIST - Kitchen ticket style with color-coded modifiers */}
      <div className="px-4 py-3">
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="border-l-4 border-gray-300 pl-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-900 text-white text-sm font-black rounded px-2 py-0.5 min-w-[28px] text-center">
                      {item.quantity}
                    </span>
                    <span className="font-semibold text-gray-900">{item.menuItemName || 'Menu Item'}</span>
                  </div>
                  {/* MODIFIERS/NOTES - Color-coded for visibility */}
                  {item.notes && (
                    <div className="mt-2 ml-8">
                      <div className="bg-orange-100 border-2 border-orange-400 rounded-lg px-3 py-2">
                        <p className="text-sm font-bold text-orange-800 flex items-start gap-2">
                          <span className="text-lg">⚠️</span>
                          <span>{item.notes}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* ORDER NOTES - Very prominent */}
        {order.notes && (
          <div className="mt-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg px-3 py-2">
            <p className="text-xs font-bold text-yellow-800 uppercase mb-1">📝 Special Instructions</p>
            <p className="text-sm font-semibold text-yellow-900">{order.notes}</p>
          </div>
        )}
      </div>

      {/* TOTAL */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total</span>
          <span className="text-lg font-black text-gray-900">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      {/* ACTION BUTTONS - Large and prominent for kitchen use */}
      <div className="px-4 py-3 bg-gray-100 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          {/* PRINT BUTTON - Always visible and prominent */}
          <button
            type="button"
            onClick={() => onPrint(order)}
            className="flex-1 min-w-[80px] bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg shadow transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            PRINT
          </button>

          {/* PRIMARY ACTION - Accept/Ready/Complete */}
          {canAccept && (
            <button
              type="button"
              onClick={() => onAccept(order)}
              className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-black py-2 px-4 rounded-lg shadow transition text-sm uppercase"
            >
              ✓ START PREPARING
            </button>
          )}
          {canMarkReady && (
            <button
              type="button"
              onClick={() => onMarkReady(order)}
              className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2 px-4 rounded-lg shadow transition text-sm uppercase"
            >
              ✓ MARK READY
            </button>
          )}
          {canComplete && !canMarkReady && (
            <button
              type="button"
              onClick={() => onComplete(order)}
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition text-sm uppercase"
            >
              COMPLETE
            </button>
          )}
        </div>

        {/* SECONDARY ACTIONS - Cancel/Refund */}
        {(canCancel || canRefund) && (
          <div className="mt-2 flex gap-2">
            {canCancel && onCancel && (
              <button
                type="button"
                onClick={() => onCancel(order)}
                className="flex-1 border-2 border-red-300 text-red-700 font-semibold py-1.5 px-3 rounded-lg text-xs hover:bg-red-50 transition"
              >
                Cancel Order
              </button>
            )}
            {canRefund && onRefund && (
              <button
                type="button"
                onClick={() => onRefund(order)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xs shadow transition"
              >
                💰 Refund
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
