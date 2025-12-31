import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

// Item types for categorization in orders
export type CartItemType = 'food' | 'grocery' | 'bakery';

export interface CartItem {
  id: string;
  menuItemId?: string; // Original menu item ID for fetching customizations
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  description?: string | null;
  modifiers?: string[];
  addons?: CartAddon[];
  availableModifiers?: string[]; // Available customization options from menu
  availableAddons?: CartAddon[]; // Available addons from menu
  note?: string | null;
  isUpsell?: boolean;
  itemType?: CartItemType; // Track if this is food, grocery, or bakery
}

interface CartStore {
  items: CartItem[];
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      addToCart: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }

          return {
            items: [...state.items, item],
          };
        });
      },

      removeFromCart: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.id !== itemId),
            };
          }

          return {
            items: state.items.map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            ),
          };
        });
      },

      updateItem: (itemId, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      total: () => {
        const state = get();
        return state.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'alessa-cart-storage',
      storage: createJSONStorage(() => {
        // Only use localStorage on client side
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // Return a no-op storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      // Only persist items, not computed values or hydration state
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Utility hook to check if cart has been hydrated from storage
export const useCartHydrated = () => useCart((state) => state._hasHydrated);
