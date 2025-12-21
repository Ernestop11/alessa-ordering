"use client";

import Image from 'next/image';
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
  { id: 'grid', label: 'Grid', icon: '⊞' },
  { id: 'list', label: 'List', icon: '☰' },
  { id: 'cards', label: 'Cards', icon: '▢' },
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

  // Liquid glass button style
  const glassButtonStyle = {
    background: `linear-gradient(135deg,
      rgba(255,255,255,0.08) 0%,
      rgba(255,255,255,0.02) 50%,
      rgba(255,255,255,0.05) 100%
    )`,
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  const glassButtonActiveStyle = {
    background: `linear-gradient(135deg,
      rgba(255,255,255,0.15) 0%,
      rgba(255,255,255,0.05) 50%,
      rgba(255,255,255,0.1) 100%
    )`,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-900/80 backdrop-blur-2xl border-b border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-4 py-3">
          {/* Logo & Name */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo with Solid Background Card */}
            <div className="relative flex-shrink-0">
              {/* Solid background container for logo visibility */}
              <div
                className="rounded-2xl p-1 shadow-xl"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,240,240,0.9))',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                {tenant.logoUrl ? (
                  <Image
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-xl object-cover"
                    unoptimized={tenant.logoUrl.startsWith('/tenant/')}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-amber-500 text-2xl">
                    🍽️
                  </div>
                )}
              </div>
            </div>

            {/* Name & Tagline */}
            <div className="min-w-0 hidden sm:block">
              <h1 className="font-semibold text-white text-lg tracking-tight truncate">{tenant.name}</h1>
              {tenant.tagline && (
                <p className="text-[11px] text-white/40 truncate">{tenant.tagline}</p>
              )}
            </div>
          </div>

          {/* Feature Tabs - Desktop */}
          <div className="hidden md:flex items-center gap-1.5">
            {cateringEnabled && onCateringClick && (
              <button
                onClick={onCateringClick}
                style={glassButtonStyle}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-white/70 hover:text-white transition-all duration-300 hover:scale-[1.02]"
              >
                <span>🎉</span>
                <span>Catering</span>
              </button>
            )}

            {onAccessibilityClick && (
              <button
                onClick={onAccessibilityClick}
                style={isAccessibilityOpen ? glassButtonActiveStyle : glassButtonStyle}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-300 hover:scale-[1.02] ${
                  isAccessibilityOpen ? 'text-white' : 'text-white/70 hover:text-white'
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
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.1) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(251,191,36,0.3)',
                }}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-amber-200 hover:text-amber-100 transition-all duration-300 hover:scale-[1.02]"
              >
                <span>🎁</span>
                <span>{hasCustomerData ? 'Rewards' : 'Join'}</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={onCartClick}
              style={{
                background: 'linear-gradient(135deg, rgba(220,38,38,0.9) 0%, rgba(185,28,28,0.9) 100%)',
                boxShadow: '0 4px 20px rgba(220,38,38,0.3)',
              }}
              className="relative flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            >
              <span>🛒</span>
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black shadow-lg">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Cart Button */}
          <button
            onClick={onCartClick}
            style={{
              background: 'linear-gradient(135deg, rgba(220,38,38,0.9) 0%, rgba(185,28,28,0.9) 100%)',
              boxShadow: '0 4px 16px rgba(220,38,38,0.3)',
            }}
            className="md:hidden relative flex items-center justify-center w-11 h-11 rounded-full text-white transition-all hover:scale-105"
          >
            <span className="text-lg">🛒</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black shadow-lg">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Category Navigation Row */}
        <div className="pb-3">
          <div className="flex items-center gap-3">
            {/* Categories */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <PolishedCategoryTabs
                sections={sections}
                activeId={activeSectionId}
                onSelect={onSectionChange}
              />
            </div>

            {/* Layout Toggle - Desktop */}
            <div
              className="hidden md:flex items-center gap-0.5 rounded-full p-1"
              style={glassButtonStyle}
            >
              {LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => onLayoutChange(layout.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    activeLayout === layout.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/80'
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
