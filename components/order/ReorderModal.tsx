"use client";

import { useMemo, useState, useEffect } from "react";
import { X, ShoppingBag, Sparkles, Clock, Plus, Check } from "lucide-react";
import { useTenantTheme } from "../TenantThemeProvider";

interface CustomerRewardsData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  loyaltyPoints: number;
  membershipTier: string | null;
  orders: Array<{
    id: string;
    createdAt: string;
    totalAmount: number;
    status: string;
    fulfillmentMethod: string;
    items: Array<{
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
    }>;
  }>;
}

interface UpsellBundle {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string | null;
  badge: string | null;
}

interface UpsellItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  emoji: string;
  category: string;
  description?: string;
}

interface QuickPickItem {
  id: string;
  name: string;
  price: number;
  image: string | null;
  orderCount: number;
  available: boolean;
  description: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  description?: string | null;
}

type CustomerOrder = CustomerRewardsData['orders'][number];

interface ReorderModalProps {
  open: boolean;
  onClose: () => void;
  customerData: CustomerRewardsData | null;
  onAddToCart: (item: CartItem) => void;
  onReorderAll: (order: CustomerOrder) => void;
}

export default function ReorderModal({
  open,
  onClose,
  customerData,
  onAddToCart,
  onReorderAll,
}: ReorderModalProps) {
  const tenant = useTenantTheme();
  const [bundles, setBundles] = useState<UpsellBundle[]>([]);
  const [snacks, setSnacks] = useState<UpsellItem[]>([]);
  const [drinks, setDrinks] = useState<UpsellItem[]>([]);
  const [sweets, setSweets] = useState<UpsellItem[]>([]);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [reorderedOrders, setReorderedOrders] = useState<Set<string>>(new Set());

  // Fetch upsell bundles and items
  useEffect(() => {
    if (open) {
      fetch("/api/rewards/upsell-bundles")
        .then((res) => res.json())
        .then((data) => {
          setBundles(data.bundles || []);
          setSnacks(data.snacks || []);
          setDrinks(data.drinks || []);
          setSweets(data.sweets || []);
        })
        .catch((err) => console.error("Failed to fetch bundles", err));
    }
  }, [open]);

  // Reset added states when modal closes
  useEffect(() => {
    if (!open) {
      setAddedItems(new Set());
      setReorderedOrders(new Set());
    }
  }, [open]);

  // Aggregate quick picks from all orders
  const quickPicks = useMemo<QuickPickItem[]>(() => {
    if (!customerData?.orders) return [];

    const itemCounts = new Map<string, QuickPickItem & { count: number }>();

    customerData.orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!item.menuItem) return;
        const existing = itemCounts.get(item.menuItem.id);
        if (existing) {
          existing.count += item.quantity;
          existing.orderCount += 1;
        } else {
          itemCounts.set(item.menuItem.id, {
            id: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            image: item.menuItem.image,
            available: item.menuItem.available,
            description: item.menuItem.description,
            orderCount: 1,
            count: item.quantity,
          });
        }
      });
    });

    return Array.from(itemCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [customerData?.orders]);

  const handleAddItem = (item: QuickPickItem) => {
    onAddToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      description: item.description,
    });
    setAddedItems((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      setAddedItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 2000);
  };

  const handleAddBundle = (bundle: UpsellBundle) => {
    onAddToCart({
      id: `bundle-${bundle.id}`,
      name: bundle.name,
      price: bundle.price,
      quantity: 1,
      image: bundle.image,
      description: bundle.description,
    });
    setAddedItems((prev) => new Set(prev).add(`bundle-${bundle.id}`));
    setTimeout(() => {
      setAddedItems((prev) => {
        const next = new Set(prev);
        next.delete(`bundle-${bundle.id}`);
        return next;
      });
    }, 2000);
  };

  const handleAddUpsellItem = (item: UpsellItem) => {
    onAddToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      description: item.description || '',
    });
    setAddedItems((prev) => new Set(prev).add(`upsell-${item.id}`));
    setTimeout(() => {
      setAddedItems((prev) => {
        const next = new Set(prev);
        next.delete(`upsell-${item.id}`);
        return next;
      });
    }, 2000);
  };

  const handleReorderOrder = (order: CustomerOrder) => {
    onReorderAll(order);
    setReorderedOrders((prev) => new Set(prev).add(order.id));
    setTimeout(() => {
      onClose();
    }, 500);
  };

  if (!open) return null;

  const primaryColor = tenant?.primaryColor || "#C41E3A";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-md sm:items-center">
      <div className="w-full max-w-4xl rounded-t-3xl bg-gradient-to-br from-[#1a0a0a] via-[#2d0f0f] to-[#1a0a0a] shadow-2xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col border border-[#C41E3A]/30">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-[#C41E3A]/20 bg-gradient-to-r from-[#C41E3A]/30 via-[#8B0000]/20 to-[#C41E3A]/30">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <ShoppingBag className="h-6 w-6 text-[#FFD700]" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#FFD700]">
                Your Favorites
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">
              One-tap to reorder your go-to meals
            </h2>
            {customerData && (
              <p className="mt-1 text-sm text-[#FFD700]/80">
                Welcome back, {customerData.name || "Member"}!
              </p>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gradient-to-b from-transparent via-[#1a0505]/50 to-[#0d0303]">
          {/* Quick Picks Section */}
          {quickPicks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-[#FFD700]" />
                <h3 className="text-lg font-bold text-white">Quick Picks</h3>
                <span className="text-xs text-[#FFD700]/60 ml-2">Your most ordered items</span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                {quickPicks.map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-40 rounded-2xl border border-[#C41E3A]/30 bg-gradient-to-br from-[#2a0a0a] to-[#1a0505] overflow-hidden hover:border-[#FFD700]/50 transition-all hover:scale-105 shadow-lg shadow-black/30"
                  >
                    <div className="relative h-28 bg-[#1a0505]">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🌮
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-[#C41E3A] backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-semibold text-white">
                        x{item.orderCount}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                      <p className="text-xs text-[#FFD700] font-bold">${item.price.toFixed(2)}</p>
                      <button
                        onClick={() => handleAddItem(item)}
                        disabled={!item.available || addedItems.has(item.id)}
                        className={`mt-2 w-full rounded-xl py-2 text-xs font-bold transition-all ${
                          addedItems.has(item.id)
                            ? "bg-green-500 text-white"
                            : item.available
                            ? "bg-gradient-to-r from-[#C41E3A] to-[#8B0000] text-white hover:scale-105 shadow-lg shadow-[#C41E3A]/30"
                            : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {addedItems.has(item.id) ? (
                          <span className="flex items-center justify-center gap-1">
                            <Check className="h-3 w-3" /> Added!
                          </span>
                        ) : item.available ? (
                          <span className="flex items-center justify-center gap-1">
                            <Plus className="h-3 w-3" /> Add
                          </span>
                        ) : (
                          "Unavailable"
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Upsell Bundles Section */}
          {bundles.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🔥</span>
                <h3 className="text-lg font-bold text-white">Deals For You</h3>
              </div>
              <div className="space-y-3">
                {bundles.slice(0, 3).map((bundle) => (
                  <div
                    key={bundle.id}
                    className="flex items-center gap-4 rounded-2xl border border-[#FFD700]/40 bg-gradient-to-r from-[#FFD700]/10 via-[#C41E3A]/10 to-[#FFD700]/10 p-4 hover:border-[#FFD700]/60 transition shadow-lg shadow-[#C41E3A]/10"
                  >
                    <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-[#1a0505]">
                      {bundle.image ? (
                        <img
                          src={bundle.image}
                          alt={bundle.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          🎁
                        </div>
                      )}
                      {bundle.badge && (
                        <div className="absolute top-1 left-1 bg-[#C41E3A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {bundle.badge}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-white truncate">{bundle.name}</h4>
                      <p className="text-xs text-white/60 line-clamp-1">{bundle.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-black text-[#FFD700]">
                          ${bundle.price.toFixed(2)}
                        </span>
                        {bundle.originalPrice > bundle.price && (
                          <span className="text-sm text-white/40 line-through">
                            ${bundle.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddBundle(bundle)}
                      disabled={addedItems.has(`bundle-${bundle.id}`)}
                      className={`flex-shrink-0 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        addedItems.has(`bundle-${bundle.id}`)
                          ? "bg-green-500 text-white"
                          : "bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:scale-105 shadow-lg shadow-[#FFD700]/30"
                      }`}
                    >
                      {addedItems.has(`bundle-${bundle.id}`) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        "Add"
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Add a Snack - Chips & Sides */}
          {snacks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🍟</span>
                <h3 className="text-lg font-bold text-white">Add a Snack</h3>
                <span className="text-xs text-white/50 ml-2">Perfect with your order</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                {snacks.map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-32 rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5 overflow-hidden hover:border-green-500/50 transition-all hover:scale-105"
                  >
                    <div className="relative h-24 bg-gray-800 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{item.emoji}</span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-green-400">${item.price.toFixed(2)}</span>
                        <button
                          onClick={() => handleAddUpsellItem(item)}
                          disabled={addedItems.has(`upsell-${item.id}`)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            addedItems.has(`upsell-${item.id}`)
                              ? "bg-green-500 text-white"
                              : "bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white"
                          }`}
                        >
                          {addedItems.has(`upsell-${item.id}`) ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Thirsty? - Drinks */}
          {drinks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🥤</span>
                <h3 className="text-lg font-bold text-white">Thirsty?</h3>
                <span className="text-xs text-white/50 ml-2">Ice cold drinks</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                {drinks.map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-32 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 overflow-hidden hover:border-blue-500/50 transition-all hover:scale-105"
                  >
                    <div className="relative h-24 bg-gray-800 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{item.emoji}</span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-blue-400">${item.price.toFixed(2)}</span>
                        <button
                          onClick={() => handleAddUpsellItem(item)}
                          disabled={addedItems.has(`upsell-${item.id}`)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            addedItems.has(`upsell-${item.id}`)
                              ? "bg-blue-500 text-white"
                              : "bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white"
                          }`}
                        >
                          {addedItems.has(`upsell-${item.id}`) ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Something Sweet - Desserts */}
          {sweets.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🍰</span>
                <h3 className="text-lg font-bold text-white">Something Sweet</h3>
                <span className="text-xs text-white/50 ml-2">Treat yourself</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                {sweets.map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-32 rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-rose-500/5 overflow-hidden hover:border-pink-500/50 transition-all hover:scale-105"
                  >
                    <div className="relative h-24 bg-gray-800 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{item.emoji}</span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-pink-400">${item.price.toFixed(2)}</span>
                        <button
                          onClick={() => handleAddUpsellItem(item)}
                          disabled={addedItems.has(`upsell-${item.id}`)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            addedItems.has(`upsell-${item.id}`)
                              ? "bg-pink-500 text-white"
                              : "bg-pink-500/20 text-pink-400 hover:bg-pink-500 hover:text-white"
                          }`}
                        >
                          {addedItems.has(`upsell-${item.id}`) ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Combo Deals Banner */}
          <section className="rounded-2xl border-2 border-dashed border-[#FFD700]/50 bg-gradient-to-r from-[#C41E3A]/20 via-[#FFD700]/10 to-[#C41E3A]/20 p-5 shadow-lg shadow-[#C41E3A]/20">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🎉</div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-white">Make it a Combo!</h4>
                <p className="text-xs text-[#FFD700]/80">Add chips + drink to any order and save $2</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-[#FFD700]">$4.99</p>
                <p className="text-xs text-white/40 line-through">$6.99</p>
              </div>
            </div>
          </section>

          {/* Past Orders Section */}
          {customerData?.orders && customerData.orders.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-[#FFD700]" />
                <h3 className="text-lg font-bold text-white">Past Orders</h3>
              </div>
              <div className="space-y-4">
                {customerData.orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-[#C41E3A]/30 bg-gradient-to-br from-[#2a0a0a] to-[#1a0505] p-4 hover:border-[#FFD700]/40 transition shadow-lg shadow-black/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-white/50">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                          {order.fulfillmentMethod === "delivery" ? "Delivery" : "Pickup"}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          order.status === "completed"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : order.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Item Thumbnails */}
                    <div className="flex items-center gap-2 mb-4">
                      {order.items.slice(0, 4).map((item, idx) => (
                        <div
                          key={item.id}
                          className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800 border border-white/10 flex-shrink-0"
                        >
                          {item.menuItem?.image ? (
                            <img
                              src={item.menuItem.image}
                              alt={item.menuItem.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">
                              🌮
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="w-14 h-14 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-sm font-bold text-white/70">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>

                    {/* Item List */}
                    <div className="mb-4 space-y-1">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-white/70">
                            {item.quantity}x {item.menuItem?.name || "Item"}
                          </span>
                          <button
                            onClick={() =>
                              item.menuItem &&
                              handleAddItem({
                                id: item.menuItem.id,
                                name: item.menuItem.name,
                                price: item.menuItem.price,
                                image: item.menuItem.image,
                                available: item.menuItem.available,
                                description: item.menuItem.description,
                                orderCount: 1,
                              })
                            }
                            disabled={!item.menuItem?.available || addedItems.has(item.menuItem?.id || "")}
                            className={`text-xs px-2 py-1 rounded-lg transition ${
                              addedItems.has(item.menuItem?.id || "")
                                ? "bg-green-500/20 text-green-400"
                                : item.menuItem?.available
                                ? "text-[#FFD700] hover:bg-[#FFD700]/20"
                                : "text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            {addedItems.has(item.menuItem?.id || "") ? "Added" : "+ Add"}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Reorder All Button */}
                    <button
                      onClick={() => handleReorderOrder(order)}
                      disabled={reorderedOrders.has(order.id)}
                      className={`w-full rounded-xl py-3 text-sm font-black transition-all ${
                        reorderedOrders.has(order.id)
                          ? "bg-green-500 text-white"
                          : "bg-gradient-to-r from-[#C41E3A] via-[#8B0000] to-[#C41E3A] text-white shadow-lg shadow-[#C41E3A]/50 hover:scale-[1.02] hover:shadow-[#C41E3A]/70"
                      }`}
                    >
                      {reorderedOrders.has(order.id) ? (
                        <span className="flex items-center justify-center gap-2">
                          <Check className="h-4 w-4" /> Added to Cart!
                        </span>
                      ) : (
                        <span>⚡ Reorder All · ${order.totalAmount.toFixed(2)}</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {(!customerData?.orders || customerData.orders.length === 0) && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-bold text-white mb-2">No orders yet</h3>
              <p className="text-[#FFD700]/70 text-sm">
                Place your first order and it will appear here for easy reordering!
              </p>
              <button
                onClick={onClose}
                className="mt-6 rounded-xl bg-gradient-to-r from-[#C41E3A] to-[#8B0000] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#C41E3A]/40"
              >
                Start Ordering
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
