"use client";

import { useMemo, useState } from 'react';
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
  kitchenMode?: boolean;
  isNew?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
}

function formatTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function OrderCard({ order, scope, onAccept, onMarkReady, onComplete, onPrint, onCancel, onRefund, kitchenMode = false, isNew = false }: Props) {
  const [showModal, setShowModal] = useState(false);
  const status = (order.status ?? '').toLowerCase();
  const isDelivery = order.fulfillmentMethod === 'delivery';
  const canAccept = status === 'pending' || status === 'confirmed';
  const canMarkReady = status === 'preparing';
  const canComplete = status === 'ready' || status === 'preparing';
  const canCancel = status !== 'completed' && status !== 'cancelled';
  const hasModifiers = order.items.some(item => item.notes) || order.notes;

  const customerLabel = useMemo(() => {
    if (order.customerName) return order.customerName;
    if (order.customer?.name) return order.customer.name;
    return 'Guest';
  }, [order.customerName, order.customer]);

  // Suppress unused variable warnings
  void scope;
  void onRefund;

  // Kitchen mode: extra large cards (existing behavior)
  if (kitchenMode) {
    return (
      <article className={`rounded-2xl border-4 bg-white p-6 shadow-lg transition ${
        canAccept ? 'border-blue-400 bg-blue-50' :
        canMarkReady ? 'border-amber-400 bg-amber-50' :
        status === 'ready' ? 'border-emerald-400 bg-emerald-50' :
        'border-gray-300'
      }`}>
        <header className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900">#{order.id.slice(-6).toUpperCase()}</h2>
            <p className="text-xl font-bold text-gray-700 mt-1">{customerLabel}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block rounded-full px-4 py-2 text-xl font-bold ${
              canAccept ? 'bg-blue-600 text-white' :
              canMarkReady ? 'bg-amber-500 text-white' :
              status === 'ready' ? 'bg-emerald-500 text-white' :
              'bg-gray-500 text-white'
            }`}>
              {status.toUpperCase()}
            </span>
            <p className="text-lg text-gray-600 mt-2">{formatTime(order.createdAt)} · {isDelivery ? '🚗 DELIVERY' : '🏪 PICKUP'}</p>
          </div>
        </header>
        <div className="bg-white rounded-xl p-4 mb-4 border-2 border-gray-200">
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id}>
                <div className="flex items-center text-2xl">
                  <span className="bg-gray-900 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-3">{item.quantity}</span>
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
        {order.notes && (
          <div className="bg-yellow-200 border-4 border-yellow-400 rounded-xl p-4 mb-4">
            <p className="text-xl font-bold text-yellow-900">📝 NOTES:</p>
            <p className="text-2xl font-semibold text-yellow-800 mt-1">{order.notes}</p>
          </div>
        )}
        <div className="text-3xl font-black text-gray-900 mb-4">Total: {formatCurrency(order.totalAmount)}</div>
        <div className="grid grid-cols-2 gap-3">
          {canAccept && (
            <button type="button" onClick={() => onAccept(order)} className="col-span-2 bg-green-600 hover:bg-green-700 text-white text-3xl font-black py-6 rounded-2xl shadow-lg">✓ ACCEPT ORDER</button>
          )}
          {canMarkReady && (
            <button type="button" onClick={() => onMarkReady(order)} className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white text-3xl font-black py-6 rounded-2xl shadow-lg">✓ MARK READY</button>
          )}
          {canComplete && (
            <button type="button" onClick={() => onComplete(order)} className="bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold py-4 rounded-xl shadow">COMPLETE</button>
          )}
          <button type="button" onClick={() => onPrint(order)} className="bg-gray-700 hover:bg-gray-800 text-white text-2xl font-bold py-4 rounded-xl shadow">🖨️ PRINT</button>
        </div>
      </article>
    );
  }

  // CLEAN PREVIEW CARD - Click to open detail modal
  return (
    <>
      {/* FULL SCREEN MODAL - Rendered as sibling, uses fixed positioning */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
          style={{
            zIndex: 999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl flex flex-col w-full max-w-3xl overflow-hidden"
            style={{
              maxHeight: '95vh',
              minHeight: '60vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className={`px-6 py-5 flex-shrink-0 ${
              isNew || canAccept ? 'bg-red-500' :
              status === 'preparing' ? 'bg-amber-500' :
              status === 'ready' ? 'bg-green-500' :
              'bg-gray-500'
            }`}>
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-4xl font-black">#{order.id.slice(-6).toUpperCase()}</h2>
                  <p className="text-xl mt-1 opacity-90">
                    {formatTime(order.createdAt)} · {isDelivery ? '🚗 DELIVERY' : '🏪 PICKUP'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-3xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-white/30">
                <p className="text-2xl font-bold">{customerLabel}</p>
                {(order.customerEmail || order.customerPhone) && (
                  <p className="text-lg opacity-80 mt-1">
                    {[order.customerEmail, order.customerPhone].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>

            {/* ITEMS */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ul className="space-y-4">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <div className="flex items-center gap-3">
                      <span className="bg-gray-900 text-white text-2xl font-black rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                        {item.quantity}
                      </span>
                      <span className="text-2xl font-bold text-gray-900">{item.menuItemName || 'Menu Item'}</span>
                    </div>
                    {item.notes && (
                      <div className="mt-2 ml-16 bg-orange-100 border-l-4 border-orange-500 px-4 py-3 rounded-r-lg">
                        <p className="text-xl font-black text-orange-800">⚠️ {item.notes}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {order.notes && (
                <div className="mt-6 bg-amber-50 border-4 border-amber-400 rounded-xl px-5 py-4">
                  <p className="text-base font-black text-amber-700 uppercase mb-1">📝 SPECIAL INSTRUCTIONS</p>
                  <p className="text-xl font-bold text-amber-900">{order.notes}</p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex-shrink-0 bg-gray-100 px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xl text-gray-600 font-medium">Total</span>
                <span className="text-4xl font-black text-gray-900">{formatCurrency(order.totalAmount)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onPrint(order)}
                  className="bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white font-black py-5 px-4 rounded-xl shadow-lg text-xl flex items-center justify-center gap-2"
                >
                  🖨️ PRINT
                </button>

                {canAccept && (
                  <button
                    type="button"
                    onClick={() => { onAccept(order); setShowModal(false); }}
                    className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-black py-5 px-4 rounded-xl shadow-lg text-xl"
                  >
                    ✓ START
                  </button>
                )}
                {canMarkReady && (
                  <button
                    type="button"
                    onClick={() => { onMarkReady(order); setShowModal(false); }}
                    className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black py-5 px-4 rounded-xl shadow-lg text-xl"
                  >
                    ✓ READY
                  </button>
                )}
                {canComplete && !canMarkReady && !canAccept && (
                  <button
                    type="button"
                    onClick={() => { onComplete(order); setShowModal(false); }}
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black py-5 px-4 rounded-xl shadow-lg text-xl"
                  >
                    DONE
                  </button>
                )}

                {canCancel && onCancel && (
                  <button
                    type="button"
                    onClick={() => { onCancel(order); setShowModal(false); }}
                    className="border-4 border-red-400 text-red-700 font-bold py-4 px-4 rounded-xl hover:bg-red-50 text-lg"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-4 px-4 rounded-xl text-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW CARD */}
      <article
        className={`rounded-xl border-2 bg-white shadow-sm transition cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
          isNew || canAccept
            ? 'border-red-300 hover:border-red-400'
            : status === 'preparing'
              ? 'border-amber-300 hover:border-amber-400'
              : status === 'ready'
                ? 'border-green-300 hover:border-green-400'
                : status === 'completed'
                  ? 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => setShowModal(true)}
      >
        <header className={`px-4 py-2 rounded-t-lg ${
          isNew || canAccept
            ? 'bg-red-500 text-white'
            : status === 'preparing'
              ? 'bg-amber-500 text-white'
              : status === 'ready'
                ? 'bg-green-500 text-white'
                : status === 'completed'
                  ? 'bg-slate-400 text-white'
                  : 'bg-gray-200 text-gray-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black">#{order.id.slice(-6).toUpperCase()}</span>
            <span className="text-sm font-medium">{formatTime(order.createdAt)}</span>
          </div>
        </header>

        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-gray-900">{customerLabel}</p>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
              {isDelivery ? '🚗 Delivery' : '🏪 Pickup'}
            </span>
          </div>

          <p className="text-sm text-gray-600">
            {order.items.length} item{order.items.length > 1 ? 's' : ''} · {formatCurrency(order.totalAmount)}
          </p>

          {hasModifiers && (
            <div className="mt-2 flex items-center gap-1 text-orange-600">
              <span className="text-sm">⚠️</span>
              <span className="text-xs font-medium">Has special instructions</span>
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-gray-50 border-t rounded-b-lg">
          <p className="text-xs text-gray-400 text-center font-medium">Tap to view details</p>
        </div>
      </article>
    </>
  );
}
