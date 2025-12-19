'use client';

import { useState } from 'react';

interface DeliveryPartnerCardProps {
  partner: 'uber' | 'doordash';
  status: 'not_connected' | 'pending' | 'connected' | 'failed';
  merchantId?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onTest: () => void;
}

export default function DeliveryPartnerCard({
  partner,
  status,
  merchantId,
  onConnect,
  onDisconnect,
  onTest,
}: DeliveryPartnerCardProps) {
  const [disconnecting, setDisconnecting] = useState(false);

  const partnerInfo = {
    uber: {
      name: 'Uber Direct',
      logo: '🚗',
      description: 'On-demand delivery through Uber\'s network',
    },
    doordash: {
      name: 'DoorDash Drive',
      logo: '🚴',
      description: 'Delivery fulfillment via DoorDash Drive',
    },
  };

  const info = partnerInfo[partner];

  const statusConfig = {
    not_connected: {
      label: 'Not Connected',
      color: 'text-gray-600 bg-gray-100',
      icon: '⚪',
    },
    pending: {
      label: 'Pending',
      color: 'text-yellow-700 bg-yellow-100',
      icon: '🟡',
    },
    connected: {
      label: 'Connected',
      color: 'text-green-700 bg-green-100',
      icon: '🟢',
    },
    failed: {
      label: 'Failed',
      color: 'text-red-700 bg-red-100',
      icon: '🔴',
    },
  };

  const statusStyle = statusConfig[status];

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect ${info.name}?`)) {
      return;
    }
    setDisconnecting(true);
    try {
      await onDisconnect();
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{info.logo}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{info.name}</h3>
            <p className="text-sm text-gray-600">{info.description}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.color} flex items-center gap-1`}
        >
          <span>{statusStyle.icon}</span>
          {statusStyle.label}
        </span>
      </div>

      {status === 'connected' && merchantId && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Merchant ID</p>
          <p className="text-sm font-mono text-gray-900">{merchantId}</p>
        </div>
      )}

      <div className="flex gap-3">
        {status === 'not_connected' || status === 'failed' ? (
          <button
            onClick={onConnect}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Connect with {info.name}
          </button>
        ) : status === 'connected' ? (
          <>
            <button
              onClick={onTest}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Test Delivery
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </>
        ) : (
          <div className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium text-center">
            Setup in progress...
          </div>
        )}
      </div>
    </div>
  );
}

