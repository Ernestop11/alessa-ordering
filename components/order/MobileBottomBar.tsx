"use client";

import { useTenantTheme } from '../TenantThemeProvider';

interface MobileBottomBarProps {
  cartItemCount: number;
  onCartClick: () => void;
  onCateringClick?: () => void;
  onRewardsClick?: () => void;
  onAccessibilityClick?: () => void;
  cateringEnabled?: boolean;
  isAccessibilityOpen?: boolean;
  activeTab?: 'menu' | 'catering' | 'rewards' | 'cart';
}

export default function MobileBottomBar({
  cartItemCount,
  onCartClick,
  onCateringClick,
  onRewardsClick,
  onAccessibilityClick,
  cateringEnabled = false,
  isAccessibilityOpen = false,
  activeTab = 'menu',
}: MobileBottomBarProps) {
  const tenant = useTenantTheme();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient Border Top */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Main Bar */}
      <div className="flex items-center justify-around bg-black/95 backdrop-blur-xl px-2 py-2 safe-area-pb">
        {/* Menu/Home Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
            activeTab === 'menu'
              ? 'text-white bg-white/10'
              : 'text-white/50 active:bg-white/10'
          }`}
        >
          <span className="text-lg">🍽️</span>
          <span className="text-[10px] font-medium">Menu</span>
        </button>

        {/* Catering */}
        {cateringEnabled && onCateringClick && (
          <button
            onClick={onCateringClick}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'catering'
                ? 'text-white bg-white/10'
                : 'text-white/50 active:bg-white/10'
            }`}
          >
            <span className="text-lg">🎉</span>
            <span className="text-[10px] font-medium">Catering</span>
          </button>
        )}

        {/* Rewards */}
        {onRewardsClick && (
          <button
            onClick={onRewardsClick}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'rewards'
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-white/50 active:bg-white/10'
            }`}
          >
            <span className="text-lg">🎁</span>
            <span className="text-[10px] font-medium">Rewards</span>
          </button>
        )}

        {/* Accessibility - Optional */}
        {onAccessibilityClick && (
          <button
            onClick={onAccessibilityClick}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
              isAccessibilityOpen
                ? 'text-blue-400 bg-blue-500/10'
                : 'text-white/50 active:bg-white/10'
            }`}
          >
            <span className="text-lg">♿</span>
            <span className="text-[10px] font-medium">ADA</span>
          </button>
        )}

        {/* Cart - Always Highlighted */}
        <button
          onClick={onCartClick}
          className="relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/30 active:scale-95 transition-transform"
        >
          <span className="text-lg">🛒</span>
          <span className="text-[10px] font-bold">Cart</span>
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-[9px] font-black text-black ring-1 ring-black animate-bounce">
              {cartItemCount > 9 ? '9+' : cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* Safe Area Spacer for iOS */}
      <div className="h-safe-area-b bg-black/95" />
    </div>
  );
}
