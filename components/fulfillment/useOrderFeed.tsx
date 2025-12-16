"use client";

import { useEffect, useRef, useState } from 'react';
import type { FulfillmentEvent, FulfillmentOrder } from './types';

interface Options {
  feedUrl: string;
  initialOrders: FulfillmentOrder[];
}

function sortOrders(orders: FulfillmentOrder[]) {
  return [...orders].sort((a, b) => {
    const createdA = new Date(a.createdAt).getTime();
    const createdB = new Date(b.createdAt).getTime();
    return createdB - createdA;
  });
}

export function useOrderFeed({ feedUrl, initialOrders }: Options) {
  const [orders, setOrders] = useState<FulfillmentOrder[]>(() => sortOrders(initialOrders));
  const [connected, setConnected] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<FulfillmentOrder | null>(null);
  const newOrderIdsRef = useRef<Set<string>>(new Set());
  const knownOrderIdsRef = useRef<Set<string>>(new Set(initialOrders.map(o => o.id))); // Track all known orders
  const isFirstPollRef = useRef(true); // Skip "new order" detection on first poll
  const [, forceTick] = useState(0);

  const ackNewOrders = () => {
    newOrderIdsRef.current.clear();
    setLastCreatedOrder(null);
    forceTick((tick) => tick + 1);
  };

  // Optimistically update an order's status in local state (for instant UI feedback)
  const optimisticUpdateOrder = (orderId: string, updates: Partial<FulfillmentOrder>) => {
    setOrders((prev) => {
      const next = prev.map((order) =>
        order.id === orderId ? { ...order, ...updates } : order
      );
      return sortOrders(next);
    });
    // Remove from new order IDs if status is being changed (order is being processed)
    if (updates.status) {
      newOrderIdsRef.current.delete(orderId);
      forceTick((tick) => tick + 1);
    }
  };

  useEffect(() => {
    setOrders(sortOrders(initialOrders));
    // Update known orders with initial orders
    initialOrders.forEach(o => knownOrderIdsRef.current.add(o.id));
    newOrderIdsRef.current.clear();
    setLastCreatedOrder(null);
    isFirstPollRef.current = true; // Reset first poll flag when initialOrders change
  }, [initialOrders]);

  useEffect(() => {
    const eventSource = new EventSource(feedUrl);
    let closed = false;

    eventSource.onopen = () => {
      if (!closed) setConnected(true);
    };

    eventSource.onerror = () => {
      if (!closed) setConnected(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: FulfillmentEvent = JSON.parse(event.data);
        if (data.type === 'init' && Array.isArray(data.orders)) {
          setOrders(sortOrders(data.orders));
          // Mark all init orders as known (no alerts for these)
          data.orders.forEach((o: FulfillmentOrder) => knownOrderIdsRef.current.add(o.id));
          newOrderIdsRef.current.clear();
          forceTick((tick) => tick + 1);
          return;
        }

        if ((data.type === 'order.created' || data.type === 'order.updated') && data.order) {
          setOrders((prev) => {
            const next = [...prev];
            const index = next.findIndex((order) => order.id === data.order!.id);
            if (index >= 0) {
              next[index] = data.order!;
            } else {
              next.push(data.order!);
            }
            return sortOrders(next);
          });

          if (data.type === 'order.created') {
            // Only trigger alert if this is truly a new order we haven't seen
            if (!knownOrderIdsRef.current.has(data.order.id)) {
              knownOrderIdsRef.current.add(data.order.id);
              newOrderIdsRef.current.add(data.order.id);
              setLastCreatedOrder(data.order);
              forceTick((tick) => tick + 1);
            }
          } else if (data.type === 'order.updated') {
            knownOrderIdsRef.current.add(data.order.id);
            setLastCreatedOrder((current) =>
              current && current.id === data.order!.id ? data.order! : current,
            );
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to parse fulfillment event', err);
      }
    };

    // AGGRESSIVE POLLING FALLBACK - Every 2 seconds for faster order detection
    // This ensures orders appear quickly even if EventSource fails on iPad PWA
    const pollInterval = setInterval(async () => {
      if (closed) return;
      try {
        // Build polling URL: remove /stream and add cache buster
        const baseUrl = feedUrl.replace('/stream', '');
        const separator = baseUrl.includes('?') ? '&' : '?';
        const pollUrl = `${baseUrl}${separator}t=${Date.now()}`;
        const response = await fetch(pollUrl, { credentials: 'include' }); // Include cookies for auth
        if (!response.ok) {
          console.error('[OrderFeed] Polling failed:', response.status, response.statusText);
          return;
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          // On first poll after page load, just sync orders without triggering "new order" alerts
          if (isFirstPollRef.current) {
            console.log('[OrderFeed] First poll - syncing', data.length, 'orders (no alerts)');
            isFirstPollRef.current = false;
            // Add all fetched orders to known orders
            data.forEach((o: FulfillmentOrder) => knownOrderIdsRef.current.add(o.id));
            setOrders(sortOrders(data));
            setConnected(true);
            return;
          }

          // Find truly new orders (not in knownOrderIds - this persists across renders)
          const newOrders = data.filter((o: FulfillmentOrder) => !knownOrderIdsRef.current.has(o.id));

          if (newOrders.length > 0) {
            console.log(`[OrderFeed] ${newOrders.length} NEW order(s) detected via polling`);
            newOrders.forEach((order: FulfillmentOrder) => {
              knownOrderIdsRef.current.add(order.id); // Mark as known
              newOrderIdsRef.current.add(order.id); // Mark as new (for UI)
              setLastCreatedOrder(order);
            });
            forceTick((tick) => tick + 1);
          }

          // Update orders list
          setOrders(sortOrders(data));

          // Also add any orders we might have missed to known orders
          data.forEach((o: FulfillmentOrder) => knownOrderIdsRef.current.add(o.id));

          setConnected(true);
        }
      } catch (err) {
        console.error('[Polling] Failed to fetch orders', err);
        setConnected(false);
      }
    }, 2000); // 2 seconds for fast detection

    return () => {
      closed = true;
      eventSource.close();
      clearInterval(pollInterval);
      setConnected(false);
    };
  }, [feedUrl]);

  return {
    orders,
    connected,
    newOrderCount: newOrderIdsRef.current.size,
    ackNewOrders,
    lastCreatedOrder,
    optimisticUpdateOrder,
  };
}
