'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, ArrowLeft, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface WeekendSpecial extends GroceryItem {
  weekendPrice?: number | null;
}

interface GroceryPageClientProps {
  groceryItems: GroceryItem[];
  bundles: GroceryBundle[];
  weekendSpecials: WeekendSpecial[];
  tenantSlug: string;
  tenantName: string;
}

export default function GroceryPageClient({
  groceryItems,
  bundles,
  weekendSpecials,
  tenantSlug,
  tenantName,
}: GroceryPageClientProps) {
  const router = useRouter();
  const { items: cartItems, addToCart, updateQuantity } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentSpecialIndex, setCurrentSpecialIndex] = useState(0);

  // Auto-rotate weekend specials carousel
  useEffect(() => {
    if (weekendSpecials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSpecialIndex((prev) => (prev + 1) % weekendSpecials.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [weekendSpecials.length]);

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

      {/* Weekend Specials Carousel */}
      {weekendSpecials.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-3xl overflow-hidden shadow-2xl">
            {/* Carousel Item */}
            <div className="relative h-96 md:h-[500px]">
              {weekendSpecials.map((special, index) => {
                const savings = special.price - (special.weekendPrice || special.price);
                const savingsPercent = Math.round((savings / special.price) * 100);
                const quantity = getCartQuantity(special.id);

                return (
                  <div
                    key={special.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentSpecialIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <div className="grid md:grid-cols-2 gap-8 h-full p-8 md:p-12">
                      {/* Image Side */}
                      <div className="flex items-center justify-center">
                        {special.image ? (
                          <img
                            src={special.image}
                            alt={special.name}
                            className="w-full h-full max-h-80 md:max-h-96 object-contain drop-shadow-2xl"
                          />
                        ) : (
                          <div className="w-full h-80 flex items-center justify-center bg-white/20 rounded-2xl">
                            <ShoppingCart className="h-32 w-32 text-white/40" />
                          </div>
                        )}
                      </div>

                      {/* Content Side */}
                      <div className="flex flex-col justify-center text-white">
                        <div className="inline-block">
                          <span className="bg-white text-red-600 text-sm md:text-base font-black px-4 py-2 rounded-full mb-4 inline-block animate-pulse">
                            🌟 WEEKEND SPECIAL
                          </span>
                        </div>

                        <h2 className="text-4xl md:text-6xl font-black mb-4 drop-shadow-lg">
                          {special.name}
                        </h2>

                        <p className="text-xl md:text-2xl mb-6 text-white/90 font-medium">
                          {special.description}
                        </p>

                        {/* Pricing */}
                        <div className="flex items-center gap-6 mb-8">
                          <div>
                            <p className="text-lg text-white/70 line-through">
                              ${special.price.toFixed(2)}
                              {special.unit && ` / ${special.unit}`}
                            </p>
                            <p className="text-5xl md:text-7xl font-black text-white drop-shadow-lg">
                              ${(special.weekendPrice || special.price).toFixed(2)}
                              {special.unit && <span className="text-3xl md:text-4xl ml-2">/ {special.unit}</span>}
                            </p>
                          </div>
                          {savingsPercent > 0 && (
                            <div className="bg-white text-red-600 px-6 py-3 rounded-2xl">
                              <p className="text-3xl md:text-4xl font-black">
                                -{savingsPercent}%
                              </p>
                              <p className="text-sm font-bold">SAVE</p>
                            </div>
                          )}
                        </div>

                        {/* Add to Cart */}
                        {quantity === 0 ? (
                          <button
                            onClick={() => addToCart({
                              id: special.id,
                              name: special.name,
                              price: special.weekendPrice || special.price,
                              quantity: 1,
                              image: special.image,
                              description: special.description,
                            })}
                            className="bg-white text-gray-900 px-8 py-5 rounded-2xl text-xl md:text-2xl font-black hover:bg-gray-100 transition shadow-2xl flex items-center justify-center gap-3 max-w-md"
                          >
                            <Plus className="h-7 w-7" />
                            ADD TO CART
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 max-w-md">
                            <button
                              onClick={() => handleDecrement(special.id, quantity)}
                              className="flex-1 bg-white text-red-600 font-black py-4 px-6 rounded-xl transition shadow-lg hover:bg-gray-100"
                            >
                              <Minus className="h-6 w-6 mx-auto" />
                            </button>
                            <div className="flex-1 bg-white/20 border-4 border-white text-white font-black py-4 px-6 rounded-xl text-center text-3xl backdrop-blur">
                              {quantity}
                            </div>
                            <button
                              onClick={() => handleIncrement(special.id, quantity)}
                              className="flex-1 bg-white text-green-600 font-black py-4 px-6 rounded-xl transition shadow-lg hover:bg-gray-100"
                            >
                              <Plus className="h-6 w-6 mx-auto" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Arrows */}
            {weekendSpecials.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentSpecialIndex((prev) => (prev - 1 + weekendSpecials.length) % weekendSpecials.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur text-white p-3 rounded-full transition"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={() => setCurrentSpecialIndex((prev) => (prev + 1) % weekendSpecials.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur text-white p-3 rounded-full transition"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {weekendSpecials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSpecialIndex(index)}
                      className={`w-3 h-3 rounded-full transition ${
                        index === currentSpecialIndex
                          ? 'bg-white scale-125'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
