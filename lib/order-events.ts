import { EventEmitter } from 'events';

export type OrderEventType = 'order.created' | 'order.updated';

export interface OrderEvent<T = unknown> {
  type: OrderEventType;
  order: T;
}

type OrderEventListener<T = unknown> = (event: OrderEvent<T>) => void;

declare global {
  // eslint-disable-next-line no-var
  var __orderEventEmitter__: EventEmitter | undefined;
}

const emitter: EventEmitter =
  global.__orderEventEmitter__ ??
  (() => {
    const ev = new EventEmitter();
    ev.setMaxListeners(200);
    global.__orderEventEmitter__ = ev;
    return ev;
  })();

export function emitOrderEvent<T = unknown>(event: OrderEvent<T>) {
  emitter.emit('order', event);
}

export function subscribeToOrders<T = unknown>(listener: OrderEventListener<T>) {
  emitter.on('order', listener as OrderEventListener);
  return () => {
    emitter.off('order', listener as OrderEventListener);
  };
}

export function onceOrder<T = unknown>(listener: OrderEventListener<T>) {
  emitter.once('order', listener as OrderEventListener);
}
