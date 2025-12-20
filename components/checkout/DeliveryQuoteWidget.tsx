'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Truck, Clock, AlertCircle, MapPin, Zap, Check } from 'lucide-react';

interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface DeliveryQuote {
  partner: 'uber' | 'doordash' | 'self';
  provider?: 'uber' | 'doordash' | 'self';
  providerName?: string;
  deliveryFee: number;
  etaMinutes: number;
  quoteId: string;
  expiresAt: string;
  mode: 'live' | 'mock' | 'sandbox';
  message?: string;
  available?: boolean;
}

interface SmartQuoteResult {
  quotes: DeliveryQuote[];
  cheapest: DeliveryQuote | null;
  fastest: DeliveryQuote | null;
  enabledProviders: string[];
}

type DeliveryPartner = 'uber' | 'doordash' | 'self' | 'smart';

interface Props {
  pickupAddress: DeliveryAddress;
  dropoffAddress: DeliveryAddress | null;
  onQuoteReceived: (quote: DeliveryQuote | null) => void;
  onDeliveryPartnerChange: (partner: 'uber' | 'doordash' | 'self') => void;
  selectedPartner: 'uber' | 'doordash' | 'self';
  enabled: boolean;
  smartDispatchEnabled?: boolean;
  orderValue?: number;
}

export default function DeliveryQuoteWidget({
  pickupAddress,
  dropoffAddress,
  onQuoteReceived,
  onDeliveryPartnerChange,
  selectedPartner,
  enabled,
  smartDispatchEnabled = false,
  orderValue,
}: Props) {
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [smartQuotes, setSmartQuotes] = useState<DeliveryQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selfDeliveryFee] = useState<number>(5.99);
  const [isSmartMode, setIsSmartMode] = useState(smartDispatchEnabled);
  const [selectedSmartQuote, setSelectedSmartQuote] = useState<DeliveryQuote | null>(null);

  const fetchSmartQuotes = useCallback(async () => {
    if (!enabled || !dropoffAddress || !dropoffAddress.street || !dropoffAddress.zipCode) {
      setSmartQuotes([]);
      setSelectedSmartQuote(null);
      onQuoteReceived(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/delivery/smart/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress,
          dropoffAddress,
          orderValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get delivery quotes');
      }

      const data: SmartQuoteResult = await response.json();

      // Normalize the quotes to have consistent structure
      const normalizedQuotes = data.quotes.map((q) => ({
        ...q,
        partner: q.provider || q.partner,
      }));

      setSmartQuotes(normalizedQuotes);

      // Auto-select the cheapest
      if (data.cheapest) {
        const cheapest = {
          ...data.cheapest,
          partner: data.cheapest.provider || data.cheapest.partner,
        };
        setSelectedSmartQuote(cheapest);
        onQuoteReceived(cheapest as DeliveryQuote);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quotes');
      setSmartQuotes([]);
      setSelectedSmartQuote(null);
      onQuoteReceived(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, dropoffAddress, pickupAddress, orderValue, onQuoteReceived]);

  const fetchSingleQuote = useCallback(async () => {
    if (!enabled || !dropoffAddress || !dropoffAddress.street || !dropoffAddress.zipCode) {
      setQuote(null);
      onQuoteReceived(null);
      return;
    }

    // For self-delivery, use the configured fee
    if (selectedPartner === 'self') {
      const selfQuote: DeliveryQuote = {
        partner: 'self',
        deliveryFee: selfDeliveryFee,
        etaMinutes: 30,
        quoteId: `self_${Date.now()}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        mode: 'live',
        message: 'Restaurant delivery',
      };
      setQuote(selfQuote);
      onQuoteReceived(selfQuote);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint =
        selectedPartner === 'uber'
          ? '/api/delivery/uber/quote'
          : '/api/delivery/doordash/quote';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress,
          dropoffAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get delivery quote');
      }

      const data: DeliveryQuote = await response.json();
      setQuote(data);
      onQuoteReceived(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quote');
      setQuote(null);
      onQuoteReceived(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, dropoffAddress, pickupAddress, selectedPartner, selfDeliveryFee, onQuoteReceived]);

  // Fetch quotes when address changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (dropoffAddress?.street && dropoffAddress?.zipCode) {
        if (isSmartMode) {
          fetchSmartQuotes();
        } else {
          fetchSingleQuote();
        }
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [fetchSmartQuotes, fetchSingleQuote, dropoffAddress, isSmartMode]);

  // Refetch when partner changes (only in non-smart mode)
  useEffect(() => {
    if (!isSmartMode && dropoffAddress?.street && dropoffAddress?.zipCode) {
      fetchSingleQuote();
    }
  }, [selectedPartner, isSmartMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle smart quote selection
  const handleSelectSmartQuote = (q: DeliveryQuote) => {
    setSelectedSmartQuote(q);
    onQuoteReceived(q);
    // Also update the partner for the parent component
    onDeliveryPartnerChange(q.partner);
  };

  // Toggle smart mode
  const handleModeToggle = (smart: boolean) => {
    setIsSmartMode(smart);
    if (!smart && selectedPartner) {
      // Switching to manual mode, fetch single quote
      if (dropoffAddress?.street && dropoffAddress?.zipCode) {
        fetchSingleQuote();
      }
    } else if (smart) {
      // Switching to smart mode, fetch all quotes
      if (dropoffAddress?.street && dropoffAddress?.zipCode) {
        fetchSmartQuotes();
      }
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'uber':
        return 'Uber Direct';
      case 'doordash':
        return 'DoorDash Drive';
      case 'self':
        return 'Restaurant Delivery';
      default:
        return provider;
    }
  };

  const getProviderColor = (provider: string, isSelected: boolean) => {
    if (!isSelected) return 'border-white/10 bg-white/5 hover:border-white/20';
    switch (provider) {
      case 'uber':
        return 'border-[#000000] bg-black/80 text-white';
      case 'doordash':
        return 'border-[#FF3008] bg-[#FF3008]/10';
      case 'self':
        return 'border-emerald-500 bg-emerald-500/10';
      default:
        return 'border-blue-500 bg-blue-500/10';
    }
  };

  if (!enabled) return null;

  return (
    <div className="space-y-4">
      {/* Mode Toggle (only show if smart dispatch is enabled) */}
      {smartDispatchEnabled && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleModeToggle(true)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
              isSmartMode
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'border border-white/10 bg-white/5 text-white/70 hover:border-white/20'
            }`}
          >
            <Zap className="h-4 w-4" />
            Smart (Best Price)
          </button>
          <button
            type="button"
            onClick={() => handleModeToggle(false)}
            className={`rounded-lg px-3 py-2 text-sm transition-all ${
              !isSmartMode
                ? 'bg-white/20 text-white'
                : 'border border-white/10 bg-white/5 text-white/70 hover:border-white/20'
            }`}
          >
            Manual
          </button>
        </div>
      )}

      {/* Smart Mode - Show all quotes */}
      {isSmartMode && smartDispatchEnabled ? (
        <>
          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
              <Loader2 className="h-5 w-5 animate-spin text-white/60" />
              <span className="text-sm text-white/60">Comparing delivery options...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {!loading && smartQuotes.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm text-white/70">
                Available Delivery Options{' '}
                <span className="text-emerald-400">(sorted by price)</span>
              </label>
              {smartQuotes.map((q, index) => (
                <button
                  key={q.quoteId}
                  type="button"
                  onClick={() => handleSelectSmartQuote(q)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    selectedSmartQuote?.quoteId === q.quoteId
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          selectedSmartQuote?.quoteId === q.quoteId
                            ? 'bg-emerald-500/20'
                            : 'bg-white/10'
                        }`}
                      >
                        {selectedSmartQuote?.quoteId === q.quoteId ? (
                          <Check className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Truck className="h-5 w-5 text-white/60" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-semibold">
                          {q.providerName || getProviderName(q.partner)}
                          {index === 0 && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                              Cheapest
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Clock className="h-4 w-4" />
                          <span>~{q.etaMinutes} min</span>
                          {q.mode === 'mock' && (
                            <span className="text-amber-400">(estimated)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xl font-bold ${
                          selectedSmartQuote?.quoteId === q.quoteId
                            ? 'text-emerald-400'
                            : 'text-white'
                        }`}
                      >
                        ${q.deliveryFee.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && smartQuotes.length === 0 && dropoffAddress?.street && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
              <MapPin className="h-5 w-5 text-white/40" />
              <span className="text-sm text-white/60">
                No delivery options available for this address
              </span>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Manual Mode - Original partner selection */}
          <div>
            <label className="mb-2 block text-sm text-white/70">Delivery Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onDeliveryPartnerChange('uber')}
                className={`rounded-xl border p-3 text-center transition-all ${getProviderColor(
                  'uber',
                  selectedPartner === 'uber'
                )}`}
              >
                <div className="text-lg font-bold">Uber</div>
                <div className="text-xs text-white/60">Fast delivery</div>
              </button>
              <button
                type="button"
                onClick={() => onDeliveryPartnerChange('doordash')}
                className={`rounded-xl border p-3 text-center transition-all ${getProviderColor(
                  'doordash',
                  selectedPartner === 'doordash'
                )}`}
              >
                <div className="text-lg font-bold">DoorDash</div>
                <div className="text-xs text-white/60">Wide coverage</div>
              </button>
              <button
                type="button"
                onClick={() => onDeliveryPartnerChange('self')}
                className={`rounded-xl border p-3 text-center transition-all ${getProviderColor(
                  'self',
                  selectedPartner === 'self'
                )}`}
              >
                <div className="text-lg font-bold">Restaurant</div>
                <div className="text-xs text-white/60">Our drivers</div>
              </button>
            </div>
          </div>

          {/* Quote Display */}
          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
              <Loader2 className="h-5 w-5 animate-spin text-white/60" />
              <span className="text-sm text-white/60">Getting delivery quote...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {quote && !loading && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-500/20 p-2">
                    <Truck className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold">{getProviderName(quote.partner)}</div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Clock className="h-4 w-4" />
                      <span>~{quote.etaMinutes} min</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-emerald-400">
                    ${quote.deliveryFee.toFixed(2)}
                  </div>
                  {quote.mode === 'mock' && (
                    <div className="text-xs text-amber-400">Estimated</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!quote && !loading && !error && dropoffAddress?.street && (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
              <MapPin className="h-5 w-5 text-white/40" />
              <span className="text-sm text-white/60">
                Enter complete address to see delivery fee
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
