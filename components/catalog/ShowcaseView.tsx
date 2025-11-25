"use client";

import { Flame, Star } from 'lucide-react';
import type { OrderMenuItem, OrderMenuSection } from '../order/OrderPageClient';
import { useTenantTheme } from '../TenantThemeProvider';

interface ShowcaseViewProps {
  section: OrderMenuSection | undefined;
  featured: OrderMenuItem[];
  onAdd: (item: OrderMenuItem) => void;
}

export function ShowcaseView({ section, featured, onAdd }: ShowcaseViewProps) {
  const tenant = useTenantTheme();
  const showcaseItems = featured.length > 0 ? featured : section?.items.slice(0, 4) ?? [];

  if (!showcaseItems.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
        Nothing to showcase yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showcaseItems.map((item, index) => (
        <article
          key={item.id}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black/70 via-black/30 to-black/40 text-white shadow-2xl shadow-black/40 transition hover:-translate-y-1 hover:border-white/30"
        >
          <div className="absolute inset-0 opacity-60">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl">🍽️</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
          </div>
          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-10">
            <div className="flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                <Flame className="h-4 w-4 text-amber-400" />
                Signature #{index + 1}
              </div>
              <h3 className="text-3xl font-black tracking-tight">{item.name}</h3>
              {item.description && <p className="mt-2 text-white/80">{item.description}</p>}
              <div className="mt-4 flex items-center gap-4 text-white/70">
                <div className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wide">
                  <Star className="h-4 w-4 text-amber-300" />
                  Crowd favorite
                </div>
                {item.category && <span>{item.category}</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="text-4xl font-black" style={{ color: tenant.secondaryColor }}>${item.price.toFixed(2)}</div>
              <button
                onClick={() => onAdd(item)}
                style={{
                  background: `linear-gradient(to right, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
                  boxShadow: `0 20px 25px -5px ${tenant.primaryColor}66, 0 10px 10px -5px ${tenant.primaryColor}66`,
                }}
                className="rounded-full px-6 py-3 text-base font-bold text-white shadow-xl transition hover:scale-105"
              >
                Add to order
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default ShowcaseView;
