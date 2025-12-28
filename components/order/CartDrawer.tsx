"use client";

import { useState } from 'react';
import { X, Pencil } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart, CartItem } from '../../lib/store/cart';
import { useTenantTheme } from '../TenantThemeProvider';
import CartItemEditModal from './CartItemEditModal';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeFromCart, updateQuantity, total } = useCart();
  const tenant = useTenantTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant');
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  const handleCheckout = () => {
    router.push(`/checkout?tenant=${tenantSlug}`);
    onClose();
  };

  if (!open) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:justify-end">
      <div className="h-[85vh] w-full max-w-md rounded-t-3xl border border-white/10 bg-[#050A1C] text-white shadow-2xl sm:h-full sm:rounded-none sm:border-l sm:border-t-0 sm:shadow-[0_0_50px_rgba(0,0,0,0.45)]">
        <div
          className="flex items-center justify-between border-b border-white/10 px-5 py-4"
          style={{
            background: `linear-gradient(to bottom, rgba(220, 38, 38, 0.15), transparent)`,
          }}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#FBBF24]/80">Cart</p>
            <h3 className="text-xl font-semibold">{items.length} items</h3>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/15 p-2 text-white/60 hover:border-[#DC2626]/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex h-[calc(100%-190px)] flex-col overflow-y-auto px-5 py-4">
          {items.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-white/60">
              Your cart is empty. Tap any + button to add Las Reinas favorites.
            </div>
          )}
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-[#DC2626]/30 hover:shadow-[0_0_15px_rgba(220,38,38,0.15)] cursor-pointer"
                onClick={() => setEditingItem(item)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold truncate">{item.name}</p>
                    {item.description && <p className="text-xs text-white/60 line-clamp-1">{item.description}</p>}
                    {item.note && (
                      <p className="text-xs text-[#FBBF24]/70 mt-1 italic truncate">Note: {item.note}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                    className="p-2 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity - 1); }}
                    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-lg font-semibold hover:border-[#DC2626]/60 hover:bg-[#DC2626]/10 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-base font-bold w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity + 1); }}
                    className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-lg font-semibold hover:border-[#DC2626]/60 hover:bg-[#DC2626]/10 transition-colors"
                  >
                    +
                  </button>
                  <div className="ml-auto text-lg font-black text-[#FBBF24]">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center justify-between text-white/70">
            <span>Subtotal</span>
            <span className="text-2xl font-black text-[#FBBF24]">${total().toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            style={{
              background: `linear-gradient(135deg, ${tenant.primaryColor} 0%, ${tenant.secondaryColor} 50%, ${tenant.primaryColor} 100%)`,
              boxShadow: `0 10px 20px rgba(220, 38, 38, 0.4), 0 0 30px rgba(251, 191, 36, 0.2)`,
            }}
            className="mt-3 w-full rounded-2xl px-4 py-3 text-base font-bold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-[0_15px_25px_rgba(220,38,38,0.5),0_0_40px_rgba(251,191,36,0.3)] disabled:opacity-50 disabled:hover:scale-100"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>

    {/* Edit Item Modal */}
    <CartItemEditModal
      open={!!editingItem}
      onClose={() => setEditingItem(null)}
      item={editingItem}
    />
    </>
  );
}

export default CartDrawer;
