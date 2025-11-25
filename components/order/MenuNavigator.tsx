"use client";

import type { ComponentType } from 'react';
import { Accessibility, ChefHat, Grid2x2, List, ScrollText, Sparkles, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import type { OrderMenuItem } from './OrderPageClient';
import { CategoryTabs } from './CategoryTabs';
import { useTenantTheme } from '../TenantThemeProvider';
import RewardsTab from './RewardsTab';

export type CatalogView = 'grid' | 'list' | 'showcase';

interface MenuNavigatorProps {
  categories: Array<{ id: string; name: string; icon?: string }>;
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  activeView: CatalogView;
  onChangeView: (view: CatalogView) => void;
  onOpenCatering: () => void;
  onOpenAccessibility: () => void;
  onOpenCart: () => void;
  highlightItem?: OrderMenuItem | null;
  onOpenRewards?: () => void;
}

const VIEW_OPTIONS: Array<{ id: CatalogView; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: 'grid', label: 'Grid', icon: Grid2x2 },
  { id: 'list', label: 'List', icon: List },
  { id: 'showcase', label: 'Showcase', icon: Sparkles },
];

export function MenuNavigator({
  categories,
  activeCategoryId,
  onSelectCategory,
  activeView,
  onChangeView,
  onOpenCatering,
  onOpenAccessibility,
  onOpenCart,
  highlightItem,
  onOpenRewards,
}: MenuNavigatorProps) {
  const tenant = useTenantTheme();
  
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCatering}
            style={{
              borderColor: `${tenant.primaryColor}99`,
              backgroundColor: `${tenant.primaryColor}26`,
              boxShadow: `inset 0 2px 4px ${tenant.primaryColor}4D`,
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold text-white transition hover:opacity-80"
          >
            <ChefHat className="h-4 w-4" />
            Catering
          </button>
          <button
            onClick={onOpenAccessibility}
            style={{
              borderColor: `${tenant.secondaryColor}80`,
              backgroundColor: `${tenant.secondaryColor}26`,
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold text-white transition hover:opacity-80"
          >
            <Accessibility className="h-4 w-4" />
            ADA
          </button>
          <button
            onClick={onOpenCart}
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/20"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {VIEW_OPTIONS.map(({ id, label, icon: Icon }) => {
            const isActive = id === activeView;
            return (
              <button
                key={id}
                onClick={() => onChangeView(id)}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(to right, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
                        boxShadow: `0 10px 15px -3px ${tenant.primaryColor}4D, 0 4px 6px -2px ${tenant.primaryColor}4D`,
                      }
                    : undefined
                }
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  isActive
                    ? 'border-transparent text-white shadow-lg'
                    : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
          <div className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs uppercase tracking-wide text-white/70">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Layout
          </div>
        </div>

        {highlightItem && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-white/20 bg-black/40">
              {highlightItem.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={highlightItem.image} alt={highlightItem.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">🍽️</div>
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span>Chef Highlight</span>
                <ScrollText className="h-4 w-4" style={{ color: tenant.secondaryColor }} />
              </div>
              <p className="text-base font-semibold text-white">{highlightItem.name}</p>
              <p className="text-sm text-white/70 line-clamp-1">{highlightItem.description}</p>
            </div>
            <div
              style={{
                background: `linear-gradient(to right, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
              }}
              className="rounded-full px-3 py-1 text-xs font-bold text-white"
            >
              ${highlightItem.price.toFixed(2)}
            </div>
          </div>
        )}

        <CategoryTabs
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelect={onSelectCategory}
          showRewardsButton
          onRewardsClick={onOpenRewards}
        />
      </div>
    </div>
  );
}

export default MenuNavigator;
