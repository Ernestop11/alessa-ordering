"use client";

import Image from 'next/image';
import { useState } from 'react';
import { useTenantTheme } from '../TenantThemeProvider';
import PolishedCategoryTabs from './PolishedCategoryTabs';

interface Section {
  id: string;
  name: string;
  type?: string;
  items?: any[];
}

type LayoutView = 'grid' | 'list' | 'cards';

interface PolishedHeaderProps {
  sections: Section[];
  activeSectionId: string;
  onSectionChange: (id: string) => void;
  activeLayout: LayoutView;
  onLayoutChange: (layout: LayoutView) => void;
  cartItemCount: number;
  onCartClick: () => void;
  onCateringClick?: () => void;
  onRewardsClick?: () => void;
  onAccessibilityClick?: () => void;
  cateringEnabled?: boolean;
  isAccessibilityOpen?: boolean;
  hasCustomerData?: boolean;
}

const LAYOUTS: Array<{ id: LayoutView; label: string; icon: string }> = [
  { id: 'grid', label: 'Grid', icon: '▦' },
  { id: 'list', label: 'List', icon: '☰' },
  { id: 'cards', label: 'Showcase', icon: '⬚' },
];

export default function PolishedHeader({
  sections,
  activeSectionId,
  onSectionChange,
  activeLayout,
  onLayoutChange,
  cartItemCount,
  onCartClick,
  onCateringClick,
  onRewardsClick,
  onAccessibilityClick,
  cateringEnabled = false,
  isAccessibilityOpen = false,
  hasCustomerData = false,
}: PolishedHeaderProps) {
  const tenant = useTenantTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/95 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-3 py-3 md:py-4">
          {/* Logo & Name - Compact on Mobile */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo with Gradient Ring */}
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-red-500/40 via-amber-500/30 to-yellow-500/40 blur-md opacity-70" />
              <div className="relative rounded-xl border border-white/20 bg-black/60 p-0.5 overflow-hidden">
                {tenant.logoUrl ? (
                  <Image
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-amber-500 text-2xl">
                    🍽️
                  </div>
                )}
              </div>
            </div>

            {/* Name & Tagline */}
            <div className="min-w-0">
              <h1 className="font-bold text-white text-base md:text-lg truncate">{tenant.name}</h1>
              {tenant.tagline && (
                <p className="text-[10px] md:text-xs text-white/50 truncate hidden sm:block">{tenant.tagline}</p>
              )}
            </div>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {cateringEnabled && onCateringClick && (
              <button
                onClick={onCateringClick}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/80 transition-all hover:bg-white/[0.08] hover:border-white/20 hover:text-white"
              >
                <span>🎉</span>
                <span>Catering</span>
              </button>
            )}

            {onAccessibilityClick && (
              <button
                onClick={onAccessibilityClick}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                  isAccessibilityOpen
                    ? 'border-blue-400/40 bg-blue-500/20 text-blue-200'
                    : 'border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.08] hover:border-white/20 hover:text-white'
                }`}
              >
                <span>♿</span>
                <span>ADA</span>
              </button>
            )}

            {onRewardsClick && (
              <button
                onClick={onRewardsClick}
                style={{
                  background: `linear-gradient(135deg, ${tenant.secondaryColor || '#f59e0b'}, ${tenant.primaryColor || '#dc2626'})`,
                }}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                <span>🎁</span>
                <span>{hasCustomerData ? 'My Rewards' : 'Join'}</span>
              </button>
            )}

            <button
              onClick={onCartClick}
              className="relative flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-red-600/30"
            >
              <span>🛒</span>
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-[10px] font-black text-black ring-2 ring-black">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Cart Button */}
          <button
            onClick={onCartClick}
            className="md:hidden relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg"
          >
            <span className="text-lg">🛒</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-[9px] font-black text-black ring-1 ring-black">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Category Navigation Row */}
        <div className="pb-3 md:pb-4">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Categories - Flexible Width */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <PolishedCategoryTabs
                sections={sections}
                activeId={activeSectionId}
                onSelect={onSectionChange}
              />
            </div>

            {/* Layout Toggle - Desktop Only */}
            <div className="hidden md:flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.02] p-1">
              {LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => onLayoutChange(layout.id)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    activeLayout === layout.id
                      ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-sm'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                  }`}
                  title={layout.label}
                >
                  {layout.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
