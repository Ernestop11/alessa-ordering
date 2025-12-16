"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import FulfillmentBoard from './FulfillmentBoard';
import NewOrderAlerts, { type AlertSettings } from './NewOrderAlerts';
import { useOrderFeed } from './useOrderFeed';
import type { FulfillmentOrder } from './types';
import CateringInquiriesTab from './CateringInquiriesTab';
import PrinterSettings from './PrinterSettings';
import RefundModal from './RefundModal';
import { useAutoPrint } from './useAutoPrint';
import { printOrderClientSide, isBluetoothPrintingAvailable, type PrinterConfig } from '@/lib/client-printer';
import { useIsNativeApp } from '@/components/KioskMode';

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
    // Initialize audio context immediately
    const initAudio = () => {
      try {
        if (!audioRef.current) {
          audioRef.current = new AudioContext();
        }
        if (audioRef.current.state === 'suspended') {
          audioRef.current.resume().catch(console.error);
        }
        unlockedRef.current = true;
      } catch (err) {
        console.error('[Audio] Failed to initialize:', err);
      }
    };

    // Try to initialize immediately
    initAudio();

    // Also unlock on user interaction (required for autoplay)
    const unlock = () => {
      initAudio();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });

    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  const play = () => {
    console.log('[Audio] Attempting to play notification...', { 
      unlocked: unlockedRef.current, 
      hasContext: !!audioRef.current,
      state: audioRef.current?.state 
    });

    if (!audioRef.current) {
      console.warn('[Audio] No audio context, creating one...');
      try {
        audioRef.current = new AudioContext();
      } catch (err) {
        console.error('[Audio] Failed to create context:', err);
        return;
      }
    }

    // Ensure context is running
    if (audioRef.current.state === 'suspended') {
      audioRef.current.resume().then(() => {
        console.log('[Audio] Context resumed, playing sound...');
        playSound();
      }).catch((err) => {
        console.error('[Audio] Failed to resume context:', err);
      });
    } else {
      playSound();
    }

    function playSound() {
      const ctx = audioRef.current!;
      const now = ctx.currentTime;
      
      console.log('[Audio] Playing EXTREME kitchen alarm...');
      
      // EXTREMELY LOUD SIREN-LIKE ALARM - alternating high-low frequencies
      // Pattern: HIGH-LOW-HIGH (siren effect for maximum attention)
      const frequencies = [1400, 800, 1400]; // Very high to low to high
      const duration = 0.3; // Longer beeps for more impact
      
      frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Square wave for harsh, piercing alarm sound
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(freq, now + i * 0.3);
        
        // MAXIMUM VOLUME - full power
        gainNode.gain.setValueAtTime(0.0001, now + i * 0.3);
        gainNode.gain.exponentialRampToValueAtTime(1.0, now + i * 0.3 + 0.01); // Full volume
        gainNode.gain.setValueAtTime(1.0, now + i * 0.3 + duration - 0.05); // Hold at max
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.3 + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start(now + i * 0.3);
        oscillator.stop(now + i * 0.3 + duration);
      });
    }
  };

  return play;
}

export default function FulfillmentDashboard({ initialOrders, feedUrl, scope }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'inquiries' | 'settings'>('orders');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [printerConfig, setPrinterConfig] = useState<any>(null);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [tabletMode, setTabletMode] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [kioskMode, setKioskMode] = useState(false);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [kitchenMode, setKitchenMode] = useState(false); // Large UI for kitchen display
  const [refundOrder, setRefundOrder] = useState<FulfillmentOrder | null>(null); // Order being refunded
  const isNativeApp = useIsNativeApp(); // Detect if running in native Capacitor app
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    enabled: true,
    volume: 1.0, // Maximum volume for kitchen
    soundType: 'chime', // Now uses loud triple beep
    flashingEnabled: true,
    modalAlertEnabled: true, // Enable full-screen modal by default
    modalFlashStyle: 'strobe', // Strobe flash style for maximum attention
    modalAutoDismiss: false, // Don't auto-dismiss - require acknowledgment
  });
  const playNotification = useAudioNotification();

  // Detect tablet mode
  useEffect(() => {
    const checkTabletMode = () => {
      const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1024px)').matches;
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      setTabletMode(isTablet || (window.innerWidth >= 768 && isLandscape));
    };
    
    checkTabletMode();
    window.addEventListener('resize', checkTabletMode);
    window.addEventListener('orientationchange', checkTabletMode);
    
    return () => {
      window.removeEventListener('resize', checkTabletMode);
      window.removeEventListener('orientationchange', checkTabletMode);
    };
  }, []);
  const { orders, connected, newOrderCount, ackNewOrders, lastCreatedOrder, optimisticUpdateOrder } = useOrderFeed({
    feedUrl,
    initialOrders,
  });
  const lastCountRef = useRef(newOrderCount);
  const lastNotifiedIdRef = useRef<string | null>(null);
  const isClient = typeof window !== 'undefined';

  // Get tenant info from first order (all orders have same tenant)
  const tenantInfo = useMemo(() => {
    const firstOrder = orders[0] || initialOrders[0];
    if (!firstOrder?.tenant) {
      // Fallback: fetch tenant info if not in order
      return null;
    }
    return {
      id: firstOrder.tenant.id,
      name: firstOrder.tenant.name,
      addressLine1: null,
      addressLine2: null,
      city: null,
      state: null,
      postalCode: null,
      contactPhone: null,
    };
  }, [orders, initialOrders]);

  // Load tenant details (address, phone) from API
  const [tenantDetails, setTenantDetails] = useState<any>(null);
  useEffect(() => {
    if (!tenantInfo) return;
    async function loadTenantDetails() {
      try {
        const res = await fetch('/api/admin/tenant-settings');
        if (res.ok) {
          const data = await res.json();
          setTenantDetails({
            ...tenantInfo,
            addressLine1: data.tenant?.addressLine1 || null,
            addressLine2: data.tenant?.addressLine2 || null,
            city: data.tenant?.city || null,
            state: data.tenant?.state || null,
            postalCode: data.tenant?.postalCode || null,
            contactPhone: data.tenant?.contactPhone || null,
          });
        }
      } catch (err) {
        console.error('Failed to load tenant details:', err);
        setTenantDetails(tenantInfo);
      }
    }
    loadTenantDetails();
  }, [tenantInfo]);

  // Auto-print hook for client-side Bluetooth printing
  useAutoPrint({
    enabled: autoPrintEnabled && printerConfig?.type === 'bluetooth',
    printerConfig: printerConfig as PrinterConfig | null,
    newOrder: lastCreatedOrder,
    tenant: tenantDetails || tenantInfo || {
      id: '',
      name: 'Restaurant',
    },
  });

  // Note: Alarm is now handled by NewOrderAlerts component automatically
  // This hook is kept for backwards compatibility but won't play duplicate sounds
  useEffect(() => {
    lastCountRef.current = newOrderCount;
  }, [newOrderCount]);

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

  // Handle PWA install prompt
  useEffect(() => {
    if (!isClient) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
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

  // Load printer config on mount
  useEffect(() => {
    async function loadPrinterConfig() {
      try {
        const [configRes, settingsRes] = await Promise.all([
          fetch('/api/admin/fulfillment/printer'),
          fetch('/api/admin/tenant-settings'),
        ]);

        if (configRes.ok) {
          const configData = await configRes.json();
          setPrinterConfig(configData.config);
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setAutoPrintEnabled(settingsData.integrations?.autoPrintOrders || false);
        }
      } catch (err) {
        console.error('Failed to load printer config:', err);
      }
    }

    loadPrinterConfig();
  }, []);

  // Auto-print when new orders arrive (for non-Bluetooth printers)
  // Bluetooth printers are handled by useAutoPrint hook above
  useEffect(() => {
    if (!lastCreatedOrder) return;
    if (lastNotifiedIdRef.current === lastCreatedOrder.id) return;
    if (!autoPrintEnabled || !printerConfig || printerConfig.type === 'none') return;

    // Skip if Bluetooth printer (handled by useAutoPrint hook)
    if (printerConfig.type === 'bluetooth' && isBluetoothPrintingAvailable()) {
      return;
    }

    lastNotifiedIdRef.current = lastCreatedOrder.id;

    // Trigger auto-print in background (don't wait for it)
    handlePrint(lastCreatedOrder).catch((err) => {
      console.error('[Auto-Print] Failed to print order:', err);
    });
  }, [lastCreatedOrder, autoPrintEnabled, printerConfig]);

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
  const handleAcceptById = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // OPTIMISTIC UPDATE: Immediately move order to "preparing" in the UI
      // This provides instant visual feedback before the API call completes
      optimisticUpdateOrder(orderId, { status: ACCEPT_TARGET_STATUS });
      console.log(`[Accept] Optimistically moved order ${orderId.slice(-6)} to ${ACCEPT_TARGET_STATUS}`);
      void handleAction(order, ACCEPT_TARGET_STATUS);
    }
  };
  const handleMarkReady = (order: FulfillmentOrder) => void handleAction(order, READY_TARGET_STATUS);
  const handleComplete = (order: FulfillmentOrder) => void handleAction(order, COMPLETE_TARGET_STATUS);

  const handleCancel = async (order: FulfillmentOrder) => {
    if (!confirm(`Cancel order ${order.id.slice(-6).toUpperCase()}?`)) return;
    setBusyOrderId(order.id);
    try {
      await patchOrderStatus(order.id, 'cancelled');
    } catch (err) {
      console.error('Failed to cancel order', err);
      setError('Failed to cancel order');
    } finally {
      setBusyOrderId(null);
    }
  };

  // Open refund modal instead of simple confirm
  const handleRefund = (order: FulfillmentOrder) => {
    setRefundOrder(order);
  };

  // Called when refund is successfully processed
  const handleRefundComplete = () => {
    if (refundOrder) {
      // Refresh the order status - it may have been cancelled for full refunds
      optimisticUpdateOrder(refundOrder.id, { status: 'cancelled' });
    }
    setRefundOrder(null);
  };

  const sendToBluetoothPrinterClient = async (deviceId: string, receiptData: string): Promise<void> => {
    if (!('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth not supported');
    }

    const navigatorBluetooth = (navigator as any).bluetooth;

    try {
      const device = await navigatorBluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '00001101-0000-1000-8000-00805f9b34fb', // SPP
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Brother
        ],
      });

      if (!device?.gatt) throw new Error('Failed to connect');

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002a3d-0000-1000-8000-00805f9b34fb');

      const encoder = new TextEncoder();
      const data = encoder.encode(receiptData);

      // Write in chunks
      const chunkSize = 20;
      for (let i = 0; i < data.length; i += chunkSize) {
        await characteristic.writeValue(data.slice(i, i + chunkSize));
      }

      await device.gatt.disconnect();
    } catch (error: any) {
      throw new Error(error.message || 'Bluetooth print failed');
    }
  };

  const handlePrint = async (order: FulfillmentOrder) => {
    try {
      // If Bluetooth printer configured and available, use client-side printing
      if (
        printerConfig?.type === 'bluetooth' &&
        printerConfig?.deviceId &&
        isBluetoothPrintingAvailable() &&
        tenantDetails
      ) {
        console.log('[Print] Using client-side Bluetooth printing');
        const result = await printOrderClientSide(order, tenantDetails, printerConfig as PrinterConfig);
        if (result.success) {
          console.log('[Print] Order printed successfully via Bluetooth');
          return;
        } else {
          console.warn('[Print] Client-side print failed, falling back to server:', result.error);
        }
      }

      // Try server-side auto-dispatch
      const response = await fetch('/api/fulfillment/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('[Print] Order sent to printer:', result.jobId);
          return;
        }
      }

      // Fallback to browser print
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
    } catch (err) {
      console.error('[Print] Failed to print order:', err);
    }
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

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Kiosk mode: fullscreen + screen wake lock
  const toggleKioskMode = async () => {
    if (!isClient) return;

    if (!kioskMode) {
      // Enter kiosk mode
      try {
        // Request fullscreen
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        }

        // Request screen wake lock to prevent sleep
        if ('wakeLock' in navigator) {
          try {
            const lock = await (navigator as any).wakeLock.request('screen');
            setWakeLock(lock);
            console.log('[Kiosk] Wake lock acquired');
          } catch (err) {
            console.warn('[Kiosk] Wake lock not available:', err);
          }
        }

        setKioskMode(true);
      } catch (err) {
        console.error('[Kiosk] Failed to enter kiosk mode:', err);
      }
    } else {
      // Exit kiosk mode
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement) {
          await (document as any).webkitExitFullscreen();
        }

        // Release wake lock
        if (wakeLock) {
          await wakeLock.release();
          setWakeLock(null);
          console.log('[Kiosk] Wake lock released');
        }

        setKioskMode(false);
      } catch (err) {
        console.error('[Kiosk] Failed to exit kiosk mode:', err);
      }
    }
  };

  // Listen for fullscreen changes (user might exit via Escape key)
  useEffect(() => {
    if (!isClient) return;

    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isFullscreen && kioskMode) {
        // User exited fullscreen, also release wake lock
        if (wakeLock) {
          wakeLock.release().catch(console.error);
          setWakeLock(null);
        }
        setKioskMode(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isClient, kioskMode, wakeLock]);

  // Re-acquire wake lock if released (e.g., when tab becomes visible again)
  useEffect(() => {
    if (!isClient || !kioskMode) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && kioskMode && !wakeLock) {
        if ('wakeLock' in navigator) {
          try {
            const lock = await (navigator as any).wakeLock.request('screen');
            setWakeLock(lock);
            console.log('[Kiosk] Wake lock re-acquired');
          } catch (err) {
            console.warn('[Kiosk] Failed to re-acquire wake lock:', err);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isClient, kioskMode, wakeLock]);

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
      {/* Refund Modal */}
      {refundOrder && (
        <RefundModal
          order={refundOrder}
          onClose={() => setRefundOrder(null)}
          onRefundComplete={handleRefundComplete}
        />
      )}

      <NewOrderAlerts
        unacknowledgedOrders={unacknowledgedOrders}
        onAcknowledge={handleAcknowledge}
        settings={alertSettings}
        onSettingsChange={setAlertSettings}
      />

      <header className="space-y-3 sm:space-y-4 rounded-2xl border border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Title and status row */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Fulfillment</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                Monitor live orders and progress tickets.
              </p>
            </div>
            {/* Connection status - always visible */}
            <span
              className={`flex-shrink-0 flex items-center gap-1.5 sm:gap-2 rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${
                connected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* New orders badge + acknowledge - always visible */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600">New</span>
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs sm:text-sm font-semibold text-white min-w-[24px] text-center">
                {newOrderCount}
              </span>
              <button
                type="button"
                onClick={ackNewOrders}
                className="rounded-full border border-gray-200 px-2 sm:px-3 py-1 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-900"
              >
                Ack
              </button>
            </div>

            {/* Menu Editor link - icon only on mobile */}
            <Link
              href="/admin/menu"
              className="inline-flex items-center gap-1 sm:gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 sm:px-3 py-1 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-900 hover:bg-gray-100"
              title="Go to Menu Editor"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Menu</span>
            </Link>
          </div>
        </div>

        {/* Action buttons - horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap">
          {notificationsSupported && (
            <button
              type="button"
              onClick={handleEnableNotifications}
              disabled={notificationsEnabled}
              className={`flex-shrink-0 inline-flex items-center rounded-full border px-2 sm:px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                notificationsEnabled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {notificationsEnabled ? '🔔 On' : '🔔 Notify'}
            </button>
          )}
          {isInstallable && (
            <button
              type="button"
              onClick={handleInstallPWA}
              className="flex-shrink-0 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 sm:px-3 py-1 text-xs font-semibold text-blue-700 hover:border-blue-300 hover:bg-blue-100 whitespace-nowrap"
              title="Install app for easier access"
            >
              <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Install
            </button>
          )}
          {/* Native App Indicator - shows when running from TestFlight */}
          {isNativeApp && (
            <span
              className="flex-shrink-0 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 sm:px-3 py-1 text-xs font-semibold text-green-700 whitespace-nowrap"
              title="Running as native iOS app with Bluetooth and always-on screen"
            >
              <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Native
            </span>
          )}
          <button
            type="button"
            onClick={toggleKioskMode}
            className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full border px-2 sm:px-3 py-1 text-xs font-semibold whitespace-nowrap ${
              kioskMode || isNativeApp
                ? 'border-purple-200 bg-purple-50 text-purple-700'
                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
            title={isNativeApp ? 'Native app kiosk mode (always on)' : kioskMode ? 'Exit kiosk mode' : 'Enter kiosk mode'}
          >
            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {kioskMode || isNativeApp ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              )}
            </svg>
            {isNativeApp ? 'Kiosk On' : kioskMode ? 'Exit' : 'Kiosk'}
          </button>
          <button
            type="button"
            onClick={() => setKitchenMode(!kitchenMode)}
            className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full border px-2 sm:px-3 py-1 text-xs font-semibold whitespace-nowrap ${
              kitchenMode
                ? 'border-orange-200 bg-orange-50 text-orange-700'
                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
            title={kitchenMode ? 'Switch to standard view' : 'Switch to kitchen display'}
          >
            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {kitchenMode ? 'Standard' : 'Kitchen'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 border-b border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'orders'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'inquiries'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Catering Inquiries
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Settings
          </button>
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

      {activeTab === 'orders' ? (
        <>
          <FulfillmentBoard
            orders={orders}
            scope={scope}
            onAccept={handleAccept}
            onMarkReady={handleMarkReady}
            onComplete={handleComplete}
            onPrint={handlePrint}
            onCancel={handleCancel}
            onRefund={handleRefund}
            tabletMode={tabletMode}
            kitchenMode={kitchenMode}
          />
          <footer className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            Showing {orders.length} orders · {newOrders.length} waiting acceptance.
          </footer>
        </>
      ) : activeTab === 'inquiries' ? (
        <CateringInquiriesTab />
      ) : (
        <PrinterSettings onBack={() => setActiveTab('orders')} />
      )}
    </div>
  );
}
