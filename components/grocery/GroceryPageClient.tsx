'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

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
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(groceryItems.map(item => item.category)))];

  // Filter items by category
  const filteredItems = selectedCategory === 'all'
    ? groceryItems
    : groceryItems.filter(item => item.category === selectedCategory);

  const handleAddToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((sum, [itemId, qty]) => {
      const item = groceryItems.find(i => i.id === itemId);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              <div className="px-4 py-2 bg-green-600 rounded-full text-white font-semibold">
                {getTotalItems()} items • ${getTotalPrice().toFixed(2)}
              </div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-3xl">
            <p className="text-white/70 text-lg">No items available in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => {
              const quantity = cart[item.id] || 0;
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
                        onClick={() => handleAddToCart(item.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                        >
                          −
                        </button>
                        <span className="px-4 py-2 bg-white/10 text-white font-semibold rounded-lg">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleAddToCart(item.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                        >
                          +
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

      {/* Cart Summary (Sticky Bottom) */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-sm border-t border-white/10 p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-white">
              <p className="text-sm text-white/70">{getTotalItems()} items</p>
              <p className="text-2xl font-bold">${getTotalPrice().toFixed(2)}</p>
            </div>
            <Link
              href="/checkout"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
