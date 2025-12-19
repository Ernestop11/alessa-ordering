'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Truck, Clock, AlertCircle, MapPin } from 'lucide-react';

interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface DeliveryQuote {
  partner: 'uber' | 'doordash' | 'self';
  deliveryFee: number;
  etaMinutes: number;
  quoteId: string;
  expiresAt: string;
  mode: 'live' | 'mock';
  message?: string;
}

interface Props {
  pickupAddress: DeliveryAddress;
  dropoffAddress: DeliveryAddress | null;
  onQuoteReceived: (quote: DeliveryQuote | null) => void;
  onDeliveryPartnerChange: (partner: 'uber' | 'doordash' | 'self') => void;
  selectedPartner: 'uber' | 'doordash' | 'self';
  enabled: boolean;
}

export default function DeliveryQuoteWidget({
  pickupAddress,
  dropoffAddress,
  onQuoteReceived,
  onDeliveryPartnerChange,
  selectedPartner,
  enabled,
}: Props) {
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selfDeliveryFee, setSelfDeliveryFee] = useState<number>(5.99);

  const fetchQuote = useCallback(async () => {
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
      const endpoint = selectedPartner === 'uber'
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

  // Fetch quote when address changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (dropoffAddress?.street && dropoffAddress?.zipCode) {
        fetchQuote();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [fetchQuote, dropoffAddress]);

  // Refetch when partner changes
  useEffect(() => {
    if (dropoffAddress?.street && dropoffAddress?.zipCode) {
      fetchQuote();
    }
  }, [selectedPartner]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!enabled) return null;

  return (
    <div className="space-y-4">
      {/* Delivery Partner Selection */}
      <div>
        <label className="mb-2 block text-sm text-white/70">Delivery Method</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onDeliveryPartnerChange('uber')}
            className={`rounded-xl border p-3 text-center transition-all ${
              selectedPartner === 'uber'
                ? 'border-[#000000] bg-black/80 text-white'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className="text-lg font-bold">Uber</div>
            <div className="text-xs text-white/60">Fast delivery</div>
          </button>
          <button
            type="button"
            onClick={() => onDeliveryPartnerChange('doordash')}
            className={`rounded-xl border p-3 text-center transition-all ${
              selectedPartner === 'doordash'
                ? 'border-[#FF3008] bg-[#FF3008]/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className="text-lg font-bold">DoorDash</div>
            <div className="text-xs text-white/60">Wide coverage</div>
          </button>
          <button
            type="button"
            onClick={() => onDeliveryPartnerChange('self')}
            className={`rounded-xl border p-3 text-center transition-all ${
              selectedPartner === 'self'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
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
                <div className="font-semibold">
                  {quote.partner === 'uber' ? 'Uber Direct' : quote.partner === 'doordash' ? 'DoorDash Drive' : 'Restaurant Delivery'}
                </div>
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
    </div>
  );
}
