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

    // Polling fallback every 5 seconds
    const pollInterval = setInterval(async () => {
      if (closed) return;
      try {
        const response = await fetch(feedUrl.replace('/stream', ''));
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setOrders((prev) => {
              const previousIds = new Set(prev.map(o => o.id));
              const newOrders = data.filter((o: FulfillmentOrder) => !previousIds.has(o.id));
              
              if (newOrders.length > 0) {
                newOrders.forEach((order: FulfillmentOrder) => {
                  newOrderIdsRef.current.add(order.id);
                  setLastCreatedOrder(order);
                });
                forceTick((tick) => tick + 1);
              }
              
              return sortOrders(data);
            });
            setConnected(true);
          }
        }
      } catch (err) {
        console.error('[Polling] Failed to fetch orders', err);
        setConnected(false);
      }
    }, 5000);

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
