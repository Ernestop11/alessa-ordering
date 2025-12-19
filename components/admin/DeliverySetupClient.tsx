'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DeliveryPartnerCard from './DeliveryPartnerCard';
import TestDeliveryModal from './TestDeliveryModal';

interface DeliverySetupClientProps {
  uberStatus: 'not_connected' | 'pending' | 'connected' | 'failed';
  uberMerchantId?: string;
  doordashStatus: 'not_connected' | 'pending' | 'connected' | 'failed';
  doordashBusinessId?: string;
}

export default function DeliverySetupClient({
  uberStatus,
  uberMerchantId,
  doordashStatus,
  doordashBusinessId,
}: DeliverySetupClientProps) {
  const searchParams = useSearchParams();
  const [showUberModal, setShowUberModal] = useState(false);
  const [showDoorDashModal, setShowDoorDashModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

