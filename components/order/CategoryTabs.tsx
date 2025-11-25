"use client";

import { useMemo } from 'react';
import { useTenantTheme } from '../TenantThemeProvider';
import RewardsTab from './RewardsTab';

interface CategoryTabsProps {
  categories: Array<{ id: string; name: string; icon?: string }>;
  activeCategoryId: string;
  onSelect: (categoryId: string) => void;
  showRewardsButton?: boolean;
  onRewardsClick?: () => void;
}

export function CategoryTabs({
  categories,
  activeCategoryId,
  onSelect,
  showRewardsButton = false,
  onRewardsClick,
}: CategoryTabsProps) {
  const tenant = useTenantTheme();
  const chips = useMemo(() => categories, [categories]);
  
  if (!chips.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/60">
        Menu sections will appear here once created.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-white/40">
        <span>Categories</span>
        <span>{chips.length} sections</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {showRewardsButton && <RewardsTab onClick={onRewardsClick} />}
        {chips.map((category) => {
          const isActive = category.id === activeCategoryId;
          return (
            <button
              key={category.id}
              onClick={() => onSelect(category.id)}
              style={
                isActive
                  ? {
                      background: `linear-gradient(to right, ${tenant.primaryColor}, ${tenant.secondaryColor})`,
                      boxShadow: `0 10px 15px -3px ${tenant.primaryColor}40, 0 4px 6px -2px ${tenant.primaryColor}40`,
                    }
                  : undefined
              }
              className={`flex flex-shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                isActive
                  ? 'border-transparent text-white shadow-lg'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/40 hover:text-white'
              }`}
            >
              {category.icon && <span className="text-base">{category.icon}</span>}
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryTabs;
