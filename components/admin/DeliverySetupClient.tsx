'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DeliveryPartnerCard from './DeliveryPartnerCard';
import TestDeliveryModal from './TestDeliveryModal';
import { Zap, Check, X } from 'lucide-react';

interface DeliverySetupClientProps {
  uberStatus: 'not_connected' | 'pending' | 'connected' | 'failed';
  uberMerchantId?: string;
  doordashStatus: 'not_connected' | 'pending' | 'connected' | 'failed';
  doordashBusinessId?: string;
  smartDispatchEnabled?: boolean;
  smartDispatchStrategy?: 'cheapest' | 'fastest';
}

export default function DeliverySetupClient({
  uberStatus,
  uberMerchantId,
  doordashStatus,
  doordashBusinessId,
  smartDispatchEnabled = false,
  smartDispatchStrategy = 'cheapest',
}: DeliverySetupClientProps) {
  const searchParams = useSearchParams();
  const [showUberModal, setShowUberModal] = useState(false);
  const [showDoorDashModal, setShowDoorDashModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [smartEnabled, setSmartEnabled] = useState(smartDispatchEnabled);
  const [strategy, setStrategy] = useState<'cheapest' | 'fastest'>(smartDispatchStrategy);
  const [savingSmartDispatch, setSavingSmartDispatch] = useState(false);

  // Show message based on URL params
  useEffect(() => {
    const partner = searchParams?.get('partner');
    const status = searchParams?.get('status');
    const statusMessage = searchParams?.get('message');

    if (partner && status) {
      if (status === 'success') {
        setMessage({
          type: 'success',
          text: `${partner === 'uber' ? 'Uber Direct' : 'DoorDash Drive'} connected successfully!`,
        });
      } else if (status === 'error') {
        setMessage({
          type: 'error',
          text: statusMessage
            ? decodeURIComponent(statusMessage)
            : `Failed to connect ${partner === 'uber' ? 'Uber Direct' : 'DoorDash Drive'}`,
        });
      }
    }
  }, [searchParams]);

  const handleUberConnect = () => {
    window.location.href = '/api/delivery/uber/oauth';
  };

  const handleDoorDashConnect = () => {
    // DoorDash uses a different flow - show a form or redirect to setup
    // For now, redirect to a setup page or show modal
    alert('DoorDash setup: Enter your developer credentials in the admin panel or contact support.');
  };

  const handleUberDisconnect = async () => {
    try {
      const response = await fetch('/api/delivery/uber/disconnect', {
        method: 'POST',
      });
      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to disconnect Uber Direct');
      }
    } catch (error) {
      alert('Error disconnecting Uber Direct');
    }
  };

  const handleDoorDashDisconnect = async () => {
    try {
      const response = await fetch('/api/delivery/doordash/disconnect', {
        method: 'POST',
      });
      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to disconnect DoorDash Drive');
      }
    } catch (error) {
      alert('Error disconnecting DoorDash Drive');
    }
  };

  const handleSmartDispatchToggle = async (enabled: boolean) => {
    setSavingSmartDispatch(true);
    try {
      const response = await fetch('/api/admin/delivery/smart-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          strategy,
        }),
      });
      if (response.ok) {
        setSmartEnabled(enabled);
        setMessage({
          type: 'success',
          text: enabled ? 'Smart Dispatch enabled!' : 'Smart Dispatch disabled',
        });
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.error || 'Failed to update Smart Dispatch settings',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error updating Smart Dispatch settings',
      });
    } finally {
      setSavingSmartDispatch(false);
    }
  };

  const handleStrategyChange = async (newStrategy: 'cheapest' | 'fastest') => {
    setSavingSmartDispatch(true);
    try {
      const response = await fetch('/api/admin/delivery/smart-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: smartEnabled,
          strategy: newStrategy,
        }),
      });
      if (response.ok) {
        setStrategy(newStrategy);
      }
    } catch (error) {
      console.error('Failed to update strategy');
    } finally {
      setSavingSmartDispatch(false);
    }
  };

  const connectedProviders = [
    uberStatus === 'connected' ? 'Uber Direct' : null,
    doordashStatus === 'connected' ? 'DoorDash Drive' : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Partner Setup</h1>
          <p className="text-gray-600">
            Connect with delivery partners to enable third-party delivery fulfillment
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <p>{message.text}</p>
              <button
                onClick={() => setMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <DeliveryPartnerCard
            partner="uber"
            status={uberStatus}
            merchantId={uberMerchantId}
            onConnect={handleUberConnect}
            onDisconnect={handleUberDisconnect}
            onTest={() => setShowUberModal(true)}
          />

          <DeliveryPartnerCard
            partner="doordash"
            status={doordashStatus}
            merchantId={doordashBusinessId}
            onConnect={handleDoorDashConnect}
            onDisconnect={handleDoorDashDisconnect}
            onTest={() => setShowDoorDashModal(true)}
          />
        </div>

        {/* Smart Dispatch Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Smart Dispatch</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Automatically compare quotes and select the best delivery option
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSmartDispatchToggle(!smartEnabled)}
                disabled={savingSmartDispatch || connectedProviders.length < 2}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  smartEnabled ? 'bg-blue-600' : 'bg-gray-200'
                } ${savingSmartDispatch || connectedProviders.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    smartEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {connectedProviders.length < 2 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm">
                  Connect at least 2 delivery partners to enable Smart Dispatch.
                  Currently connected: {connectedProviders.length > 0 ? connectedProviders.join(', ') : 'None'}
                </p>
              </div>
            )}

            {smartEnabled && connectedProviders.length >= 2 && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selection Strategy
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleStrategyChange('cheapest')}
                      disabled={savingSmartDispatch}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        strategy === 'cheapest'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">Cheapest</div>
                          <div className="text-sm text-gray-500">Auto-select lowest price</div>
                        </div>
                        {strategy === 'cheapest' && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => handleStrategyChange('fastest')}
                      disabled={savingSmartDispatch}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        strategy === 'fastest'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">Fastest</div>
                          <div className="text-sm text-gray-500">Auto-select shortest ETA</div>
                        </div>
                        {strategy === 'fastest' && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">How it works</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Fetches quotes from all connected providers in parallel
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Compares prices and ETAs across {connectedProviders.join(' & ')}
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Auto-selects best option based on your strategy
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Automatic fallback if primary provider fails
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <TestDeliveryModal
          partner="uber"
          isOpen={showUberModal}
          onClose={() => setShowUberModal(false)}
        />

        <TestDeliveryModal
          partner="doordash"
          isOpen={showDoorDashModal}
          onClose={() => setShowDoorDashModal(false)}
        />
      </div>
    </div>
  );
}

