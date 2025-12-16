"use client";

import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

// Separate Modal Component that uses Portal
function OrderDetailModal({
  order,
  isNew,
  onClose,
  onAccept,
  onMarkReady,
  onComplete,
  onPrint,
  onCancel,
}: {
  order: FulfillmentOrder;
  isNew: boolean;
  onClose: () => void;
  onAccept: (order: FulfillmentOrder) => void;
  onMarkReady: (order: FulfillmentOrder) => void;
  onComplete: (order: FulfillmentOrder) => void;
  onPrint: (order: FulfillmentOrder) => void;
  onCancel?: (order: FulfillmentOrder) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const status = (order.status ?? '').toLowerCase();
  const isDelivery = order.fulfillmentMethod === 'delivery';
  const canAccept = status === 'pending' || status === 'confirmed';
  const canMarkReady = status === 'preparing';
  const canComplete = status === 'ready' || status === 'preparing';
  const canCancel = status !== 'completed' && status !== 'cancelled';

  const customerLabel = order.customerName || order.customer?.name || 'Guest';

  if (!mounted) return null;

  const modalContent = (
    <div
      id="order-detail-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 2147483647, // Max z-index
        overflow: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '20px 24px',
            flexShrink: 0,
            backgroundColor: isNew || canAccept ? '#ef4444' : status === 'preparing' ? '#f59e0b' : status === 'ready' ? '#22c55e' : '#6b7280',
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>
                #{order.id.slice(-6).toUpperCase()}
              </h2>
              <p style={{ fontSize: '1.25rem', marginTop: '4px', opacity: 0.9 }}>
                {formatTime(order.createdAt)} · {isDelivery ? '🚗 DELIVERY' : '🏪 PICKUP'}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{customerLabel}</p>
            {(order.customerEmail || order.customerPhone) && (
              <p style={{ fontSize: '1rem', opacity: 0.8, marginTop: '4px' }}>
                {[order.customerEmail, order.customerPhone].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* ITEMS */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {order.items.map((item) => (
              <li key={item.id} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      backgroundColor: '#111827',
                      color: 'white',
                      fontSize: '1.5rem',
                      fontWeight: 900,
                      borderRadius: '12px',
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.quantity}
                  </span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                    {item.menuItemName || 'Menu Item'}
                  </span>
                </div>
                {item.notes && (
                  <div
                    style={{
                      marginTop: '8px',
                      marginLeft: '60px',
                      backgroundColor: '#fff7ed',
                      borderLeft: '4px solid #f97316',
                      padding: '12px 16px',
                      borderRadius: '0 8px 8px 0',
                    }}
                  >
                    <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#9a3412', margin: 0 }}>
                      ⚠️ {item.notes}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {order.notes && (
            <div
              style={{
                marginTop: '24px',
                backgroundColor: '#fffbeb',
                border: '4px solid #fbbf24',
                borderRadius: '12px',
                padding: '16px 20px',
              }}
            >
              <p style={{ fontSize: '0.875rem', fontWeight: 900, color: '#b45309', textTransform: 'uppercase', marginBottom: '4px' }}>
                📝 SPECIAL INSTRUCTIONS
              </p>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#78350f', margin: 0 }}>{order.notes}</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ flexShrink: 0, backgroundColor: '#f3f4f6', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.25rem', color: '#4b5563', fontWeight: 500 }}>Total</span>
            <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827' }}>{formatCurrency(order.totalAmount)}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <button
              type="button"
              onClick={() => onPrint(order)}
              style={{
                backgroundColor: '#374151',
                color: 'white',
                fontWeight: 900,
                padding: '20px 16px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              🖨️ PRINT
            </button>

            {canAccept && (
              <button
                type="button"
                onClick={() => { onAccept(order); onClose(); }}
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  fontWeight: 900,
                  padding: '20px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                }}
              >
                ✓ START
              </button>
            )}
            {canMarkReady && (
              <button
                type="button"
                onClick={() => { onMarkReady(order); onClose(); }}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  fontWeight: 900,
                  padding: '20px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                }}
              >
                ✓ READY
              </button>
            )}
            {canComplete && !canMarkReady && !canAccept && (
              <button
                type="button"
                onClick={() => { onComplete(order); onClose(); }}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontWeight: 900,
                  padding: '20px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                }}
              >
                DONE
              </button>
            )}

            {canCancel && onCancel && (
              <button
                type="button"
                onClick={() => { onCancel(order); onClose(); }}
                style={{
                  backgroundColor: 'white',
                  color: '#dc2626',
                  fontWeight: 'bold',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '4px solid #fca5a5',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#d1d5db',
                color: '#374151',
                fontWeight: 'bold',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use createPortal to render at document.body
  return createPortal(modalContent, document.body);
}

export default function OrderCard({ order, scope, onAccept, onMarkReady, onComplete, onPrint, onCancel, onRefund, kitchenMode = false, isNew = false }: Props) {
  const [showModal, setShowModal] = useState(false);
  const status = (order.status ?? '').toLowerCase();
  const isDelivery = order.fulfillmentMethod === 'delivery';
  const canAccept = status === 'pending' || status === 'confirmed';
  const canMarkReady = status === 'preparing';
  const canComplete = status === 'ready' || status === 'preparing';
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

  // PREVIEW CARD - Click to open detail modal
  return (
    <>
      {/* Modal rendered via Portal */}
      {showModal && (
        <OrderDetailModal
          order={order}
          isNew={isNew}
          onClose={() => setShowModal(false)}
          onAccept={onAccept}
          onMarkReady={onMarkReady}
          onComplete={onComplete}
          onPrint={onPrint}
          onCancel={onCancel}
        />
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
