'use client';

import { useState } from 'react';

interface TestDeliveryModalProps {
  partner: 'uber' | 'doordash';
  isOpen: boolean;
  onClose: () => void;
}

interface DeliveryQuote {
  price: number;
  eta: number; // minutes
  available: boolean;
  surgePricing?: boolean;
  surgeMultiplier?: number;
}

export default function TestDeliveryModal({ partner, isOpen, onClose }: TestDeliveryModalProps) {
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [packageSize, setPackageSize] = useState('small'); // small, medium, large
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGetQuote = async () => {
    if (!pickupAddress || !dropoffAddress) {
      setError('Please enter both pickup and dropoff addresses');
      return;
    }

    setQuoteLoading(true);
    setError(null);
    setQuote(null);

    try {
      const endpoint = partner === 'uber' ? '/api/delivery/uber/test/quote' : `/api/delivery/${partner}/quote`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: { address: pickupAddress },
          dropoff: { address: dropoffAddress },
          packageSize,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get quote');
      }

      const data = await response.json();
      setQuote(data);
    } catch (err: any) {
      setError(err.message || 'Failed to get quote');
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleCreateDelivery = async () => {
    if (!pickupAddress || !dropoffAddress) {
      setError('Please enter both pickup and dropoff addresses');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch(`/api/delivery/${partner}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: { address: pickupAddress },
          dropoff: { address: dropoffAddress },
          packageSize,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create delivery');
      }

      const data = await response.json();
      setDeliveryId(data.deliveryId);
      setDeliveryStatus(data.status || 'pending');

      // Start polling for status updates
      if (data.deliveryId) {
        pollDeliveryStatus(data.deliveryId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create delivery');
    } finally {
      setCreating(false);
    }
  };

  const pollDeliveryStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/delivery/${partner}/test?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          setDeliveryStatus(data.status);
          if (data.status === 'delivered' || data.status === 'cancelled') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Failed to poll delivery status:', err);
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup after 10 minutes
    setTimeout(() => clearInterval(interval), 600000);
  };

  const partnerName = partner === 'uber' ? 'Uber Direct' : 'DoorDash Drive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Test {partnerName} Delivery</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {deliveryId && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Delivery Created</p>
              <p className="text-xs text-blue-700 mb-2">ID: {deliveryId}</p>
              <p className="text-sm text-blue-800">
                Status: <span className="font-semibold capitalize">{deliveryStatus}</span>
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Address
              </label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="123 Main St, City, State ZIP"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dropoff Address
              </label>
              <input
                type="text"
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                placeholder="456 Oak Ave, City, State ZIP"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Size
              </label>
              <select
                value={packageSize}
                onChange={(e) => setPackageSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            {quote && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-sm font-semibold text-green-900 mb-2">Delivery Quote</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Price:</span>
                    <span className="font-semibold text-green-900">
                      ${quote.price.toFixed(2)}
                      {quote.surgePricing && quote.surgeMultiplier && (
                        <span className="ml-2 text-xs text-orange-600">
                          (Surge: {quote.surgeMultiplier}x)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Estimated Time:</span>
                    <span className="font-semibold text-green-900">{quote.eta} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Availability:</span>
                    <span className="font-semibold text-green-900">
                      {quote.available ? '✅ Available' : '❌ Not Available'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleGetQuote}
                disabled={quoteLoading || !pickupAddress || !dropoffAddress}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {quoteLoading ? 'Getting Quote...' : 'Get Quote'}
              </button>
              <button
                onClick={handleCreateDelivery}
                disabled={creating || !pickupAddress || !dropoffAddress}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Test Delivery'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

