"use client";

import { useEffect, useState } from 'react';
import { useTenantTheme } from '../TenantThemeProvider';
import { useCart } from '../../lib/store/cart';

interface MenuSection {
  id: string;
  name: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string | null;
    available: boolean;
  } | null;
}

interface PastOrder {
  id: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  fulfillmentMethod: string;
  items: OrderItem[];
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
  onCheckoutClick?: () => void;
  cateringEnabled: boolean;
  customerData: { name?: string; loyaltyPoints?: number; orders?: PastOrder[] } | null;
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
  onCheckoutClick,
  cateringEnabled,
  customerData,
  isAccessibilityOpen,
  menuSections = [],
}: MobileNavDrawerProps) {
  const tenant = useTenantTheme();
  const [mounted, setMounted] = useState(false);
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);
  const { addToCart, items: cartItems } = useCart();

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

  // Quick reorder function - adds all items from a past order to cart
  const handleQuickReorder = async (order: PastOrder) => {
    setReorderingOrderId(order.id);

    // Add each item from the order to cart
    for (const item of order.items) {
      if (item.menuItem && item.menuItem.available) {
        addToCart({
          id: `${item.menuItem.id}-${Date.now()}-${Math.random()}`, // Unique ID for cart
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          image: item.menuItem.image,
          description: item.menuItem.description,
        });
      }
    }

    // Brief delay to show loading state
    await new Promise(r => setTimeout(r, 500));
    setReorderingOrderId(null);

    // Open cart/checkout
    onClose();
    if (onCheckoutClick) {
      setTimeout(() => onCheckoutClick(), 300);
    }
  };

  // Format date for display
  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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

      {/* Drawer - Dark theme matching cart/checkout */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-[#050A1C] border-r border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Header with gradient accent */}
          <div
            className="flex items-center justify-between p-4 border-b border-white/10"
            style={{
              background: `linear-gradient(to bottom, rgba(220, 38, 38, 0.15), transparent)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Glowing ring effect like header logo */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-red-500 to-amber-400 rounded-full opacity-75 blur-sm animate-pulse" />
                <div className="relative w-12 h-12 rounded-full bg-white p-1 shadow-xl ring-2 ring-white/50 flex items-center justify-center">
                  {tenant.logoUrl ? (
                    <img
                      src={tenant.logoUrl}
                      alt={tenant.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🍽️</span>
                  )}
                </div>
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">{tenant.name}</h2>
                {customerData && (
                  <p className="text-xs text-[#FBBF24]">{customerData.loyaltyPoints || 0} points</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/15 p-2 text-white/60 hover:border-[#DC2626]/60 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Section */}
          {customerData ? (
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-[#DC2626]/10 to-transparent">
              <p className="text-white font-medium">Welcome back, {customerData.name || 'Member'}!</p>
              <p className="text-sm text-[#FBBF24] mt-1">You have {customerData.loyaltyPoints || 0} reward points</p>
            </div>
          ) : (
            <div className="p-4 border-b border-white/10 space-y-3">
              {onLoginClick && (
                <button
                  onClick={() => {
                    onClose();
                    onLoginClick();
                  }}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/20 text-white font-bold hover:bg-white/10 hover:border-[#DC2626]/40 transition-all flex items-center justify-center gap-2"
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
                style={{
                  background: `linear-gradient(135deg, #DC2626 0%, #FBBF24 50%, #DC2626 100%)`,
                  boxShadow: `0 10px 20px rgba(220, 38, 38, 0.4), 0 0 30px rgba(251, 191, 36, 0.2)`,
                }}
                className="w-full py-3 rounded-xl text-white font-bold hover:scale-[1.02] transition-all"
              >
                Join Rewards - It&apos;s Free!
              </button>
              <p className="text-center text-xs text-[#FBBF24]/60">Earn points with every order</p>
            </div>
          )}

          {/* Quick Reorder Section - For logged in users with past orders */}
          {customerData && customerData.orders && customerData.orders.length > 0 && (
            <div className="p-4 border-b border-white/10">
              <p className="text-xs uppercase tracking-[0.3em] text-[#FBBF24]/60 mb-3">⚡ Quick Reorder</p>
              <div className="space-y-2">
                {customerData.orders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/50">{formatOrderDate(order.createdAt)}</p>
                        <p className="text-sm text-white font-medium truncate">
                          {order.items.slice(0, 2).map(i => i.menuItem?.name || 'Item').join(', ')}
                          {order.items.length > 2 && ` +${order.items.length - 2} more`}
                        </p>
                        <p className="text-xs text-[#FBBF24]">${order.totalAmount.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => handleQuickReorder(order)}
                        disabled={reorderingOrderId === order.id}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C] transition-all disabled:opacity-50"
                      >
                        {reorderingOrderId === order.id ? (
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Adding...
                          </span>
                        ) : (
                          '🔄 Reorder'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => {
                onClose();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white border border-transparent hover:bg-white/5 hover:border-[#DC2626]/30 transition-all"
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
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white border border-transparent hover:bg-white/5 hover:border-[#DC2626]/30 transition-all"
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
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white border border-transparent hover:bg-white/5 hover:border-[#DC2626]/30 transition-all"
            >
              <span className="text-xl">🎁</span>
              <div>
                <span className="font-medium">Rewards</span>
                <p className="text-xs text-white/50">{customerData ? 'View your rewards' : 'Join & earn points'}</p>
              </div>
              {customerData && (
                <span className="ml-auto px-2 py-0.5 bg-[#FBBF24] text-black text-xs font-bold rounded-full">
                  {customerData.loyaltyPoints || 0} pts
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onClose();
                onAccessibilityClick();
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all ${
                isAccessibilityOpen
                  ? 'bg-[#DC2626]/20 text-[#FBBF24] border border-[#DC2626]/40'
                  : 'text-white border border-transparent hover:bg-white/5 hover:border-[#DC2626]/30'
              }`}
            >
              <span className="text-xl">♿</span>
              <div>
                <span className="font-medium">Accessibility</span>
                <p className="text-xs text-white/50">Adjust display settings</p>
              </div>
              {isAccessibilityOpen && (
                <span className="ml-auto text-xs text-[#FBBF24]">ON</span>
              )}
            </button>
          </nav>

          {/* Menu Section Shortcuts */}
          {menuSections.length > 0 && (
            <div className="px-4 py-3 border-t border-white/10">
              <p className="text-xs uppercase tracking-[0.3em] text-[#FBBF24]/60 mb-3">Jump to Section</p>
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
                    className="px-3 py-2 rounded-lg text-sm font-medium text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#DC2626]/40 transition-all text-left truncate"
                  >
                    {section.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          {customerData && onSignOut && (
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[#DC2626] border border-[#DC2626]/30 hover:bg-[#DC2626]/10 transition-all"
              >
                <span className="text-lg">🚪</span>
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          )}

          {/* Bottom padding for safe scrolling */}
          <div className="h-24" />
        </div>

        {/* Fixed Checkout Button at Bottom */}
        {cartItemCount > 0 && onCheckoutClick && (
          <div className="flex-shrink-0 p-4 border-t border-white/10 bg-[#050A1C]">
            <button
              onClick={() => {
                onClose();
                setTimeout(() => onCheckoutClick(), 100);
              }}
              style={{
                background: `linear-gradient(135deg, #DC2626 0%, #FBBF24 50%, #DC2626 100%)`,
                boxShadow: `0 10px 20px rgba(220, 38, 38, 0.4), 0 0 30px rgba(251, 191, 36, 0.2)`,
              }}
              className="w-full py-4 rounded-xl text-white font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
            >
              <span className="text-xl">🛒</span>
              <span>Checkout</span>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                {cartItemCount} items · ${cartTotal.toFixed(2)}
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
