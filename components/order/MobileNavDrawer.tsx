"use client";

import { useEffect, useState } from 'react';
import { useTenantTheme } from '../TenantThemeProvider';

interface MenuSection {
  id: string;
  name: string;
}

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCateringClick: () => void;
  onRewardsClick: () => void;
  onAccessibilityClick: () => void;
  onReorderClick?: () => void;
  onSignOut?: () => void;
  onLoginClick?: () => void;
  cateringEnabled: boolean;
  customerData: { name?: string; loyaltyPoints?: number; orders?: any[] } | null;
  isAccessibilityOpen: boolean;
  menuSections?: MenuSection[];
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  onCateringClick,
  onRewardsClick,
  onAccessibilityClick,
  onReorderClick,
  onSignOut,
  onLoginClick,
  cateringEnabled,
  customerData,
  isAccessibilityOpen,
  menuSections = [],
}: MobileNavDrawerProps) {
  const tenant = useTenantTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen && !mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        onTransitionEnd={() => !isOpen && setMounted(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-[#1a1a1a] shadow-2xl transform transition-transform duration-300 ease-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-xl">
              {tenant.logoUrl ? (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                '🍽️'
              )}
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">{tenant.name}</h2>
              {customerData && (
                <p className="text-xs text-amber-300">{customerData.loyaltyPoints || 0} points</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Section */}
        {customerData ? (
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-transparent">
            <p className="text-white font-medium">Welcome back, {customerData.name || 'Member'}!</p>
            <p className="text-sm text-white/60 mt-1">You have {customerData.loyaltyPoints || 0} reward points</p>
          </div>
        ) : (
          <div className="p-4 border-b border-white/10 space-y-3">
            {onLoginClick && (
              <button
                onClick={() => {
                  onClose();
                  onLoginClick();
                }}
                className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sign In / Create Account
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onRewardsClick();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold hover:from-red-500 hover:to-red-400 transition-all"
            >
              Join Rewards - It&apos;s Free!
            </button>
            <p className="text-center text-xs text-white/50">Earn points with every order</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <button
            onClick={() => {
              onClose();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white hover:bg-white/5 transition-all"
          >
            <span className="text-xl">🍽️</span>
            <div>
              <span className="font-medium">Our Menu</span>
              <p className="text-xs text-white/50">Browse all items</p>
            </div>
          </button>

          {cateringEnabled && (
            <button
              onClick={() => {
                onClose();
                onCateringClick();
              }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white hover:bg-white/5 transition-all"
            >
              <span className="text-xl">🎉</span>
              <div>
                <span className="font-medium">Catering</span>
                <p className="text-xs text-white/50">Events & large orders</p>
              </div>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onRewardsClick();
            }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white hover:bg-white/5 transition-all"
          >
            <span className="text-xl">🎁</span>
            <div>
              <span className="font-medium">Rewards</span>
              <p className="text-xs text-white/50">{customerData ? 'View your rewards' : 'Join & earn points'}</p>
            </div>
            {customerData && (
              <span className="ml-auto px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded-full">
                {customerData.loyaltyPoints || 0} pts
              </span>
            )}
          </button>

          {customerData && onReorderClick && (
            <button
              onClick={() => {
                onClose();
                onReorderClick();
              }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white hover:bg-white/5 transition-all"
            >
              <span className="text-xl">🔄</span>
              <div>
                <span className="font-medium">Quick Reorder</span>
                <p className="text-xs text-white/50">Order your favorites again</p>
              </div>
              {customerData.orders && customerData.orders.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                  {customerData.orders.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onAccessibilityClick();
            }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all ${
              isAccessibilityOpen
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-white hover:bg-white/5'
            }`}
          >
            <span className="text-xl">♿</span>
            <div>
              <span className="font-medium">Accessibility</span>
              <p className="text-xs text-white/50">Adjust display settings</p>
            </div>
            {isAccessibilityOpen && (
              <span className="ml-auto text-xs text-blue-300">ON</span>
            )}
          </button>
        </nav>

        {/* Menu Section Shortcuts */}
        {menuSections.length > 0 && (
          <div className="px-4 py-3 border-t border-white/10">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Jump to Section</p>
            <div className="grid grid-cols-2 gap-2">
              {menuSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    onClose();
                    setTimeout(() => {
                      const el = document.getElementById(`section-${section.id}`);
                      if (el) {
                        const yOffset = -160;
                        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      }
                    }, 300);
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#C41E3A]/40 transition-all text-left truncate"
                >
                  {section.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {customerData && onSignOut && (
          <div className="p-4 mt-4 border-t border-white/10">
            <button
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
            >
              <span className="text-lg">🚪</span>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        )}

        {/* Bottom padding for safe scrolling */}
        <div className="h-8" />
      </div>
    </>
  );
}
