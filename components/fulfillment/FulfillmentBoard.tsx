"use client";

import type { FulfillmentOrder } from './types';
import OrderCard from './OrderCard';

type ColumnKey = 'new' | 'preparing' | 'ready' | 'completed' | 'other';

const COLUMNS: Array<{
  key: ColumnKey;
  label: string;
  statuses: string[];
}> = [
  { key: 'new', label: 'New', statuses: ['pending', 'confirmed'] },
  { key: 'preparing', label: 'Preparing', statuses: ['preparing'] },
  { key: 'ready', label: 'Ready for Pickup', statuses: ['ready'] },
  { key: 'completed', label: 'Completed', statuses: ['completed'] },
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

  // Standard/tablet mode
  return (
    <div className={`grid gap-6 ${tabletMode ? 'grid-cols-2' : 'lg:grid-cols-4 md:grid-cols-2'}`}>
      {COLUMNS.map((column) => (
        <section key={column.key} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{column.label}</h2>
              <p className="text-xs text-gray-500">
                {column.statuses.map((status) => status.toUpperCase()).join(', ')}
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {grouped[column.key].length}
            </span>
          </header>
          <div className="flex min-h-[220px] flex-col gap-3 p-3">
            {grouped[column.key].length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
                No orders here yet.
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
                />
              ))
            )}
          </div>
        </section>
      ))}
      {grouped.other.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 shadow-inner lg:col-span-4">
          <header className="flex items-center justify-between border-b border-amber-200 px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-amber-900">Other Statuses</h2>
              <p className="text-xs text-amber-700">Will include cancelled or custom workflow steps.</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
              {grouped.other.length}
            </span>
          </header>
          <div className="flex flex-col gap-3 p-3">
            {grouped.other.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                scope={scope}
                onAccept={onAccept}
                onMarkReady={onMarkReady}
                onComplete={onComplete}
                onPrint={onPrint}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
