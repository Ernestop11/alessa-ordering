"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenantTheme } from '../TenantThemeProvider';
import { useCart } from '../../lib/store/cart';

interface MenuSection {
  id: string;
  name: string;
}

interface SavedPaymentMethod {
  id: string;
  brand: string;
  last4: string;
}

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

interface PastOrder {
  id: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  fulfillmentMethod: string;
  items: OrderItem[];
}

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCateringClick: () => void;
  onPanaderiaClick?: () => void;
  onRewardsClick: () => void;
  onAccessibilityClick: () => void;
  onReorderClick?: () => void;
  onSignOut?: () => void;
  onLoginClick?: () => void;
  onCheckoutClick?: () => void;
  onGroupOrderClick?: () => void;
  cateringEnabled: boolean;
  panaderiaEnabled?: boolean;
  customerData: {
    name?: string;
    loyaltyPoints?: number;
    orders?: PastOrder[];
    email?: string;
    phone?: string;
  } | null;
  isAccessibilityOpen: boolean;
  menuSections?: MenuSection[];
  restaurantIsOpen?: boolean;
  closedMessage?: string;
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  onCateringClick,
  onPanaderiaClick,
  onRewardsClick,
  onAccessibilityClick,
  onReorderClick,
  onSignOut,
  onLoginClick,
  onCheckoutClick,
  onGroupOrderClick,
  cateringEnabled,
  panaderiaEnabled = false,
  customerData,
  isAccessibilityOpen,
  menuSections = [],
  restaurantIsOpen = true,
  closedMessage,
}: MobileNavDrawerProps) {
  const tenant = useTenantTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant') || tenant.slug;
  const [mounted, setMounted] = useState(false);
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([]);
  const [oneClickPayingOrderId, setOneClickPayingOrderId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { addToCart, items: cartItems, clearCart } = useCart();

  // Track quantities for reorder items (key: menuItemId, value: quantity)
  const [reorderQuantities, setReorderQuantities] = useState<Record<string, number>>({});
  // Track "added to cart" visual feedback (key: menuItemId)
  const [addedToCartItems, setAddedToCartItems] = useState<Set<string>>(new Set());
  // Track closed notification
  const [closedNotification, setClosedNotification] = useState<string | null>(null);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installStep, setInstallStep] = useState<'intro' | 'confirm' | 'android-instructions' | 'ios-instructions' | 'success'>('intro');

  // Set mounted on client-side for portal hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Fetch saved payment methods when drawer opens
      if (customerData) {
        fetchSavedCards();
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, customerData]);

  // PWA Install prompt handling
  useEffect(() => {
    // Check if already installed (standalone mode or Capacitor)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isCapacitor = !!(window as any).Capacitor;
    if (isStandalone || isCapacitor) {
      setIsInstalled(true);
      return;
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check for Android
    const isAndroidDevice = /Android/.test(navigator.userAgent);
    setIsAndroid(isAndroidDevice);

    // Listen for beforeinstallprompt event (Chrome, Edge, Samsung Browser, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[PWA] Install prompt captured and ready');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle PWA install button click - show modal
  const handleInstallClick = () => {
    setInstallStep('intro');
    setShowInstallModal(true);
  };

  // Handle actual install after user confirms
  const handleConfirmInstall = async () => {
    if (isIOS) {
      setInstallStep('ios-instructions');
      return;
    }

    // If we have the deferred prompt, trigger the native install
    if (deferredPrompt) {
      try {
        console.log('[PWA] Triggering native install prompt...');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] User choice:', outcome);

        if (outcome === 'accepted') {
          setInstallStep('success');
          setIsInstalled(true);
          setTimeout(() => {
            setShowInstallModal(false);
          }, 2000);
        } else {
          // User dismissed - close our modal
          setShowInstallModal(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('[PWA] Install prompt error:', err);
        // Fall back to manual instructions
        setInstallStep('android-instructions');
      }
    } else if (isAndroid) {
      // No deferred prompt on Android - show manual instructions
      setInstallStep('android-instructions');
    } else {
      // Desktop or other - show generic instructions
      setInstallStep('android-instructions');
    }
  };

  // Fetch saved payment methods
  const fetchSavedCards = async () => {
    try {
      const res = await fetch('/api/customers/payment-methods');
      const data = await res.json();
      if (data.paymentMethods) {
        setSavedCards(data.paymentMethods);
      }
    } catch (err) {
      console.error('Failed to fetch saved cards:', err);
    }
  };

  // Get quantity for a reorder item (defaults to original order quantity)
  const getReorderQuantity = (menuItemId: string, originalQty: number) => {
    return reorderQuantities[menuItemId] ?? originalQty;
  };

  // Update quantity for a specific reorder item
  const updateReorderQuantity = (menuItemId: string, newQty: number) => {
    if (newQty < 1) return;
    setReorderQuantities(prev => ({ ...prev, [menuItemId]: newQty }));
  };

  // Show closed notification helper
  const showClosedNotification = () => {
    const message = closedMessage || 'We are currently closed. Please check back during our operating hours.';
    setClosedNotification(message);
    setTimeout(() => setClosedNotification(null), 3000);
  };

  // Add a single item to cart (stays on modal, shows feedback)
  const handleAddSingleItem = (item: OrderItem) => {
    if (!item.menuItem || !item.menuItem.available) return;

    // Block adding to cart if restaurant is closed
    if (!restaurantIsOpen) {
      showClosedNotification();
      return;
    }

    const quantity = getReorderQuantity(item.menuItem.id, item.quantity);

    addToCart({
      id: `${item.menuItem.id}-${Date.now()}-${Math.random()}`,
      name: item.menuItem.name,
      price: item.menuItem.price,
      quantity: quantity,
      image: item.menuItem.image,
      description: item.menuItem.description,
    });

    // Show "Added!" feedback
    setAddedToCartItems(prev => new Set(prev).add(item.menuItem!.id));

    // Clear feedback after 2 seconds
    setTimeout(() => {
      setAddedToCartItems(prev => {
        const next = new Set(prev);
        next.delete(item.menuItem!.id);
        return next;
      });
    }, 2000);
  };

  // Quick reorder function - adds all items from a past order to cart
  const handleQuickReorder = async (order: PastOrder) => {
    // Block adding to cart if restaurant is closed
    if (!restaurantIsOpen) {
      showClosedNotification();
      return;
    }

    setReorderingOrderId(order.id);

    // Add each item from the order to cart
    for (const item of order.items) {
      if (item.menuItem && item.menuItem.available) {
        const quantity = getReorderQuantity(item.menuItem.id, item.quantity);
        addToCart({
          id: `${item.menuItem.id}-${Date.now()}-${Math.random()}`, // Unique ID for cart
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: quantity,
          image: item.menuItem.image,
          description: item.menuItem.description,
        });
      }
    }

    // Brief delay to show loading state
    await new Promise(r => setTimeout(r, 500));
    setReorderingOrderId(null);

    // Show feedback but stay on modal
    // Mark all items as added
    const addedIds = order.items
      .filter(i => i.menuItem?.available)
      .map(i => i.menuItem!.id);
    setAddedToCartItems(new Set(addedIds));

    // Clear feedback after 2 seconds
    setTimeout(() => {
      setAddedToCartItems(new Set());
    }, 2000);
  };

  // One-click pay with saved card
  const handleOneClickPay = async (order: PastOrder, cardId: string) => {
    if (!customerData?.name || !customerData?.email || !customerData?.phone) {
      setPaymentError('Missing customer information');
      return;
    }

    setOneClickPayingOrderId(order.id);
    setPaymentError(null);

    try {
      // Extract menuItemId properly (remove timestamp suffix if present)
      const extractMenuItemId = (id: string) => {
        const uuidPattern = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
        const match = id.match(uuidPattern);
        return match ? match[1] : id;
      };

      // Build items from past order
      const items = order.items
        .filter(item => item.menuItem && item.menuItem.available)
        .map(item => ({
          menuItemId: extractMenuItemId(item.menuItem!.id),
          quantity: item.quantity,
          price: item.menuItem!.price,
        }));

      const orderData = {
        items,
        subtotalAmount: order.totalAmount,
        totalAmount: order.totalAmount,
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        fulfillmentMethod: order.fulfillmentMethod || 'pickup',
      };

      // Create payment intent with saved card
      const response = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: orderData,
          paymentMethodId: cardId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      // Payment succeeded
      if (data.success && data.status === 'succeeded') {
        // Confirm order creation
        await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: data.paymentIntentId }),
        });

        clearCart();
        onClose();
        router.push(`/order/success${tenantSlug ? `?tenant=${tenantSlug}` : ''}`);
        return;
      }

      // If requires 3D Secure, fall back to regular checkout
      if (data.requiresAction || data.clientSecret) {
        // Add items to cart and go to checkout
        for (const item of order.items) {
          if (item.menuItem && item.menuItem.available) {
            addToCart({
              id: `${item.menuItem.id}-${Date.now()}-${Math.random()}`,
              name: item.menuItem.name,
              price: item.menuItem.price,
              quantity: item.quantity,
              image: item.menuItem.image,
              description: item.menuItem.description,
            });
          }
        }
        onClose();
        router.push(`/checkout${tenantSlug ? `?tenant=${tenantSlug}` : ''}`);
        return;
      }

      throw new Error('Unexpected payment response');
    } catch (err) {
      console.error('One-click payment error:', err);
      setPaymentError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setOneClickPayingOrderId(null);
    }
  };

  // Format date for display
  const formatOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Don't render anything until mounted (client-side only for portal)
  if (!mounted) return null;

  // Use portal to render directly to document.body, bypassing all parent stacking contexts
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ position: 'fixed', zIndex: 9998 }}
        onClick={onClose}
      />

      {/* Drawer - Dark theme matching cart/checkout */}
      <div
        className={`bg-[#050A1C] border-r border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '320px',
          maxWidth: '85vw',
          zIndex: 9999,
        }}
      >
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Header with gradient accent */}
          <div
            className="flex items-center justify-between p-4 border-b border-white/10"
            style={{
              background: `linear-gradient(to bottom, rgba(220, 38, 38, 0.15), transparent)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white p-1 shadow-lg ring-2 ring-white/30 flex items-center justify-center overflow-hidden">
                {tenant.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    className="w-10 h-10 rounded-full object-cover aspect-square"
                  />
                ) : (
                  <span className="text-2xl">🍽️</span>
                )}
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">{tenant.name}</h2>
                {customerData && (
                  <p className="text-xs text-[#FBBF24]">{customerData.loyaltyPoints || 0} points</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/15 p-2 text-white/60 hover:border-[#DC2626]/60 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Section */}
          {customerData ? (
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-[#DC2626]/10 to-transparent">
              <p className="text-white font-medium">Welcome back, {customerData.name || 'Member'}!</p>
              <p className="text-sm text-[#FBBF24] mt-1">You have {customerData.loyaltyPoints || 0} reward points</p>
            </div>
          ) : (
            <div className="p-4 border-b border-white/10 space-y-3">
              {onLoginClick && (
                <button
                  onClick={() => {
                    onClose();
                    onLoginClick();
                  }}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/20 text-white font-bold hover:bg-white/10 hover:border-[#DC2626]/40 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Sign In / Create Account
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  onRewardsClick();
                }}
                style={{
                  background: `linear-gradient(135deg, #DC2626 0%, #FBBF24 50%, #DC2626 100%)`,
                  boxShadow: `0 10px 20px rgba(220, 38, 38, 0.4), 0 0 30px rgba(251, 191, 36, 0.2)`,
                }}
                className="w-full py-3 rounded-xl text-white font-bold hover:scale-[1.02] transition-all"
              >
                Join Rewards - It&apos;s Free!
              </button>
              <p className="text-center text-xs text-[#FBBF24]/60">Earn points with every order</p>
            </div>
          )}

          {/* Quick Reorder Section - Cart-style with individual items */}
          {customerData && customerData.orders && customerData.orders.length > 0 && (
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-[0.3em] text-[#FBBF24]/60">⚡ Quick Reorder</p>
                {savedCards.length > 0 && (
                  <span className="text-xs text-white/40 flex items-center gap-1">
                    <span className="w-4 h-2.5 rounded bg-gradient-to-br from-gray-500 to-gray-700 text-[6px] font-bold text-white flex items-center justify-center">
                      {savedCards[0].brand.slice(0, 2).toUpperCase()}
                    </span>
                    ••{savedCards[0].last4}
                  </span>
                )}
              </div>

              {/* Payment Error */}
              {paymentError && (
                <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {paymentError}
                </div>
              )}

              {/* Closed Notification */}
              {closedNotification && (
                <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-2 text-xs text-red-300 flex items-center gap-2">
                  <span>🚫</span>
                  <span>{closedNotification}</span>
                </div>
              )}

              {/* Restaurant Closed Banner */}
              {!restaurantIsOpen && (
                <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 flex items-center gap-2">
                  <span>⏰</span>
                  <span>Ordering is currently unavailable</span>
                </div>
              )}

              {/* Individual items from past orders - Cart style */}
              <div className="space-y-3">
                {/* Get unique items from all orders */}
                {(() => {
                  // Collect unique items from past orders
                  const uniqueItems = new Map<string, OrderItem>();
                  customerData.orders.forEach(order => {
                    order.items.forEach(item => {
                      if (item.menuItem?.available && !uniqueItems.has(item.menuItem.id)) {
                        uniqueItems.set(item.menuItem.id, item);
                      }
                    });
                  });
                  return Array.from(uniqueItems.values()).slice(0, 6);
                })().map((item) => (
                  <article
                    key={item.menuItem!.id}
                    className="group flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm transition-all hover:border-[#DC2626]/30 hover:bg-white/10"
                  >
                    {/* Item Image */}
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white/10 shadow-sm ring-1 ring-white/10">
                      {item.menuItem?.image ? (
                        <img
                          src={item.menuItem.image}
                          alt={item.menuItem.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white/40">
                          {item.menuItem?.name.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex flex-1 flex-col gap-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.menuItem?.name}</p>
                        {item.menuItem?.description && (
                          <p className="mt-0.5 text-xs text-white/50 line-clamp-1">{item.menuItem.description}</p>
                        )}
                      </div>

                      {/* Quantity controls and price */}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateReorderQuantity(item.menuItem!.id, getReorderQuantity(item.menuItem!.id, item.quantity) - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-sm font-bold text-white transition hover:border-[#DC2626]/40 hover:bg-white/10 active:scale-95"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-white">
                            {getReorderQuantity(item.menuItem!.id, item.quantity)}
                          </span>
                          <button
                            onClick={() => updateReorderQuantity(item.menuItem!.id, getReorderQuantity(item.menuItem!.id, item.quantity) + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-sm font-bold text-white transition hover:border-[#DC2626]/40 hover:bg-white/10 active:scale-95"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold text-[#FBBF24]">
                          ${(item.menuItem!.price * getReorderQuantity(item.menuItem!.id, item.quantity)).toFixed(2)}
                        </span>
                      </div>

                      {/* Add to Cart button - Yellow gradient matching page buttons */}
                      <button
                        onClick={() => handleAddSingleItem(item)}
                        disabled={!restaurantIsOpen}
                        className={`mt-2 w-full py-2 rounded-lg text-xs font-bold transition-all ${
                          !restaurantIsOpen
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : addedToCartItems.has(item.menuItem!.id)
                            ? 'bg-green-500 text-white'
                            : 'text-black hover:scale-[1.02]'
                        }`}
                        style={!restaurantIsOpen || addedToCartItems.has(item.menuItem!.id) ? {} : {
                          background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #FBBF24 100%)',
                          boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
                        }}
                      >
                        {!restaurantIsOpen ? 'Closed' : addedToCartItems.has(item.menuItem!.id) ? '✓ Added!' : '+ Add to Cart'}
                      </button>
                    </div>
                  </article>
                ))}

                {/* Reorder All button - Yellow gradient */}
                {customerData.orders[0]?.items.filter(i => i.menuItem?.available).length > 0 && (
                  <button
                    onClick={() => handleQuickReorder(customerData.orders![0])}
                    disabled={!restaurantIsOpen || reorderingOrderId === customerData.orders![0].id}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      !restaurantIsOpen
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'text-black hover:scale-[1.02] disabled:opacity-50'
                    }`}
                    style={!restaurantIsOpen ? {} : {
                      background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #FBBF24 100%)',
                      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
                    }}
                  >
                    {!restaurantIsOpen ? (
                      <>🚫 Ordering Closed</>
                    ) : reorderingOrderId === customerData.orders![0].id ? (
                      <>
                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Adding all...
                      </>
                    ) : (
                      <>🔄 Add All from Last Order</>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => {
                onClose();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white border border-transparent hover:bg-white/5 hover:border-[#DC2626]/30 transition-all"
            >
              <span className="text-xl">🍽️</span>
              <div>
                <span className="font-medium">Our Menu</span>
                <p className="text-xs text-white/50">Browse all items</p>
              </div>
            </button>

            {cateringEnabled && (
              <button
                onClick={() => {
                  onClose();
                  onCateringClick();
                }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white border border-transparent hover:bg-white/5 hover:border-[#DC2626]/30 transition-all"
              >
                <span className="text-xl">🎉</span>
                <div>
                  <span className="font-medium">Catering</span>
                  <p className="text-xs text-white/50">Events & large orders</p>
                </div>
              </button>
            )}

            {panaderiaEnabled && (
              <a
                href="/bakery"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  router.push('/bakery');
                }}
                className="block w-full rounded-2xl overflow-hidden border-2 border-cyan-500/40 hover:border-cyan-400/60 transition-all relative group"
                style={{
                  background: 'linear-gradient(135deg, rgba(30,58,95,0.9) 0%, rgba(15,23,42,0.95) 50%, rgba(30,58,95,0.9) 100%)',
                  boxShadow: '0 8px 32px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                {/* Animated sparkle stars */}
                <div className="absolute top-2 right-2 w-2 h-2 text-yellow-300 animate-pulse">✦</div>
                <div className="absolute top-4 right-6 w-1.5 h-1.5 text-cyan-300 animate-pulse" style={{ animationDelay: '0.3s' }}>✦</div>
                <div className="absolute bottom-3 left-3 w-1.5 h-1.5 text-pink-300 animate-pulse" style={{ animationDelay: '0.6s' }}>✦</div>

                {/* Content */}
                <div className="relative p-4">
                  <div className="flex items-center gap-4">
                    {/* Logo Circle */}
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 via-blue-400 to-cyan-500 p-1 shadow-lg shadow-cyan-500/40">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                          <span className="text-3xl">🥐</span>
                        </div>
                      </div>
                      {/* Badge */}
                      <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-bold rounded-full shadow-lg">
                        FRESH
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-200 via-blue-100 to-cyan-200 bg-clip-text text-transparent">
                          El Hornito
                        </h3>
                        <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-300 rounded border border-amber-500/30">
                          Panaderia
                        </span>
                      </div>
                      <p className="text-xs text-cyan-200/60 mb-2">Pan dulce, pasteles & mas</p>

                      {/* Feature pills */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-pink-500/20 text-pink-300 rounded-full border border-pink-500/30">
                          🎂 Pasteles
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                          📦 Docenas
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
                          🛒 Same Cart
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/40">
                      →
                    </div>
                  </div>
                </div>

                {/* Bottom highlight bar */}
                <div className="h-1 bg-gradient-to-r from-pink-500 via-cyan-400 to-amber-400" />
              </a>
            )}

            {onGroupOrderClick && (
              <button
                onClick={() => {
                  onClose();
                  onGroupOrderClick();
                }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent hover:from-amber-500/20 hover:border-amber-500/50 transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/20 flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
                <div className="relative flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Group Order</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 rounded">Team</span>
                  </div>
                  <p className="text-xs text-white/50">Office & team orders</p>
                </div>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onRewardsClick();
              }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-white border border-transparent hover:bg-white/5 hover:border-[#DC2626]/30 transition-all"
            >
              <span className="text-xl">🎁</span>
              <div>
                <span className="font-medium">Rewards</span>
                <p className="text-xs text-white/50">{customerData ? 'View your rewards' : 'Join & earn points'}</p>
              </div>
              {customerData && (
                <span className="ml-auto px-2 py-0.5 bg-[#FBBF24] text-black text-xs font-bold rounded-full">
                  {customerData.loyaltyPoints || 0} pts
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onClose();
                onAccessibilityClick();
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all ${
                isAccessibilityOpen
                  ? 'bg-[#DC2626]/20 text-[#FBBF24] border border-[#DC2626]/40'
                  : 'text-white border border-transparent hover:bg-white/5 hover:border-[#DC2626]/30'
              }`}
            >
              <span className="text-xl">♿</span>
              <div>
                <span className="font-medium">Accessibility</span>
                <p className="text-xs text-white/50">Adjust display settings</p>
              </div>
              {isAccessibilityOpen && (
                <span className="ml-auto text-xs text-[#FBBF24]">ON</span>
              )}
            </button>
          </nav>

          {/* Menu Section Shortcuts */}
          {menuSections.length > 0 && (
            <div className="px-4 py-3 border-t border-white/10">
              <p className="text-xs uppercase tracking-[0.3em] text-[#FBBF24]/60 mb-3">Jump to Section</p>
              <div className="grid grid-cols-2 gap-2">
                {menuSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      onClose();
                      setTimeout(() => {
                        const el = document.getElementById(`section-${section.id}`);
                        if (el) {
                          const yOffset = -160;
                          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                          window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                      }, 300);
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#DC2626]/40 transition-all text-left truncate"
                  >
                    {section.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          {customerData && onSignOut && (
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[#DC2626] border border-[#DC2626]/30 hover:bg-[#DC2626]/10 transition-all"
              >
                <span className="text-lg">🚪</span>
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          )}

          {/* PWA Install Button - App Store Style - Show on mobile devices */}
          {!isInstalled && (deferredPrompt || isIOS || isAndroid) && (
            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center gap-4 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border border-white/10 hover:border-white/20 transition-all group"
              >
                {/* App Icon */}
                <div className="w-14 h-14 rounded-xl bg-white shadow-lg overflow-hidden flex-shrink-0">
                  {tenant.logoUrl ? (
                    <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-amber-500 text-2xl">🍽️</div>
                  )}
                </div>
                {/* App Info */}
                <div className="flex-1 text-left">
                  <p className="font-bold text-white text-sm">{tenant.name}</p>
                  <p className="text-xs text-gray-400">Order food & earn rewards</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[#FBBF24] text-xs">★★★★★</span>
                    <span className="text-gray-500 text-[10px]">FREE</span>
                  </div>
                </div>
                {/* GET Button */}
                <div className="flex-shrink-0">
                  <span className="px-5 py-2 rounded-full bg-[#007AFF] text-white text-sm font-bold group-hover:bg-[#0066CC] transition-colors">
                    GET
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Bottom padding for safe scrolling */}
          <div className="h-24" />
        </div>

        {/* Fixed Bottom Buttons - Order More & Checkout */}
        {cartItemCount > 0 && onCheckoutClick && (
          <div className="flex-shrink-0 p-4 border-t border-white/10 bg-[#050A1C] space-y-3">
            {/* Order More Button - closes drawer to browse menu */}
            <button
              onClick={() => {
                onClose();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg">🍽️</span>
              <span>Order More</span>
            </button>

            {/* Checkout Button */}
            <button
              onClick={() => {
                onClose();
                setTimeout(() => onCheckoutClick(), 100);
              }}
              style={{
                background: `linear-gradient(135deg, #DC2626 0%, #FBBF24 50%, #DC2626 100%)`,
                boxShadow: `0 10px 20px rgba(220, 38, 38, 0.4), 0 0 30px rgba(251, 191, 36, 0.2)`,
              }}
              className="w-full py-4 rounded-xl text-white font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
            >
              <span className="text-xl">🛒</span>
              <span>Checkout</span>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                {cartItemCount} items · ${cartTotal.toFixed(2)}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* PWA Install Modal - Animated */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowInstallModal(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md mx-4 mb-4 animate-slide-up">
            <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f23] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              {/* Header with App Preview */}
              <div className="relative pt-8 pb-6 px-6 text-center bg-gradient-to-b from-[#DC2626]/20 to-transparent">
                {/* Close Button */}
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
                >
                  ✕
                </button>

                {/* App Icon with Animation */}
                <div className="inline-block mb-4 animate-bounce-gentle">
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-xl overflow-hidden mx-auto ring-4 ring-white/20">
                    {tenant.logoUrl ? (
                      <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-amber-500 text-3xl">🍽️</div>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{tenant.name}</h3>
                {tenant.tagline && <p className="text-sm text-gray-400">{tenant.tagline}</p>}
              </div>

              {/* Content based on step */}
              <div className="px-6 pb-6">
                {installStep === 'intro' && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Benefits */}
                    <div className="space-y-3 py-4">
                      <div className="flex items-center gap-3 text-white/90">
                        <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">⚡</span>
                        <span className="text-sm">Instant access from home screen</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/90">
                        <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">🔔</span>
                        <span className="text-sm">Get order updates & special offers</span>
                      </div>
                      <div className="flex items-center gap-3 text-white/90">
                        <span className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">🏆</span>
                        <span className="text-sm">Faster checkout & rewards tracking</span>
                      </div>
                    </div>

                    {/* Install Button */}
                    <button
                      onClick={handleConfirmInstall}
                      className="w-full py-4 rounded-xl bg-[#007AFF] text-white font-bold text-lg hover:bg-[#0066CC] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Add to Home Screen
                    </button>

                    <p className="text-center text-xs text-gray-500">
                      Free • No App Store required
                    </p>
                  </div>
                )}

                {installStep === 'android-instructions' && (
                  <div className="space-y-4 animate-fade-in py-4">
                    <p className="text-center text-white/80 text-sm mb-4">
                      Follow these steps in Chrome:
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#34A853] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">1</span>
                        <div>
                          <p className="text-white font-medium">Tap the menu button</p>
                          <p className="text-gray-400 text-sm">⋮ in the top right corner</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#34A853] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">2</span>
                        <div>
                          <p className="text-white font-medium">Tap &quot;Add to Home screen&quot;</p>
                          <p className="text-gray-400 text-sm">or &quot;Install app&quot;</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#34A853] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">3</span>
                        <div>
                          <p className="text-white font-medium">Tap &quot;Add&quot; or &quot;Install&quot;</p>
                          <p className="text-gray-400 text-sm">to confirm</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowInstallModal(false)}
                      className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all mt-4"
                    >
                      Got it!
                    </button>
                  </div>
                )}

                {installStep === 'ios-instructions' && (
                  <div className="space-y-4 animate-fade-in py-4">
                    <p className="text-center text-white/80 text-sm mb-4">
                      Follow these steps in Safari:
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">1</span>
                        <div>
                          <p className="text-white font-medium">Tap the Share button</p>
                          <p className="text-gray-400 text-sm">📤 at the bottom of Safari</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">2</span>
                        <div>
                          <p className="text-white font-medium">Scroll down and tap</p>
                          <p className="text-gray-400 text-sm">&quot;Add to Home Screen&quot; ➕</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">3</span>
                        <div>
                          <p className="text-white font-medium">Tap &quot;Add&quot;</p>
                          <p className="text-gray-400 text-sm">in the top right corner</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowInstallModal(false)}
                      className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all mt-4"
                    >
                      Got it!
                    </button>
                  </div>
                )}

                {installStep === 'success' && (
                  <div className="py-8 text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce-gentle">
                      <span className="text-4xl">✓</span>
                    </div>
                    <p className="text-xl font-bold text-white mb-2">App Added!</p>
                    <p className="text-gray-400">Find it on your home screen</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </>,
    document.body
  );
}
