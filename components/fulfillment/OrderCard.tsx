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
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Status color mapping
const STATUS_COLORS = {
  new: { bg: '#dc2626', text: 'white', label: 'NEW ORDER' },
  pending: { bg: '#dc2626', text: 'white', label: 'NEW ORDER' },
  confirmed: { bg: '#dc2626', text: 'white', label: 'CONFIRMED' },
  preparing: { bg: '#f59e0b', text: 'white', label: 'PREPARING' },
  ready: { bg: '#16a34a', text: 'white', label: 'READY' },
  completed: { bg: '#64748b', text: 'white', label: 'COMPLETED' },
  cancelled: { bg: '#991b1b', text: 'white', label: 'CANCELLED' },
};

function getStatusColor(status: string, isNew: boolean) {
  if (isNew || status === 'pending' || status === 'confirmed') {
    return STATUS_COLORS.new;
  }
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending;
}

// FULL-SCREEN TICKET MODAL
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
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, []);

  const status = (order.status ?? '').toLowerCase();
  const isDelivery = order.fulfillmentMethod === 'delivery';
  const canAccept = status === 'pending' || status === 'confirmed';
  const canMarkReady = status === 'preparing';
  const canComplete = status === 'ready' || status === 'preparing';
  const canCancel = status !== 'completed' && status !== 'cancelled';
  const customerLabel = order.customerName || order.customer?.name || 'Guest';
  const statusColor = getStatusColor(status, isNew);

  if (!mounted) return null;

  const modalContent = (
    <div
      id="order-detail-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: statusColor.bg,
        zIndex: 2147483647,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* TOP BAR - Status & Close */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            backgroundColor: 'white',
            color: statusColor.bg,
            padding: '6px 16px',
            borderRadius: '20px',
            fontWeight: 900,
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {statusColor.label}
          </span>
          <span style={{ color: 'white', opacity: 0.9, fontSize: '14px', fontWeight: 500 }}>
            {isDelivery ? '🚗 Delivery' : '🏪 Pickup'}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            fontSize: '24px',
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

      {/* MAIN CONTENT */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '16px',
        overflow: 'auto',
      }}>
        {/* ORDER HEADER */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111', margin: 0, lineHeight: 1 }}>
                #{order.id.slice(-6).toUpperCase()}
              </h1>
              <p style={{ fontSize: '1rem', color: '#666', marginTop: '4px' }}>
                {formatTime(order.createdAt)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '2rem', fontWeight: 900, color: '#111', margin: 0 }}>
                {formatCurrency(order.totalAmount)}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111', margin: 0 }}>{customerLabel}</p>
              {(order.customerEmail || order.customerPhone) && (
                <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '2px' }}>
                  {order.customerPhone || order.customerEmail}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ORDER ITEMS */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          flex: 1,
          overflow: 'auto',
        }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px 0' }}>
            Order Items
          </h3>
          {order.items.map((item, idx) => (
            <div key={item.id} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 0',
              borderBottom: idx < order.items.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}>
              <span style={{
                backgroundColor: '#111',
                color: 'white',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.125rem',
                flexShrink: 0,
              }}>
                {item.quantity}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111', margin: 0 }}>
                  {item.menuItemName || 'Menu Item'}
                </p>
                {item.notes && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#ea580c',
                    fontWeight: 600,
                    marginTop: '4px',
                    backgroundColor: '#fff7ed',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    display: 'inline-block',
                  }}>
                    ⚠️ {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}

          {order.notes && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              borderLeft: '4px solid #f59e0b',
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                Special Instructions
              </p>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: '#78350f', margin: 0 }}>
                {order.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FIXED ACTION BAR */}
      <div style={{
        backgroundColor: 'white',
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        {/* Print always visible */}
        <button
          onClick={() => onPrint(order)}
          style={{
            flex: '0 0 auto',
            padding: '14px 20px',
            borderRadius: '12px',
            border: '2px solid #e5e7eb',
            backgroundColor: 'white',
            color: '#374151',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🖨️ Print
        </button>

        {/* Primary action based on status */}
        {canAccept && (
          <button
            onClick={() => { onAccept(order); onClose(); }}
            style={{
              flex: 1,
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#16a34a',
              color: 'white',
              fontWeight: 900,
              fontSize: '1.125rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            ✓ Accept & Start
          </button>
        )}

        {canMarkReady && (
          <button
            onClick={() => { onMarkReady(order); onClose(); }}
            style={{
              flex: 1,
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#16a34a',
              color: 'white',
              fontWeight: 900,
              fontSize: '1.125rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            ✓ Mark Ready
          </button>
        )}

        {status === 'ready' && (
          <button
            onClick={() => { onComplete(order); onClose(); }}
            style={{
              flex: 1,
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: 'white',
              fontWeight: 900,
              fontSize: '1.125rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Complete Order
          </button>
        )}

        {canCancel && onCancel && (
          <button
            onClick={() => { onCancel(order); onClose(); }}
            style={{
              flex: '0 0 auto',
              padding: '14px 20px',
              borderRadius: '12px',
              border: '2px solid #fca5a5',
              backgroundColor: 'white',
              color: '#dc2626',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// COMPACT ORDER CARD (no carousel, clean grid)
export default function OrderCard({ order, scope, onAccept, onMarkReady, onComplete, onPrint, onCancel, onRefund, kitchenMode = false, isNew = false }: Props) {
  const [showModal, setShowModal] = useState(false);
  const status = (order.status ?? '').toLowerCase();
  const isDelivery = order.fulfillmentMethod === 'delivery';
  const canAccept = status === 'pending' || status === 'confirmed';
  const canMarkReady = status === 'preparing';
  const statusColor = getStatusColor(status, isNew);

  const customerLabel = useMemo(() => {
    if (order.customerName) return order.customerName;
    if (order.customer?.name) return order.customer.name;
    return 'Guest';
  }, [order.customerName, order.customer]);

  void scope;
  void onRefund;

  // Kitchen mode
  if (kitchenMode) {
    return (
      <article
        onClick={() => setShowModal(true)}
        className="rounded-2xl bg-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        style={{ borderLeft: `6px solid ${statusColor.bg}` }}
      >
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
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-2xl font-black text-gray-900">#{order.id.slice(-6).toUpperCase()}</h2>
              <p className="text-sm text-gray-500">{formatTime(order.createdAt)}</p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
            >
              {statusColor.label}
            </span>
          </div>
          <p className="font-semibold text-gray-800">{customerLabel}</p>
          <p className="text-sm text-gray-500 mt-1">{order.items.length} items · {formatCurrency(order.totalAmount)}</p>
        </div>
        <div className="px-4 pb-4 flex gap-2">
          {canAccept && (
            <button onClick={(e) => { e.stopPropagation(); onAccept(order); }} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg">
              Accept
            </button>
          )}
          {canMarkReady && (
            <button onClick={(e) => { e.stopPropagation(); onMarkReady(order); }} className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-lg">
              Ready
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onPrint(order); }} className="px-4 bg-gray-200 text-gray-700 font-bold py-3 rounded-lg">
            🖨️
          </button>
        </div>
      </article>
    );
  }

  // COMPACT CARD for grid view
  return (
    <>
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

      <article
        onClick={() => setShowModal(true)}
        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
        style={{ borderLeft: `4px solid ${statusColor.bg}` }}
      >
        {/* Header with order # and status */}
        <div className="px-3 py-2 flex justify-between items-center border-b border-gray-100">
          <span className="font-black text-gray-900">#{order.id.slice(-6).toUpperCase()}</span>
          <span className="text-xs text-gray-500">{formatTime(order.createdAt)}</span>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex justify-between items-start mb-2">
            <p className="font-semibold text-gray-900 text-sm">{customerLabel}</p>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              {isDelivery ? '🚗' : '🏪'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{order.items.length} items</span>
            <span className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span>
          </div>
          {(order.notes || order.items.some(i => i.notes)) && (
            <div className="mt-2 text-xs text-orange-600 font-medium">⚠️ Special instructions</div>
          )}
        </div>
      </article>
    </>
  );
}
