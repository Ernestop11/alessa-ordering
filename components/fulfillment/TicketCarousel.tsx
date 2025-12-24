"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import type { FulfillmentOrder } from './types';

type StatusFilter = 'new' | 'preparing' | 'ready' | 'history';

interface Props {
  orders: FulfillmentOrder[];
  onAccept: (order: FulfillmentOrder) => void;
  onMarkReady: (order: FulfillmentOrder) => void;
  onComplete: (order: FulfillmentOrder) => void;
  onPrint: (order: FulfillmentOrder) => void;
  onCancel: (order: FulfillmentOrder) => void;
  onRefund: (order: FulfillmentOrder) => void;
  onOrderClick?: (order: FulfillmentOrder) => void;
  lastCreatedOrderId?: string;
}

const STATUS_COLORS = {
  new: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-600', light: 'bg-red-50' },
  preparing: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
  ready: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-600', light: 'bg-green-50' },
  history: { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-600', light: 'bg-gray-50' },
};

function formatCurrency(value: number | null | undefined): string {
  if (!value || Number.isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function getOrderStatus(order: FulfillmentOrder): StatusFilter {
  const status = order.status.toLowerCase();
  if (['pending', 'confirmed'].includes(status)) return 'new';
  if (status === 'preparing') return 'preparing';
  if (status === 'ready') return 'ready';
  return 'history';
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export default function TicketCarousel({
  orders,
  onAccept,
  onMarkReady,
  onComplete,
  onPrint,
  onCancel,
  onRefund,
  onOrderClick,
  lastCreatedOrderId,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('new');
  const [selectedOrder, setSelectedOrder] = useState<FulfillmentOrder | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Filter orders by status
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderStatus = getOrderStatus(order);
      if (activeFilter === 'history') {
        return ['completed', 'cancelled', 'refunded'].includes(order.status.toLowerCase());
      }
      return orderStatus === activeFilter;
    });
  }, [orders, activeFilter]);

  // Count orders by status
  const counts = useMemo(() => ({
    new: orders.filter(o => ['pending', 'confirmed'].includes(o.status.toLowerCase())).length,
    preparing: orders.filter(o => o.status.toLowerCase() === 'preparing').length,
    ready: orders.filter(o => o.status.toLowerCase() === 'ready').length,
    history: orders.filter(o => ['completed', 'cancelled', 'refunded'].includes(o.status.toLowerCase())).length,
  }), [orders]);

  // Auto-switch to NEW tab and scroll when new order arrives
  useEffect(() => {
    if (lastCreatedOrderId) {
      setActiveFilter('new');
      // Scroll to beginning of carousel
      if (carouselRef.current) {
        carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  }, [lastCreatedOrderId]);

  const handleOrderClick = (order: FulfillmentOrder) => {
    setSelectedOrder(order);
    onOrderClick?.(order);
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };

  const getPrimaryAction = (order: FulfillmentOrder) => {
    const status = getOrderStatus(order);
    switch (status) {
      case 'new':
        return { label: 'Accept', action: () => onAccept(order), color: 'bg-green-600 hover:bg-green-700' };
      case 'preparing':
        return { label: 'Ready', action: () => onMarkReady(order), color: 'bg-blue-600 hover:bg-blue-700' };
      case 'ready':
        return { label: 'Complete', action: () => onComplete(order), color: 'bg-purple-600 hover:bg-purple-700' };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['new', 'preparing', 'ready', 'history'] as StatusFilter[]).map((status) => {
          const colors = STATUS_COLORS[status];
          const count = counts[status];
          const isActive = activeFilter === status;

          return (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                isActive
                  ? `${colors.bg} text-white shadow-lg scale-105`
                  : `${colors.light} ${colors.text} hover:scale-102`
              }`}
            >
              {status === 'new' && <span className={count > 0 ? 'animate-pulse' : ''}>🔴</span>}
              {status === 'preparing' && '🟠'}
              {status === 'ready' && '🟢'}
              {status === 'history' && '📋'}
              <span className="capitalize">{status}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isActive ? 'bg-white/20' : colors.bg + ' text-white'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ticket carousel */}
      <div
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {filteredOrders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16 px-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="text-center">
              <div className="text-4xl mb-3">
                {activeFilter === 'new' && '📭'}
                {activeFilter === 'preparing' && '👨‍🍳'}
                {activeFilter === 'ready' && '✅'}
                {activeFilter === 'history' && '📜'}
              </div>
              <p className="text-gray-500 text-lg font-medium">
                {activeFilter === 'new' && 'No new orders'}
                {activeFilter === 'preparing' && 'No orders being prepared'}
                {activeFilter === 'ready' && 'No orders ready for pickup'}
                {activeFilter === 'history' && 'No completed orders yet'}
              </p>
            </div>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const status = getOrderStatus(order);
            const colors = STATUS_COLORS[status];
            const primaryAction = getPrimaryAction(order);
            const customerName = order.customerName || order.customer?.name || 'Guest';
            const itemCount = order.items.length;
            const isDelivery = order.fulfillmentMethod === 'delivery';

            return (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order)}
                className={`flex-shrink-0 w-[320px] min-h-[420px] bg-white rounded-2xl shadow-lg border-l-8 ${colors.border} cursor-pointer hover:shadow-xl transition-shadow snap-start`}
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Card header */}
                <div className={`${colors.light} px-4 py-3 rounded-tr-2xl`}>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-gray-900">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatTime(order.createdAt)}
                    </span>
                  </div>
                  {isDelivery && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      🚗 Delivery
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* Customer */}
                  <div className="mb-3">
                    <p className="text-xl font-bold text-gray-900 truncate">{customerName}</p>
                    {order.customerPhone && (
                      <p className="text-sm text-gray-500">{order.customerPhone}</p>
                    )}
                  </div>

                  {/* Items preview */}
                  <div className="flex-1 mb-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </p>
                    <ul className="space-y-1 max-h-[120px] overflow-y-auto">
                      {order.items.slice(0, 4).map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex justify-between">
                          <span className="truncate flex-1">
                            {item.quantity}x {item.menuItemName || 'Item'}
                          </span>
                          <span className="text-gray-500 ml-2">
                            {formatCurrency(Number(item.price) * item.quantity)}
                          </span>
                        </li>
                      ))}
                      {order.items.length > 4 && (
                        <li className="text-sm text-gray-400 italic">
                          +{order.items.length - 4} more items...
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Total</span>
                      <span className="text-2xl font-black text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Notes indicator */}
                  {order.notes && (
                    <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs font-medium text-yellow-800 truncate">
                        📝 {order.notes}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrint(order);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print
                    </button>
                    {primaryAction && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          primaryAction.action();
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-white rounded-xl font-semibold text-sm transition-colors ${primaryAction.color}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {primaryAction.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className={`sticky top-0 ${STATUS_COLORS[getOrderStatus(selectedOrder)].light} px-6 py-4 rounded-t-2xl border-b flex items-center justify-between`}>
              <div>
                <h2 className="text-2xl font-black text-gray-900">
                  ORDER #{selectedOrder.id.slice(-6).toUpperCase()}
                </h2>
                <p className="text-sm text-gray-500">{formatTime(selectedOrder.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPrint(selectedOrder)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-semibold text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-6">
              {/* Customer info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</h3>
                <p className="text-xl font-bold text-gray-900">
                  {selectedOrder.customerName || selectedOrder.customer?.name || 'Guest'}
                </p>
                {selectedOrder.customerPhone && (
                  <p className="text-gray-600">{selectedOrder.customerPhone}</p>
                )}
                <p className="text-sm text-gray-500 mt-1 uppercase font-medium">
                  {selectedOrder.fulfillmentMethod === 'delivery' ? '🚗 Delivery' : '🏃 Pickup'}
                </p>
                {selectedOrder.deliveryAddress && (
                  <p className="text-sm text-gray-600 mt-2">
                    📍 {[
                      selectedOrder.deliveryAddress.line1,
                      selectedOrder.deliveryAddress.line2,
                      selectedOrder.deliveryAddress.city,
                      selectedOrder.deliveryAddress.state,
                      selectedOrder.deliveryAddress.postalCode
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Items</h3>
                <ul className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {item.quantity}x {item.menuItemName || 'Item'}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-0.5">→ {item.notes}</p>
                        )}
                      </div>
                      <span className="font-medium text-gray-700">
                        {formatCurrency(Number(item.price) * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                {selectedOrder.subtotalAmount && (
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotalAmount)}</span>
                  </div>
                )}
                {selectedOrder.taxAmount && Number(selectedOrder.taxAmount) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                  </div>
                )}
                {selectedOrder.tipAmount && Number(selectedOrder.tipAmount) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tip</span>
                    <span>{formatCurrency(selectedOrder.tipAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-yellow-800 uppercase tracking-wide mb-1">Special Notes</h3>
                  <p className="text-yellow-900">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Modal footer - actions */}
            <div className="sticky bottom-0 bg-white border-t p-4 rounded-b-2xl">
              {(() => {
                const action = getPrimaryAction(selectedOrder);
                const status = getOrderStatus(selectedOrder);

                if (status === 'history') {
                  return (
                    <p className="text-center text-gray-500 py-2">
                      Order {selectedOrder.status.toLowerCase()}
                    </p>
                  );
                }

                return (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (confirm(`Cancel order #${selectedOrder.id.slice(-6).toUpperCase()}?`)) {
                          onCancel(selectedOrder);
                          closeModal();
                        }
                      }}
                      className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    {action && (
                      <button
                        onClick={() => {
                          action.action();
                          closeModal();
                        }}
                        className={`flex-1 px-4 py-3 text-white rounded-xl font-bold text-lg transition-colors ${action.color}`}
                      >
                        {action.label === 'Accept' && '✓ Accept & Start'}
                        {action.label === 'Ready' && '✓ Mark Ready'}
                        {action.label === 'Complete' && '✓ Complete Order'}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
