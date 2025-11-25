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
