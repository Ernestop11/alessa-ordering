"use client";

import type { OrderMenuItem, OrderMenuSection } from '../order/OrderPageClient';
import { useTenantTheme } from '../TenantThemeProvider';

interface ListViewProps {
  section: OrderMenuSection | undefined;
  onAdd: (item: OrderMenuItem) => void;
}

export function ListView({ section, onAdd }: ListViewProps) {
  const tenant = useTenantTheme();
  if (!section) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 text-white">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-sm uppercase tracking-widest text-white/60">{section.type}</p>
        <h2 className="text-2xl font-semibold">{section.name}</h2>
      </div>
      <ul className="divide-y divide-white/5">
        {section.items.map((item) => (
          <li key={item.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{item.name}</span>
                {item.tags && item.tags.length > 0 && (
                  <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/60">{item.tags[0]}</span>
                )}
              </div>
              {item.description && <p className="text-sm text-white/65">{item.description}</p>}
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="text-xl font-black" style={{ color: tenant.secondaryColor }}>${item.price.toFixed(2)}</div>
              <button
                onClick={() => onAdd(item)}
                style={{
                  borderColor: `${tenant.primaryColor}80`,
                }}
                className="rounded-full border px-4 py-2 text-sm font-semibold text-white transition hover:opacity-80"
              >
                Add to cart
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ListView;
