import type { OrderItemPayload, OrderPayload } from '../order-service';

export function normalizeOrderPayload(value: unknown): OrderPayload | null {
  if (!value || typeof value !== 'object') return null;
  const draft = value as Partial<OrderPayload> & { items?: unknown; destination?: unknown };
  if (!Array.isArray(draft.items) || draft.items.length === 0) return null;

  const normalizedItems: OrderItemPayload[] = [];

  for (const item of draft.items) {
    if (!item || typeof item !== 'object') return null;
    const record = item as {
      menuItemId?: unknown;
      quantity?: unknown;
      price?: unknown;
      notes?: unknown;
    };

    if (typeof record.menuItemId !== 'string') return null;

    const normalizedQuantity = Number(record.quantity ?? 1);
    const normalizedPrice = Number(record.price ?? 0);

    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) return null;
    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) return null;

    normalizedItems.push({
      menuItemId: record.menuItemId,
      quantity: normalizedQuantity,
      price: normalizedPrice,
      notes: typeof record.notes === 'string' ? record.notes : record.notes === null ? null : undefined,
    });
  }

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const providedSubtotal =
    typeof draft.subtotalAmount === 'number' && Number.isFinite(draft.subtotalAmount)
      ? draft.subtotalAmount
      : subtotal;

  const providedPlatformFee =
    typeof draft.platformFee === 'number' && Number.isFinite(draft.platformFee) ? draft.platformFee : 0;
  const providedTax =
    typeof draft.taxAmount === 'number' && Number.isFinite(draft.taxAmount) ? draft.taxAmount : 0;
  const providedDelivery =
    typeof draft.deliveryFee === 'number' && Number.isFinite(draft.deliveryFee) ? draft.deliveryFee : 0;
  const providedTip =
    typeof draft.tipAmount === 'number' && Number.isFinite(draft.tipAmount) ? draft.tipAmount : 0;

  const providedTotal =
    typeof draft.totalAmount === 'number' && Number.isFinite(draft.totalAmount)
      ? draft.totalAmount
      : providedSubtotal + providedPlatformFee + providedTax + providedDelivery + providedTip;

  let destination: OrderPayload['destination'] | undefined;
  if (draft.destination && typeof draft.destination === 'object') {
    const raw = draft.destination as Record<string, unknown>;
    destination = {
      postalCode: typeof raw.postalCode === 'string' ? raw.postalCode : undefined,
      country: typeof raw.country === 'string' ? raw.country : undefined,
      state: typeof raw.state === 'string' ? raw.state : undefined,
      city: typeof raw.city === 'string' ? raw.city : undefined,
      line1: typeof raw.line1 === 'string' ? raw.line1 : undefined,
      line2: typeof raw.line2 === 'string' ? raw.line2 : undefined,
    };
  }

  const toCurrency = (amount: number) => Number(amount.toFixed(2));

  return {
    items: normalizedItems,
    subtotalAmount: toCurrency(providedSubtotal),
    totalAmount: toCurrency(providedTotal),
    taxAmount: toCurrency(providedTax),
    deliveryFee: toCurrency(providedDelivery),
    tipAmount: toCurrency(providedTip),
    platformFee: toCurrency(providedPlatformFee),
    fulfillmentMethod:
      typeof draft.fulfillmentMethod === 'string' && draft.fulfillmentMethod.length > 0
        ? draft.fulfillmentMethod
        : 'pickup',
    deliveryPartner: typeof draft.deliveryPartner === 'string' ? draft.deliveryPartner : undefined,
    paymentMethod: typeof draft.paymentMethod === 'string' ? draft.paymentMethod : undefined,
    customerName: typeof draft.customerName === 'string' ? draft.customerName : undefined,
    customerEmail: typeof draft.customerEmail === 'string' ? draft.customerEmail : undefined,
    customerPhone: typeof draft.customerPhone === 'string' ? draft.customerPhone : undefined,
    notes: typeof draft.notes === 'string' ? draft.notes : undefined,
    destination,
  };
}
