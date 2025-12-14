'use client';

import { useState, useMemo } from 'react';
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

interface GroceryBundle {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string | null;
  badge: string | null;
  items: any;
}

interface GroceryPageClientProps {
  groceryItems: GroceryItem[];
  bundles: GroceryBundle[];
  tenantSlug: string;
  tenantName: string;
}

export default function GroceryPageClient({
  groceryItems,
  bundles,
  tenantSlug,
  tenantName,
}: GroceryPageClientProps) {
  const router = useRouter();
  const { items: cartItems, addToCart, updateQuantity } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-700 border-b border-white/20 sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
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
              <div>
                <h1 className="text-2xl font-bold text-white">
                  🛒 {tenantName} - Grocery Store
                </h1>
                <p className="text-white/60 text-sm">Fresh ingredients delivered with your food order</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {totalItems > 0 && (
                <button
                  onClick={() => router.push('/checkout')}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-full text-gray-900 font-bold transition shadow-lg flex items-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>{totalItems} items • ${cartTotal.toFixed(2)}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cross-promotion banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          href="/order"
          className="block bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 text-white hover:shadow-2xl transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">🌮 Don't forget to order food!</h3>
              <p className="text-white/90">Browse our authentic Mexican menu - your groceries ship together with your meal</p>
            </div>
            <ArrowLeft className="h-8 w-8 rotate-180 group-hover:translate-x-2 transition" />
          </div>
        </Link>
      </div>

      {/* Grocery Bundles Section */}
      {bundles.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">🎁 Special Bundles & Combos</h2>
            <p className="text-white/70">Save money with our curated meal kits and combo packages</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {bundles.map(bundle => {
              const quantity = getCartQuantity(bundle.id);
              return (
                <div
                  key={bundle.id}
                  className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-3xl overflow-hidden border-3 border-yellow-400 hover:border-yellow-300 transition group shadow-2xl hover:shadow-yellow-500/50"
                >
                  {/* Image */}
                  <div className="relative h-64 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                    {bundle.image ? (
                      <img
                        src={bundle.image}
                        alt={bundle.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <ShoppingCart className="h-24 w-24 text-yellow-500/40 mx-auto mb-2" />
                          <p className="text-yellow-500/60 font-bold">Bundle Package</p>
                        </div>
                      </div>
                    )}
                    {bundle.badge && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-gray-900 text-sm font-black px-4 py-2 rounded-full shadow-xl animate-pulse">
                        {bundle.badge}
                      </div>
                    )}
                    {/* Price badge */}
                    <div className="absolute bottom-3 left-3 bg-green-600 text-white px-5 py-3 rounded-full shadow-xl">
                      <span className="text-3xl font-black">${bundle.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 bg-gradient-to-b from-white/10 to-transparent">
                    <h3 className="text-white font-black text-2xl mb-3">{bundle.name}</h3>
                    <p className="text-white/80 text-base mb-4 line-clamp-3">{bundle.description}</p>

                    {/* Add to Cart */}
                    {quantity === 0 ? (
                      <button
                        onClick={() => addToCart({
                          id: bundle.id,
                          name: bundle.name,
                          price: bundle.price,
                          quantity: 1,
                          image: bundle.image,
                          description: bundle.description,
                        })}
                        className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-black py-4 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-xl text-lg"
                      >
                        <Plus className="h-6 w-6" />
                        Add Bundle to Cart
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrement(bundle.id, quantity)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-4 rounded-xl transition flex items-center justify-center shadow-lg"
                        >
                          <Minus className="h-6 w-6" />
                        </button>
                        <div className="flex-1 bg-white/20 border-3 border-yellow-400 text-white font-black py-4 px-4 rounded-xl text-center text-2xl">
                          {quantity}
                        </div>
                        <button
                          onClick={() => handleIncrement(bundle.id, quantity)}
                          className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-4 px-4 rounded-xl transition flex items-center justify-center shadow-lg"
                        >
                          <Plus className="h-6 w-6" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Items Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">🥬 Individual Grocery Items</h2>
          <p className="text-white/70">Fresh ingredients and specialty products</p>
        </div>

        {/* Category Filter */}
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
                  className="bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden border-2 border-green-500/30 hover:border-yellow-400 transition group shadow-xl hover:shadow-2xl"
                >
                  {/* Image */}
                  <div className="relative h-56 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingCart className="h-20 w-20 text-green-500/30" />
                      </div>
                    )}
                    {item.stockQuantity !== null && item.stockQuantity < 10 && (
                      <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        Only {item.stockQuantity} left!
                      </div>
                    )}
                    {/* Price badge overlay */}
                    <div className="absolute bottom-3 left-3 bg-yellow-500 text-gray-900 px-4 py-2 rounded-full shadow-xl">
                      <span className="text-2xl font-black">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.unit && (
                        <span className="text-sm font-bold ml-1">/ {item.unit}</span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 bg-gradient-to-b from-white/5 to-transparent">
                    <h3 className="text-white font-bold text-xl mb-2">{item.name}</h3>
                    <p className="text-white/70 text-sm mb-4 line-clamp-2 min-h-[40px]">{item.description}</p>

                    {/* Add to Cart Controls */}
                    {quantity === 0 ? (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Plus className="h-5 w-5" />
                        Add to Cart
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrement(item.id, quantity)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center shadow-lg"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        <div className="flex-1 bg-white/20 border-2 border-yellow-400 text-white font-black py-3 px-4 rounded-xl text-center text-xl">
                          {quantity}
                        </div>
                        <button
                          onClick={() => handleIncrement(item.id, quantity)}
                          className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center shadow-lg"
                        >
                          <Plus className="h-5 w-5" />
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
