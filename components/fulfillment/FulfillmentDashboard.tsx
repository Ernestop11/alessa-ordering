"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import FulfillmentBoard from './FulfillmentBoard';
import NewOrderAlerts, { type AlertSettings } from './NewOrderAlerts';
import { useOrderFeed } from './useOrderFeed';
import type { FulfillmentOrder } from './types';

interface Props {
  initialOrders: FulfillmentOrder[];
  feedUrl: string;
  scope: 'tenant' | 'platform';
}

const ACCEPT_TARGET_STATUS = 'preparing';
const READY_TARGET_STATUS = 'ready';
const COMPLETE_TARGET_STATUS = 'completed';

function formatCurrency(value: number | null | undefined) {
  if (!value || Number.isNaN(value)) return '$0.00';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
}

async function patchOrderStatus(orderId: string, status: string) {
  const response = await fetch(`/api/fulfillment/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as FulfillmentOrder;
}

function useAudioNotification() {
  const audioRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    const unlock = () => {
      if (!audioRef.current) {
        try {
          audioRef.current = new AudioContext();
        } catch {
          return;
        }
      }
      if (audioRef.current.state === 'suspended') {
        void audioRef.current.resume();
      }
      unlockedRef.current = true;
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);

    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const play = () => {
    if (!unlockedRef.current) return;
    if (!audioRef.current) return;
    const ctx = audioRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  };

  return play;
}

export default function FulfillmentDashboard({ initialOrders, feedUrl, scope }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    enabled: true,
    volume: 0.7,
    soundType: 'chime',
    flashingEnabled: true,
  });
  const playNotification = useAudioNotification();
  const { orders, connected, newOrderCount, ackNewOrders, lastCreatedOrder } = useOrderFeed({
    feedUrl,
    initialOrders,
  });
  const lastCountRef = useRef(newOrderCount);
  const lastNotifiedIdRef = useRef<string | null>(null);
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    if (newOrderCount > lastCountRef.current) {
      playNotification();
    }
    lastCountRef.current = newOrderCount;
  }, [newOrderCount, playNotification]);

  useEffect(() => {
    if (!isClient) return;
    const supported = 'Notification' in window;
    setNotificationsSupported(supported);
    if (supported) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('denied');
    }
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    const anyNavigator = navigator as any;
    try {
      if (newOrderCount > 0) {
        anyNavigator?.setAppBadge?.(newOrderCount);
      } else {
        anyNavigator?.clearAppBadge?.();
      }
    } catch {
      // ignore badge errors
    }
  }, [isClient, newOrderCount]);

  useEffect(() => {
    if (!lastCreatedOrder) return;
    if (lastNotifiedIdRef.current === lastCreatedOrder.id) return;

    lastNotifiedIdRef.current = lastCreatedOrder.id;

    const customerName =
      lastCreatedOrder.customerName ??
      lastCreatedOrder.customer?.name ??
      (lastCreatedOrder.fulfillmentMethod === 'delivery' ? 'Delivery Guest' : 'Guest');

    const summary = `${customerName} · ${formatCurrency(lastCreatedOrder.totalAmount)}`;

    setNotificationBanner(`New order from ${summary}`);

    if (notificationsSupported && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted' && document.visibilityState === 'hidden') {
        try {
          new Notification('New order received', {
            body: summary,
            tag: lastCreatedOrder.id,
          });
        } catch {
          // ignore notification errors
        }
      }
    }
  }, [lastCreatedOrder, notificationsSupported]);

  useEffect(() => {
    if (!notificationBanner) return;
    const timer = window.setTimeout(() => setNotificationBanner(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notificationBanner]);

  const newOrders = useMemo(
    () => orders.filter((order) => ['pending', 'confirmed'].includes(order.status.toLowerCase())),
    [orders],
  );

  const unacknowledgedOrders = useMemo(
    () => orders.filter((order) => !order.acknowledgedAt && ['pending', 'confirmed'].includes(order.status.toLowerCase())),
    [orders],
  );

  const notificationsEnabled = notificationsSupported && notificationPermission === 'granted';

  const handleAction = async (order: FulfillmentOrder, status: string) => {
    setBusyOrderId(order.id);
    setError(null);
    try {
      await patchOrderStatus(order.id, status);
    } catch (err) {
      console.error(err);
      setError('Failed to update order. Please try again.');
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleAccept = (order: FulfillmentOrder) => void handleAction(order, ACCEPT_TARGET_STATUS);
  const handleMarkReady = (order: FulfillmentOrder) => void handleAction(order, READY_TARGET_STATUS);
  const handleComplete = (order: FulfillmentOrder) => void handleAction(order, COMPLETE_TARGET_STATUS);

  const handlePrint = (order: FulfillmentOrder) => {
    const printable = window.open('', '_blank', 'width=600,height=800');
    if (!printable) return;

    printable.document.write(`
      <html>
        <head>
          <title>Order ${order.id}</title>
          <style>
            body { font-family: sans-serif; padding: 16px; }
            h1 { font-size: 18px; margin-bottom: 8px; }
            ul { padding-left: 18px; }
            li { margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <h1>Order ${order.id}</h1>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Placed:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Customer:</strong> ${order.customerName ?? order.customer?.name ?? 'Guest'}</p>
          <h2>Items</h2>
          <ul>
            ${order.items
              .map(
                (item) =>
                  `<li>${item.quantity} × ${item.menuItemName ?? 'Menu Item'} — $${Number(item.price).toFixed(2)}</li>`,
              )
              .join('')}
          </ul>
          <p><strong>Total:</strong> $${Number(order.totalAmount ?? 0).toFixed(2)}</p>
          ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
          <script>window.print();window.onafterprint = () => window.close();</script>
        </body>
      </html>
    `);
    printable.document.close();
  };

  const handleEnableNotifications = async () => {
    if (!notificationsSupported || typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationError('Notifications are not supported in this browser.');
      return;
    }
    setNotificationError(null);
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission !== 'granted') {
        setNotificationError('Notifications were not enabled. Please allow notifications in your browser settings.');
      }
    } catch (err) {
      console.error(err);
      setNotificationError('Unable to request notification permission.');
    }
  };

  const handleAcknowledge = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/fulfillment/orders/${orderId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge order');
      }

      // The order will be updated via the WebSocket feed
    } catch (err) {
      console.error('Failed to acknowledge order:', err);
      setError('Failed to acknowledge order. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <NewOrderAlerts
        unacknowledgedOrders={unacknowledgedOrders}
        onAcknowledge={handleAcknowledge}
        settings={alertSettings}
        onSettingsChange={setAlertSettings}
      />

      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Fulfillment Dashboard</h1>
          <p className="text-sm text-gray-500">
            Monitor live orders, trigger printing, and progress tickets through each stage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              connected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            {connected ? 'Live' : 'Offline'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">New orders</span>
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-sm font-semibold text-white">
              {newOrderCount}
            </span>
            <button
              type="button"
              onClick={ackNewOrders}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-900"
            >
              Acknowledge
            </button>
          </div>
          {notificationsSupported && (
            <button
              type="button"
              onClick={handleEnableNotifications}
              disabled={notificationsEnabled}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                notificationsEnabled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}
            </button>
          )}
        </div>
      </header>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notificationError && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">{notificationError}</p>
      )}
      {notificationBanner && (
        <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">{notificationBanner}</p>
      )}

      {busyOrderId && (
        <p className="text-sm text-gray-500">
          Updating order <span className="font-mono">{busyOrderId.slice(-6).toUpperCase()}</span>…
        </p>
      )}

      <FulfillmentBoard
        orders={orders}
        scope={scope}
        onAccept={handleAccept}
        onMarkReady={handleMarkReady}
        onComplete={handleComplete}
        onPrint={handlePrint}
      />

      <footer className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        Showing {orders.length} orders · {newOrders.length} waiting acceptance.
      </footer>
    </div>
  );
}
