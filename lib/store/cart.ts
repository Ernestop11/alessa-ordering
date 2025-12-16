import { create } from 'zustand';

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

// Item types for categorization in orders
export type CartItemType = 'food' | 'grocery' | 'bakery';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  description?: string | null;
  modifiers?: string[];
  addons?: CartAddon[];
  note?: string | null;
  isUpsell?: boolean;
  itemType?: CartItemType; // Track if this is food, grocery, or bakery
}

interface CartStore {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  
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
}));
