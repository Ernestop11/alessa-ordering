"use client";

import { useState, useEffect } from "react";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { CartItem, useCart } from "../../lib/store/cart";
import { useTenantTheme } from "../TenantThemeProvider";

interface CartItemEditModalProps {
  open: boolean;
  onClose: () => void;
  item: CartItem | null;
}

export default function CartItemEditModal({
  open,
  onClose,
  item,
}: CartItemEditModalProps) {
  const tenant = useTenantTheme();
  const { updateQuantity, updateItem, removeFromCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setNote(item.note || "");
    }
  }, [item]);

  if (!open || !item) return null;

  const handleSave = () => {
    if (quantity <= 0) {
      removeFromCart(item.id);
    } else {
      updateItem(item.id, { quantity, note: note.trim() || null });
    }
    onClose();
  };

  const handleRemove = () => {
    removeFromCart(item.id);
    onClose();
  };

  const itemTotal = item.price * quantity;
  const addonsTotal = item.addons?.reduce((sum, a) => sum + a.price, 0) || 0;
  const grandTotal = (item.price + addonsTotal) * quantity;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-[#1a1a1a] text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with image */}
        <div className="relative h-48 bg-gradient-to-b from-[#C41E3A]/20 to-[#1a1a1a]">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
              🍽️
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <h2 className="text-xl font-bold text-white drop-shadow-lg">{item.name}</h2>
            {item.description && (
              <p className="text-sm text-white/70 mt-1 line-clamp-2 drop-shadow">{item.description}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-white/60">Price</span>
            <span className="text-lg font-bold text-[#FBBF24]">${item.price.toFixed(2)}</span>
          </div>

          {/* Addons if any */}
          {item.addons && item.addons.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm text-white/60">Add-ons</span>
              <div className="space-y-1">
                {item.addons.map((addon) => (
                  <div key={addon.id} className="flex justify-between text-sm">
                    <span className="text-white/80">{addon.name}</span>
                    <span className="text-[#FBBF24]">+${addon.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modifiers if any */}
          {item.modifiers && item.modifiers.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm text-white/60">Customizations</span>
              <div className="flex flex-wrap gap-2">
                {item.modifiers.map((mod, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/80"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <span className="text-white/60">Quantity</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-xl font-bold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <label className="text-sm text-white/60">Special Instructions</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any special requests? (e.g., no onions, extra sauce)"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[#C41E3A]/50 focus:outline-none resize-none"
              rows={2}
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-white font-medium">Item Total</span>
            <span className="text-2xl font-black text-[#FBBF24]">${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={handleRemove}
            className="flex-shrink-0 w-14 h-14 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-6 h-6" />
          </button>
          <button
            onClick={handleSave}
            className="flex-1 h-14 rounded-xl font-bold text-black/90 shadow-lg shadow-amber-500/30 hover:shadow-xl transition-all active:scale-[0.98] bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:via-amber-400 hover:to-yellow-400"
          >
            Update Item - ${grandTotal.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
