"use client";

import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Subscription {
  id: string;
  productName: string;
  productSlug: string;
  status: string;
  subscribedAt: string;
  expiresAt: string | null;
  trialEndsAt: string | null;
  daysUntilExpiry: number | null;
}

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/subscription')
      .then((res) => res.json())
      .then((data) => {
        setSubscription(data.subscription);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading subscription:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-yellow-50 rounded-lg p-4 mb-4 border border-yellow-200">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <div>
            <h3 className="font-semibold text-gray-900">No Active Subscription</h3>
            <p className="text-sm text-gray-600">Please contact support to set up your subscription.</p>
          </div>
        </div>
      </div>
    );
  }

  const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt) : null;
  const daysRemaining = subscription.daysUntilExpiry;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prepaid':
        return 'bg-blue-100 text-blue-700';
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'trial':
        return 'bg-purple-100 text-purple-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getExpiryColor = (days: number | null) => {
    if (days === null) return 'bg-gray-100 text-gray-700';
    if (days <= 30) return 'bg-red-100 text-red-700';
    if (days <= 90) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Subscription Status</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(subscription.status)}`}>
          {subscription.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Product</span>
          </div>
          <span className="text-sm text-gray-900">{subscription.productName}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Subscribed Since</span>
          </div>
          <span className="text-sm text-gray-900">
            {new Date(subscription.subscribedAt).toLocaleDateString()}
          </span>
        </div>

        {expiresAt && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Expires</span>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-900">{expiresAt.toLocaleDateString()}</span>
              {daysRemaining !== null && (
                <span className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold ${getExpiryColor(daysRemaining)}`}>
                  {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Expired'}
                </span>
              )}
            </div>
          </div>
        )}

        {subscription.trialEndsAt && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Trial Ends</span>
            </div>
            <span className="text-sm text-gray-900">
              {new Date(subscription.trialEndsAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {daysRemaining !== null && daysRemaining <= 90 && daysRemaining > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Renewal Reminder:</strong> Your subscription will expire in {daysRemaining} days.
            {daysRemaining <= 30 && ' Please renew soon to avoid service interruption.'}
          </p>
        </div>
      )}

      {daysRemaining !== null && daysRemaining <= 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-800">
            <strong>Expired:</strong> Your subscription has expired. Please renew to continue service.
          </p>
        </div>
      )}
    </div>
  );
}

