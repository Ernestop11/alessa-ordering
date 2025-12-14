'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, ArrowLeft, Plus, Minus } from 'lucide-react';
import { useCart } from '@/lib/store/cart';
import { useRouter } from 'next/navigation';

interface GroceryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  unit: string | null;
  image: string | null;
  gallery: any;
  available: boolean;
  stockQuantity: number | null;
  tags: string[];
  displayOrder: number;
}

interface GroceryPageClientProps {
  groceryItems: GroceryItem[];
  tenantSlug: string;
  tenantName: string;
}

export default function GroceryPageClient({
  groceryItems,
  tenantSlug,
  tenantName,
}: GroceryPageClientProps) {
  const router = useRouter();
  const { items: cartItems, addToCart, updateQuantity } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-orange-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading grocery store...</p>
        </div>
      </div>
    );
  }

  // Get unique categories
  const categories = useMemo(() =>
    ['all', ...Array.from(new Set(groceryItems.map(item => item.category)))],
    [groceryItems]
  );

  // Filter items by category
  const filteredItems = useMemo(() =>
    selectedCategory === 'all'
      ? groceryItems
      : groceryItems.filter(item => item.category === selectedCategory),
    [groceryItems, selectedCategory]
  );

  // Get cart quantity for an item
  const getCartQuantity = (itemId: string) => {
    const cartItem = cartItems.find(item => item.id === itemId);
    return cartItem?.quantity || 0;
  };

  // Handle add to cart
  const handleAddToCart = (item: GroceryItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      description: item.description,
    });
  };

  // Handle increment quantity
  const handleIncrement = (itemId: string, currentQuantity: number) => {
    updateQuantity(itemId, currentQuantity + 1);
  };

  // Handle decrement quantity
  const handleDecrement = (itemId: string, currentQuantity: number) => {
    if (currentQuantity > 0) {
      updateQuantity(itemId, currentQuantity - 1);
    }
  };

  // Calculate cart total
  const cartTotal = useMemo(() =>
    cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [cartItems]
  );

  const totalItems = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-orange-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-800 to-orange-800 border-b border-white/20 sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/order"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white transition"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Back to Menu</span>
              </Link>
              <h1 className="text-2xl font-bold text-white">
                {tenantName} - Grocery Store
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {totalItems > 0 && (
                <button
                  onClick={() => router.push('/checkout')}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-full text-white font-semibold transition shadow-lg flex items-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>{totalItems} items • ${cartTotal.toFixed(2)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition ${
                selectedCategory === category
                  ? 'bg-green-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grocery Items Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-3xl">
            <p className="text-white/70 text-lg">No items available in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => {
              const quantity = getCartQuantity(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition group"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingCart className="h-16 w-16 text-white/20" />
                      </div>
                    )}
                    {item.stockQuantity !== null && item.stockQuantity < 10 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Only {item.stockQuantity} left
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-lg mb-1">{item.name}</h3>
                    <p className="text-white/60 text-sm mb-3 line-clamp-2">{item.description}</p>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-green-400">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.unit && (
                        <span className="text-white/50 text-sm">/ {item.unit}</span>
                      )}
                    </div>

                    {/* Add to Cart Controls */}
                    {quantity === 0 ? (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add to Cart
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrement(item.id, quantity)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="flex-1 bg-white/10 text-white font-bold py-2 px-4 rounded-lg text-center">
                          {quantity}
                        </div>
                        <button
                          onClick={() => handleIncrement(item.id, quantity)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Checkout Button (Mobile) */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent z-50 md:hidden">
          <button
            onClick={() => router.push('/checkout')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-full shadow-2xl flex items-center justify-center gap-3"
          >
            <ShoppingCart className="h-6 w-6" />
            <span>Checkout • {totalItems} items • ${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
