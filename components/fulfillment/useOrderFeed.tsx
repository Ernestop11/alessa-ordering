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
  const [, forceTick] = useState(0);

  const ackNewOrders = () => {
    newOrderIdsRef.current.clear();
    setLastCreatedOrder(null);
    forceTick((tick) => tick + 1);
  };

  useEffect(() => {
    setOrders(sortOrders(initialOrders));
    newOrderIdsRef.current.clear();
    setLastCreatedOrder(null);
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
            newOrderIdsRef.current.add(data.order.id);
            setLastCreatedOrder(data.order);
            forceTick((tick) => tick + 1);
          } else if (data.type === 'order.updated') {
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
        console.log('[OrderFeed] Polling:', pollUrl);
        const response = await fetch(pollUrl, { credentials: 'include' }); // Include cookies for auth
        if (!response.ok) {
          console.error('[OrderFeed] Polling failed:', response.status, response.statusText);
          return;
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          console.log('[OrderFeed] Got', data.length, 'orders from polling');
          setOrders((prev) => {
            const previousIds = new Set(prev.map(o => o.id));
            const currentOrderIds = new Set(data.map((o: FulfillmentOrder) => o.id));

            // Find truly new orders (not in previous list)
            const newOrders = data.filter((o: FulfillmentOrder) => !previousIds.has(o.id));

            if (newOrders.length > 0) {
              console.log(`[OrderFeed] ${newOrders.length} new order(s) detected via polling`);
              newOrders.forEach((order: FulfillmentOrder) => {
                newOrderIdsRef.current.add(order.id);
                setLastCreatedOrder(order);
              });
              forceTick((tick) => tick + 1);
            }

            // Remove orders that are no longer in the feed (optional cleanup)
            const removedOrders = prev.filter(o => !currentOrderIds.has(o.id));
            if (removedOrders.length > 0) {
              removedOrders.forEach(o => newOrderIdsRef.current.delete(o.id));
            }

            return sortOrders(data);
          });
          setConnected(true);
        }
      } catch (err) {
        console.error('[Polling] Failed to fetch orders', err);
        setConnected(false);
      }
    }, 2000); // Changed from 5000 to 2000 (2 seconds) for faster detection

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
  };
}
