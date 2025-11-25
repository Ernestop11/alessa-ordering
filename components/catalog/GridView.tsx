"use client";

import type { OrderMenuItem, OrderMenuSection } from '../order/OrderPageClient';
import { useTenantTheme } from '../TenantThemeProvider';

interface GridViewProps {
  section: OrderMenuSection | undefined;
  onAdd: (item: OrderMenuItem) => void;
}

export function GridView({ section, onAdd }: GridViewProps) {
  const tenant = useTenantTheme();
  if (!section) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
        No menu sections available yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-white/60">{section.type}</p>
          <h2 className="text-3xl font-bold text-white">{section.name}</h2>
          {section.description && <p className="text-white/70">{section.description}</p>}
        </div>
        <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">
          {section.items.length} items
        </span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item) => (
          <article
            key={item.id}
            className="relative group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-white shadow-xl shadow-black/30 transition hover:-translate-y-1 hover:border-white/30"
          >
            <div className="relative h-48 w-full overflow-hidden">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl">🍽️</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
                {item.category || 'Chef Special'}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div>
                <h3 className="text-xl font-bold">{item.name}</h3>
                {item.description && <p className="text-sm text-white/70 line-clamp-3">{item.description}</p>}
              </div>
              <button
                onClick={() => onAdd(item)}
                style={{
                  background: `linear-gradient(to right, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
                  boxShadow: `0 10px 15px -3px ${tenant.primaryColor}66, 0 4px 6px -2px ${tenant.primaryColor}66`,
                }}
                className="absolute -top-4 right-4 rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:-translate-y-0.5"
              >
                + Add
              </button>
              <div className="mt-auto flex items-center justify-between pt-4">
                <div className="text-2xl font-black" style={{ color: tenant.secondaryColor }}>${item.price.toFixed(2)}</div>
                <button
                  onClick={() => onAdd(item)}
                  style={{
                    background: `linear-gradient(to right, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
                    boxShadow: `0 10px 15px -3px ${tenant.primaryColor}4D, 0 4px 6px -2px ${tenant.primaryColor}4D`,
                  }}
                  className="rounded-full px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:scale-105"
                >
                  Add
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default GridView;
