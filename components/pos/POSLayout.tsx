'use client';

import { useState, useEffect, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string;
  unit: string;
  salePrice: number;
  costPerUnit: number;
  currentStock: number;
  image: string | null;
  menuSection: { id: string; name: string } | null;
}

interface CartItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unit: string;
  stock: number;
}

interface Session {
  id: string;
  employeeName: string;
  openedAt: string;
  openingCash: number;
  status: string;
}

interface POSLayoutProps {
  tenantSlug: string;
}

type AppView = 'login' | 'checkout' | 'payment' | 'receipt' | 'shift-report';

export default function POSLayout({ tenantSlug }: POSLayoutProps) {
  const [view, setView] = useState<AppView>('login');
  const [session, setSession] = useState<Session | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Login state
  const [employeeName, setEmployeeName] = useState('');
  const [openingCash, setOpeningCash] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [changeGiven, setChangeGiven] = useState<number | null>(null);

  // Shift report state
  const [shiftReport, setShiftReport] = useState<any>(null);
  const [closingCash, setClosingCash] = useState('');

  const TAX_RATE = 0.0875; // 8.75% - California default
  const authParam = `tenantSlug=${tenantSlug}`;

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/pos/products?${authParam}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, [authParam]);

  // Check for existing open session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`/api/pos/session?status=open&${authParam}`);
        if (res.ok) {
          const data = await res.json();
          if (data.sessions && data.sessions.length > 0) {
            setSession(data.sessions[0]);
            setView('checkout');
            fetchProducts();
          }
        }
      } catch (err) {
        console.error('Failed to check sessions:', err);
      }
    };
    checkSession();
  }, [authParam, fetchProducts]);

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  const openSession = async () => {
    if (!employeeName) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/session?${authParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName,
          openingCash: parseFloat(openingCash) || 0,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setView('checkout');
        fetchProducts();
      } else {
        const data = await res.json();
        if (data.existingSession) {
          setSession(data.existingSession);
          setView('checkout');
          fetchProducts();
        } else {
          alert(data.error || 'Failed to open session');
        }
      }
    } catch (err) {
      alert('Failed to open session');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          return prev; // Can't exceed stock
        }
        return prev.map((c) =>
          c.itemId === product.id
            ? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.unitPrice }
            : c
        );
      }
      return [...prev, {
        itemId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
        total: product.salePrice,
        unit: product.unit,
        stock: product.currentStock,
      }];
    });
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.itemId !== itemId) return c;
          const newQty = c.quantity + delta;
          if (newQty <= 0) return null as any;
          if (newQty > c.stock) return c;
          return { ...c, quantity: newQty, total: newQty * c.unitPrice };
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
  };

  const processPayment = async () => {
    if (!session || cart.length === 0) return;

    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived);
      if (!received || received < total) {
        alert('Cash received must be at least the total amount');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/pos/transaction?${authParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          items: cart,
          subtotal,
          taxRate: TAX_RATE,
          taxAmount,
          total,
          paymentMethod,
          cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastTransaction(data.transaction);
        setChangeGiven(data.changeGiven);
        setView('receipt');
        fetchProducts(); // Refresh stock
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to process payment');
      }
    } catch (err) {
      alert('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const newSale = () => {
    setCart([]);
    setCashReceived('');
    setPaymentMethod('cash');
    setLastTransaction(null);
    setChangeGiven(null);
    setView('checkout');
  };

  const openShiftReport = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/reports?sessionId=${session.id}&${authParam}`);
      if (res.ok) {
        const data = await res.json();
        setShiftReport(data);
        setView('shift-report');
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeShift = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/session/${session.id}?${authParam}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closingCash: parseFloat(closingCash) || 0,
        }),
      });

      if (res.ok) {
        setSession(null);
        setCart([]);
        setView('login');
        setEmployeeName('');
        setOpeningCash('');
        setShiftReport(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to close shift');
      }
    } catch (err) {
      alert('Failed to close shift');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery)) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // --- LOGIN VIEW ---
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl">
              {'\u{1F4B3}'}
            </div>
            <h1 className="text-2xl font-bold text-white">Store Checkout</h1>
            <p className="text-gray-400 mt-1">Open a shift to start</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Your Name</label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="e.g., Maria"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Opening Cash ($)</label>
              <input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg"
              />
            </div>
            <button
              onClick={openSession}
              disabled={!employeeName || loading}
              className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-lg font-semibold disabled:opacity-50 transition-colors touch-manipulation"
            >
              {loading ? 'Opening...' : 'Open Shift'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RECEIPT VIEW ---
  if (view === 'receipt') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sale Complete!</h2>

          <div className="bg-gray-800 rounded-xl p-4 my-6 text-left space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Total</span>
              <span className="font-bold text-white">${total.toFixed(2)}</span>
            </div>
            {paymentMethod === 'cash' && (
              <>
                <div className="flex justify-between text-gray-400">
                  <span>Cash Received</span>
                  <span>${parseFloat(cashReceived).toFixed(2)}</span>
                </div>
                {changeGiven !== null && changeGiven > 0 && (
                  <div className="flex justify-between text-green-400 text-lg font-bold pt-2 border-t border-gray-700">
                    <span>Change</span>
                    <span>${changeGiven.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            {paymentMethod === 'card' && (
              <div className="flex justify-between text-gray-400">
                <span>Paid by Card</span>
                <span>Approved</span>
              </div>
            )}
          </div>

          <button
            onClick={newSale}
            className="w-full py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-lg font-semibold transition-colors touch-manipulation"
          >
            New Sale
          </button>
        </div>
      </div>
    );
  }

  // --- SHIFT REPORT VIEW ---
  if (view === 'shift-report') {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Shift Report</h2>
            <button
              onClick={() => setView('checkout')}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm"
            >
              Back
            </button>
          </div>

          {shiftReport && (
            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-sm">Cashier: <span className="text-white">{shiftReport.session.employeeName}</span></p>
                <p className="text-gray-400 text-sm">Opened: <span className="text-white">{new Date(shiftReport.session.openedAt).toLocaleString()}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{shiftReport.summary.transactionCount}</p>
                  <p className="text-xs text-gray-400">Transactions</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">${shiftReport.summary.totalSales.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Total Sales</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">${shiftReport.summary.cashSales.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Cash</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">${shiftReport.summary.cardSales.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Card</p>
                </div>
              </div>

              {shiftReport.summary.refundCount > 0 && (
                <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-center">
                  <p className="text-lg font-bold text-red-400">{shiftReport.summary.refundCount} refund(s) - ${shiftReport.summary.refundTotal.toFixed(2)}</p>
                </div>
              )}

              {/* Close Shift */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mt-6">
                <h3 className="font-semibold text-white mb-3">Close Shift</h3>
                <div className="mb-3">
                  <label className="block text-sm text-gray-400 mb-1">Closing Cash Count ($)</label>
                  <input
                    type="number"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    placeholder="Count cash in drawer"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg"
                  />
                </div>
                <button
                  onClick={closeShift}
                  disabled={loading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Closing...' : 'Close Shift & Log Out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- PAYMENT VIEW ---
  if (view === 'payment') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Payment</h2>
            <button
              onClick={() => setView('checkout')}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm"
            >
              Back
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6 space-y-1">
            <div className="flex justify-between text-gray-300 text-sm">
              <span>Subtotal ({cart.length} items)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-sm">
              <span>Tax ({(TAX_RATE * 100).toFixed(2)}%)</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-gray-700">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`py-4 rounded-xl text-lg font-medium border-2 transition-all ${
                paymentMethod === 'cash'
                  ? 'border-green-500 bg-green-900/20 text-green-400'
                  : 'border-gray-700 bg-gray-800 text-gray-400'
              }`}
            >
              Cash
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`py-4 rounded-xl text-lg font-medium border-2 transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-900/20 text-blue-400'
                  : 'border-gray-700 bg-gray-800 text-gray-400'
              }`}
            >
              Card
            </button>
          </div>

          {/* Cash Amount */}
          {paymentMethod === 'cash' && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Cash Received ($)</label>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder={total.toFixed(2)}
                min={total}
                step="0.01"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-2xl text-center"
                autoFocus
              />
              {cashReceived && parseFloat(cashReceived) >= total && (
                <p className="text-center text-green-400 mt-2 text-lg">
                  Change: ${(parseFloat(cashReceived) - total).toFixed(2)}
                </p>
              )}

              {/* Quick cash buttons */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[1, 5, 10, 20].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCashReceived(String(Math.ceil(total / amt) * amt))}
                    className="py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm hover:bg-gray-700"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  onClick={() => setCashReceived(total.toFixed(2))}
                  className="py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm hover:bg-gray-700"
                >
                  Exact
                </button>
                <button
                  onClick={() => setCashReceived(String(50))}
                  className="py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm hover:bg-gray-700"
                >
                  $50
                </button>
                <button
                  onClick={() => setCashReceived(String(100))}
                  className="py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm hover:bg-gray-700"
                >
                  $100
                </button>
              </div>
            </div>
          )}

          {/* Process Button */}
          <button
            onClick={processPayment}
            disabled={loading || (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < total))}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xl font-bold disabled:opacity-50 transition-colors touch-manipulation"
          >
            {loading ? 'Processing...' : paymentMethod === 'cash' ? `Charge $${total.toFixed(2)}` : `Charge Card $${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    );
  }

  // --- CHECKOUT VIEW (Main) ---
  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sky-400 font-bold">POS</span>
          <span className="text-sm text-gray-400">{session?.employeeName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openShiftReport}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            Shift Report
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Product Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + Category Filter */}
          <div className="p-3 space-y-2 shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or scan barcode..."
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-sm"
            />
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  selectedCategory === 'all' ? 'bg-sky-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize ${
                    selectedCategory === cat ? 'bg-sky-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {cat.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.currentStock <= 0}
                  className={`bg-gray-900 border rounded-xl p-3 text-left transition-all touch-manipulation ${
                    product.currentStock <= 0
                      ? 'border-red-900/30 opacity-50'
                      : 'border-gray-800 hover:border-sky-600 active:scale-95'
                  }`}
                >
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-sky-400 font-bold text-lg mt-1">${product.salePrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {product.currentStock <= 0 ? 'Out of stock' : `${product.currentStock} ${product.unit}`}
                  </p>
                </button>
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No products found</p>
                <p className="text-sm mt-1">Set sale prices on inventory items to list them here</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart Sidebar */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-800">
            <h3 className="font-semibold text-sm text-gray-400 uppercase">
              Cart ({cart.length} item{cart.length !== 1 ? 's' : ''})
            </h3>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <p className="text-center text-gray-600 py-8 text-sm">Tap products to add</p>
            ) : (
              cart.map((item) => (
                <div key={item.itemId} className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium flex-1 pr-2">{item.name}</p>
                    <button
                      onClick={() => removeFromCart(item.itemId)}
                      className="text-red-400 hover:text-red-300 text-xs p-1"
                    >
                      X
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.itemId, -1)}
                        className="w-7 h-7 bg-gray-700 rounded-lg flex items-center justify-center text-gray-300 hover:bg-gray-600"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.itemId, 1)}
                        className="w-7 h-7 bg-gray-700 rounded-lg flex items-center justify-center text-gray-300 hover:bg-gray-600"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-bold">${item.total.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Totals */}
          <div className="border-t border-gray-800 p-3 space-y-1 shrink-0">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Tax</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white pt-1 border-t border-gray-700">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Charge Button */}
          <div className="p-3 shrink-0">
            <button
              onClick={() => setView('payment')}
              disabled={cart.length === 0}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg font-bold disabled:opacity-30 transition-colors touch-manipulation"
            >
              Charge ${total.toFixed(2)}
            </button>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="w-full py-2 text-red-400 text-sm mt-2 hover:text-red-300"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
