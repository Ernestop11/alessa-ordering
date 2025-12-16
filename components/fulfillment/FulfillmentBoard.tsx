"use client";

import type { FulfillmentOrder } from './types';
import OrderCard from './OrderCard';

type ColumnKey = 'new' | 'preparing' | 'ready' | 'completed' | 'other';

const COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  statuses: string[];
  bgColor: string;
  borderColor: string;
  headerBg: string;
  countBg: string;
  icon: string;
}> = [
  {
    // LOUDEST - Urgent new orders needing attention
    key: 'new',
    label: 'NEW ORDERS',
    statuses: ['pending', 'confirmed'],
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
    headerBg: 'bg-gradient-to-r from-red-600 to-red-500',
    countBg: 'bg-red-700',
    icon: '🔴',
  },
  {
    // MEDIUM - Actively being worked on
    key: 'preparing',
    label: 'Preparing',
    statuses: ['preparing'],
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    headerBg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    countBg: 'bg-amber-600',
    icon: '🟡',
  },
  {
    // CALM - Ready, waiting for pickup
    key: 'ready',
    label: 'Ready',
    statuses: ['ready'],
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    headerBg: 'bg-gradient-to-r from-green-500 to-emerald-400',
    countBg: 'bg-green-600',
    icon: '🟢',
  },
  {
    // MUTED - Completed, archive
    key: 'completed',
    label: 'Done',
    statuses: ['completed'],
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    headerBg: 'bg-gradient-to-r from-slate-400 to-slate-300',
    countBg: 'bg-slate-500',
    icon: '⚪',
  },
];

interface Props {
  orders: FulfillmentOrder[];
  onAccept: (order: FulfillmentOrder) => void;
  onMarkReady: (order: FulfillmentOrder) => void;
  onComplete: (order: FulfillmentOrder) => void;
  onPrint: (order: FulfillmentOrder) => void;
  onCancel?: (order: FulfillmentOrder) => void;
  onRefund?: (order: FulfillmentOrder) => void;
  scope: 'tenant' | 'platform';
  tabletMode?: boolean;
  kitchenMode?: boolean; // Large UI for kitchen display
}

function getColumnForOrder(order: FulfillmentOrder): ColumnKey {
  const status = (order.status || '').toLowerCase();
  const column = COLUMNS.find((col) => col.statuses.includes(status));
  return column?.key ?? 'other';
}

export default function FulfillmentBoard({
  orders,
  onAccept,
  onMarkReady,
  onComplete,
  onPrint,
  onCancel,
  onRefund,
  scope,
  tabletMode = false,
  kitchenMode = false,
}: Props) {
  const grouped: Record<ColumnKey, FulfillmentOrder[]> = {
    new: [],
    preparing: [],
    ready: [],
    completed: [],
    other: [],
  };

  orders.forEach((order) => {
    const key = getColumnForOrder(order);
    grouped[key].push(order);
  });

  // Kitchen mode: simplified 2-column layout focused on actionable orders
  if (kitchenMode) {
    const KITCHEN_COLUMNS = [
      { key: 'new' as ColumnKey, label: '🔔 NEW ORDERS', statuses: ['pending', 'confirmed'], bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
      { key: 'preparing' as ColumnKey, label: '👨‍🍳 PREPARING', statuses: ['preparing'], bgColor: 'bg-amber-50', borderColor: 'border-amber-300' },
    ];

    return (
      <div className="grid grid-cols-2 gap-4">
        {KITCHEN_COLUMNS.map((column) => (
          <section key={column.key} className={`rounded-2xl border-4 ${column.borderColor} ${column.bgColor} shadow-lg`}>
            <header className="flex items-center justify-between border-b-4 border-inherit px-6 py-4">
              <h2 className="text-2xl font-black text-gray-900">{column.label}</h2>
              <span className="rounded-full bg-gray-900 text-white px-4 py-2 text-2xl font-black">
                {grouped[column.key].length}
              </span>
            </header>
            <div className="flex flex-col gap-4 p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {grouped[column.key].length === 0 ? (
                <p className="rounded-xl border-4 border-dashed border-gray-300 px-6 py-12 text-center text-2xl font-bold text-gray-400">
                  No orders
                </p>
              ) : (
                grouped[column.key].map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    scope={scope}
                    onAccept={onAccept}
                    onMarkReady={onMarkReady}
                    onComplete={onComplete}
                    onPrint={onPrint}
                    onCancel={onCancel}
                    onRefund={onRefund}
                    kitchenMode={true}
                  />
                ))
              )}
            </div>
          </section>
        ))}

        {/* Ready orders - smaller row at bottom */}
        {grouped.ready.length > 0 && (
          <section className="col-span-2 rounded-2xl border-4 border-emerald-400 bg-emerald-50 shadow-lg">
            <header className="flex items-center justify-between border-b-4 border-emerald-400 px-6 py-3">
              <h2 className="text-xl font-black text-emerald-900">✅ READY FOR PICKUP</h2>
              <span className="rounded-full bg-emerald-600 text-white px-4 py-2 text-xl font-black">
                {grouped.ready.length}
              </span>
            </header>
            <div className="flex flex-wrap gap-4 p-4">
              {grouped.ready.map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-4 border-2 border-emerald-300 flex items-center gap-4">
                  <span className="text-2xl font-black text-gray-900">#{order.id.slice(-6).toUpperCase()}</span>
                  <span className="text-xl font-bold text-gray-700">{order.customerName || 'Guest'}</span>
                  <button
                    onClick={() => onComplete(order)}
                    className="bg-emerald-600 text-white text-lg font-bold px-4 py-2 rounded-lg"
                  >
                    COMPLETE
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // Standard/tablet mode - Ticket Rolodex Style
  return (
    <>
      {/* CSS for ticket animations */}
      <style jsx global>{`
        @keyframes ticketPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        }
        .ticket-new {
          animation: ticketPulse 1.5s infinite;
        }
        .ticket-stack {
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        .ticket-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .ticket-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.2);
          z-index: 10;
        }
      `}</style>

      <div className={`grid gap-4 ${tabletMode ? 'grid-cols-2' : 'lg:grid-cols-4 md:grid-cols-2'}`}>
        {COLUMNS.map((column) => (
          <section
            key={column.key}
            className={`rounded-2xl border-2 ${column.borderColor} ${column.bgColor} shadow-lg overflow-hidden`}
          >
            {/* Color-coded header */}
            <header className={`${column.headerBg} text-white px-4 py-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{column.icon}</span>
                  <h2 className="text-lg font-bold">{column.label}</h2>
                </div>
                <span className={`${column.countBg} rounded-full px-3 py-1 text-lg font-bold shadow-inner`}>
                  {grouped[column.key].length}
                </span>
              </div>
            </header>

            {/* Order cards - ticket stack style */}
            <div className="ticket-stack flex min-h-[200px] flex-col gap-3 p-3 max-h-[500px] overflow-y-auto">
              {grouped[column.key].length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="rounded-xl border-2 border-dashed border-gray-300 px-6 py-8 text-center text-sm text-gray-400 bg-white/50">
                    No {column.label.toLowerCase()} orders
                  </p>
                </div>
              ) : (
                grouped[column.key].map((order, index) => (
                  <div
                    key={order.id}
                    className={`ticket-card ${column.key === 'new' && index === 0 ? 'ticket-new' : ''}`}
                    style={{
                      position: 'relative',
                      zIndex: grouped[column.key].length - index,
                    }}
                  >
                    <OrderCard
                      order={order}
                      scope={scope}
                      onAccept={onAccept}
                      onMarkReady={onMarkReady}
                      onComplete={onComplete}
                      onPrint={onPrint}
                      onCancel={onCancel}
                      onRefund={onRefund}
                      isNew={column.key === 'new'}
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        ))}

        {/* Other/cancelled orders */}
        {grouped.other.length > 0 && (
          <section className="rounded-2xl border-2 border-red-300 bg-red-50 shadow-lg lg:col-span-4 overflow-hidden">
            <header className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <h2 className="text-lg font-bold">Cancelled / Other</h2>
                </div>
                <span className="bg-red-700 rounded-full px-3 py-1 text-lg font-bold shadow-inner">
                  {grouped.other.length}
                </span>
              </div>
            </header>
            <div className="flex flex-wrap gap-3 p-3">
              {grouped.other.map((order) => (
                <div key={order.id} className="ticket-card flex-shrink-0 w-72">
                  <OrderCard
                    order={order}
                    scope={scope}
                    onAccept={onAccept}
                    onMarkReady={onMarkReady}
                    onComplete={onComplete}
                    onPrint={onPrint}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
