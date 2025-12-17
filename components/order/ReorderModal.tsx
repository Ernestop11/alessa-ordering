"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';

// Types
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

interface CustomerOrder {
  id: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  fulfillmentMethod: string;
  items: OrderItem[];
}

interface CustomerRewardsData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  loyaltyPoints: number;
  membershipTier: string | null;
  orders: CustomerOrder[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  description?: string | null;
  note?: string;
}

interface UpsellBundle {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string | null;
  badge: string | null;
  items: { name: string; quantity: number }[];
}

interface QuickPickItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  orderCount: number;
  available: boolean;
}

interface ReorderModalProps {
  open: boolean;
  onClose: () => void;
  customerData: CustomerRewardsData | null;
  onAddToCart: (item: CartItem) => void;
  onReorderAll: (order: CustomerOrder) => void;
  showNotification: (message: string) => void;
}

export function ReorderModal({
  open,
  onClose,
  customerData,
  onAddToCart,
  onReorderAll,
  showNotification
}: ReorderModalProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Calculate quick picks - most ordered items across all orders
  const quickPicks = useMemo<QuickPickItem[]>(() => {
    if (!customerData?.orders) return [];

    const itemCounts: Record<string, QuickPickItem & { orderCount: number }> = {};

    customerData.orders.forEach(order => {
      order.items.forEach(item => {
        if (item.menuItem && item.menuItem.available) {
          const id = item.menuItem.id;
          if (itemCounts[id]) {
            itemCounts[id].orderCount += item.quantity;
          } else {
            itemCounts[id] = {
              id: item.menuItem.id,
              name: item.menuItem.name,
              price: item.menuItem.price,
              image: item.menuItem.image,
              orderCount: item.quantity,
              available: item.menuItem.available,
            };
          }
        }
      });
    });

    return Object.values(itemCounts)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 8);
  }, [customerData?.orders]);

  // Mock upsell bundles - in production, fetch from API
  const upsellBundles = useMemo<UpsellBundle[]>(() => {
    // These would come from /api/rewards/upsell-bundles or catering packages
    return [
      {
        id: 'bundle-1',
        name: 'Family Fiesta Pack',
        description: '4 tacos, rice & beans, chips & salsa',
        price: 24.99,
        originalPrice: 32.00,
        image: null,
        badge: 'SAVE $7',
        items: [
          { name: 'Street Tacos', quantity: 4 },
          { name: 'Rice & Beans', quantity: 2 },
          { name: 'Chips & Salsa', quantity: 1 },
        ],
      },
      {
        id: 'bundle-2',
        name: 'Date Night Special',
        description: '2 entrees + dessert to share',
        price: 34.99,
        originalPrice: 42.00,
        image: null,
        badge: 'POPULAR',
        items: [
          { name: 'Chef Special Entree', quantity: 2 },
          { name: 'Churros', quantity: 1 },
        ],
      },
    ];
  }, []);

  const handleQuickAdd = (item: QuickPickItem) => {
    onAddToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image || '',
    });
    showNotification(`${item.name} added to cart!`);
  };

  const handleReorderClick = (order: CustomerOrder) => {
    onReorderAll(order);
    onClose();
  };

  const handleAddSingleItem = (item: OrderItem) => {
    if (item.menuItem && item.menuItem.available) {
      onAddToCart({
        id: item.menuItem.id,
        name: item.menuItem.name,
        price: item.menuItem.price,
        quantity: 1,
        image: item.menuItem.image || '',
      });
      showNotification(`${item.menuItem.name} added to cart!`);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center">
      <div className="relative w-full max-w-3xl rounded-t-3xl border border-amber-500/50 bg-gradient-to-b from-black via-gray-900 to-black text-white shadow-2xl sm:rounded-3xl max-h-[90vh] overflow-hidden">
        {/* Header with gradient */}
        <div className="relative overflow-hidden border-b border-amber-500/30 px-6 py-6 bg-gradient-to-r from-amber-900/50 via-yellow-900/30 to-amber-900/50">
          {/* Decorative background circles */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-yellow-500/10 blur-3xl" />

          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-400 text-2xl shadow-lg shadow-amber-500/30">
                  🛒
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Your Favorites</h2>
                  <p className="text-sm text-amber-200/80">One-tap to reorder your go-to meals</p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border-2 border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-8">

          {/* Quick Picks Section */}
          {quickPicks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⭐</span>
                <h3 className="text-xl font-black text-white">Quick Picks</h3>
                <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full ml-2">
                  Most ordered
                </span>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-amber-500/30 scrollbar-track-transparent">
                {quickPicks.map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-36 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-white/10 to-white/5 overflow-hidden group hover:border-amber-400/60 transition-all hover:scale-105"
                  >
                    <div className="relative h-24 bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="144px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-4xl opacity-50">
                          🍽️
                        </div>
                      )}
                      {/* Order count badge */}
                      <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                        x{item.orderCount}
                      </div>
                    </div>
                    <div className="p-3 text-center">
                      <p className="font-semibold text-sm text-white truncate">{item.name}</p>
                      <p className="text-amber-400 font-bold mt-1">${item.price.toFixed(2)}</p>
                      <button
                        onClick={() => handleQuickAdd(item)}
                        className="mt-2 w-full rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 px-3 py-1.5 text-xs font-bold text-black hover:from-amber-500 hover:to-yellow-500 transition shadow-md"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Upsell Bundles Section */}
          {upsellBundles.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🔥</span>
                <h3 className="text-xl font-black text-white">Deals For You</h3>
              </div>

              <div className="space-y-4">
                {upsellBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="rounded-2xl border-2 border-red-500/40 bg-gradient-to-r from-red-900/30 via-orange-900/20 to-red-900/30 p-5 hover:border-red-400/60 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {bundle.badge && (
                          <span className="inline-block bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 shadow-lg">
                            {bundle.badge}
                          </span>
                        )}
                        <h4 className="text-lg font-bold text-white">{bundle.name}</h4>
                        <p className="text-sm text-white/70 mt-1">{bundle.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-2xl font-black text-amber-400">${bundle.price.toFixed(2)}</span>
                          <span className="text-sm text-white/50 line-through">${bundle.originalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          showNotification(`${bundle.name} added to cart!`);
                        }}
                        className="ml-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3 text-sm font-bold text-white hover:from-red-600 hover:to-orange-600 transition shadow-lg shadow-red-500/30 group-hover:scale-105"
                      >
                        Add Bundle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Past Orders Section */}
          {customerData?.orders && customerData.orders.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📦</span>
                <h3 className="text-xl font-black text-white">Past Orders</h3>
                <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full ml-2">
                  {customerData.orders.length} order{customerData.orders.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4">
                {customerData.orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const availableItems = order.items.filter(item => item.menuItem?.available);
                  const displayItems = availableItems.slice(0, 4);
                  const remainingCount = availableItems.length - 4;

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-white/10 to-white/5 overflow-hidden hover:border-amber-400/50 transition-all"
                    >
                      {/* Order header */}
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-bold text-white">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-white/70 mt-0.5">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''} · ${order.totalAmount.toFixed(2)}
                            </p>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            order.status === 'completed' ? 'bg-green-500/30 text-green-300 border border-green-500/50' :
                            order.status === 'confirmed' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' :
                            'bg-gray-500/30 text-gray-300 border border-gray-500/50'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        {/* Item thumbnails */}
                        <div className="flex gap-2 mb-4">
                          {displayItems.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/20 bg-white/5"
                            >
                              {item.menuItem?.image ? (
                                <Image
                                  src={item.menuItem.image}
                                  alt={item.menuItem.name}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-xl opacity-40">
                                  🍽️
                                </div>
                              )}
                              {item.quantity > 1 && (
                                <div className="absolute bottom-0 right-0 bg-black/80 text-white text-xs px-1 rounded-tl">
                                  x{item.quantity}
                                </div>
                              )}
                            </div>
                          ))}
                          {remainingCount > 0 && (
                            <div className="w-14 h-14 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center">
                              <span className="text-sm font-bold text-white/70">+{remainingCount}</span>
                            </div>
                          )}
                        </div>

                        {/* Expand/collapse button */}
                        <button
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="w-full text-center text-xs text-amber-300 hover:text-amber-200 transition py-2"
                        >
                          {isExpanded ? '▲ Hide items' : '▼ View all items'}
                        </button>

                        {/* Expanded item list */}
                        {isExpanded && (
                          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                            {availableItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10">
                                    {item.menuItem?.image ? (
                                      <Image
                                        src={item.menuItem.image}
                                        alt={item.menuItem.name}
                                        width={40}
                                        height={40}
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center h-full text-lg opacity-40">
                                        🍽️
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-white">{item.menuItem?.name}</p>
                                    <p className="text-xs text-white/60">
                                      Qty: {item.quantity} · ${((item.menuItem?.price || 0) * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAddSingleItem(item)}
                                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-white/20 transition border border-amber-500/30"
                                >
                                  + Add
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reorder all button */}
                        <button
                          onClick={() => handleReorderClick(order)}
                          className="w-full mt-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 px-5 py-4 text-base font-black text-black shadow-xl shadow-amber-500/40 transition-all hover:scale-[1.02] hover:shadow-amber-500/60 active:scale-[0.98]"
                        >
                          ⚡ Reorder All · ${order.totalAmount.toFixed(2)}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* No orders state */}
          {(!customerData?.orders || customerData.orders.length === 0) && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-bold text-white mb-2">No Previous Orders</h3>
              <p className="text-white/60 text-sm">
                Place your first order to unlock quick reorder features!
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ReorderModal;
